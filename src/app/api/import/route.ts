import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getUserPlanInfo, checkFeatureAccess } from "@/lib/plan-limits";
import {
  EntityType,
  ImportRequest,
  ImportResult,
  ValidationError,
} from "@/lib/import/types";
import { getFieldDefinitions, getFieldByName } from "@/lib/import/field-definitions";
import { validateFieldValue, transformValue } from "@/lib/import/validators";

async function getSupabaseClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Ignore in Server Components
          }
        },
      },
    }
  );
}

// Get table name for entity type
function getTableName(entityType: EntityType): string {
  switch (entityType) {
    case "contacts":
      return "contacts";
    case "leads":
      return "leads";
    case "clients":
      return "clients";
    default:
      throw new Error(`Unknown entity type: ${entityType}`);
  }
}

// Build record data for insertion
function buildRecordData(
  row: Record<string, unknown>,
  entityType: EntityType,
  tenantId: string,
  userId: string
): Record<string, unknown> {
  const fields = getFieldDefinitions(entityType);
  const data: Record<string, unknown> = {
    tenant_id: tenantId,
    created_by: userId,
  };

  for (const field of fields) {
    if (row[field.name] !== undefined) {
      const transformedValue = transformValue(row[field.name], field.type);
      if (transformedValue !== null && transformedValue !== "") {
        data[field.name] = transformedValue;
      }
    }
  }

  return data;
}

// Validate a single row and collect errors
function validateRow(
  row: Record<string, unknown>,
  entityType: EntityType,
  rowIndex: number
): ValidationError[] {
  const errors: ValidationError[] = [];
  const fields = getFieldDefinitions(entityType);

  for (const field of fields) {
    const value = row[field.name];
    const error = validateFieldValue(value, field);
    if (error) {
      errors.push({
        row: rowIndex,
        field: field.name,
        value,
        message: error,
      });
    }
  }

  return errors;
}

// POST - Batch import records
export async function POST(request: Request) {
  try {
    const supabase = await getSupabaseClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user's tenant_id from profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("tenant_id")
      .eq("id", user.id)
      .single();

    if (!profile?.tenant_id) {
      return NextResponse.json({ error: "No tenant found" }, { status: 400 });
    }

    // Check plan feature access for CRM
    const planInfo = await getUserPlanInfo(supabase, user.id);
    if (!planInfo) {
      return NextResponse.json(
        { error: "No active subscription found", upgrade_required: true },
        { status: 403 }
      );
    }

    const crmAccess = checkFeatureAccess(planInfo.planType, "crm");
    if (!crmAccess.allowed) {
      return NextResponse.json(
        {
          error: crmAccess.reason,
          upgrade_required: crmAccess.upgrade_required,
          feature: "crm",
        },
        { status: 403 }
      );
    }

    const body: ImportRequest = await request.json();
    const { entityType, data, config } = body;

    // Validate entity type
    if (!["contacts", "leads", "clients"].includes(entityType)) {
      return NextResponse.json(
        { error: "Invalid entity type" },
        { status: 400 }
      );
    }

    if (!data || !Array.isArray(data) || data.length === 0) {
      return NextResponse.json(
        { error: "No data provided" },
        { status: 400 }
      );
    }

    const tableName = getTableName(entityType);
    const result: ImportResult = {
      success: true,
      imported: 0,
      updated: 0,
      skipped: 0,
      failed: 0,
      errors: [],
    };

    // Process each row
    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      const rowIndex = i + 1;

      // Validate row
      const rowErrors = validateRow(row, entityType, rowIndex);

      if (rowErrors.length > 0) {
        if (config.skipInvalidRows) {
          result.skipped++;
          result.errors.push(...rowErrors);
          continue;
        } else {
          result.failed++;
          result.errors.push(...rowErrors);
          continue;
        }
      }

      // Build record data
      const recordData = buildRecordData(row, entityType, profile.tenant_id, user.id);

      // Handle duplicates
      if (config.duplicateHandling !== "create_new" && config.duplicateKey) {
        const duplicateValue = row[config.duplicateKey];

        if (duplicateValue) {
          // Check for existing record
          const { data: existing } = await supabase
            .from(tableName)
            .select("id")
            .eq("tenant_id", profile.tenant_id)
            .eq(config.duplicateKey, duplicateValue)
            .maybeSingle();

          if (existing) {
            if (config.duplicateHandling === "skip") {
              result.skipped++;
              continue;
            } else if (config.duplicateHandling === "update") {
              // Update existing record
              const { error: updateError } = await supabase
                .from(tableName)
                .update(recordData)
                .eq("id", existing.id);

              if (updateError) {
                result.failed++;
                result.errors.push({
                  row: rowIndex,
                  field: "",
                  value: null,
                  message: `Update failed: ${updateError.message}`,
                });
              } else {
                result.updated++;
              }
              continue;
            }
          }
        }
      }

      // Insert new record
      const { error: insertError } = await supabase
        .from(tableName)
        .insert(recordData);

      if (insertError) {
        result.failed++;
        result.errors.push({
          row: rowIndex,
          field: "",
          value: null,
          message: `Insert failed: ${insertError.message}`,
        });
      } else {
        result.imported++;
      }
    }

    result.success = result.failed === 0 || config.skipInvalidRows;

    return NextResponse.json(result);
  } catch (error) {
    console.error("Import error:", error);
    return NextResponse.json(
      { error: "Something went wrong during import" },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { getUserPlanInfo, checkFeatureAccess } from "@/lib/plan-limits";
import { checkTriggers } from "@/lib/workflows/triggers";
import {
  EntityType,
  ImportRequest,
  ImportResult,
  ValidationError,
} from "@/lib/import/types";
import { getFieldDefinitions } from "@/lib/import/field-definitions";
import { validateFieldValue, transformValue } from "@/lib/import/validators";
import { getUserIdFromRequest } from "@/hooks/useTenantFromHeaders";

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
  };

  // Only contacts and leads have created_by column
  if (entityType === "contacts" || entityType === "leads") {
    data.created_by = userId;
  }

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
    const userId = getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = await createClient();

    // Get user's tenant_id from profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("tenant_id")
      .eq("id", userId)
      .single();

    if (!profile?.tenant_id) {
      return NextResponse.json({ error: "No tenant found" }, { status: 400 });
    }

    // Check plan feature access for CRM
    const planInfo = await getUserPlanInfo(supabase, userId);
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
      const recordData = buildRecordData(row, entityType, profile.tenant_id, userId);

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
      const { data: insertedRecord, error: insertError } = await supabase
        .from(tableName)
        .insert(recordData)
        .select()
        .single();

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

        // Fire workflow triggers for clients and leads
        if (insertedRecord && (entityType === "clients" || entityType === "leads")) {
          const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
          const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
          if (supabaseUrl && supabaseServiceKey) {
            const serviceClient = createServiceClient(supabaseUrl, supabaseServiceKey);
            try {
              if (entityType === "clients") {
                await checkTriggers("client_created", {
                  entity_id: insertedRecord.id,
                  entity_type: "client",
                  entity_name: insertedRecord.name,
                  client_name: insertedRecord.name,
                  client_email: insertedRecord.email || null,
                  client_phone: insertedRecord.phone || null,
                  client_company: insertedRecord.company || null,
                }, serviceClient, profile.tenant_id, userId);
              } else if (entityType === "leads") {
                await checkTriggers("lead_created", {
                  entity_id: insertedRecord.id,
                  entity_type: "lead",
                  entity_name: insertedRecord.name,
                  lead_name: insertedRecord.name,
                  lead_email: insertedRecord.email || null,
                  lead_company: insertedRecord.company || null,
                  lead_source: insertedRecord.source || null,
                  lead_estimated_value: insertedRecord.estimated_value || null,
                }, serviceClient, profile.tenant_id, userId);
              }
            } catch (err) {
              console.error(`Workflow trigger error (${entityType} import):`, err);
            }
          }
        }
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

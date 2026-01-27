import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getUserPlanInfo, checkFeatureAccess } from "@/lib/plan-limits";
import {
  ValidateRequest,
  ValidateResponse,
  ValidationError,
} from "@/lib/import/types";
import { getFieldDefinitions } from "@/lib/import/field-definitions";
import { validateFieldValue } from "@/lib/import/validators";

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
function getTableName(entityType: string): string {
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

// Validate a single row
function validateRow(
  row: Record<string, unknown>,
  entityType: string,
  rowIndex: number
): ValidationError[] {
  const errors: ValidationError[] = [];
  const fields = getFieldDefinitions(entityType as "contacts" | "leads" | "clients");

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

// POST - Validate sample data before import
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

    const body: ValidateRequest = await request.json();
    const { entityType, sample, duplicateKey } = body;

    // Validate entity type
    if (!["contacts", "leads", "clients"].includes(entityType)) {
      return NextResponse.json(
        { error: "Invalid entity type" },
        { status: 400 }
      );
    }

    if (!sample || !Array.isArray(sample)) {
      return NextResponse.json(
        { error: "No sample data provided" },
        { status: 400 }
      );
    }

    const result: ValidateResponse = {
      valid: 0,
      invalid: 0,
      duplicates: 0,
      errors: [],
    };

    // Collect duplicate key values to check
    const duplicateValues: string[] = [];
    const tableName = getTableName(entityType);

    // Validate each row in sample
    for (let i = 0; i < sample.length; i++) {
      const row = sample[i];
      const rowIndex = i + 1;
      const rowErrors = validateRow(row, entityType, rowIndex);

      if (rowErrors.length > 0) {
        result.invalid++;
        result.errors.push(...rowErrors);
      } else {
        result.valid++;
      }

      // Collect duplicate key values
      if (duplicateKey && row[duplicateKey]) {
        const value = String(row[duplicateKey]).trim();
        if (value) {
          duplicateValues.push(value);
        }
      }
    }

    // Check for duplicates in database
    if (duplicateKey && duplicateValues.length > 0) {
      const uniqueValues = [...new Set(duplicateValues)];

      const { data: existingRecords, error } = await supabase
        .from(tableName)
        .select(duplicateKey)
        .eq("tenant_id", profile.tenant_id)
        .in(duplicateKey, uniqueValues);

      if (!error && existingRecords) {
        result.duplicates = existingRecords.length;
      }
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Validation error:", error);
    return NextResponse.json(
      { error: "Something went wrong during validation" },
      { status: 500 }
    );
  }
}

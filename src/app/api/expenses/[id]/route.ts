import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

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

// GET - Fetch single expense
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await getSupabaseClient();
    const { id } = await params;

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

    // Fetch expense with related data
    const { data: expense, error } = await supabase
      .from("expenses")
      .select(`
        *,
        client:clients(id, name, email, company),
        project:projects(id, name, project_code),
        event:events(id, title)
      `)
      .eq("id", id)
      .eq("tenant_id", profile.tenant_id)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return NextResponse.json({ error: "Expense not found" }, { status: 404 });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ expense });
  } catch (error) {
    console.error("Get expense error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

// PATCH - Update expense
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await getSupabaseClient();
    const { id } = await params;

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

    const body = await request.json();

    // Fields that should be null when empty (UUIDs and optional fields)
    const nullableUuidFields = ["client_id", "project_id", "event_id", "approved_by"];
    const nullableDateFields = ["expense_date", "reimbursed_at", "approved_at"];
    const nullableStringFields = ["vendor_name", "receipt_url", "receipt_number", "tax_category", "notes"];

    // Convert empty strings to null for nullable fields
    nullableUuidFields.forEach((field) => {
      if (body[field] === "") body[field] = null;
    });
    nullableDateFields.forEach((field) => {
      if (body[field] === "") body[field] = null;
    });
    nullableStringFields.forEach((field) => {
      if (body[field] === "") body[field] = null;
    });

    // Build update object with allowed fields
    const allowedFields = [
      "description", "amount", "currency", "expense_date", "category",
      "project_id", "event_id", "client_id", "vendor_name", "payment_method",
      "is_reimbursable", "is_billable", "reimbursed_at", "receipt_url",
      "receipt_number", "status", "approved_by", "approved_at",
      "tax_deductible", "tax_category", "notes", "tags"
    ];

    const updates: Record<string, unknown> = {};
    allowedFields.forEach((field) => {
      if (body[field] !== undefined) {
        updates[field] = body[field];
      }
    });

    // Handle status transitions
    if (body.status === "approved" && !body.approved_at) {
      updates.approved_at = new Date().toISOString();
      updates.approved_by = user.id;
    }
    if (body.status === "reimbursed" && !body.reimbursed_at) {
      updates.reimbursed_at = new Date().toISOString();
    }

    updates.updated_at = new Date().toISOString();

    const { data: expense, error } = await supabase
      .from("expenses")
      .update(updates)
      .eq("id", id)
      .eq("tenant_id", profile.tenant_id)
      .select(`
        *,
        client:clients(id, name, company),
        project:projects(id, name, project_code),
        event:events(id, title)
      `)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return NextResponse.json({ error: "Expense not found" }, { status: 404 });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ expense });
  } catch (error) {
    console.error("Update expense error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

// DELETE - Delete expense
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await getSupabaseClient();
    const { id } = await params;

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

    const { error } = await supabase
      .from("expenses")
      .delete()
      .eq("id", id)
      .eq("tenant_id", profile.tenant_id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete expense error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

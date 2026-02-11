import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createExpenseSchema, validateBody } from "@/lib/validations";
import { getUserIdFromRequest } from "@/hooks/useTenantFromHeaders";

// GET - Fetch all expenses for the user's tenant
export async function GET(request: Request) {
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

    // Fetch expenses with related data
    const { data: expenses, error } = await supabase
      .from("expenses")
      .select(`
        *,
        client:clients(id, name, company),
        project:projects(id, name, project_code),
        event:events(id, title)
      `)
      .eq("tenant_id", profile.tenant_id)
      .order("expense_date", { ascending: false })
      .limit(500);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ expenses });
  } catch (error) {
    console.error("Get expenses error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

// POST - Create a new expense
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

    const body = await request.json();

    // Validate input
    const validation = validateBody(createExpenseSchema, body);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }
    const v = validation.data;

    // Validate FK references belong to the same tenant
    if (v.project_id) {
      const { data: project } = await supabase
        .from("projects").select("id").eq("id", v.project_id).eq("tenant_id", profile.tenant_id).single();
      if (!project) {
        return NextResponse.json({ error: "Project not found" }, { status: 404 });
      }
    }
    if (v.client_id) {
      const { data: client } = await supabase
        .from("clients").select("id").eq("id", v.client_id).eq("tenant_id", profile.tenant_id).single();
      if (!client) {
        return NextResponse.json({ error: "Client not found" }, { status: 404 });
      }
    }
    if (v.event_id) {
      const { data: evt } = await supabase
        .from("events").select("id").eq("id", v.event_id).eq("tenant_id", profile.tenant_id).single();
      if (!evt) {
        return NextResponse.json({ error: "Event not found" }, { status: 404 });
      }
    }

    const expenseData = {
      tenant_id: profile.tenant_id,
      description: v.description,
      amount: v.amount,
      currency: v.currency,
      expense_date: v.expense_date || new Date().toISOString().split("T")[0],
      category: v.category || null,
      project_id: v.project_id || null,
      event_id: v.event_id || null,
      client_id: v.client_id || null,
      vendor_name: v.vendor_name || null,
      payment_method: v.payment_method || null,
      is_reimbursable: v.is_reimbursable || false,
      is_billable: v.is_billable || false,
      receipt_url: v.receipt_url || null,
      receipt_number: v.receipt_number || null,
      status: v.status,
      tax_deductible: v.tax_deductible !== false,
      tax_category: v.tax_category || null,
      notes: v.notes || null,
      tags: v.tags || null,
      created_by: userId,
    };

    const { data: expense, error } = await supabase
      .from("expenses")
      .insert(expenseData)
      .select(`
        *,
        client:clients(id, name, company),
        project:projects(id, name, project_code),
        event:events(id, title)
      `)
      .single();

    if (error) {
      console.error("Insert error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ expense }, { status: 201 });
  } catch (error) {
    console.error("Create expense error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

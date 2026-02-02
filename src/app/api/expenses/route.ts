import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { createExpenseSchema, validateBody } from "@/lib/validations";

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

// GET - Fetch all expenses for the user's tenant
export async function GET() {
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
      vendor_name: body.vendor_name || null,
      payment_method: body.payment_method || null,
      is_reimbursable: body.is_reimbursable || false,
      is_billable: body.is_billable || false,
      receipt_url: v.receipt_url || null,
      receipt_number: body.receipt_number || null,
      status: v.status,
      tax_deductible: body.tax_deductible !== false,
      tax_category: body.tax_category || null,
      notes: v.notes || null,
      tags: body.tags || null,
      created_by: user.id,
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

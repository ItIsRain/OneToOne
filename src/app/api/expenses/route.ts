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
      .order("expense_date", { ascending: false });

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

    const expenseData = {
      tenant_id: profile.tenant_id,
      description: body.description,
      amount: parseFloat(body.amount) || 0,
      currency: body.currency || "USD",
      expense_date: body.expense_date || new Date().toISOString().split("T")[0],
      category: body.category || null,
      project_id: body.project_id || null,
      event_id: body.event_id || null,
      client_id: body.client_id || null,
      vendor_name: body.vendor_name || null,
      payment_method: body.payment_method || null,
      is_reimbursable: body.is_reimbursable || false,
      is_billable: body.is_billable || false,
      receipt_url: body.receipt_url || null,
      receipt_number: body.receipt_number || null,
      status: body.status || "pending",
      tax_deductible: body.tax_deductible !== false,
      tax_category: body.tax_category || null,
      notes: body.notes || null,
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

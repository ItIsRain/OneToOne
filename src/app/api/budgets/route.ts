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

// GET - Fetch all budgets for the user's tenant
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

    // Fetch budgets with related data
    const { data: budgets, error } = await supabase
      .from("budgets")
      .select(`
        *,
        project:projects(id, name, project_code),
        client:clients(id, name, company)
      `)
      .eq("tenant_id", profile.tenant_id)
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ budgets });
  } catch (error) {
    console.error("Get budgets error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

// POST - Create a new budget
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

    // Calculate end date based on period type if not provided
    let endDate = body.end_date || null;
    if (!endDate && body.start_date && body.period_type) {
      const startDate = new Date(body.start_date);
      switch (body.period_type) {
        case "monthly":
          endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0).toISOString().split("T")[0];
          break;
        case "quarterly":
          endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 3, 0).toISOString().split("T")[0];
          break;
        case "yearly":
          endDate = new Date(startDate.getFullYear(), 11, 31).toISOString().split("T")[0];
          break;
      }
    }

    const budgetData = {
      tenant_id: profile.tenant_id,
      name: body.name,
      description: body.description || null,
      amount: parseFloat(body.amount) || 0,
      spent: parseFloat(body.spent) || 0,
      currency: body.currency || "USD",
      period_type: body.period_type || "monthly",
      start_date: body.start_date,
      end_date: endDate,
      category: body.category || null,
      project_id: body.project_id || null,
      client_id: body.client_id || null,
      department: body.department || null,
      alert_threshold: parseFloat(body.alert_threshold) || 80,
      alert_sent: false,
      status: body.status || "active",
      notes: body.notes || null,
      tags: body.tags || null,
      rollover_enabled: body.rollover_enabled || false,
      rollover_amount: parseFloat(body.rollover_amount) || 0,
      fiscal_year: body.fiscal_year || new Date().getFullYear(),
      is_recurring: body.is_recurring || false,
      recurrence_interval: body.recurrence_interval || null,
      created_by: user.id,
    };

    const { data: budget, error } = await supabase
      .from("budgets")
      .insert(budgetData)
      .select(`
        *,
        project:projects(id, name, project_code),
        client:clients(id, name, company)
      `)
      .single();

    if (error) {
      console.error("Insert error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ budget }, { status: 201 });
  } catch (error) {
    console.error("Create budget error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

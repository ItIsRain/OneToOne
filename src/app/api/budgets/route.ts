import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { createBudgetSchema, validateBody } from "@/lib/validations";

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

    // Validate input
    const validation = validateBody(createBudgetSchema, body);
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

    // Calculate end date based on period type if not provided
    let endDate = v.end_date || null;
    if (!endDate && v.start_date && v.period_type) {
      const startDate = new Date(v.start_date);
      switch (v.period_type) {
        case "monthly":
          endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0).toISOString().split("T")[0];
          break;
        case "quarterly": {
          const quarterEnd = new Date(startDate);
          quarterEnd.setMonth(quarterEnd.getMonth() + 3);
          quarterEnd.setDate(0); // last day of the previous month (i.e. end of 3-month span)
          endDate = quarterEnd.toISOString().split("T")[0];
          break;
        }
        case "yearly":
          endDate = new Date(startDate.getFullYear(), 11, 31).toISOString().split("T")[0];
          break;
      }
    }

    const budgetData = {
      tenant_id: profile.tenant_id,
      name: v.name,
      description: v.description || null,
      amount: v.amount,
      spent: v.spent,
      currency: v.currency,
      period_type: v.period_type,
      start_date: v.start_date,
      end_date: endDate,
      category: v.category || null,
      project_id: v.project_id || null,
      client_id: v.client_id || null,
      department: v.department || null,
      alert_threshold: v.alert_threshold,
      alert_sent: false,
      status: v.status,
      notes: v.notes || null,
      tags: v.tags || null,
      rollover_enabled: v.rollover_enabled,
      rollover_amount: v.rollover_amount,
      fiscal_year: v.fiscal_year || new Date().getFullYear(),
      is_recurring: v.is_recurring,
      recurrence_interval: v.recurrence_interval || null,
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

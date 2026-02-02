import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { validateBody, updateBudgetSchema } from "@/lib/validations";

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

// GET - Fetch single budget
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

    // Fetch budget with related data
    const { data: budget, error } = await supabase
      .from("budgets")
      .select(`
        *,
        project:projects(id, name, project_code),
        client:clients(id, name, email, company)
      `)
      .eq("id", id)
      .eq("tenant_id", profile.tenant_id)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return NextResponse.json({ error: "Budget not found" }, { status: 404 });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Fetch related expenses for this budget's category/project
    let expenses: Array<{ id: string; description: string; amount: number; expense_date: string; category: string | null; status: string }> = [];
    if (budget.category || budget.project_id) {
      let query = supabase
        .from("expenses")
        .select("id, description, amount, expense_date, category, status")
        .eq("tenant_id", profile.tenant_id)
        .gte("expense_date", budget.start_date);

      if (budget.end_date) {
        query = query.lte("expense_date", budget.end_date);
      }

      if (budget.project_id) {
        query = query.eq("project_id", budget.project_id);
      } else if (budget.category) {
        query = query.eq("category", budget.category);
      }

      const { data: expenseData } = await query.order("expense_date", { ascending: false }).limit(10);
      expenses = expenseData || [];
    }

    return NextResponse.json({ budget: { ...budget, recent_expenses: expenses } });
  } catch (error) {
    console.error("Get budget error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

// PATCH - Update budget
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

    // Validate input
    const validation = validateBody(updateBudgetSchema, body);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    // Validate FK references belong to the same tenant
    if (body.project_id) {
      const { data: project } = await supabase
        .from("projects").select("id").eq("id", body.project_id).eq("tenant_id", profile.tenant_id).single();
      if (!project) {
        return NextResponse.json({ error: "Project not found" }, { status: 404 });
      }
    }
    if (body.client_id) {
      const { data: client } = await supabase
        .from("clients").select("id").eq("id", body.client_id).eq("tenant_id", profile.tenant_id).single();
      if (!client) {
        return NextResponse.json({ error: "Client not found" }, { status: 404 });
      }
    }

    // Fields that should be null when empty
    const nullableUuidFields = ["project_id", "client_id"];
    const nullableDateFields = ["start_date", "end_date"];
    const nullableStringFields = ["description", "category", "department", "notes", "recurrence_interval"];

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
      "name", "description", "amount", "spent", "currency", "period_type",
      "start_date", "end_date", "category", "project_id", "client_id",
      "department", "alert_threshold", "alert_sent", "status", "notes", "tags",
      "rollover_enabled", "rollover_amount", "fiscal_year", "is_recurring", "recurrence_interval"
    ];

    const updates: Record<string, unknown> = {};
    allowedFields.forEach((field) => {
      if (body[field] !== undefined) {
        updates[field] = body[field];
      }
    });

    // Check if budget should be marked as exceeded
    if (body.spent !== undefined || body.amount !== undefined) {
      const currentBudget = await supabase
        .from("budgets")
        .select("amount, spent")
        .eq("id", id)
        .eq("tenant_id", profile.tenant_id)
        .single();

      if (currentBudget.data) {
        const newSpent = body.spent !== undefined ? parseFloat(body.spent) : currentBudget.data.spent;
        const newAmount = body.amount !== undefined ? parseFloat(body.amount) : currentBudget.data.amount;

        if (newSpent > newAmount && body.status !== "exceeded") {
          updates.status = "exceeded";
        }
      }
    }

    updates.updated_at = new Date().toISOString();

    const { data: budget, error } = await supabase
      .from("budgets")
      .update(updates)
      .eq("id", id)
      .eq("tenant_id", profile.tenant_id)
      .select(`
        *,
        project:projects(id, name, project_code),
        client:clients(id, name, company)
      `)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return NextResponse.json({ error: "Budget not found" }, { status: 404 });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ budget });
  } catch (error) {
    console.error("Update budget error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

// DELETE - Delete budget
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
      .from("budgets")
      .delete()
      .eq("id", id)
      .eq("tenant_id", profile.tenant_id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete budget error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

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

// GET - Fetch all payroll runs for the user's tenant
export async function GET(request: Request) {
  try {
    const supabase = await getSupabaseClient();
    const { searchParams } = new URL(request.url);

    // Optional filters
    const status = searchParams.get("status");
    const year = searchParams.get("year");

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user's tenant_id and role from profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("tenant_id, role")
      .eq("id", user.id)
      .single();

    if (!profile?.tenant_id) {
      return NextResponse.json({ error: "No tenant found" }, { status: 400 });
    }

    // Only admins and owners can view payroll
    if (!["owner", "admin"].includes(profile.role)) {
      return NextResponse.json({ error: "Permission denied" }, { status: 403 });
    }

    // Build query
    let query = supabase
      .from("payroll_runs")
      .select(`
        *,
        created_by_user:profiles!payroll_runs_created_by_fkey(id, first_name, last_name),
        approved_by_user:profiles!payroll_runs_approved_by_fkey(id, first_name, last_name),
        items:payroll_items(count)
      `)
      .eq("tenant_id", profile.tenant_id)
      .order("period_end", { ascending: false });

    // Apply filters
    if (status) {
      query = query.eq("status", status);
    }
    if (year) {
      query = query.gte("period_start", `${year}-01-01`).lte("period_end", `${year}-12-31`);
    }

    const { data: payrollRuns, error } = await query;

    if (error) {
      console.error("Fetch payroll runs error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Get items count for each run
    const runsWithCounts = await Promise.all(
      (payrollRuns || []).map(async (run) => {
        const { count } = await supabase
          .from("payroll_items")
          .select("*", { count: "exact", head: true })
          .eq("payroll_run_id", run.id);
        return { ...run, employee_count: count || 0 };
      })
    );

    // Calculate stats
    const currentYear = new Date().getFullYear();
    const yearRuns = runsWithCounts.filter(
      (r) => new Date(r.period_start).getFullYear() === currentYear
    );

    const stats = {
      totalRuns: runsWithCounts.length,
      yearToDatePayout: yearRuns
        .filter((r) => r.status === "completed")
        .reduce((sum, r) => sum + (r.total_net || 0), 0),
      pendingApproval: runsWithCounts.filter((r) => r.status === "pending_approval").length,
      draft: runsWithCounts.filter((r) => r.status === "draft").length,
    };

    return NextResponse.json({ payrollRuns: runsWithCounts, stats });
  } catch (error) {
    console.error("Get payroll runs error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

// POST - Create a new payroll run
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

    // Get user's profile with tenant_id and role
    const { data: currentProfile } = await supabase
      .from("profiles")
      .select("tenant_id, role")
      .eq("id", user.id)
      .single();

    if (!currentProfile?.tenant_id) {
      return NextResponse.json({ error: "No tenant found" }, { status: 400 });
    }

    // Only admins and owners can create payroll
    if (!["owner", "admin"].includes(currentProfile.role)) {
      return NextResponse.json({ error: "Permission denied" }, { status: 403 });
    }

    const body = await request.json();

    // Generate run number
    const { count } = await supabase
      .from("payroll_runs")
      .select("*", { count: "exact", head: true })
      .eq("tenant_id", currentProfile.tenant_id);

    const runNumber = `PR-${String((count || 0) + 1).padStart(4, "0")}`;

    const payrollRunData = {
      tenant_id: currentProfile.tenant_id,
      period_start: body.period_start,
      period_end: body.period_end,
      pay_date: body.pay_date,
      run_number: runNumber,
      name: body.name || `Payroll ${body.period_start} - ${body.period_end}`,
      status: "draft",
      notes: body.notes || null,
      created_by: user.id,
    };

    const { data: payrollRun, error } = await supabase
      .from("payroll_runs")
      .insert(payrollRunData)
      .select()
      .single();

    if (error) {
      console.error("Insert error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // If employees are provided, create payroll items for them
    if (body.employees && Array.isArray(body.employees) && body.employees.length > 0) {
      const payrollItems = body.employees.map((emp: {
        employee_id: string;
        base_salary?: number;
        hourly_rate?: number;
        hours_worked?: number;
        overtime_hours?: number;
        overtime_rate?: number;
        bonus?: number;
        commission?: number;
        allowances?: number;
        reimbursements?: number;
        tax_federal?: number;
        tax_state?: number;
        tax_local?: number;
        social_security?: number;
        medicare?: number;
        health_insurance?: number;
        dental_insurance?: number;
        vision_insurance?: number;
        retirement_401k?: number;
        other_deductions?: number;
        payment_method?: string;
        notes?: string;
      }) => {
        const regularPay = (emp.hourly_rate || 0) * (emp.hours_worked || 0) + (emp.base_salary || 0);
        const overtimePay = (emp.overtime_rate || (emp.hourly_rate || 0) * 1.5) * (emp.overtime_hours || 0);
        const grossPay = regularPay + overtimePay + (emp.bonus || 0) + (emp.commission || 0) +
                        (emp.allowances || 0) + (emp.reimbursements || 0);

        const totalDeductions = (emp.tax_federal || 0) + (emp.tax_state || 0) + (emp.tax_local || 0) +
                               (emp.social_security || 0) + (emp.medicare || 0) + (emp.health_insurance || 0) +
                               (emp.dental_insurance || 0) + (emp.vision_insurance || 0) +
                               (emp.retirement_401k || 0) + (emp.other_deductions || 0);

        const netPay = grossPay - totalDeductions;

        return {
          tenant_id: currentProfile.tenant_id,
          payroll_run_id: payrollRun.id,
          employee_id: emp.employee_id,
          base_salary: emp.base_salary || 0,
          hourly_rate: emp.hourly_rate || 0,
          hours_worked: emp.hours_worked || 0,
          overtime_hours: emp.overtime_hours || 0,
          overtime_rate: emp.overtime_rate || 0,
          regular_pay: regularPay,
          overtime_pay: overtimePay,
          bonus: emp.bonus || 0,
          commission: emp.commission || 0,
          allowances: emp.allowances || 0,
          reimbursements: emp.reimbursements || 0,
          gross_pay: grossPay,
          tax_federal: emp.tax_federal || 0,
          tax_state: emp.tax_state || 0,
          tax_local: emp.tax_local || 0,
          social_security: emp.social_security || 0,
          medicare: emp.medicare || 0,
          health_insurance: emp.health_insurance || 0,
          dental_insurance: emp.dental_insurance || 0,
          vision_insurance: emp.vision_insurance || 0,
          retirement_401k: emp.retirement_401k || 0,
          other_deductions: emp.other_deductions || 0,
          total_deductions: totalDeductions,
          net_pay: netPay,
          payment_method: emp.payment_method || "direct_deposit",
          notes: emp.notes || null,
          status: "pending",
        };
      });

      const { error: itemsError } = await supabase
        .from("payroll_items")
        .insert(payrollItems);

      if (itemsError) {
        console.error("Insert items error:", itemsError);
        // Don't fail the whole request, just log the error
      }

      // Update payroll run totals
      const totals = payrollItems.reduce(
        (acc: { gross: number; deductions: number; net: number }, item: { gross_pay: number; total_deductions: number; net_pay: number }) => ({
          gross: acc.gross + item.gross_pay,
          deductions: acc.deductions + item.total_deductions,
          net: acc.net + item.net_pay,
        }),
        { gross: 0, deductions: 0, net: 0 }
      );

      await supabase
        .from("payroll_runs")
        .update({
          total_gross: totals.gross,
          total_deductions: totals.deductions,
          total_net: totals.net,
        })
        .eq("id", payrollRun.id);
    }

    // Fetch the complete payroll run
    const { data: completeRun } = await supabase
      .from("payroll_runs")
      .select(`
        *,
        created_by_user:profiles!payroll_runs_created_by_fkey(id, first_name, last_name)
      `)
      .eq("id", payrollRun.id)
      .single();

    return NextResponse.json({ payrollRun: completeRun }, { status: 201 });
  } catch (error) {
    console.error("Create payroll run error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

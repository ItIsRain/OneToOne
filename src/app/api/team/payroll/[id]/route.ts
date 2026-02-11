import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { validateBody, updatePayrollRunSchema } from "@/lib/validations";
import { getUserIdFromRequest } from "@/hooks/useTenantFromHeaders";

// GET - Fetch single payroll run with all items
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = await createClient();
    const { id } = await params;

    // Get user's tenant_id and role from profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("tenant_id, role")
      .eq("id", userId)
      .single();

    if (!profile?.tenant_id) {
      return NextResponse.json({ error: "No tenant found" }, { status: 400 });
    }

    // Only admins and owners can view payroll
    if (!["owner", "admin"].includes(profile.role)) {
      return NextResponse.json({ error: "Permission denied" }, { status: 403 });
    }

    // Fetch payroll run
    const { data: payrollRun, error } = await supabase
      .from("payroll_runs")
      .select(`
        *,
        created_by_user:profiles!payroll_runs_created_by_fkey(id, first_name, last_name, email),
        approved_by_user:profiles!payroll_runs_approved_by_fkey(id, first_name, last_name, email),
        processed_by_user:profiles!payroll_runs_processed_by_fkey(id, first_name, last_name, email)
      `)
      .eq("id", id)
      .eq("tenant_id", profile.tenant_id)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return NextResponse.json({ error: "Payroll run not found" }, { status: 404 });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Fetch payroll items
    const { data: items } = await supabase
      .from("payroll_items")
      .select(`
        *,
        employee:profiles!payroll_items_employee_id_fkey(
          id, first_name, last_name, email, avatar_url, job_title, department
        )
      `)
      .eq("payroll_run_id", id)
      .eq("tenant_id", profile.tenant_id)
      .order("created_at", { ascending: true });

    return NextResponse.json({
      payrollRun: {
        ...payrollRun,
        items: items || [],
      },
    });
  } catch (error) {
    console.error("Get payroll run error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

// PATCH - Update payroll run
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = await createClient();
    const { id } = await params;

    // Get user's profile with tenant_id and role
    const { data: currentProfile } = await supabase
      .from("profiles")
      .select("tenant_id, role")
      .eq("id", userId)
      .single();

    if (!currentProfile?.tenant_id) {
      return NextResponse.json({ error: "No tenant found" }, { status: 400 });
    }

    // Only admins and owners can update payroll
    if (!["owner", "admin"].includes(currentProfile.role)) {
      return NextResponse.json({ error: "Permission denied" }, { status: 403 });
    }

    // Get existing payroll run
    const { data: existingRun } = await supabase
      .from("payroll_runs")
      .select("id, status")
      .eq("id", id)
      .eq("tenant_id", currentProfile.tenant_id)
      .single();

    if (!existingRun) {
      return NextResponse.json({ error: "Payroll run not found" }, { status: 404 });
    }

    const body = await request.json();

    // Validate input
    const validation = validateBody(updatePayrollRunSchema, body);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    // Can't edit completed or cancelled runs
    if (["completed", "cancelled"].includes(existingRun.status) && !body.force) {
      return NextResponse.json(
        { error: "Cannot edit completed or cancelled payroll runs" },
        { status: 400 }
      );
    }

    // Build update object
    const updates: Record<string, unknown> = {};
    const allowedFields = [
      "name", "period_start", "period_end", "pay_date", "notes"
    ];

    allowedFields.forEach((field) => {
      if (body[field] !== undefined) {
        updates[field] = body[field];
      }
    });

    // Handle status changes
    if (body.status) {
      const validTransitions: Record<string, string[]> = {
        draft: ["pending_approval", "cancelled"],
        pending_approval: ["approved", "draft", "cancelled"],
        approved: ["processing", "draft", "cancelled"],
        processing: ["completed", "cancelled"],
        completed: [],
        cancelled: [],
      };

      if (!validTransitions[existingRun.status]?.includes(body.status)) {
        return NextResponse.json(
          { error: `Invalid status transition from ${existingRun.status} to ${body.status}` },
          { status: 400 }
        );
      }

      updates.status = body.status;

      // Set approval info
      if (body.status === "approved") {
        updates.approved_by = userId;
        updates.approved_at = new Date().toISOString();
      }

      // Set processing info
      if (body.status === "processing" || body.status === "completed") {
        updates.processed_by = userId;
        updates.processed_at = new Date().toISOString();
      }

      // If completing, mark all items as paid
      if (body.status === "completed") {
        await supabase
          .from("payroll_items")
          .update({
            status: "paid",
            paid_at: new Date().toISOString(),
          })
          .eq("payroll_run_id", id)
          .eq("tenant_id", currentProfile.tenant_id)
          .eq("status", "pending");
      }
    }

    updates.updated_at = new Date().toISOString();

    const { data: payrollRun, error } = await supabase
      .from("payroll_runs")
      .update(updates)
      .eq("id", id)
      .eq("tenant_id", currentProfile.tenant_id)
      .select(`
        *,
        created_by_user:profiles!payroll_runs_created_by_fkey(id, first_name, last_name)
      `)
      .single();

    if (error) {
      console.error("Update error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ payrollRun });
  } catch (error) {
    console.error("Update payroll run error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

// DELETE - Delete payroll run
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = await createClient();
    const { id } = await params;

    // Get user's profile with tenant_id and role
    const { data: currentProfile } = await supabase
      .from("profiles")
      .select("tenant_id, role")
      .eq("id", userId)
      .single();

    if (!currentProfile?.tenant_id) {
      return NextResponse.json({ error: "No tenant found" }, { status: 400 });
    }

    // Only owners can delete payroll runs
    if (currentProfile.role !== "owner") {
      return NextResponse.json({ error: "Only owners can delete payroll runs" }, { status: 403 });
    }

    // Get existing payroll run
    const { data: existingRun } = await supabase
      .from("payroll_runs")
      .select("id, status")
      .eq("id", id)
      .eq("tenant_id", currentProfile.tenant_id)
      .single();

    if (!existingRun) {
      return NextResponse.json({ error: "Payroll run not found" }, { status: 404 });
    }

    // Can't delete completed runs
    if (existingRun.status === "completed") {
      return NextResponse.json(
        { error: "Cannot delete completed payroll runs" },
        { status: 400 }
      );
    }

    // Delete payroll items first (cascade should handle this, but just to be safe)
    await supabase
      .from("payroll_items")
      .delete()
      .eq("payroll_run_id", id)
      .eq("tenant_id", currentProfile.tenant_id);

    // Delete payroll run
    const { error } = await supabase
      .from("payroll_runs")
      .delete()
      .eq("id", id)
      .eq("tenant_id", currentProfile.tenant_id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete payroll run error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

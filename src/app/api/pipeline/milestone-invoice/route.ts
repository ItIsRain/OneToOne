import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getUserPlanInfo, checkFeatureAccess } from "@/lib/plan-limits";
import { getUserIdFromRequest } from "@/hooks/useTenantFromHeaders";

export async function POST(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = await createClient();

    const { data: profile } = await supabase
      .from("profiles")
      .select("tenant_id")
      .eq("id", userId)
      .single();

    if (!profile?.tenant_id) {
      return NextResponse.json({ error: "No tenant found" }, { status: 400 });
    }

    // Feature gate
    const planInfo = await getUserPlanInfo(supabase, userId);
    if (!planInfo) {
      return NextResponse.json(
        { error: "No active subscription found", upgrade_required: true },
        { status: 403 }
      );
    }
    const access = checkFeatureAccess(planInfo.planType, "sow_pipeline");
    if (!access.allowed) {
      return NextResponse.json(
        { error: access.reason, upgrade_required: true },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { task_id } = body;

    if (!task_id) {
      return NextResponse.json(
        { error: "task_id is required" },
        { status: 400 }
      );
    }

    // Fetch task
    const { data: task, error: taskError } = await supabase
      .from("tasks")
      .select("*, project:projects(id, name, client_id, currency)")
      .eq("id", task_id)
      .eq("tenant_id", profile.tenant_id)
      .single();

    if (taskError || !task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    // Task must have pipeline:payment tag
    const tags = Array.isArray(task.tags) ? task.tags : [];
    if (!tags.includes("pipeline:payment")) {
      return NextResponse.json(
        { error: "Task is not a pipeline payment milestone" },
        { status: 400 }
      );
    }

    // Task must be completed
    if (task.status !== "completed") {
      return NextResponse.json(
        { error: "Milestone task must be completed before generating an invoice" },
        { status: 400 }
      );
    }

    // Parse amount from notes: [milestone_amount:XXXX]
    const amountMatch = (task.notes || "").match(
      /\[milestone_amount:([\d.]+)\]/
    );
    const amount = amountMatch ? parseFloat(amountMatch[1]) : 0;

    if (amount <= 0) {
      return NextResponse.json(
        { error: "No valid amount found in milestone task" },
        { status: 400 }
      );
    }

    // Duplicate check via reference_number
    const referenceNumber = `PIPE-MS-${task.id.substring(0, 8)}`;
    const { data: existingInvoice } = await supabase
      .from("invoices")
      .select("id")
      .eq("reference_number", referenceNumber)
      .eq("tenant_id", profile.tenant_id)
      .maybeSingle();

    if (existingInvoice) {
      return NextResponse.json(
        {
          error: "An invoice already exists for this milestone",
          invoice_id: existingInvoice.id,
        },
        { status: 409 }
      );
    }

    // Generate invoice number with uniqueness check
    const year = new Date().getFullYear().toString().slice(-2);
    const { count } = await supabase
      .from("invoices")
      .select("*", { count: "exact", head: true })
      .eq("tenant_id", profile.tenant_id);

    let nextNumber = (count || 0) + 1;
    let invoiceNumber = `INV-${year}-${nextNumber.toString().padStart(4, "0")}`;

    // Check uniqueness and increment if collision
    const { data: existingInvNum } = await supabase
      .from("invoices")
      .select("id")
      .eq("tenant_id", profile.tenant_id)
      .eq("invoice_number", invoiceNumber)
      .maybeSingle();

    if (existingInvNum) {
      nextNumber++;
      invoiceNumber = `INV-${year}-${nextNumber.toString().padStart(4, "0")}`;
    }

    const currency = task.project?.currency || "USD";
    const milestoneName = task.title.replace(/^Milestone:\s*/, "");

    // Create invoice
    const invoiceData = {
      tenant_id: profile.tenant_id,
      invoice_number: invoiceNumber,
      reference_number: referenceNumber,
      client_id: task.project?.client_id || null,
      project_id: task.project_id || null,
      title: `Milestone Invoice: ${milestoneName}`,
      subtotal: amount,
      tax_rate: 0,
      tax_amount: 0,
      discount_type: "fixed",
      discount_value: 0,
      discount_amount: 0,
      total: amount,
      amount: amount,
      amount_paid: 0,
      currency,
      status: "draft",
      issue_date: new Date().toISOString().split("T")[0],
      payment_terms: "net_30",
      notes: `Auto-generated from pipeline milestone: ${task.title}`,
      tags: ["pipeline:milestone-invoice"],
      created_by: userId,
    };

    const { data: invoice, error: invoiceError } = await supabase
      .from("invoices")
      .insert(invoiceData)
      .select("*")
      .single();

    if (invoiceError) {
      console.error("Pipeline invoice creation error:", invoiceError);
      return NextResponse.json(
        { error: invoiceError.message },
        { status: 500 }
      );
    }

    // Insert single line item
    const { error: itemError } = await supabase.from("invoice_items").insert({
      invoice_id: invoice.id,
      description: `Milestone payment: ${milestoneName}`,
      quantity: 1,
      unit_price: amount,
      unit: "milestone",
      amount: amount,
      sort_order: 0,
    });

    if (itemError) {
      console.error("Pipeline invoice item creation error:", itemError);
      // Clean up the orphaned invoice
      await supabase.from("invoices").delete().eq("id", invoice.id);
      return NextResponse.json(
        { error: itemError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ invoice });
  } catch (error) {
    console.error("Pipeline milestone-invoice error:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}

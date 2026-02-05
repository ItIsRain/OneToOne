import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { checkTriggers } from "@/lib/workflows/triggers";

// This endpoint should be called by a cron job (e.g. Vercel Cron, external scheduler)
// to detect overdue invoices and fire the invoice_overdue workflow trigger.
//
// Recommended schedule: once daily
// Protected by CRON_SECRET to prevent unauthorized access.

export async function GET(request: NextRequest) {
  try {
    // Verify cron secret to prevent unauthorized calls
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ error: "Missing Supabase config" }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Find all unpaid invoices that are past due
    const today = new Date().toISOString().slice(0, 10);
    const { data: overdueInvoices, error } = await supabase
      .from("invoices")
      .select("id, invoice_number, total, amount, due_date, client_id, tenant_id, status")
      .lt("due_date", today)
      .not("status", "eq", "paid")
      .not("status", "eq", "cancelled")
      .not("status", "eq", "refunded");

    if (error) {
      console.error("Failed to fetch overdue invoices:", error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!overdueInvoices || overdueInvoices.length === 0) {
      return NextResponse.json({ triggered: 0, message: "No overdue invoices found" });
    }

    // Track which workflows were already triggered today to avoid duplicates
    // Check workflow_runs for invoice_overdue triggers from today
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const { data: todaysRuns } = await supabase
      .from("workflow_runs")
      .select("trigger_data")
      .gte("started_at", todayStart.toISOString());

    const alreadyTriggeredInvoiceIds = new Set<string>();
    if (todaysRuns) {
      for (const run of todaysRuns) {
        const triggerData = run.trigger_data as Record<string, unknown> | null;
        if (triggerData?.entity_type === "invoice" && triggerData?.entity_id) {
          alreadyTriggeredInvoiceIds.add(triggerData.entity_id as string);
        }
      }
    }

    let triggeredCount = 0;

    // Group invoices by tenant and fire triggers
    const invoicesByTenant = new Map<string, typeof overdueInvoices>();
    for (const invoice of overdueInvoices) {
      if (alreadyTriggeredInvoiceIds.has(invoice.id)) continue;
      const list = invoicesByTenant.get(invoice.tenant_id) || [];
      list.push(invoice);
      invoicesByTenant.set(invoice.tenant_id, list);
    }

    for (const [tenantId, invoices] of invoicesByTenant) {
      // Look up a tenant admin to use as userId
      const { data: tenantAdmin } = await supabase
        .from("profiles")
        .select("id")
        .eq("tenant_id", tenantId)
        .limit(1)
        .single();

      if (!tenantAdmin) continue;

      for (const invoice of invoices) {
        const dueDate = new Date(invoice.due_date);
        const now = new Date();
        const daysOverdue = Math.floor((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));

        try {
          await checkTriggers(
            "invoice_overdue",
            {
              entity_id: invoice.id,
              entity_type: "invoice",
              entity_name: invoice.invoice_number || `Invoice ${invoice.id}`,
              invoice_number: invoice.invoice_number || "",
              invoice_amount: String(invoice.total || invoice.amount || 0),
              invoice_due_date: invoice.due_date,
              invoice_client_id: invoice.client_id || null,
              days_overdue: String(daysOverdue),
            },
            supabase,
            tenantId,
            tenantAdmin.id
          );
          triggeredCount++;
        } catch (err) {
          console.error(`Failed to trigger invoice_overdue for ${invoice.id}:`, err);
        }
      }
    }

    return NextResponse.json({
      triggered: triggeredCount,
      total_overdue: overdueInvoices.length,
      skipped_already_triggered: alreadyTriggeredInvoiceIds.size,
    });
  } catch (error) {
    console.error("Cron invoice-overdue error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

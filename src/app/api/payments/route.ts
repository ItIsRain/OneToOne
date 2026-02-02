import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { checkTriggers } from "@/lib/workflows/triggers";
import { createPaymentSchema, validateBody } from "@/lib/validations";

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

// GET - Fetch all payments for the user's tenant
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

    // Fetch payments with related data
    const { data: payments, error } = await supabase
      .from("payments")
      .select(`
        *,
        client:clients(id, name, email, company),
        invoice:invoices(id, invoice_number, total, currency, status)
      `)
      .eq("tenant_id", profile.tenant_id)
      .order("payment_date", { ascending: false })
      .limit(500);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ payments });
  } catch (error) {
    console.error("Get payments error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

// POST - Create a new payment
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
    const validation = validateBody(createPaymentSchema, body);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }
    const v = validation.data;

    // If payment is linked to an invoice and completed, validate before insert
    if (v.invoice_id && v.status === "completed") {
      const { data: invoice } = await supabase
        .from("invoices")
        .select("amount_paid, total, amount, status, currency")
        .eq("id", v.invoice_id)
        .eq("tenant_id", profile.tenant_id)
        .single();

      if (!invoice) {
        return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
      }

      // Validate currency matches invoice
      if (invoice.currency && v.currency && invoice.currency !== v.currency) {
        return NextResponse.json(
          { error: `Currency mismatch: payment is ${v.currency} but invoice is ${invoice.currency}` },
          { status: 400 }
        );
      }

      // Don't allow payments on cancelled/void/refunded invoices
      const nonPayableStatuses = ["cancelled", "void", "refunded"];
      if (nonPayableStatuses.includes(invoice.status)) {
        return NextResponse.json(
          { error: `Cannot add payment to ${invoice.status} invoice` },
          { status: 400 }
        );
      }

      // Validate: prevent overpayment
      const paymentAmount = parseFloat(String(v.amount));
      const currentPaid = invoice.amount_paid || 0;
      const invoiceTotal = invoice.total || invoice.amount || 0;

      if (currentPaid + paymentAmount > invoiceTotal) {
        const remaining = Math.max(0, invoiceTotal - currentPaid);
        return NextResponse.json(
          { error: `Payment would exceed invoice total. Remaining balance: ${remaining.toFixed(2)} ${invoice.currency || v.currency}` },
          { status: 400 }
        );
      }
    }

    // Validate client_id belongs to the same tenant
    if (v.client_id) {
      const { data: client } = await supabase
        .from("clients").select("id").eq("id", v.client_id).eq("tenant_id", profile.tenant_id).single();
      if (!client) {
        return NextResponse.json({ error: "Client not found" }, { status: 404 });
      }
    }

    const paymentData = {
      tenant_id: profile.tenant_id,
      invoice_id: v.invoice_id || null,
      client_id: v.client_id || null,
      client_name: v.client_name || null,
      amount: v.amount,
      currency: v.currency,
      payment_date: v.payment_date || new Date().toISOString().split("T")[0],
      payment_method: v.payment_method || null,
      transaction_id: v.transaction_id || null,
      reference_number: v.reference_number || null,
      status: v.status,
      notes: v.notes || null,
      created_by: user.id,
    };

    const { data: payment, error } = await supabase
      .from("payments")
      .insert(paymentData)
      .select(`
        *,
        client:clients(id, name, email, company),
        invoice:invoices(id, invoice_number, total, currency, status)
      `)
      .single();

    if (error) {
      console.error("Insert error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // If payment is linked to an invoice and completed, update the invoice
    if (v.invoice_id && v.status === "completed") {
      const { data: invoice } = await supabase
        .from("invoices")
        .select("amount_paid, total, amount, status, currency")
        .eq("id", v.invoice_id)
        .eq("tenant_id", profile.tenant_id)
        .single();

      if (invoice) {
        const paymentAmount = parseFloat(String(v.amount));
        const currentPaid = invoice.amount_paid || 0;
        const invoiceTotal = invoice.total || invoice.amount || 0;
        const newAmountPaid = currentPaid + paymentAmount;
        const newStatus = newAmountPaid >= invoiceTotal ? "paid" : "partially_paid";

        await supabase
          .from("invoices")
          .update({
            amount_paid: newAmountPaid,
            status: newStatus,
            paid_at: newAmountPaid >= invoiceTotal ? new Date().toISOString() : null,
            updated_at: new Date().toISOString(),
          })
          .eq("id", v.invoice_id)
          .eq("tenant_id", profile.tenant_id);
      }
    }

    // Trigger workflow automations for payment_received
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (supabaseUrl && supabaseServiceKey) {
      const serviceClient = createServiceClient(supabaseUrl, supabaseServiceKey);
      try {
        await checkTriggers("payment_received", {
          entity_id: payment.id,
          entity_type: "payment",
          entity_name: `Payment ${payment.amount} ${payment.currency}`,
          payment_amount: payment.amount,
          payment_method: payment.payment_method,
          payment_invoice_id: payment.invoice_id,
          payment_client_id: payment.client_id,
        }, serviceClient, profile.tenant_id, user.id);
      } catch (err) {
        console.error("Workflow trigger error (payment_received):", err);
      }
    }

    return NextResponse.json({ payment }, { status: 201 });
  } catch (error) {
    console.error("Create payment error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

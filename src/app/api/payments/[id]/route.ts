import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { validateBody, updatePaymentSchema } from "@/lib/validations";
import { getUserIdFromRequest } from "@/hooks/useTenantFromHeaders";

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

// GET - Fetch single payment
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = await getSupabaseClient();
    const { id } = await params;

    // Get user's tenant_id from profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("tenant_id")
      .eq("id", userId)
      .single();

    if (!profile?.tenant_id) {
      return NextResponse.json({ error: "No tenant found" }, { status: 400 });
    }

    // Fetch payment with related data
    const { data: payment, error } = await supabase
      .from("payments")
      .select(`
        *,
        client:clients(id, name, email, company),
        invoice:invoices(id, invoice_number, total, currency, status, client:clients(id, name))
      `)
      .eq("id", id)
      .eq("tenant_id", profile.tenant_id)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return NextResponse.json({ error: "Payment not found" }, { status: 404 });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ payment });
  } catch (error) {
    console.error("Get payment error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

// PATCH - Update payment
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = await getSupabaseClient();
    const { id } = await params;

    // Get user's tenant_id from profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("tenant_id")
      .eq("id", userId)
      .single();

    if (!profile?.tenant_id) {
      return NextResponse.json({ error: "No tenant found" }, { status: 400 });
    }

    const body = await request.json();

    // Validate input
    const validation = validateBody(updatePaymentSchema, body);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    // Fetch existing payment to detect amount/status changes
    const { data: existingPayment } = await supabase
      .from("payments")
      .select("invoice_id, amount, status")
      .eq("id", id)
      .eq("tenant_id", profile.tenant_id)
      .single();

    if (!existingPayment) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 });
    }

    // Fields that should be null when empty
    const nullableUuidFields = ["client_id", "invoice_id"];
    const nullableDateFields = ["payment_date"];
    const nullableStringFields = ["transaction_id", "reference_number", "notes", "client_name"];

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
      "invoice_id", "client_id", "client_name", "amount", "currency",
      "payment_date", "payment_method", "transaction_id", "reference_number",
      "status", "notes"
    ];

    const updates: Record<string, unknown> = {};
    allowedFields.forEach((field) => {
      if (body[field] !== undefined) {
        updates[field] = body[field];
      }
    });

    updates.updated_at = new Date().toISOString();

    const { data: payment, error } = await supabase
      .from("payments")
      .update(updates)
      .eq("id", id)
      .eq("tenant_id", profile.tenant_id)
      .select(`
        *,
        client:clients(id, name, email, company),
        invoice:invoices(id, invoice_number, total, currency, status)
      `)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return NextResponse.json({ error: "Payment not found" }, { status: 404 });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Recalculate invoice amount_paid if payment amount, status, or invoice_id changed
    const amountChanged = body.amount !== undefined && body.amount !== existingPayment.amount;
    const statusChanged = body.status !== undefined && body.status !== existingPayment.status;
    const invoiceChanged = body.invoice_id !== undefined && body.invoice_id !== existingPayment.invoice_id;
    const oldInvoiceId = existingPayment.invoice_id;
    const newInvoiceId = body.invoice_id !== undefined ? body.invoice_id : oldInvoiceId;

    const tenantId = profile.tenant_id;

    // Helper function to recalculate invoice amounts
    async function recalculateInvoice(invoiceId: string | null) {
      if (!invoiceId) return;

      // Sum all completed payments for this invoice
      const { data: allPayments } = await supabase
        .from("payments")
        .select("amount, status")
        .eq("invoice_id", invoiceId)
        .eq("tenant_id", tenantId)
        .eq("status", "completed");

      const totalPaid = (allPayments || []).reduce((sum, p) => sum + (p.amount || 0), 0);

      const { data: invoice } = await supabase
        .from("invoices")
        .select("total, amount, status")
        .eq("id", invoiceId)
        .eq("tenant_id", tenantId)
        .single();

      if (invoice) {
        const invoiceTotal = invoice.total || invoice.amount || 0;
        let newStatus = invoice.status;
        if (totalPaid >= invoiceTotal && invoiceTotal > 0) {
          newStatus = "paid";
        } else if (totalPaid > 0) {
          newStatus = "partially_paid";
        } else if (invoice.status === "paid" || invoice.status === "partially_paid") {
          newStatus = "sent";
        }

        await supabase
          .from("invoices")
          .update({
            amount_paid: totalPaid,
            status: newStatus,
            paid_at: newStatus === "paid" ? new Date().toISOString() : null,
            updated_at: new Date().toISOString(),
          })
          .eq("id", invoiceId)
          .eq("tenant_id", tenantId);
      }
    }

    // Recalculate affected invoices
    if (invoiceChanged) {
      // Payment moved to different invoice - recalculate both
      await recalculateInvoice(oldInvoiceId);
      await recalculateInvoice(newInvoiceId);
    } else if ((oldInvoiceId || newInvoiceId) && (amountChanged || statusChanged)) {
      // Same invoice but amount/status changed
      await recalculateInvoice(oldInvoiceId || newInvoiceId);
    }

    return NextResponse.json({ payment });
  } catch (error) {
    console.error("Update payment error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

// DELETE - Delete payment
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = await getSupabaseClient();
    const { id } = await params;

    // Get user's tenant_id from profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("tenant_id")
      .eq("id", userId)
      .single();

    if (!profile?.tenant_id) {
      return NextResponse.json({ error: "No tenant found" }, { status: 400 });
    }

    // Get the payment first to check if we need to update invoice
    const { data: existingPayment } = await supabase
      .from("payments")
      .select("invoice_id, amount, status")
      .eq("id", id)
      .eq("tenant_id", profile.tenant_id)
      .single();

    const { error } = await supabase
      .from("payments")
      .delete()
      .eq("id", id)
      .eq("tenant_id", profile.tenant_id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // If payment was linked to an invoice and was completed, recalculate invoice amount_paid
    if (existingPayment?.invoice_id && existingPayment.status === "completed") {
      // Sum all remaining completed payments for this invoice
      const { data: remainingPayments } = await supabase
        .from("payments")
        .select("amount")
        .eq("invoice_id", existingPayment.invoice_id)
        .eq("tenant_id", profile.tenant_id)
        .eq("status", "completed");

      const newAmountPaid = (remainingPayments || []).reduce((sum, p) => sum + (p.amount || 0), 0);

      const { data: invoice } = await supabase
        .from("invoices")
        .select("total, amount, status, due_date")
        .eq("id", existingPayment.invoice_id)
        .eq("tenant_id", profile.tenant_id)
        .single();

      if (invoice) {
        const invoiceTotal = invoice.total || invoice.amount || 0;
        let newStatus = invoice.status;
        if (newAmountPaid >= invoiceTotal && invoiceTotal > 0) {
          newStatus = "paid";
        } else if (newAmountPaid > 0) {
          newStatus = "partially_paid";
        } else {
          // No payments left — check if invoice is overdue based on due_date
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const dueDate = invoice.due_date ? new Date(invoice.due_date) : null;

          if (dueDate && dueDate < today) {
            newStatus = "overdue";
          } else if (invoice.status === "paid" || invoice.status === "partially_paid") {
            // Was previously paid, now unpaid - revert to sent
            newStatus = "sent";
          }
          // Otherwise keep current status (sent, viewed, etc.)
        }

        await supabase
          .from("invoices")
          .update({
            amount_paid: newAmountPaid,
            status: newStatus,
            paid_at: newStatus === "paid" ? new Date().toISOString() : null,
            updated_at: new Date().toISOString(),
          })
          .eq("id", existingPayment.invoice_id)
          .eq("tenant_id", profile.tenant_id);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete payment error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

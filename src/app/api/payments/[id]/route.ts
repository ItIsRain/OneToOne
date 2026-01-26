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

// GET - Fetch single payment
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

    // If payment was linked to an invoice and was completed, update the invoice amount_paid
    if (existingPayment?.invoice_id && existingPayment.status === "completed") {
      const { data: invoice } = await supabase
        .from("invoices")
        .select("amount_paid, total, amount")
        .eq("id", existingPayment.invoice_id)
        .single();

      if (invoice) {
        const newAmountPaid = Math.max(0, (invoice.amount_paid || 0) - existingPayment.amount);
        const invoiceTotal = invoice.total || invoice.amount || 0;
        let newStatus = "sent";
        if (newAmountPaid > 0 && newAmountPaid < invoiceTotal) {
          newStatus = "partially_paid";
        } else if (newAmountPaid >= invoiceTotal) {
          newStatus = "paid";
        }

        await supabase
          .from("invoices")
          .update({
            amount_paid: newAmountPaid,
            status: newStatus,
            paid_at: newStatus === "paid" ? invoice.amount_paid : null,
            updated_at: new Date().toISOString(),
          })
          .eq("id", existingPayment.invoice_id);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete payment error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

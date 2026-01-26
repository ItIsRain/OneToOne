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
      .order("payment_date", { ascending: false });

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

    const paymentData = {
      tenant_id: profile.tenant_id,
      invoice_id: body.invoice_id || null,
      client_id: body.client_id || null,
      client_name: body.client_name || null,
      amount: parseFloat(body.amount) || 0,
      currency: body.currency || "USD",
      payment_date: body.payment_date || new Date().toISOString().split("T")[0],
      payment_method: body.payment_method || null,
      transaction_id: body.transaction_id || null,
      reference_number: body.reference_number || null,
      status: body.status || "completed",
      notes: body.notes || null,
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
    if (body.invoice_id && body.status === "completed") {
      // Get current invoice
      const { data: invoice } = await supabase
        .from("invoices")
        .select("amount_paid, total, amount")
        .eq("id", body.invoice_id)
        .single();

      if (invoice) {
        const newAmountPaid = (invoice.amount_paid || 0) + parseFloat(body.amount);
        const invoiceTotal = invoice.total || invoice.amount || 0;
        const newStatus = newAmountPaid >= invoiceTotal ? "paid" : "partially_paid";

        await supabase
          .from("invoices")
          .update({
            amount_paid: newAmountPaid,
            status: newStatus,
            paid_at: newAmountPaid >= invoiceTotal ? new Date().toISOString() : null,
            updated_at: new Date().toISOString(),
          })
          .eq("id", body.invoice_id);
      }
    }

    return NextResponse.json({ payment }, { status: 201 });
  } catch (error) {
    console.error("Create payment error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

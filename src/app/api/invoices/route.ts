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

// Generate invoice number
async function generateInvoiceNumber(supabase: ReturnType<typeof createServerClient>, tenantId: string) {
  const year = new Date().getFullYear().toString().slice(-2);

  const { count } = await supabase
    .from("invoices")
    .select("*", { count: "exact", head: true })
    .eq("tenant_id", tenantId);

  const nextNumber = (count || 0) + 1;
  return `INV-${year}-${nextNumber.toString().padStart(4, "0")}`;
}

// GET - Fetch all invoices for the user's tenant
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

    // Fetch invoices with client and project info
    const { data: invoices, error } = await supabase
      .from("invoices")
      .select(`
        *,
        client:clients(id, name, email, company),
        project:projects(id, name, project_code),
        event:events(id, title)
      `)
      .eq("tenant_id", profile.tenant_id)
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ invoices });
  } catch (error) {
    console.error("Get invoices error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

// POST - Create a new invoice
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

    // Generate invoice number if not provided
    const invoiceNumber = body.invoice_number || await generateInvoiceNumber(supabase, profile.tenant_id);

    // Calculate totals
    const subtotal = parseFloat(body.subtotal) || parseFloat(body.amount) || 0;
    const taxRate = parseFloat(body.tax_rate) || 0;
    const taxAmount = subtotal * (taxRate / 100);
    const discountValue = parseFloat(body.discount_value) || 0;
    const discountAmount = body.discount_type === 'percentage'
      ? subtotal * (discountValue / 100)
      : discountValue;
    const total = subtotal + taxAmount - discountAmount;

    const invoiceData = {
      tenant_id: profile.tenant_id,
      invoice_number: invoiceNumber,
      client_id: body.client_id || null,
      project_id: body.project_id || null,
      event_id: body.event_id || null,
      title: body.title || null,
      subtotal: subtotal,
      tax_rate: taxRate,
      tax_amount: taxAmount,
      discount_type: body.discount_type || 'fixed',
      discount_value: discountValue,
      discount_amount: discountAmount,
      total: total,
      amount: total, // For backward compatibility
      amount_paid: parseFloat(body.amount_paid) || 0,
      currency: body.currency || 'USD',
      status: body.status || 'draft',
      issue_date: body.issue_date || new Date().toISOString().split('T')[0],
      due_date: body.due_date || null,
      payment_terms: body.payment_terms || 'net_30',
      notes: body.notes || null,
      terms_and_conditions: body.terms_and_conditions || null,
      footer_note: body.footer_note || null,
      billing_name: body.billing_name || null,
      billing_email: body.billing_email || null,
      billing_address: body.billing_address || null,
      billing_city: body.billing_city || null,
      billing_country: body.billing_country || null,
      po_number: body.po_number || null,
      reference_number: body.reference_number || null,
      tags: body.tags || null,
      created_by: user.id,
    };

    const { data: invoice, error } = await supabase
      .from("invoices")
      .insert(invoiceData)
      .select(`
        *,
        client:clients(id, name, email, company),
        project:projects(id, name, project_code),
        event:events(id, title)
      `)
      .single();

    if (error) {
      console.error("Insert error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // If items are provided, insert them
    if (body.items && Array.isArray(body.items) && body.items.length > 0) {
      const itemsData = body.items.map((item: Record<string, unknown>, index: number) => ({
        invoice_id: invoice.id,
        description: item.description,
        quantity: parseFloat(item.quantity as string) || 1,
        unit_price: parseFloat(item.unit_price as string) || 0,
        unit: item.unit || 'unit',
        amount: (parseFloat(item.quantity as string) || 1) * (parseFloat(item.unit_price as string) || 0),
        discount_type: item.discount_type || 'fixed',
        discount_value: parseFloat(item.discount_value as string) || 0,
        tax_rate: parseFloat(item.tax_rate as string) || 0,
        sort_order: index,
        notes: item.notes || null,
      }));

      const { error: itemsError } = await supabase
        .from("invoice_items")
        .insert(itemsData);

      if (itemsError) {
        console.error("Insert items error:", itemsError);
      }
    }

    return NextResponse.json({ invoice }, { status: 201 });
  } catch (error) {
    console.error("Create invoice error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

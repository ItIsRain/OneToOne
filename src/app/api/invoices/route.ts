import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { getUserPlanInfo, checkFeatureAccess } from "@/lib/plan-limits";
import { checkTriggers } from "@/lib/workflows/triggers";
import { createInvoiceSchema, validateBody } from "@/lib/validations";

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

    // Check plan feature access for invoicing
    const planInfo = await getUserPlanInfo(supabase, user.id);
    if (!planInfo) {
      return NextResponse.json(
        { error: "No active subscription found", upgrade_required: true },
        { status: 403 }
      );
    }

    const invoicingAccess = checkFeatureAccess(planInfo.planType, "invoicing");
    if (!invoicingAccess.allowed) {
      return NextResponse.json(
        {
          error: invoicingAccess.reason,
          upgrade_required: invoicingAccess.upgrade_required,
        },
        { status: 403 }
      );
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
      .order("created_at", { ascending: false })
      .limit(500);

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

    // Check plan feature access for invoicing
    const planInfo = await getUserPlanInfo(supabase, user.id);
    if (!planInfo) {
      return NextResponse.json(
        { error: "No active subscription found", upgrade_required: true },
        { status: 403 }
      );
    }

    const invoicingAccess = checkFeatureAccess(planInfo.planType, "invoicing");
    if (!invoicingAccess.allowed) {
      return NextResponse.json(
        {
          error: invoicingAccess.reason,
          upgrade_required: invoicingAccess.upgrade_required,
        },
        { status: 403 }
      );
    }

    const body = await request.json();

    // Validate input
    const validation = validateBody(createInvoiceSchema, body);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }
    const v = validation.data;

    // Validate date constraints
    const issueDate = body.issue_date || new Date().toISOString().split('T')[0];
    if (v.due_date && v.due_date < issueDate) {
      return NextResponse.json({ error: "Due date cannot be before issue date" }, { status: 400 });
    }

    // Generate invoice number if not provided
    const invoiceNumber = v.invoice_number || await generateInvoiceNumber(supabase, profile.tenant_id);

    // Check invoice number uniqueness within tenant
    const { data: existingInvoice } = await supabase
      .from("invoices")
      .select("id")
      .eq("tenant_id", profile.tenant_id)
      .eq("invoice_number", invoiceNumber)
      .maybeSingle();

    if (existingInvoice) {
      return NextResponse.json({ error: "Invoice number already exists" }, { status: 409 });
    }

    // Calculate totals
    const subtotal = v.subtotal ?? v.amount ?? 0;
    const taxRate = v.tax_rate ?? 0;
    const taxAmount = Math.round(subtotal * (taxRate / 100) * 100) / 100;
    const discountValue = v.discount_value ?? 0;
    const discountAmount = Math.round(
      (v.discount_type === 'percentage'
        ? subtotal * (discountValue / 100)
        : discountValue) * 100
    ) / 100;
    const total = Math.round((subtotal + taxAmount - discountAmount) * 100) / 100;

    const invoiceData = {
      tenant_id: profile.tenant_id,
      invoice_number: invoiceNumber,
      client_id: v.client_id || null,
      project_id: v.project_id || null,
      event_id: body.event_id || null,
      title: body.title || null,
      subtotal: subtotal,
      tax_rate: taxRate,
      tax_amount: taxAmount,
      discount_type: v.discount_type,
      discount_value: discountValue,
      discount_amount: discountAmount,
      total: total,
      amount: total, // For backward compatibility
      amount_paid: 0,
      currency: v.currency,
      status: v.status,
      issue_date: issueDate,
      due_date: v.due_date || null,
      payment_terms: body.payment_terms || 'net_30',
      notes: v.notes || null,
      terms_and_conditions: body.terms_and_conditions || null,
      footer_note: body.footer_note || null,
      billing_name: body.billing_name || null,
      billing_email: body.billing_email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.billing_email) ? body.billing_email : null,
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

    // Trigger workflow automations for invoice_created
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (supabaseUrl && supabaseServiceKey) {
      const serviceClient = createServiceClient(supabaseUrl, supabaseServiceKey);
      try {
        await checkTriggers("invoice_created", {
          entity_id: invoice.id,
          entity_type: "invoice",
          entity_name: invoice.invoice_number,
          invoice_number: invoice.invoice_number,
          invoice_amount: invoice.total,
          invoice_client_id: invoice.client_id,
          invoice_due_date: invoice.due_date,
        }, serviceClient, profile.tenant_id, user.id);
      } catch (err) {
        console.error("Workflow trigger error (invoice_created):", err);
      }
    }

    return NextResponse.json({ invoice }, { status: 201 });
  } catch (error) {
    console.error("Create invoice error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

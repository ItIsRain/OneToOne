import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { checkRateLimit, getClientIp, rateLimitResponse } from "@/lib/rate-limit";

// GET - Fetch invoice publicly (no auth required)
// The invoice ID itself acts as an unguessable token (UUID)
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Rate limit: 30 requests per IP per minute to prevent UUID enumeration
    const ip = getClientIp(request);
    const rateCheck = await checkRateLimit({
      key: "public-invoice",
      identifier: ip,
      maxRequests: 30,
      windowSeconds: 60,
    });
    if (!rateCheck.allowed) {
      return rateLimitResponse(rateCheck.retryAfterSeconds!);
    }

    // Validate UUID format to avoid unnecessary DB queries
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      return NextResponse.json({ error: "Invalid invoice ID" }, { status: 400 });
    }

    const supabase = await createClient();

    const { data: invoice, error } = await supabase
      .from("invoices")
      .select(`
        id,
        invoice_number,
        title,
        subtotal,
        tax_rate,
        tax_amount,
        discount_type,
        discount_value,
        discount_amount,
        total,
        amount,
        amount_paid,
        currency,
        status,
        issue_date,
        due_date,
        sent_date,
        paid_at,
        payment_terms,
        notes,
        terms_and_conditions,
        footer_note,
        billing_name,
        billing_email,
        billing_address,
        billing_city,
        billing_country,
        po_number,
        reference_number,
        tenant_id,
        client:clients(id, name, email, company),
        project:projects(id, name, project_code),
        items:invoice_items(id, description, quantity, unit_price, unit, amount, discount_type, discount_value, tax_rate, sort_order, notes)
      `)
      .eq("id", id)
      .single();

    if (error || !invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    // Fetch tenant info for branding
    const { data: tenant } = await supabase
      .from("tenants")
      .select("name, subdomain")
      .eq("id", invoice.tenant_id)
      .single();

    // Strip tenant_id from response (internal detail)
    const { tenant_id: _, ...publicInvoice } = invoice;

    return NextResponse.json({
      invoice: publicInvoice,
      tenant: tenant ? { name: tenant.name } : null,
    });
  } catch (error) {
    console.error("Public invoice fetch error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/email";
import { invoiceEmail } from "@/lib/email-templates";

// POST - Send invoice via email to client
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("tenant_id")
      .eq("id", user.id)
      .single();

    if (!profile?.tenant_id) {
      return NextResponse.json({ error: "No tenant found" }, { status: 400 });
    }

    // Fetch invoice with client info
    const { data: invoice, error: fetchError } = await supabase
      .from("invoices")
      .select(`
        *,
        client:clients(id, name, email, company)
      `)
      .eq("id", id)
      .eq("tenant_id", profile.tenant_id)
      .single();

    if (fetchError || !invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    // Parse optional request body for custom recipient or message
    let customEmail: string | undefined;
    let customMessage: string | undefined;
    try {
      const body = await request.json();
      customEmail = body.email;
      customMessage = body.message;
    } catch {
      // No body is fine — we'll use the client email
    }

    // Validate custom email format if provided
    if (customEmail) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (typeof customEmail !== "string" || !emailRegex.test(customEmail) || customEmail.length > 254) {
        return NextResponse.json({ error: "Invalid email address format" }, { status: 400 });
      }
    }

    // Sanitize custom message to prevent header injection
    if (customMessage) {
      customMessage = customMessage.replace(/[\r\n]/g, " ").substring(0, 200);
    }

    // Determine recipient
    const client = invoice.client as { id: string; name: string; email: string | null; company: string | null } | null;
    const recipientEmail = customEmail || client?.email || invoice.billing_email;

    if (!recipientEmail) {
      return NextResponse.json(
        { error: "No email address found. Add an email to the client or billing details." },
        { status: 400 }
      );
    }

    const clientName = client?.name || invoice.billing_name || "Client";
    const invoiceTotal = invoice.total || invoice.amount || 0;
    const currency = invoice.currency || "USD";

    const formattedAmount = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      minimumFractionDigits: 2,
    }).format(invoiceTotal);

    const formattedDueDate = invoice.due_date
      ? new Date(invoice.due_date).toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        })
      : "On receipt";

    // Build the view URL — direct public invoice link (no login required)
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://1i1.ae";
    const viewUrl = `${appUrl}/invoice/${id}`;

    // Fetch tenant name for branding in email
    const { data: tenant } = await supabase
      .from("tenants")
      .select("subdomain")
      .eq("id", profile.tenant_id)
      .single();

    // Build email HTML
    const html = invoiceEmail({
      clientName,
      invoiceNumber: invoice.invoice_number,
      amount: formattedAmount,
      dueDate: formattedDueDate,
      viewUrl,
    });

    // If there's a custom message, we could prepend it, but the template already looks great
    const subject = customMessage
      ? `Invoice ${invoice.invoice_number} — ${customMessage}`
      : `Invoice ${invoice.invoice_number} for ${formattedAmount}`;

    const sent = await sendEmail({
      to: recipientEmail,
      subject,
      html,
      tenantId: profile.tenant_id,
    });

    if (!sent) {
      return NextResponse.json({ error: "Failed to send email. Please check your email configuration." }, { status: 500 });
    }

    // Update invoice: set status to "sent" if it was draft, and update sent_date
    const updates: Record<string, unknown> = {
      sent_date: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (invoice.status === "draft") {
      updates.status = "sent";
    }

    const { data: updatedInvoice } = await supabase
      .from("invoices")
      .update(updates)
      .eq("id", id)
      .eq("tenant_id", profile.tenant_id)
      .select(`
        *,
        client:clients(id, name, email, company),
        project:projects(id, name, project_code),
        event:events(id, title)
      `)
      .single();

    return NextResponse.json({
      success: true,
      sentTo: recipientEmail,
      invoice: updatedInvoice || invoice,
    });
  } catch (error) {
    console.error("Send invoice error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

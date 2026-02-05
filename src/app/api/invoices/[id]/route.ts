import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { validateBody, updateInvoiceSchema } from "@/lib/validations";

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

// GET - Fetch single invoice with items
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

    // Fetch invoice with related data
    const { data: invoice, error } = await supabase
      .from("invoices")
      .select(`
        *,
        client:clients(id, name, email, phone, company, address, city, country),
        project:projects(id, name, project_code),
        event:events(id, title),
        items:invoice_items(*)
      `)
      .eq("id", id)
      .eq("tenant_id", profile.tenant_id)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Fetch payments for this invoice
    const { data: payments } = await supabase
      .from("payments")
      .select("*")
      .eq("invoice_id", id)
      .order("payment_date", { ascending: false });

    return NextResponse.json({ invoice: { ...invoice, payments: payments || [] } });
  } catch (error) {
    console.error("Get invoice error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

// PATCH - Update invoice
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

    // Validate input
    const validation = validateBody(updateInvoiceSchema, body);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    // Fields that should be null when empty (UUIDs and optional fields)
    const nullableUuidFields = ["client_id", "project_id", "event_id"];
    const nullableDateFields = ["issue_date", "due_date", "sent_date", "paid_at"];
    const nullableStringFields = ["notes", "terms_and_conditions", "footer_note", "po_number", "reference_number"];

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
      "client_id", "project_id", "event_id", "title", "invoice_number",
      "subtotal", "tax_rate", "tax_amount", "discount_type", "discount_value",
      "discount_amount", "total", "amount", "currency", "status",
      "issue_date", "due_date", "sent_date", "paid_at", "payment_terms",
      "notes", "terms_and_conditions", "footer_note",
      "billing_name", "billing_email", "billing_address", "billing_city", "billing_country",
      "po_number", "reference_number", "tags"
    ];
    // amount_paid is excluded — it should only be updated by the payments system

    const updates: Record<string, unknown> = {};
    allowedFields.forEach((field) => {
      if (body[field] !== undefined) {
        updates[field] = body[field];
      }
    });

    // Auto-compute subtotal from items if items provided but subtotal is not
    if (body.items && Array.isArray(body.items) && body.items.length > 0 && body.subtotal === undefined) {
      body.subtotal = body.items.reduce((sum: number, item: Record<string, unknown>) => {
        return sum + (parseFloat(item.quantity as string) || 1) * (parseFloat(item.unit_price as string) || 0);
      }, 0);
    }

    // Recalculate totals if financial fields changed
    if (body.subtotal !== undefined || body.tax_rate !== undefined || body.discount_value !== undefined) {
      const subtotal = parseFloat(body.subtotal) || 0;
      const taxRate = parseFloat(body.tax_rate) || 0;
      const taxAmount = Math.round(subtotal * (taxRate / 100) * 100) / 100;
      const discountValue = parseFloat(body.discount_value) || 0;
      const discountType = body.discount_type || 'fixed';
      const discountAmount = discountType === 'percentage'
        ? Math.round(subtotal * (discountValue / 100) * 100) / 100
        : discountValue;
      const total = Math.round((subtotal + taxAmount - discountAmount) * 100) / 100;

      updates.tax_amount = taxAmount;
      updates.discount_amount = discountAmount;
      updates.total = total;
      updates.amount = total; // Backward compatibility
    }

    // Keep total and amount in sync if only one was updated directly
    if (updates.total !== undefined && updates.amount === undefined) {
      updates.amount = updates.total;
    } else if (updates.amount !== undefined && updates.total === undefined) {
      updates.total = updates.amount;
    }

    // Validate invoice_number uniqueness within tenant
    if (updates.invoice_number) {
      const { data: existingInvoice } = await supabase
        .from("invoices")
        .select("id")
        .eq("tenant_id", profile.tenant_id)
        .eq("invoice_number", updates.invoice_number as string)
        .neq("id", id)
        .maybeSingle();

      if (existingInvoice) {
        return NextResponse.json(
          { error: "An invoice with this number already exists" },
          { status: 409 }
        );
      }
    }

    // Validate status transitions
    if (updates.status) {
      const { data: currentInvoice } = await supabase
        .from("invoices")
        .select("status")
        .eq("id", id)
        .eq("tenant_id", profile.tenant_id)
        .single();

      if (currentInvoice) {
        const validTransitions: Record<string, string[]> = {
          draft: ["sent", "cancelled"],
          sent: ["paid", "partially_paid", "overdue", "cancelled", "draft"],
          overdue: ["paid", "partially_paid", "cancelled", "sent"],
          partially_paid: ["paid", "overdue", "cancelled"],
          paid: ["refunded"],
          cancelled: ["draft"],
          refunded: [],
        };
        const allowed = validTransitions[currentInvoice.status] || [];
        if (!allowed.includes(updates.status as string)) {
          return NextResponse.json(
            { error: `Cannot transition from "${currentInvoice.status}" to "${updates.status}"` },
            { status: 400 }
          );
        }
      }
    }

    // Handle status transitions
    if (body.status === 'sent' && !body.sent_date) {
      updates.sent_date = new Date().toISOString();
    }
    if (body.status === 'paid' && !body.paid_at) {
      updates.paid_at = new Date().toISOString();
    }

    updates.updated_at = new Date().toISOString();

    const { data: invoice, error } = await supabase
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

    if (error) {
      if (error.code === "PGRST116") {
        return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Update items if provided
    if (body.items && Array.isArray(body.items)) {
      if (body.items.length > 0) {
        const itemsData = body.items.map((item: Record<string, unknown>, index: number) => ({
          invoice_id: id,
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

        // Delete existing items then insert new ones
        const { error: deleteError } = await supabase
          .from("invoice_items")
          .delete()
          .eq("invoice_id", id);

        if (deleteError) {
          console.error("Failed to delete old invoice items:", deleteError);
        }

        const { error: insertError } = await supabase.from("invoice_items").insert(itemsData);
        if (insertError) {
          console.error("Failed to insert invoice items:", insertError);
          return NextResponse.json(
            { error: "Invoice updated but failed to save line items", invoice },
            { status: 207 }
          );
        }
      } else {
        // If items array is empty, delete all items
        await supabase
          .from("invoice_items")
          .delete()
          .eq("invoice_id", id);
      }
    }

    return NextResponse.json({ invoice });
  } catch (error) {
    console.error("Update invoice error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

// DELETE - Delete invoice
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

    // Check invoice status before deletion - prevent deleting paid invoices
    const { data: currentInvoice } = await supabase
      .from("invoices")
      .select("status")
      .eq("id", id)
      .eq("tenant_id", profile.tenant_id)
      .single();

    if (!currentInvoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    const protectedStatuses = ["paid", "partially_paid"];
    if (protectedStatuses.includes(currentInvoice.status)) {
      return NextResponse.json(
        { error: `Cannot delete a ${currentInvoice.status.replace("_", " ")} invoice` },
        { status: 400 }
      );
    }

    // Delete invoice items first (cascade should handle this, but being explicit)
    await supabase
      .from("invoice_items")
      .delete()
      .eq("invoice_id", id);

    // Delete the invoice
    const { error } = await supabase
      .from("invoices")
      .delete()
      .eq("id", id)
      .eq("tenant_id", profile.tenant_id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete invoice error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

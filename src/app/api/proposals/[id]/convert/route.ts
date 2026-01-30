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

// POST - Convert an accepted proposal to project + invoice
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await getSupabaseClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch the proposal
    const { data: proposal, error: fetchError } = await supabase
      .from("proposals")
      .select("*")
      .eq("id", id)
      .single();

    if (fetchError || !proposal) {
      return NextResponse.json({ error: "Proposal not found" }, { status: 404 });
    }

    if (proposal.status !== "accepted") {
      return NextResponse.json(
        { error: "Only accepted proposals can be converted" },
        { status: 400 }
      );
    }

    // Create project from proposal
    const { data: project, error: projectError } = await supabase
      .from("projects")
      .insert({
        tenant_id: proposal.tenant_id,
        name: proposal.title,
        client_id: proposal.client_id,
        status: "planning",
        budget: proposal.total,
        created_by: user.id,
      })
      .select()
      .single();

    if (projectError) {
      console.error("Create project error:", projectError);
      return NextResponse.json({ error: projectError.message }, { status: 500 });
    }

    // Build invoice items from pricing_items
    const pricingItems = proposal.pricing_items || [];
    const invoiceItems = pricingItems.map((item: Record<string, unknown>, index: number) => ({
      description: item.description || item.name || "Item",
      quantity: parseFloat(item.quantity as string) || 1,
      unit_price: parseFloat(item.unit_price as string) || parseFloat(item.price as string) || 0,
      amount: (parseFloat(item.quantity as string) || 1) * (parseFloat(item.unit_price as string) || parseFloat(item.price as string) || 0),
      sort_order: index,
    }));

    // Create invoice from proposal
    const { data: invoice, error: invoiceError } = await supabase
      .from("invoices")
      .insert({
        tenant_id: proposal.tenant_id,
        client_id: proposal.client_id,
        project_id: project.id,
        title: `Invoice for ${proposal.title}`,
        amount: proposal.total,
        total: proposal.total,
        subtotal: proposal.subtotal || proposal.total,
        status: "draft",
        currency: proposal.currency || "USD",
        created_by: user.id,
      })
      .select()
      .single();

    if (invoiceError) {
      console.error("Create invoice error:", invoiceError);
      return NextResponse.json({ error: invoiceError.message }, { status: 500 });
    }

    // Insert invoice items if any
    if (invoiceItems.length > 0) {
      const itemsWithInvoiceId = invoiceItems.map((item: Record<string, unknown>) => ({
        ...item,
        invoice_id: invoice.id,
      }));

      const { error: itemsError } = await supabase
        .from("invoice_items")
        .insert(itemsWithInvoiceId);

      if (itemsError) {
        console.error("Insert invoice items error:", itemsError);
      }
    }

    return NextResponse.json({ project, invoice }, { status: 201 });
  } catch (error) {
    console.error("Convert proposal error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

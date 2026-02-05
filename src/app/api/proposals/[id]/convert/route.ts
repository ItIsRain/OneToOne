import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getUserPlanInfo, checkFeatureAccess } from "@/lib/plan-limits";
import { mapProposalToContractSections } from "@/lib/pipeline/utils";

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

    // Get user's tenant_id from profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("tenant_id")
      .eq("id", user.id)
      .single();

    if (!profile?.tenant_id) {
      return NextResponse.json({ error: "No tenant found" }, { status: 400 });
    }

    // Fetch the proposal
    const { data: proposal, error: fetchError } = await supabase
      .from("proposals")
      .select("*")
      .eq("id", id)
      .eq("tenant_id", profile.tenant_id)
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

    // Check for mode=pipeline in request body
    let body: Record<string, unknown> = {};
    try {
      body = await request.json();
    } catch {
      // No body is fine
    }

    if (body.mode === "pipeline") {
      // Pipeline mode: create a contract from the proposal
      const planInfo = await getUserPlanInfo(supabase, user.id);
      if (!planInfo) {
        return NextResponse.json(
          { error: "No active subscription found", upgrade_required: true },
          { status: 403 }
        );
      }
      const access = checkFeatureAccess(planInfo.planType, "sow_pipeline");
      if (!access.allowed) {
        return NextResponse.json(
          { error: access.reason, upgrade_required: true },
          { status: 403 }
        );
      }

      // Duplicate check
      const { data: existingContract } = await supabase
        .from("contracts")
        .select("id")
        .eq("proposal_id", proposal.id)
        .eq("tenant_id", proposal.tenant_id)
        .maybeSingle();

      if (existingContract) {
        return NextResponse.json(
          { error: "A contract already exists for this proposal", contract_id: existingContract.id },
          { status: 409 }
        );
      }

      const sections = Array.isArray(proposal.sections) ? proposal.sections : [];
      const contractSections = mapProposalToContractSections(sections);

      const { data: contract, error: contractError } = await supabase
        .from("contracts")
        .insert({
          tenant_id: proposal.tenant_id,
          name: proposal.title,
          client_id: proposal.client_id,
          proposal_id: proposal.id,
          value: proposal.total || 0,
          currency: proposal.currency || "USD",
          contract_type: "project_contract",
          status: "draft",
          sections: contractSections,
          description: `Generated from proposal: ${proposal.title}`,
          tags: ["pipeline:auto-generated"],
          created_by: user.id,
        })
        .select("*")
        .single();

      if (contractError) {
        return NextResponse.json({ error: contractError.message }, { status: 500 });
      }

      return NextResponse.json({ contract }, { status: 201 });
    }

    // Standard mode: duplicate check — prevent converting the same proposal twice
    let existingProjectQuery = supabase
      .from("projects")
      .select("id")
      .eq("name", proposal.title)
      .eq("tenant_id", proposal.tenant_id);

    if (proposal.client_id) {
      existingProjectQuery = existingProjectQuery.eq("client_id", proposal.client_id);
    } else {
      existingProjectQuery = existingProjectQuery.is("client_id", null);
    }

    const { data: existingProject } = await existingProjectQuery.maybeSingle();

    if (existingProject) {
      // Also check if an invoice already exists linked to that project
      const { data: existingInvoice } = await supabase
        .from("invoices")
        .select("id")
        .eq("project_id", existingProject.id)
        .eq("tenant_id", proposal.tenant_id)
        .maybeSingle();

      if (existingInvoice) {
        return NextResponse.json(
          { error: "This proposal has already been converted to a project and invoice", project_id: existingProject.id, invoice_id: existingInvoice.id },
          { status: 409 }
        );
      }
    }

    // Validate client still exists if proposal references one
    if (proposal.client_id) {
      const { data: client } = await supabase
        .from("clients")
        .select("id")
        .eq("id", proposal.client_id)
        .eq("tenant_id", proposal.tenant_id)
        .single();

      if (!client) {
        return NextResponse.json({ error: "The client associated with this proposal no longer exists" }, { status: 400 });
      }
    }

    // Create project from proposal
    const { data: project, error: projectError } = await supabase
      .from("projects")
      .insert({
        tenant_id: proposal.tenant_id,
        name: proposal.title,
        client_id: proposal.client_id,
        status: "planning",
        budget_amount: proposal.total || 0,
        budget_currency: proposal.currency || "USD",
        created_by: user.id,
      })
      .select()
      .single();

    if (projectError) {
      console.error("Create project error:", projectError);
      return NextResponse.json({ error: projectError.message }, { status: 500 });
    }

    // Generate invoice number
    const year = new Date().getFullYear().toString().slice(-2);
    const { count: invoiceCount } = await supabase
      .from("invoices")
      .select("*", { count: "exact", head: true })
      .eq("tenant_id", proposal.tenant_id);
    const invoiceNumber = `INV-${year}-${((invoiceCount || 0) + 1).toString().padStart(4, "0")}`;

    // Build invoice items from pricing_items
    const pricingItems = proposal.pricing_items || [];
    const invoiceItems = pricingItems.map((item: Record<string, unknown>, index: number) => ({
      description: item.description || item.name || "Item",
      quantity: parseFloat(item.quantity as string) || 1,
      unit_price: parseFloat(item.unit_price as string) || parseFloat(item.price as string) || 0,
      amount: (parseFloat(item.quantity as string) || 1) * (parseFloat(item.unit_price as string) || parseFloat(item.price as string) || 0),
      sort_order: index,
    }));

    // Calculate tax and discount amounts from proposal
    const invoiceSubtotal = proposal.subtotal || proposal.total || 0;
    const taxRate = proposal.tax_percent || 0;
    const taxAmount = Math.round(invoiceSubtotal * (taxRate / 100) * 100) / 100;
    const discountPercent = proposal.discount_percent || 0;
    const discountAmount = Math.round(invoiceSubtotal * (discountPercent / 100) * 100) / 100;
    const invoiceTotal = proposal.total || Math.round((invoiceSubtotal + taxAmount - discountAmount) * 100) / 100;

    // Create invoice from proposal
    const { data: invoice, error: invoiceError } = await supabase
      .from("invoices")
      .insert({
        tenant_id: proposal.tenant_id,
        invoice_number: invoiceNumber,
        client_id: proposal.client_id,
        project_id: project.id,
        title: `Invoice for ${proposal.title}`,
        subtotal: invoiceSubtotal,
        tax_rate: taxRate,
        tax_amount: taxAmount,
        discount_type: discountPercent > 0 ? "percentage" : "fixed",
        discount_value: discountPercent > 0 ? discountPercent : 0,
        discount_amount: discountAmount,
        total: invoiceTotal,
        amount: invoiceTotal,
        status: "draft",
        currency: proposal.currency || "USD",
        created_by: user.id,
      })
      .select()
      .single();

    if (invoiceError) {
      console.error("Create invoice error:", invoiceError);
      // Clean up project if invoice creation fails
      await supabase.from("projects").delete().eq("id", project.id);
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

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getUserIdFromRequest } from "@/hooks/useTenantFromHeaders";

// POST - Duplicate a proposal
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const supabase = await createClient();

    // Get user's tenant_id from profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("tenant_id")
      .eq("id", userId)
      .single();

    if (!profile?.tenant_id) {
      return NextResponse.json({ error: "No tenant found" }, { status: 400 });
    }

    // Fetch original proposal
    const { data: original, error: fetchError } = await supabase
      .from("proposals")
      .select("*")
      .eq("id", id)
      .eq("tenant_id", profile.tenant_id)
      .single();

    if (fetchError || !original) {
      return NextResponse.json({ error: "Proposal not found" }, { status: 404 });
    }

    // Generate new slug with -copy and random suffix
    const randomSuffix = crypto.randomUUID().substring(0, 8);
    const newSlug = `${original.slug}-copy-${randomSuffix}`;

    const duplicateData = {
      tenant_id: original.tenant_id,
      created_by: userId,
      title: `${original.title} (Copy)`,
      slug: newSlug,
      client_id: original.client_id,
      lead_id: original.lead_id,
      project_id: original.project_id,
      sections: original.sections || [],
      pricing_items: original.pricing_items || [],
      subtotal: original.subtotal,
      discount_percent: original.discount_percent,
      tax_percent: original.tax_percent,
      total: original.total,
      currency: original.currency,
      notes: original.notes,
      status: "draft",
      // Clear all signature and date fields
      agency_signature_data: null,
      agency_signature_name: null,
      client_signature_data: null,
      client_signature_name: null,
      client_signature_ip: null,
      client_signed_at: null,
      sent_at: null,
      viewed_at: null,
      accepted_at: null,
      declined_at: null,
      decline_reason: null,
    };

    const { data: proposal, error } = await supabase
      .from("proposals")
      .insert(duplicateData)
      .select('*, client:clients(id, name, company, email)')
      .single();

    if (error) {
      console.error("Duplicate error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ proposal }, { status: 201 });
  } catch (error) {
    console.error("Duplicate proposal error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { createClient as createServiceClient } from "@supabase/supabase-js";

// GET - Public proposal view (NO AUTH)
export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
    }

    const serviceClient = createServiceClient(supabaseUrl, supabaseServiceKey);

    // Get tenant context from middleware (if accessed via tenant subdomain)
    const headersList = await headers();
    const requestTenantId = headersList.get("x-tenant-id");

    // Build query with optional tenant filter for security
    let query = serviceClient
      .from("proposals")
      .select(`
        *,
        client:clients(id, name)
      `)
      .eq("slug", slug)
      .in("status", ["draft", "sent", "viewed", "accepted", "declined"]);

    // If accessed from a tenant subdomain, enforce tenant isolation
    if (requestTenantId) {
      query = query.eq("tenant_id", requestTenantId);
    }

    const { data: proposal, error } = await query.single();

    if (error || !proposal) {
      return NextResponse.json({ error: "Proposal not found" }, { status: 404 });
    }

    // Additional security: Log if slug is short
    if (!requestTenantId && proposal.slug.length < 20) {
      console.warn(`Proposal ${proposal.id} has short slug - potential security risk`);
    }

    // Fetch tenant branding info
    let tenant = null;
    if (proposal.tenant_id) {
      const { data: tenantData } = await serviceClient
        .from("tenants")
        .select("name, logo_url, primary_color")
        .eq("id", proposal.tenant_id)
        .single();
      tenant = tenantData;
    }

    return NextResponse.json({ proposal, tenant });
  } catch (error) {
    console.error("Get public proposal error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

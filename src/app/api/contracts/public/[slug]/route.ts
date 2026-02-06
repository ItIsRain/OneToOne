import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { createClient as createServiceClient } from "@supabase/supabase-js";

// GET - Public contract view (NO AUTH)
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
      .from("contracts")
      .select(`
        *,
        client:clients(id, name)
      `)
      .eq("slug", slug)
      .in("status", ["draft", "sent", "viewed", "active", "pending_signature", "declined", "signed"]);

    // If accessed from a tenant subdomain, enforce tenant isolation
    if (requestTenantId) {
      query = query.eq("tenant_id", requestTenantId);
    }

    const { data: contract, error } = await query.single();

    if (error || !contract) {
      return NextResponse.json({ error: "Contract not found" }, { status: 404 });
    }

    // Additional security: If no tenant context, verify slug is sufficiently random
    // (contracts should only be accessible via their unique slug)
    if (!requestTenantId && contract.slug.length < 20) {
      console.warn(`Contract ${contract.id} has short slug - potential security risk`);
    }

    // Fetch tenant branding info
    let tenant = null;
    if (contract.tenant_id) {
      const { data: tenantData } = await serviceClient
        .from("tenants")
        .select("name, logo_url, primary_color")
        .eq("id", contract.tenant_id)
        .single();
      tenant = tenantData;
    }

    return NextResponse.json({ contract, tenant });
  } catch (error) {
    console.error("Get public contract error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

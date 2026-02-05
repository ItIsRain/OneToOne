import { NextResponse } from "next/server";
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

    const { data: contract, error } = await serviceClient
      .from("contracts")
      .select(`
        *,
        client:clients(id, name)
      `)
      .eq("slug", slug)
      .in("status", ["draft", "sent", "viewed", "active", "pending_signature", "declined", "signed"])
      .single();

    if (error || !contract) {
      return NextResponse.json({ error: "Contract not found" }, { status: 404 });
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

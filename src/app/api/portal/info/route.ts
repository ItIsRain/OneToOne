import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getTenantContextFromRequest } from "@/hooks/useTenantFromHeaders";

// Public API — no auth required
export async function GET(request: Request) {
  try {
    const tenant = getTenantContextFromRequest(request);

    if (!tenant.tenantId) {
      return NextResponse.json({ error: "Tenant context required" }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
    }

    const serviceClient = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch portal settings
    const { data: portalSettings } = await serviceClient
      .from("tenant_portal_settings")
      .select("hero_headline, hero_subtitle, banner_image_url, show_events, featured_event_ids, custom_cta_text, custom_cta_url")
      .eq("tenant_id", tenant.tenantId)
      .single();

    return NextResponse.json({
      tenant: {
        name: tenant.name,
        logo_url: tenant.logoUrl,
        primary_color: tenant.primaryColor,
        subdomain: tenant.subdomain,
      },
      portal_settings: portalSettings || null,
    });
  } catch (error) {
    console.error("Portal info error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

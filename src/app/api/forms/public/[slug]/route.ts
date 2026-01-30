import { NextResponse } from "next/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";

// GET - Fetch a published form by slug (NO AUTH REQUIRED)
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

    const { data: form, error } = await serviceClient
      .from("forms")
      .select("id, tenant_id, title, description, slug, fields, conditional_rules, settings, thank_you_title, thank_you_message, thank_you_redirect_url")
      .eq("slug", slug)
      .eq("status", "published")
      .single();

    if (error || !form) {
      return NextResponse.json({ error: "Form not found" }, { status: 404 });
    }

    // Fetch tenant branding info
    let tenant = null;
    if (form.tenant_id) {
      const { data: tenantData } = await serviceClient
        .from("tenants")
        .select("name, logo_url, primary_color")
        .eq("id", form.tenant_id)
        .single();

      tenant = tenantData;
    }

    // Remove tenant_id from the form response (not needed by the client)
    const { tenant_id: _tenantId, ...formWithoutTenantId } = form;

    return NextResponse.json({ form: formWithoutTenantId, tenant });
  } catch (error) {
    console.error("Get public form error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import crypto from "crypto";

function getServiceClient() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// POST - Generate magic link for portal client
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, tenant_slug } = body;

    if (!email || !tenant_slug) {
      return NextResponse.json({ error: "Email and tenant slug are required" }, { status: 400 });
    }

    const supabase = getServiceClient();

    // Find tenant by slug
    const { data: tenant, error: tenantError } = await supabase
      .from("tenants")
      .select("id")
      .eq("subdomain", tenant_slug)
      .single();

    if (tenantError || !tenant) {
      // Return success even if tenant not found to prevent email enumeration
      return NextResponse.json({ success: true, message: "If an account exists, a magic link has been sent." });
    }

    // Find portal client
    const { data: portalClient, error: clientError } = await supabase
      .from("portal_clients")
      .select("id, email, name")
      .eq("email", email.toLowerCase())
      .eq("tenant_id", tenant.id)
      .eq("is_active", true)
      .single();

    if (clientError || !portalClient) {
      // Return success even if client not found to prevent email enumeration
      return NextResponse.json({ success: true, message: "If an account exists, a magic link has been sent." });
    }

    // Generate magic link token
    const token = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // 24 hours

    // Update portal client with magic link token
    const { error: updateError } = await supabase
      .from("portal_clients")
      .update({
        magic_link_token: token,
        magic_link_expires_at: expiresAt,
      })
      .eq("id", portalClient.id);

    if (updateError) {
      console.error("Magic link update error:", updateError);
      return NextResponse.json({ error: "Failed to generate magic link" }, { status: 500 });
    }

    // NOTE: In production, this would send an email with the magic link URL.
    // For now, return the token directly for development/testing purposes.
    return NextResponse.json({
      success: true,
      message: "If an account exists, a magic link has been sent.",
      // Development only - remove in production
      token,
      expires_at: expiresAt,
    });
  } catch (error) {
    console.error("Magic link error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

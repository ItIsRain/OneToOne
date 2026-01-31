import { NextResponse } from "next/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import crypto from "crypto";
import { checkRateLimit, getClientIp, rateLimitResponse } from "@/lib/rate-limit";

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

    // Rate limit: 5 magic link requests per email per hour
    const ip = getClientIp(request);
    const emailRateCheck = await checkRateLimit({
      key: "magic-link",
      identifier: email.toLowerCase(),
      maxRequests: 5,
      windowSeconds: 60 * 60,
    });
    if (!emailRateCheck.allowed) {
      // Return success message to prevent email enumeration even when rate limited
      return NextResponse.json({ success: true, message: "If an account exists, a magic link has been sent." });
    }

    const ipRateCheck = await checkRateLimit({
      key: "magic-link-ip",
      identifier: ip,
      maxRequests: 15,
      windowSeconds: 60 * 60,
    });
    if (!ipRateCheck.allowed) {
      return NextResponse.json({ success: true, message: "If an account exists, a magic link has been sent." });
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

    // Send magic link email
    const { sendEmail } = await import("@/lib/email");
    const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const magicLinkUrl = `${APP_URL}/portal/login?token=${token}&tenant=${tenant_slug}`;

    await sendEmail({
      to: portalClient.email,
      subject: "Your magic link to sign in",
      html: `
        <div style="font-family: sans-serif; max-width: 400px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #111; margin-bottom: 20px;">Sign in to your portal</h2>
          <p style="color: #666; margin-bottom: 20px;">
            Hi ${portalClient.name}, click the link below to sign in to your portal:
          </p>
          <div style="margin-bottom: 20px;">
            <a href="${magicLinkUrl}" style="display:inline-block;padding:12px 24px;background-color:#72b81a;color:#ffffff;text-decoration:none;border-radius:8px;font-weight:600;">Sign In</a>
          </div>
          <p style="color: #999; font-size: 14px;">This link expires in 24 hours. If you didn't request this, you can safely ignore this email.</p>
        </div>
      `,
    });

    return NextResponse.json({
      success: true,
      message: "If an account exists, a magic link has been sent.",
    });
  } catch (error) {
    console.error("Magic link error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

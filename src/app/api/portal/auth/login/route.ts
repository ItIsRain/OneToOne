import { NextResponse } from "next/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { checkTriggers } from "@/lib/workflows/triggers";
import bcrypt from "bcryptjs";
import { checkRateLimit, getClientIp, rateLimitResponse } from "@/lib/rate-limit";
import { hashSessionToken } from "@/lib/portal-auth";

function getServiceClient() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// POST - Portal client login
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password, tenant_slug, token } = body;

    if (!tenant_slug) {
      return NextResponse.json({ error: "Tenant slug is required" }, { status: 400 });
    }

    // Rate limit: 10 login attempts per IP per 15 minutes
    const ip = getClientIp(request);
    const rateCheck = await checkRateLimit({
      key: "portal-login",
      identifier: ip,
      maxRequests: 10,
      windowSeconds: 15 * 60,
    });
    if (!rateCheck.allowed) {
      return rateLimitResponse(rateCheck.retryAfterSeconds!);
    }

    const supabase = getServiceClient();

    // Find tenant by slug
    const { data: tenant, error: tenantError } = await supabase
      .from("tenants")
      .select("id, name, subdomain, logo_url")
      .eq("subdomain", tenant_slug)
      .single();

    if (tenantError || !tenant) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
    }

    // Magic link token login
    if (token) {
      const { data: portalClient, error: clientError } = await supabase
        .from("portal_clients")
        .select("*")
        .eq("magic_link_token", token)
        .eq("tenant_id", tenant.id)
        .eq("is_active", true)
        .single();

      if (clientError || !portalClient) {
        return NextResponse.json({ error: "Invalid or expired magic link" }, { status: 401 });
      }

      // Check if magic link has expired
      if (portalClient.magic_link_expires_at && new Date(portalClient.magic_link_expires_at) < new Date()) {
        return NextResponse.json({ error: "Magic link has expired" }, { status: 401 });
      }

      // Generate session token for secure subsequent requests
      const sessionToken = crypto.randomUUID();
      const sessionTokenHash = hashSessionToken(sessionToken);

      // Clear the magic link token after use and update last_login_at
      const sessionExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
      await supabase
        .from("portal_clients")
        .update({
          magic_link_token: null,
          magic_link_expires_at: null,
          last_login_at: new Date().toISOString(),
          session_token: sessionTokenHash,
          session_token_expires_at: sessionExpiresAt,
        })
        .eq("id", portalClient.id);

      // Trigger workflow
      try {
        await checkTriggers("portal_client_login", {
          entity_id: portalClient.id,
          entity_type: "portal_client",
          portal_client_name: portalClient.name,
          portal_client_email: portalClient.email,
          login_method: "magic_link",
        }, supabase, tenant.id, portalClient.id);
      } catch (err) {
        console.error("Workflow trigger error:", err);
      }

      return NextResponse.json({
        portal_client: {
          id: portalClient.id,
          name: portalClient.name,
          email: portalClient.email,
          avatar_url: portalClient.avatar_url,
          client_id: portalClient.client_id,
        },
        session_token: sessionToken,
        tenant: {
          id: tenant.id,
          name: tenant.name,
          subdomain: tenant.subdomain,
          logo_url: tenant.logo_url,
        },
      });
    }

    // Email + password login
    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
    }

    // Find portal client by email and tenant
    const { data: portalClient, error: clientError } = await supabase
      .from("portal_clients")
      .select("*")
      .eq("email", email.toLowerCase())
      .eq("tenant_id", tenant.id)
      .eq("is_active", true)
      .single();

    if (clientError || !portalClient) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    // Verify password — bcrypt only
    if (!portalClient.password || !/^\$2[aby]\$/.test(portalClient.password)) {
      // Password is not hashed — require password reset via magic link
      return NextResponse.json(
        { error: "Password reset required. Please use the magic link option to sign in and set a new password." },
        { status: 401 }
      );
    }

    const isValidPassword = await bcrypt.compare(password, portalClient.password);

    if (!isValidPassword) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    // Generate session token for secure subsequent requests
    const sessionToken = crypto.randomUUID();
    const sessionTokenHash = hashSessionToken(sessionToken);

    // Update last_login_at and store session token with 24h expiry
    const sessionExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    await supabase
      .from("portal_clients")
      .update({
        last_login_at: new Date().toISOString(),
        session_token: sessionTokenHash,
        session_token_expires_at: sessionExpiresAt,
      })
      .eq("id", portalClient.id);

    // Trigger workflow
    try {
      await checkTriggers("portal_client_login", {
        entity_id: portalClient.id,
        entity_type: "portal_client",
        portal_client_name: portalClient.name,
        portal_client_email: portalClient.email,
        login_method: "password",
      }, supabase, tenant.id, portalClient.id);
    } catch (err) {
      console.error("Workflow trigger error:", err);
    }

    return NextResponse.json({
      portal_client: {
        id: portalClient.id,
        name: portalClient.name,
        email: portalClient.email,
        avatar_url: portalClient.avatar_url,
        client_id: portalClient.client_id,
      },
      session_token: sessionToken,
      tenant: {
        id: tenant.id,
        name: tenant.name,
        subdomain: tenant.subdomain,
        logo_url: tenant.logo_url,
      },
    });
  } catch (error) {
    console.error("Portal login error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

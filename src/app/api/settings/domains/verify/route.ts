import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getUserPlanInfo, checkFeatureAccess } from "@/lib/plan-limits";
import {
  getCustomHostname,
  refreshCustomHostname,
  getSSLStatusMessage,
  isCustomHostnameActive,
  getFallbackOrigin,
} from "@/lib/cloudflare";

// POST - Check/refresh custom domain SSL status from Cloudflare
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user's profile to find tenant_id
    const { data: profile } = await supabase
      .from("profiles")
      .select("tenant_id")
      .eq("id", user.id)
      .single();

    if (!profile?.tenant_id) {
      return NextResponse.json({ error: "No tenant found" }, { status: 400 });
    }

    // Check plan feature access for custom domains (white_label feature)
    const planInfo = await getUserPlanInfo(supabase, user.id);
    if (!planInfo) {
      return NextResponse.json(
        { error: "No active subscription found", upgrade_required: true },
        { status: 403 }
      );
    }

    const customDomainAccess = checkFeatureAccess(planInfo.planType, "white_label");
    if (!customDomainAccess.allowed) {
      return NextResponse.json(
        {
          error: customDomainAccess.reason || "Custom domains require a Business plan",
          upgrade_required: customDomainAccess.upgrade_required,
        },
        { status: 403 }
      );
    }

    // Get tenant's custom domain settings
    const { data: tenant, error: tenantError } = await supabase
      .from("tenants")
      .select(`
        custom_domain,
        custom_domain_verified,
        custom_domain_ssl_status,
        cloudflare_custom_hostname_id
      `)
      .eq("id", profile.tenant_id)
      .single();

    if (tenantError || !tenant) {
      console.error("Error fetching tenant:", tenantError);
      return NextResponse.json({ error: "Failed to fetch tenant" }, { status: 500 });
    }

    if (!tenant.custom_domain) {
      return NextResponse.json({ error: "No custom domain configured" }, { status: 400 });
    }

    if (!tenant.cloudflare_custom_hostname_id) {
      return NextResponse.json({ error: "Custom domain not properly configured" }, { status: 400 });
    }

    // Get current status from Cloudflare
    let cfHostname;
    try {
      cfHostname = await getCustomHostname(tenant.cloudflare_custom_hostname_id);
    } catch (cfError) {
      console.error("Error fetching Cloudflare hostname:", cfError);
      return NextResponse.json(
        { error: "Failed to check domain status with Cloudflare" },
        { status: 500 }
      );
    }

    const isVerified = isCustomHostnameActive(cfHostname);
    const sslStatus = cfHostname.ssl.status;
    const sslStatusMessage = getSSLStatusMessage(sslStatus);

    // Update local status
    const { error: updateError } = await supabase
      .from("tenants")
      .update({
        custom_domain_verified: isVerified,
        custom_domain_ssl_status: sslStatus,
        custom_domain_verified_at: isVerified ? new Date().toISOString() : null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", profile.tenant_id);

    if (updateError) {
      console.error("Error updating verification status:", updateError);
    }

    // If verified, return success
    if (isVerified) {
      return NextResponse.json({
        success: true,
        verified: true,
        sslStatus,
        sslStatusMessage,
        message: "Domain verified and SSL is active! Your custom domain is now working.",
        customDomain: tenant.custom_domain,
      });
    }

    // If not verified, provide helpful info based on status
    const fallbackOrigin = getFallbackOrigin();
    let helpMessage = "";

    switch (sslStatus) {
      case "initializing":
        helpMessage = "SSL initialization in progress. This usually takes a few seconds.";
        break;
      case "pending_validation":
        helpMessage = `Domain validation pending. Make sure you have added a CNAME record pointing ${tenant.custom_domain} to ${fallbackOrigin}`;
        break;
      case "pending_issuance":
        helpMessage = "Domain validated! SSL certificate is being issued. This may take a few minutes.";
        break;
      case "pending_deployment":
        helpMessage = "SSL certificate issued! Deploying to edge servers. Almost done...";
        break;
      default:
        helpMessage = "Checking domain status...";
    }

    return NextResponse.json({
      success: true,
      verified: false,
      sslStatus,
      sslStatusMessage,
      helpMessage,
      dnsInstructions: {
        type: "CNAME",
        host: tenant.custom_domain,
        value: fallbackOrigin,
        note: "Ensure this CNAME record exists in your DNS. SSL will be automatically provisioned once detected.",
      },
    });
  } catch (error) {
    console.error("Error in domain verification:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

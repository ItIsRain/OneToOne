import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getUserPlanInfo, checkFeatureAccess } from "@/lib/plan-limits";
import {
  createCustomHostname,
  deleteCustomHostname,
  getCustomHostname,
  getFallbackOrigin,
  getSSLStatusMessage,
  isCustomHostnameActive,
} from "@/lib/cloudflare";

// GET - Get domain settings (subdomain + custom domain)
export async function GET(request: NextRequest) {
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

    // Get tenant domain settings
    const { data: tenant, error } = await supabase
      .from("tenants")
      .select(`
        subdomain,
        custom_domain,
        custom_domain_verified,
        custom_domain_ssl_status,
        cloudflare_custom_hostname_id
      `)
      .eq("id", profile.tenant_id)
      .single();

    if (error) {
      console.error("Error fetching domain settings:", error);
      return NextResponse.json({ error: "Failed to fetch domain settings" }, { status: 500 });
    }

    // Check if user has access to custom domains feature (Business plan)
    const planInfo = await getUserPlanInfo(supabase, user.id);
    const customDomainAccess = planInfo
      ? checkFeatureAccess(planInfo.planType, "white_label")
      : { allowed: false, reason: "No active subscription" };

    // If there's a Cloudflare hostname, fetch its current status
    let sslStatus = tenant.custom_domain_ssl_status;
    let sslStatusMessage = "";

    if (tenant.cloudflare_custom_hostname_id && tenant.custom_domain) {
      try {
        const cfHostname = await getCustomHostname(tenant.cloudflare_custom_hostname_id);
        sslStatus = cfHostname.ssl.status;
        sslStatusMessage = getSSLStatusMessage(cfHostname.ssl.status);

        // Update local status if it changed
        if (sslStatus !== tenant.custom_domain_ssl_status) {
          const isVerified = isCustomHostnameActive(cfHostname);
          await supabase
            .from("tenants")
            .update({
              custom_domain_ssl_status: sslStatus,
              custom_domain_verified: isVerified,
              custom_domain_verified_at: isVerified ? new Date().toISOString() : null,
            })
            .eq("id", profile.tenant_id);
        }
      } catch (cfError) {
        console.error("Error fetching Cloudflare status:", cfError);
        // Continue with cached status
      }
    }

    return NextResponse.json({
      subdomain: tenant.subdomain,
      subdomainUrl: `https://${tenant.subdomain}.1i1.ae`,
      customDomain: tenant.custom_domain,
      customDomainVerified: tenant.custom_domain_verified,
      customDomainSslStatus: sslStatus,
      customDomainSslStatusMessage: sslStatusMessage,
      customDomainFeatureEnabled: customDomainAccess.allowed,
      planType: planInfo?.planType || "free",
      fallbackOrigin: getFallbackOrigin(),
    });
  } catch (error) {
    console.error("Error in GET domain settings:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PATCH - Set or update custom domain (Business plan only)
export async function PATCH(request: NextRequest) {
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

    const body = await request.json();
    const { customDomain } = body;

    if (!customDomain) {
      return NextResponse.json({ error: "Custom domain is required" }, { status: 400 });
    }

    // Validate domain format
    const domainRegex = /^(?!:\/\/)([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}$/;
    if (!domainRegex.test(customDomain)) {
      return NextResponse.json({ error: "Invalid domain format" }, { status: 400 });
    }

    // Check if domain contains reserved terms
    const lowerDomain = customDomain.toLowerCase();
    if (lowerDomain.includes("1i1.ae") || lowerDomain.includes("1i1.com")) {
      return NextResponse.json({ error: "Cannot use 1i1.ae or 1i1.com domains" }, { status: 400 });
    }

    // Check if domain is already used by another tenant
    const { data: existingTenant } = await supabase
      .from("tenants")
      .select("id")
      .eq("custom_domain", customDomain)
      .neq("id", profile.tenant_id)
      .single();

    if (existingTenant) {
      return NextResponse.json({ error: "This domain is already in use" }, { status: 400 });
    }

    // Get current tenant to check if we need to delete old hostname
    const { data: currentTenant } = await supabase
      .from("tenants")
      .select("cloudflare_custom_hostname_id, custom_domain")
      .eq("id", profile.tenant_id)
      .single();

    // Delete old Cloudflare hostname if exists and domain is changing
    if (currentTenant?.cloudflare_custom_hostname_id && currentTenant.custom_domain !== customDomain) {
      try {
        await deleteCustomHostname(currentTenant.cloudflare_custom_hostname_id);
      } catch (cfError) {
        console.error("Error deleting old Cloudflare hostname:", cfError);
        // Continue anyway - the old hostname will eventually be cleaned up
      }
    }

    // Create new custom hostname in Cloudflare
    let cloudflareHostname;
    try {
      cloudflareHostname = await createCustomHostname(customDomain);
    } catch (cfError: unknown) {
      console.error("Error creating Cloudflare hostname:", cfError);
      const errorMessage = cfError instanceof Error ? cfError.message : "Failed to register domain with Cloudflare";
      return NextResponse.json(
        { error: errorMessage },
        { status: 500 }
      );
    }

    // Update tenant with custom domain
    const { data: tenant, error } = await supabase
      .from("tenants")
      .update({
        custom_domain: customDomain,
        custom_domain_verified: false,
        custom_domain_ssl_status: cloudflareHostname.ssl.status,
        cloudflare_custom_hostname_id: cloudflareHostname.id,
        custom_domain_verified_at: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", profile.tenant_id)
      .select(`
        custom_domain,
        custom_domain_verified,
        custom_domain_ssl_status
      `)
      .single();

    if (error) {
      console.error("Error updating custom domain:", error);
      // Try to clean up the Cloudflare hostname
      try {
        await deleteCustomHostname(cloudflareHostname.id);
      } catch {
        // Ignore cleanup errors
      }
      return NextResponse.json({ error: "Failed to update custom domain" }, { status: 500 });
    }

    const fallbackOrigin = getFallbackOrigin();

    return NextResponse.json({
      success: true,
      customDomain: tenant.custom_domain,
      customDomainVerified: tenant.custom_domain_verified,
      customDomainSslStatus: tenant.custom_domain_ssl_status,
      customDomainSslStatusMessage: getSSLStatusMessage(cloudflareHostname.ssl.status),
      dnsInstructions: {
        type: "CNAME",
        host: customDomain,
        value: fallbackOrigin,
        note: "Add this CNAME record in your DNS provider. SSL will be automatically provisioned once the record is detected.",
      },
      message: "Custom domain added. Add the CNAME record to your DNS - SSL will be provisioned automatically.",
    });
  } catch (error) {
    console.error("Error in PATCH domain settings:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE - Remove custom domain
export async function DELETE(request: NextRequest) {
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

    // Get current tenant to get Cloudflare hostname ID
    const { data: currentTenant } = await supabase
      .from("tenants")
      .select("cloudflare_custom_hostname_id")
      .eq("id", profile.tenant_id)
      .single();

    // Delete Cloudflare hostname if exists
    if (currentTenant?.cloudflare_custom_hostname_id) {
      try {
        await deleteCustomHostname(currentTenant.cloudflare_custom_hostname_id);
      } catch (cfError) {
        console.error("Error deleting Cloudflare hostname:", cfError);
        // Continue anyway - we still want to remove from our database
      }
    }

    // Remove custom domain from database
    const { error } = await supabase
      .from("tenants")
      .update({
        custom_domain: null,
        custom_domain_verified: false,
        custom_domain_ssl_status: null,
        cloudflare_custom_hostname_id: null,
        custom_domain_verified_at: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", profile.tenant_id);

    if (error) {
      console.error("Error removing custom domain:", error);
      return NextResponse.json({ error: "Failed to remove custom domain" }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: "Custom domain removed successfully",
    });
  } catch (error) {
    console.error("Error in DELETE domain settings:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

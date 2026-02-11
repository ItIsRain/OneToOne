import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getUserIdFromRequest } from "@/hooks/useTenantFromHeaders";

export async function GET(request: Request) {
  try {
    // Use user ID from middleware header (already validated) to skip getUser() call
    const userId = getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = await createClient();

    // Get tenant_id from profile
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("tenant_id")
      .eq("id", userId)
      .single();

    if (profileError || !profile?.tenant_id) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    const tenantId = profile.tenant_id;

    // Run all counts in parallel
    const [eventsResult, clientsResult, profilesResult, projectsResult, invoicesResult, tenantResult] =
      await Promise.all([
        supabase
          .from("events")
          .select("id", { count: "exact", head: true })
          .eq("tenant_id", tenantId),
        supabase
          .from("clients")
          .select("id", { count: "exact", head: true })
          .eq("tenant_id", tenantId),
        supabase
          .from("profiles")
          .select("id", { count: "exact", head: true })
          .eq("tenant_id", tenantId),
        supabase
          .from("projects")
          .select("id", { count: "exact", head: true })
          .eq("tenant_id", tenantId),
        supabase
          .from("invoices")
          .select("id", { count: "exact", head: true })
          .eq("tenant_id", tenantId),
        supabase
          .from("tenants")
          .select("logo_url")
          .eq("id", tenantId)
          .single(),
      ]);

    return NextResponse.json({
      hasEvents: (eventsResult.count ?? 0) > 0,
      hasClients: (clientsResult.count ?? 0) > 0,
      hasTeamMembers: (profilesResult.count ?? 0) > 1, // More than just the owner
      hasProjects: (projectsResult.count ?? 0) > 0,
      hasInvoices: (invoicesResult.count ?? 0) > 0,
      hasBranding: !!tenantResult.data?.logo_url,
    });
  } catch (error) {
    console.error("Get onboarding status error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

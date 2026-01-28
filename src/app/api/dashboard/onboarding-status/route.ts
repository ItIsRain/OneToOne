import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

async function getSupabaseClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Ignore in Server Components
          }
        },
      },
    }
  );
}

export async function GET() {
  try {
    const supabase = await getSupabaseClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get tenant_id from profile
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("tenant_id")
      .eq("id", user.id)
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

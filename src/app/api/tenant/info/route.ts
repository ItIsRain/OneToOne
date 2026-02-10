import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getUserIdFromRequest } from "@/hooks/useTenantFromHeaders";

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

export async function GET(request: Request) {
  try {
    // Use user ID from middleware header (already validated) to skip getUser() call
    const userId = getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = await getSupabaseClient();

    // Get tenant_id from profile
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("tenant_id")
      .eq("id", userId)
      .single();

    if (profileError || !profile?.tenant_id) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    // Get tenant info
    const { data: tenant, error: tenantError } = await supabase
      .from("tenants")
      .select("use_case, name, logo_url")
      .eq("id", profile.tenant_id)
      .single();

    if (tenantError) {
      return NextResponse.json({ error: tenantError.message }, { status: 500 });
    }

    return NextResponse.json({
      use_case: tenant.use_case || "other",
      name: tenant.name || "",
      logo_url: tenant.logo_url || null,
    });
  } catch (error) {
    console.error("Get tenant info error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getUserIdFromRequest } from "@/hooks/useTenantFromHeaders";

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

async function verifyAdmin(request: Request): Promise<{ authorized: boolean; error?: string }> {
  const userId = getUserIdFromRequest(request);
  if (!userId) {
    return { authorized: false, error: "Unauthorized" };
  }

  const serviceClient = getServiceClient();

  // Get user's email from profiles
  const { data: profile } = await serviceClient
    .from("profiles")
    .select("email")
    .eq("id", userId)
    .maybeSingle();

  if (!profile?.email) {
    return { authorized: false, error: "Unauthorized" };
  }

  const { data: adminRecord } = await serviceClient
    .from("platform_admins")
    .select("id")
    .eq("email", profile.email.toLowerCase())
    .maybeSingle();

  if (!adminRecord) {
    return { authorized: false, error: "Forbidden" };
  }

  return { authorized: true };
}

export async function GET(request: NextRequest) {
  const authCheck = await verifyAdmin(request);
  if (!authCheck.authorized) {
    return NextResponse.json({ error: authCheck.error }, { status: authCheck.error === "Forbidden" ? 403 : 401 });
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");

  const serviceClient = getServiceClient();

  try {
    // Fetch tenants with embedded counts (avoid N+1)
    let query = serviceClient
      .from("tenants")
      .select("*, profiles(count), projects(count)")
      .order("created_at", { ascending: false });

    if (status && status !== "all") {
      query = query.eq("status", status);
    }

    const { data: tenants, error } = await query;

    if (error) throw error;

    // Map embedded counts to _count format
    const tenantsWithCounts = (tenants || []).map((tenant: Record<string, unknown>) => ({
      ...tenant,
      _count: {
        users: Array.isArray(tenant.profiles) && tenant.profiles.length > 0
          ? (tenant.profiles[0] as { count: number }).count
          : 0,
        projects: Array.isArray(tenant.projects) && tenant.projects.length > 0
          ? (tenant.projects[0] as { count: number }).count
          : 0,
      },
      profiles: undefined,
      projects: undefined,
    }));

    return NextResponse.json({ tenants: tenantsWithCounts });
  } catch (err) {
    console.error("Error fetching tenants:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const authCheck = await verifyAdmin(request);
  if (!authCheck.authorized) {
    return NextResponse.json({ error: authCheck.error }, { status: authCheck.error === "Forbidden" ? 403 : 401 });
  }

  const serviceClient = getServiceClient();

  try {
    const { id, status } = await request.json();

    const { error } = await serviceClient
      .from("tenants")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Error updating tenant:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

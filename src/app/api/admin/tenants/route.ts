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
    let query = serviceClient
      .from("tenants")
      .select("*")
      .order("created_at", { ascending: false });

    if (status && status !== "all") {
      query = query.eq("status", status);
    }

    const { data: tenants, error } = await query;

    if (error) throw error;

    // Fetch counts for each tenant
    const tenantsWithCounts = await Promise.all(
      (tenants || []).map(async (tenant) => {
        const [userResult, projectResult] = await Promise.all([
          serviceClient.from("profiles").select("*", { count: "exact", head: true }).eq("tenant_id", tenant.id),
          serviceClient.from("projects").select("*", { count: "exact", head: true }).eq("tenant_id", tenant.id),
        ]);

        return {
          ...tenant,
          _count: {
            users: userResult.count || 0,
            projects: projectResult.count || 0,
          },
        };
      })
    );

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

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
  const tenantId = searchParams.get("tenant_id");

  const serviceClient = getServiceClient();

  try {
    let query = serviceClient
      .from("profiles")
      .select(`
        id,
        email,
        first_name,
        last_name,
        role,
        created_at,
        tenant_id,
        tenants:tenant_id (id, name, subdomain)
      `)
      .order("created_at", { ascending: false });

    if (tenantId) {
      query = query.eq("tenant_id", tenantId);
    }

    const { data: users, error } = await query;

    if (error) throw error;

    return NextResponse.json({ users: users || [] });
  } catch (err) {
    console.error("Error fetching users:", err);
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
    const { id, role } = await request.json();

    const { error } = await serviceClient
      .from("profiles")
      .update({ role, updated_at: new Date().toISOString() })
      .eq("id", id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Error updating user:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

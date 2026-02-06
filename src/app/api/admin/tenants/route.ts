import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createClient as createServerClient } from "@/lib/supabase/server";

async function verifyAdmin() {
  const supabase = await createServerClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user?.email) {
    return { authorized: false, error: "Unauthorized" };
  }

  const { data: adminRecord } = await supabase
    .from("platform_admins")
    .select("id")
    .eq("email", user.email.toLowerCase())
    .maybeSingle();

  if (!adminRecord) {
    return { authorized: false, error: "Forbidden" };
  }

  return { authorized: true };
}

export async function GET(request: NextRequest) {
  const authCheck = await verifyAdmin();
  if (!authCheck.authorized) {
    return NextResponse.json({ error: authCheck.error }, { status: authCheck.error === "Forbidden" ? 403 : 401 });
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");

  const serviceClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

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
  const authCheck = await verifyAdmin();
  if (!authCheck.authorized) {
    return NextResponse.json({ error: authCheck.error }, { status: authCheck.error === "Forbidden" ? 403 : 401 });
  }

  const serviceClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

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

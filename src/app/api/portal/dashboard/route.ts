import { NextResponse } from "next/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";

function getServiceClient() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

async function validatePortalClient(supabase: ReturnType<typeof getServiceClient>, portalClientId: string) {
  const { data, error } = await supabase
    .from("portal_clients")
    .select("id, client_id, tenant_id, name, email, is_active")
    .eq("id", portalClientId)
    .eq("is_active", true)
    .single();

  if (error || !data) return null;
  return data;
}

// GET - Fetch portal dashboard data
export async function GET(request: Request) {
  try {
    const portalClientId = request.headers.get("x-portal-client-id");
    if (!portalClientId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = getServiceClient();
    const portalClient = await validatePortalClient(supabase, portalClientId);
    if (!portalClient) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch dashboard data in parallel
    const [projectsResult, approvalsResult, invoicesResult, filesResult] = await Promise.all([
      // Recent projects for this client
      supabase
        .from("projects")
        .select("id, name, status, created_at, due_date")
        .eq("client_id", portalClient.client_id)
        .eq("tenant_id", portalClient.tenant_id)
        .order("created_at", { ascending: false })
        .limit(5),

      // Pending approvals count
      supabase
        .from("portal_approvals")
        .select("id", { count: "exact", head: true })
        .eq("portal_client_id", portalClient.id)
        .eq("status", "pending"),

      // Recent invoices
      supabase
        .from("invoices")
        .select("id, invoice_number, status, total_amount, due_date, created_at")
        .eq("client_id", portalClient.client_id)
        .eq("tenant_id", portalClient.tenant_id)
        .order("created_at", { ascending: false })
        .limit(5),

      // Recent shared files
      supabase
        .from("portal_shared_files")
        .select("id, file_name, file_url, file_type, uploaded_by, created_at")
        .eq("portal_client_id", portalClient.id)
        .order("created_at", { ascending: false })
        .limit(5),
    ]);

    return NextResponse.json({
      projects: projectsResult.data || [],
      pending_approvals_count: approvalsResult.count || 0,
      invoices: invoicesResult.data || [],
      files: filesResult.data || [],
      portal_client: {
        id: portalClient.id,
        name: portalClient.name,
        email: portalClient.email,
      },
    });
  } catch (error) {
    console.error("Portal dashboard error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

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

// GET - Fetch portal client's invoices
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

    const { data: invoices, error: invoicesError } = await supabase
      .from("invoices")
      .select("id, invoice_number, status, total, amount, due_date, created_at, paid_at, currency, description")
      .eq("client_id", portalClient.client_id)
      .eq("tenant_id", portalClient.tenant_id)
      .order("created_at", { ascending: false });

    if (invoicesError) {
      console.error("Fetch invoices error:", invoicesError);
      return NextResponse.json({ error: invoicesError.message }, { status: 500 });
    }

    return NextResponse.json({ invoices: invoices || [] });
  } catch (error) {
    console.error("Portal invoices error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

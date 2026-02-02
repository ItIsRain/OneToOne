import { NextResponse } from "next/server";
import { getPortalServiceClient, validatePortalClient, getPortalAuthHeaders } from "@/lib/portal-auth";

// GET - Fetch portal client's invoices
export async function GET(request: Request) {
  try {
    const { portalClientId, sessionToken } = getPortalAuthHeaders(request);
    if (!portalClientId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = getPortalServiceClient();
    const portalClient = await validatePortalClient(supabase, portalClientId, sessionToken);
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

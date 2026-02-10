import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getUserIdFromRequest } from "@/hooks/useTenantFromHeaders";

// GET - Get invoice details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const supabase = await createClient();

    const { data: profile } = await supabase
      .from("profiles")
      .select("tenant_id")
      .eq("id", userId)
      .single();

    if (!profile?.tenant_id) {
      return NextResponse.json({ error: "No tenant found" }, { status: 400 });
    }

    // Get the invoice
    const { data: invoice, error } = await supabase
      .from("billing_history")
      .select("*")
      .eq("id", id)
      .eq("tenant_id", profile.tenant_id)
      .single();

    if (error || !invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    // Get tenant details for the invoice
    const { data: tenant } = await supabase
      .from("tenants")
      .select("name, subdomain")
      .eq("id", profile.tenant_id)
      .single();

    // Get subscription details
    const { data: subscription } = await supabase
      .from("tenant_subscriptions")
      .select("plan_type, billing_interval")
      .eq("tenant_id", profile.tenant_id)
      .single();

    return NextResponse.json({
      invoice: {
        ...invoice,
        tenant_name: tenant?.name || "Unknown",
        tenant_subdomain: tenant?.subdomain || "",
        plan_type: subscription?.plan_type || "unknown",
        billing_interval: subscription?.billing_interval || "monthly",
      },
    });
  } catch (error) {
    console.error("Error fetching invoice:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

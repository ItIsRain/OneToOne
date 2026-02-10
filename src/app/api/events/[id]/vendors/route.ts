import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getUserPlanInfo, checkFeatureAccess } from "@/lib/plan-limits";
import { getUserIdFromRequest } from "@/hooks/useTenantFromHeaders";

// GET - Fetch all vendors for a specific event
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: eventId } = await params;

    const userId = getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = await createClient();

    const { data: profile } = await supabase
      .from("profiles")
      .select("tenant_id")
      .eq("id", userId)
      .single();

    if (!profile?.tenant_id) {
      return NextResponse.json({ error: "No tenant found" }, { status: 400 });
    }

    const planInfo = await getUserPlanInfo(supabase, userId);
    if (!planInfo) {
      return NextResponse.json(
        { error: "No active subscription found", upgrade_required: true },
        { status: 403 }
      );
    }

    const access = checkFeatureAccess(planInfo.planType, "vendors");
    if (!access.allowed) {
      return NextResponse.json(
        {
          error: access.reason,
          upgrade_required: access.upgrade_required,
          feature: "vendors",
        },
        { status: 403 }
      );
    }

    const { data: vendors, error } = await supabase
      .from("event_vendors")
      .select("*, vendor:vendors(*)")
      .eq("event_id", eventId)
      .eq("tenant_id", profile.tenant_id)
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ vendors });
  } catch (error) {
    console.error("Get event vendors error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

// POST - Assign a vendor to an event
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: eventId } = await params;

    const userId = getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = await createClient();

    const { data: profile } = await supabase
      .from("profiles")
      .select("tenant_id")
      .eq("id", userId)
      .single();

    if (!profile?.tenant_id) {
      return NextResponse.json({ error: "No tenant found" }, { status: 400 });
    }

    const planInfo = await getUserPlanInfo(supabase, userId);
    if (!planInfo) {
      return NextResponse.json(
        { error: "No active subscription found", upgrade_required: true },
        { status: 403 }
      );
    }

    const access = checkFeatureAccess(planInfo.planType, "vendors");
    if (!access.allowed) {
      return NextResponse.json(
        {
          error: access.reason,
          upgrade_required: access.upgrade_required,
          feature: "vendors",
        },
        { status: 403 }
      );
    }

    const body = await request.json();

    if (!body.vendor_id) {
      return NextResponse.json({ error: "vendor_id is required" }, { status: 400 });
    }

    const { data: eventVendor, error } = await supabase
      .from("event_vendors")
      .insert({
        tenant_id: profile.tenant_id,
        event_id: eventId,
        vendor_id: body.vendor_id,
        role: body.role || null,
        agreed_rate: body.agreed_rate || null,
        status: body.status || "pending",
        notes: body.notes || null,
      })
      .select()
      .single();

    if (error) {
      console.error("Insert event vendor error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ eventVendor }, { status: 201 });
  } catch (error) {
    console.error("Assign vendor to event error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getUserPlanInfo, checkFeatureAccess } from "@/lib/plan-limits";
import { validateBody, createVendorCategorySchema } from "@/lib/validations";
import { getUserIdFromRequest } from "@/hooks/useTenantFromHeaders";

export async function GET(request: Request) {
  try {
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

    const { data: categories, error } = await supabase
      .from("vendor_categories")
      .select("*, vendors:vendors(count)")
      .eq("tenant_id", profile.tenant_id)
      .order("name", { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ categories });
  } catch (error) {
    console.error("Get vendor categories error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
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

    // Validate input
    const validation = validateBody(createVendorCategorySchema, body);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const { data: category, error } = await supabase
      .from("vendor_categories")
      .insert({
        tenant_id: profile.tenant_id,
        name: body.name,
        description: body.description || null,
        color: body.color || null,
      })
      .select()
      .single();

    if (error) {
      console.error("Insert vendor category error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ category }, { status: 201 });
  } catch (error) {
    console.error("Create vendor category error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

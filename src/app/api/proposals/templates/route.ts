import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getUserPlanInfo, checkFeatureAccess } from "@/lib/plan-limits";
import { getUserIdFromRequest } from "@/hooks/useTenantFromHeaders";

// GET - Fetch all proposal templates for the user's tenant
export async function GET(request: Request) {
  try {
    const userId = getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = await createClient();

    // Get user's tenant_id from profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("tenant_id")
      .eq("id", userId)
      .single();

    if (!profile?.tenant_id) {
      return NextResponse.json({ error: "No tenant found" }, { status: 400 });
    }

    // Check plan feature access for proposals
    const planInfo = await getUserPlanInfo(supabase, userId);
    if (!planInfo) {
      return NextResponse.json(
        { error: "No active subscription found", upgrade_required: true },
        { status: 403 }
      );
    }

    const proposalsAccess = checkFeatureAccess(planInfo.planType, "proposals");
    if (!proposalsAccess.allowed) {
      return NextResponse.json(
        {
          error: proposalsAccess.reason,
          upgrade_required: proposalsAccess.upgrade_required,
          feature: "proposals",
        },
        { status: 403 }
      );
    }

    const { data: templates, error } = await supabase
      .from("proposal_templates")
      .select("*")
      .eq("tenant_id", profile.tenant_id)
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ templates });
  } catch (error) {
    console.error("Get proposal templates error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

// POST - Create a new proposal template
export async function POST(request: Request) {
  try {
    const userId = getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = await createClient();

    // Get user's tenant_id from profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("tenant_id")
      .eq("id", userId)
      .single();

    if (!profile?.tenant_id) {
      return NextResponse.json({ error: "No tenant found" }, { status: 400 });
    }

    // Check plan feature access for proposals
    const planInfo = await getUserPlanInfo(supabase, userId);
    if (!planInfo) {
      return NextResponse.json(
        { error: "No active subscription found", upgrade_required: true },
        { status: 403 }
      );
    }

    const proposalsAccess = checkFeatureAccess(planInfo.planType, "proposals");
    if (!proposalsAccess.allowed) {
      return NextResponse.json(
        {
          error: proposalsAccess.reason,
          upgrade_required: proposalsAccess.upgrade_required,
          feature: "proposals",
        },
        { status: 403 }
      );
    }

    const body = await request.json();

    if (!body.name) {
      return NextResponse.json({ error: "Template name is required" }, { status: 400 });
    }

    const templateData = {
      tenant_id: profile.tenant_id,
      created_by: userId,
      name: body.name,
      description: body.description || null,
      sections: body.sections || [],
      pricing_items: body.pricing_items || [],
    };

    const { data: template, error } = await supabase
      .from("proposal_templates")
      .insert(templateData)
      .select()
      .single();

    if (error) {
      console.error("Insert error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ template }, { status: 201 });
  } catch (error) {
    console.error("Create proposal template error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

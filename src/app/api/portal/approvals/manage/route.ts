import { NextRequest, NextResponse } from "next/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { getUserPlanInfo, checkFeatureAccess } from "@/lib/plan-limits";
import { getUserIdFromRequest } from "@/hooks/useTenantFromHeaders";

// GET - List all approvals for tenant (ADMIN)
export async function GET(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
    }
    const serviceClient = createServiceClient(supabaseUrl, supabaseServiceKey);

    const planInfo = await getUserPlanInfo(serviceClient, userId);
    if (!planInfo) {
      return NextResponse.json({ error: "No tenant found" }, { status: 400 });
    }

    const featureCheck = checkFeatureAccess(planInfo.planType, "client_portal");
    if (!featureCheck.allowed) {
      return NextResponse.json({ error: featureCheck.reason, upgrade_required: true }, { status: 403 });
    }

    const { data: approvals, error } = await serviceClient
      .from("portal_approvals")
      .select("*, portal_clients(id, name, email), projects(id, name), tasks(id, title)")
      .eq("tenant_id", planInfo.tenantId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Fetch approvals error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ approvals: approvals || [] });
  } catch (error) {
    console.error("Manage approvals error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

// POST - Create approval request (ADMIN)
export async function POST(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
    }
    const serviceClient = createServiceClient(supabaseUrl, supabaseServiceKey);

    const planInfo = await getUserPlanInfo(serviceClient, userId);
    if (!planInfo) {
      return NextResponse.json({ error: "No tenant found" }, { status: 400 });
    }

    const featureCheck = checkFeatureAccess(planInfo.planType, "client_portal");
    if (!featureCheck.allowed) {
      return NextResponse.json({ error: featureCheck.reason, upgrade_required: true }, { status: 403 });
    }

    const body = await request.json();
    const { title, description, project_id, task_id, portal_client_id, file_urls } = body;

    if (!title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    const { data: approval, error: insertError } = await serviceClient
      .from("portal_approvals")
      .insert({
        title,
        description: description || null,
        project_id: project_id || null,
        task_id: task_id || null,
        portal_client_id: portal_client_id || null,
        file_urls: file_urls || null,
        tenant_id: planInfo.tenantId,
        status: "pending",
        created_by: userId,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (insertError) {
      console.error("Create approval error:", insertError);
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    return NextResponse.json({ approval }, { status: 201 });
  } catch (error) {
    console.error("Create approval error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

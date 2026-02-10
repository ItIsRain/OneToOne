import { NextRequest, NextResponse } from "next/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { getUserPlanInfo } from "@/lib/plan-limits";
import { getUserIdFromRequest } from "@/hooks/useTenantFromHeaders";

// GET - Fetch portal settings for tenant (ADMIN)
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

    const { data: settings, error } = await serviceClient
      .from("tenant_portal_settings")
      .select("*")
      .eq("tenant_id", planInfo.tenantId)
      .single();

    if (error && error.code !== "PGRST116") {
      // PGRST116 = no rows found, which is acceptable (return defaults)
      console.error("Fetch portal settings error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Return settings or defaults if none exist
    return NextResponse.json({
      settings: settings || {
        tenant_id: planInfo.tenantId,
        client_portal_enabled: false,
        portal_welcome_message: null,
        portal_logo_url: null,
        portal_primary_color: null,
        show_invoices: true,
        show_projects: true,
        show_files: true,
        show_approvals: true,
      },
    });
  } catch (error) {
    console.error("Portal settings error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

// PUT - Update portal settings (ADMIN)
export async function PUT(request: NextRequest) {
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

    const body = await request.json();

    const allowedFields = [
      "client_portal_enabled",
      "portal_welcome_message",
      "portal_logo_url",
      "portal_primary_color",
      "show_invoices",
      "show_projects",
      "show_files",
      "show_approvals",
    ];

    const updates: Record<string, unknown> = {};
    for (const key of allowedFields) {
      if (body[key] !== undefined) {
        updates[key] = body[key];
      }
    }
    updates.updated_at = new Date().toISOString();

    // Upsert: create if not exists, update if exists
    const { data: settings, error: upsertError } = await serviceClient
      .from("tenant_portal_settings")
      .upsert(
        {
          tenant_id: planInfo.tenantId,
          ...updates,
        },
        { onConflict: "tenant_id" }
      )
      .select()
      .single();

    if (upsertError) {
      console.error("Update portal settings error:", upsertError);
      return NextResponse.json({ error: upsertError.message }, { status: 500 });
    }

    return NextResponse.json({ settings });
  } catch (error) {
    console.error("Update portal settings error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

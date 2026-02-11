import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { getUserPlanInfo, checkFeatureAccess } from "@/lib/plan-limits";
import { checkTriggers } from "@/lib/workflows/triggers";
import { getUserIdFromRequest } from "@/hooks/useTenantFromHeaders";

// POST - Publish a form
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
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

    // Check plan feature access for forms
    const planInfo = await getUserPlanInfo(supabase, userId);
    if (!planInfo) {
      return NextResponse.json(
        { error: "No active subscription found", upgrade_required: true },
        { status: 403 }
      );
    }

    const formsAccess = checkFeatureAccess(planInfo.planType, "forms");
    if (!formsAccess.allowed) {
      return NextResponse.json(
        {
          error: formsAccess.reason,
          upgrade_required: formsAccess.upgrade_required,
          feature: "forms",
        },
        { status: 403 }
      );
    }

    const { data: form, error } = await supabase
      .from("forms")
      .update({ status: "published", updated_at: new Date().toISOString() })
      .eq("id", id)
      .eq("tenant_id", profile.tenant_id)
      .select("*")
      .single();

    if (error) {
      console.error("Publish error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!form) {
      return NextResponse.json({ error: "Form not found" }, { status: 404 });
    }

    // Trigger workflow automations for form_published
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (supabaseUrl && supabaseServiceKey) {
      const serviceClient = createServiceClient(supabaseUrl, supabaseServiceKey);
      try {
        await checkTriggers("form_published", {
          entity_id: form.id,
          entity_type: "form",
          entity_name: form.title,
          form_title: form.title,
          public_url: `/form/${form.slug}`,
        }, serviceClient, profile.tenant_id, userId);
      } catch (err) {
        console.error("Workflow trigger error:", err);
      }
    }

    return NextResponse.json({ form });
  } catch (error) {
    console.error("Publish form error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

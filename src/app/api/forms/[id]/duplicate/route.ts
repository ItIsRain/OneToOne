import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getUserPlanInfo, checkFeatureAccess } from "@/lib/plan-limits";
import { getUserIdFromRequest } from "@/hooks/useTenantFromHeaders";

// POST - Duplicate a form
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

    // Fetch original form
    const { data: originalForm, error: fetchError } = await supabase
      .from("forms")
      .select("*")
      .eq("id", id)
      .eq("tenant_id", profile.tenant_id)
      .single();

    if (fetchError || !originalForm) {
      return NextResponse.json({ error: "Form not found" }, { status: 404 });
    }

    // Generate new slug with "-copy" suffix + random chars
    const randomSuffix = Math.random().toString(36).substring(2, 8);
    const newSlug = `${originalForm.slug}-copy-${randomSuffix}`;

    const duplicateData = {
      tenant_id: profile.tenant_id,
      created_by: userId,
      title: `${originalForm.title} (Copy)`,
      description: originalForm.description,
      slug: newSlug,
      status: "draft",
      fields: originalForm.fields,
      conditional_rules: originalForm.conditional_rules,
      settings: originalForm.settings,
      thank_you_title: originalForm.thank_you_title,
      thank_you_message: originalForm.thank_you_message,
      thank_you_redirect_url: originalForm.thank_you_redirect_url,
      auto_create_lead: originalForm.auto_create_lead,
      auto_create_contact: originalForm.auto_create_contact,
      lead_field_mapping: originalForm.lead_field_mapping,
      submissions_count: 0,
    };

    const { data: form, error } = await supabase
      .from("forms")
      .insert(duplicateData)
      .select("*")
      .single();

    if (error) {
      console.error("Duplicate error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ form }, { status: 201 });
  } catch (error) {
    console.error("Duplicate form error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

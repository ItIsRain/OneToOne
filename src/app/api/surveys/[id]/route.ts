import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getUserPlanInfo, checkFeatureAccess } from "@/lib/plan-limits";

async function getSupabaseClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Ignore in Server Components
          }
        },
      },
    }
  );
}

// GET - Fetch a single survey with form and event data
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await getSupabaseClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user's tenant_id from profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("tenant_id")
      .eq("id", user.id)
      .single();

    if (!profile?.tenant_id) {
      return NextResponse.json({ error: "No tenant found" }, { status: 400 });
    }

    const { data: survey, error } = await supabase
      .from("surveys")
      .select(
        "*, forms:form_id(*), events:event_id(id, title, status, start_date, end_date)"
      )
      .eq("id", id)
      .eq("tenant_id", profile.tenant_id)
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!survey) {
      return NextResponse.json(
        { error: "Survey not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ survey });
  } catch (error) {
    console.error("Get survey error:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}

// PATCH - Update a survey
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await getSupabaseClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user's tenant_id from profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("tenant_id")
      .eq("id", user.id)
      .single();

    if (!profile?.tenant_id) {
      return NextResponse.json({ error: "No tenant found" }, { status: 400 });
    }

    // Check plan feature access for forms (surveys reuse forms access)
    const planInfo = await getUserPlanInfo(supabase, user.id);
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

    const body = await request.json();

    // Only allow updating specific fields
    const allowedFields = [
      "title",
      "description",
      "event_id",
      "survey_type",
      "status",
      "auto_send_on_event_end",
      "send_delay_minutes",
      "is_testimonial_enabled",
    ];

    const updates: Record<string, unknown> = {};
    for (const key of allowedFields) {
      if (body[key] !== undefined) {
        updates[key] = body[key];
      }
    }

    updates.updated_at = new Date().toISOString();

    const { data: survey, error } = await supabase
      .from("surveys")
      .update(updates)
      .eq("id", id)
      .eq("tenant_id", profile.tenant_id)
      .select("*")
      .single();

    if (error) {
      console.error("Update survey error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // If title was updated, also update the underlying form title
    if (body.title && survey?.form_id) {
      await supabase
        .from("forms")
        .update({
          title: body.title,
          updated_at: new Date().toISOString(),
        })
        .eq("id", survey.form_id)
        .eq("tenant_id", profile.tenant_id);
    }

    // Auto-publish the form when survey is set to active
    if (body.status === "active" && survey?.form_id) {
      await supabase
        .from("forms")
        .update({ status: "published" })
        .eq("id", survey.form_id)
        .eq("tenant_id", profile.tenant_id);
    }

    return NextResponse.json({ survey });
  } catch (error) {
    console.error("Update survey error:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}

// DELETE - Delete a survey and its underlying form
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await getSupabaseClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user's tenant_id from profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("tenant_id")
      .eq("id", user.id)
      .single();

    if (!profile?.tenant_id) {
      return NextResponse.json({ error: "No tenant found" }, { status: 400 });
    }

    // Fetch the survey to get the form_id before deleting
    const { data: survey } = await supabase
      .from("surveys")
      .select("form_id")
      .eq("id", id)
      .eq("tenant_id", profile.tenant_id)
      .single();

    if (!survey) {
      return NextResponse.json(
        { error: "Survey not found" },
        { status: 404 }
      );
    }

    // Delete the survey first
    const { error: surveyError } = await supabase
      .from("surveys")
      .delete()
      .eq("id", id)
      .eq("tenant_id", profile.tenant_id);

    if (surveyError) {
      console.error("Delete survey error:", surveyError);
      return NextResponse.json(
        { error: surveyError.message },
        { status: 500 }
      );
    }

    // Delete the underlying form
    if (survey.form_id) {
      const { error: formError } = await supabase
        .from("forms")
        .delete()
        .eq("id", survey.form_id)
        .eq("tenant_id", profile.tenant_id);

      if (formError) {
        console.error("Delete survey form error:", formError);
        // Survey is already deleted, log but don't fail
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete survey error:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}

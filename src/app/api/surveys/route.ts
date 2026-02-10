import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getUserPlanInfo, checkFeatureAccess } from "@/lib/plan-limits";
import { getUserIdFromRequest } from "@/hooks/useTenantFromHeaders";

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

// Default survey fields by survey type
function getDefaultFieldsForSurveyType(surveyType: string) {
  switch (surveyType) {
    case "post_event":
      return [
        {
          id: crypto.randomUUID(),
          type: "rating",
          label: "Overall Experience",
          required: true,
          max_value: 5,
        },
        {
          id: crypto.randomUUID(),
          type: "nps",
          label: "How likely to recommend?",
          required: true,
        },
        {
          id: crypto.randomUUID(),
          type: "testimonial",
          label: "Share your feedback",
          required: false,
        },
      ];
    case "nps":
      return [
        {
          id: crypto.randomUUID(),
          type: "nps",
          label: "How likely are you to recommend us?",
          required: true,
        },
        {
          id: crypto.randomUUID(),
          type: "textarea",
          label: "What's the main reason for your score?",
          required: false,
        },
      ];
    case "satisfaction":
      return [
        {
          id: crypto.randomUUID(),
          type: "scale",
          label: "Overall Satisfaction",
          required: true,
          min_value: 1,
          max_value: 10,
        },
        {
          id: crypto.randomUUID(),
          type: "scale",
          label: "Quality of Service",
          required: true,
          min_value: 1,
          max_value: 10,
        },
        {
          id: crypto.randomUUID(),
          type: "textarea",
          label: "Additional comments",
          required: false,
        },
      ];
    case "general_feedback":
      return [
        {
          id: crypto.randomUUID(),
          type: "textarea",
          label: "Your Feedback",
          required: true,
        },
        {
          id: crypto.randomUUID(),
          type: "rating",
          label: "Overall Rating",
          required: true,
          max_value: 5,
        },
      ];
    default:
      return [];
  }
}

// GET - Fetch all surveys for the user's tenant
export async function GET(request: Request) {
  try {
    const userId = getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = await getSupabaseClient();

    // Get user's tenant_id from profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("tenant_id")
      .eq("id", userId)
      .single();

    if (!profile?.tenant_id) {
      return NextResponse.json({ error: "No tenant found" }, { status: 400 });
    }

    // Check plan feature access for forms (surveys reuse forms access)
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

    const { data: surveys, error } = await supabase
      .from("surveys")
      .select(
        "*, forms:form_id(title, slug, submissions_count), events:event_id(title, status, end_date)"
      )
      .eq("tenant_id", profile.tenant_id)
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Flatten joined data for convenience
    const flatSurveys = (surveys || []).map((s: Record<string, unknown>) => {
      const form = s.forms as Record<string, unknown> | null;
      const event = s.events as Record<string, unknown> | null;
      return {
        ...s,
        form_title: form?.title ?? null,
        form_slug: form?.slug ?? null,
        submissions_count: form?.submissions_count ?? 0,
        event_title: event?.title ?? null,
        event_status: event?.status ?? null,
        event_end_date: event?.end_date ?? null,
        forms: undefined,
        events: undefined,
      };
    });

    return NextResponse.json({ surveys: flatSurveys });
  } catch (error) {
    console.error("Get surveys error:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}

// POST - Create a new survey
export async function POST(request: Request) {
  try {
    const userId = getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = await getSupabaseClient();

    // Get user's tenant_id from profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("tenant_id")
      .eq("id", userId)
      .single();

    if (!profile?.tenant_id) {
      return NextResponse.json({ error: "No tenant found" }, { status: 400 });
    }

    // Check plan feature access for forms (surveys reuse forms access)
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

    const body = await request.json();

    // Validate required fields
    if (!body.title) {
      return NextResponse.json(
        { error: "Title is required" },
        { status: 400 }
      );
    }

    if (!body.survey_type) {
      return NextResponse.json(
        { error: "Survey type is required" },
        { status: 400 }
      );
    }

    const validTypes = ["post_event", "nps", "satisfaction", "general_feedback"];
    if (!validTypes.includes(body.survey_type)) {
      return NextResponse.json(
        {
          error: `Invalid survey_type. Must be one of: ${validTypes.join(", ")}`,
        },
        { status: 400 }
      );
    }

    // Auto-generate slug for the underlying form
    const baseSlug = body.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
    const randomSuffix = Math.random().toString(36).substring(2, 8);
    const slug = `survey-${baseSlug}-${randomSuffix}`;

    // Generate default fields based on survey type
    const fields = getDefaultFieldsForSurveyType(body.survey_type);

    // Create the underlying form first
    const formData = {
      tenant_id: profile.tenant_id,
      created_by: userId,
      title: body.title,
      description: body.description || null,
      slug,
      status: "draft",
      fields,
      conditional_rules: [],
      settings: { is_survey: true, survey_type: body.survey_type },
      thank_you_title: "Thank you!",
      thank_you_message: "Your feedback has been recorded.",
      thank_you_redirect_url: null,
      auto_create_lead: false,
      auto_create_contact: false,
      lead_field_mapping: null,
      submissions_count: 0,
    };

    const { data: form, error: formError } = await supabase
      .from("forms")
      .insert(formData)
      .select("*")
      .single();

    if (formError) {
      console.error("Create survey form error:", formError);
      return NextResponse.json(
        { error: formError.message },
        { status: 500 }
      );
    }

    // Create the survey record
    const surveyData = {
      tenant_id: profile.tenant_id,
      created_by: userId,
      title: body.title,
      description: body.description || null,
      survey_type: body.survey_type,
      form_id: form.id,
      event_id: body.event_id || null,
      status: "draft",
      auto_send_on_event_end: body.auto_send_on_event_end || false,
      send_delay_minutes: body.send_delay_minutes || 0,
      is_testimonial_enabled: body.is_testimonial_enabled ?? true,
      sent_count: 0,
      response_count: 0,
    };

    const { data: survey, error: surveyError } = await supabase
      .from("surveys")
      .insert(surveyData)
      .select("*")
      .single();

    if (surveyError) {
      console.error("Create survey error:", surveyError);
      // Clean up the form if survey creation fails
      await supabase.from("forms").delete().eq("id", form.id);
      return NextResponse.json(
        { error: surveyError.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { survey: { ...survey, form } },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create survey error:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}

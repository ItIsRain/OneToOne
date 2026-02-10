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

interface FormField {
  id: string;
  type: string;
  label: string;
}

interface Submission {
  data: Record<string, unknown>;
}

function computeNpsFromSubmissions(
  fields: FormField[],
  submissions: Submission[]
): number | null {
  const npsField = fields.find((f) => f.type === "nps");
  if (!npsField) return null;

  const values = submissions
    .map((s) => Number(s.data?.[npsField.id]))
    .filter((v) => !isNaN(v));

  if (values.length === 0) return null;

  let promoters = 0;
  let detractors = 0;

  for (const v of values) {
    if (v >= 9) promoters++;
    else if (v < 7) detractors++;
  }

  return Math.round(((promoters - detractors) / values.length) * 100);
}

function computeAverageRatingFromSubmissions(
  fields: FormField[],
  submissions: Submission[]
): number | null {
  const ratingField = fields.find(
    (f) => f.type === "rating" || f.type === "scale"
  );
  if (!ratingField) return null;

  const values = submissions
    .map((s) => Number(s.data?.[ratingField.id]))
    .filter((v) => !isNaN(v));

  if (values.length === 0) return null;

  const sum = values.reduce((a, b) => a + b, 0);
  return Math.round((sum / values.length) * 10) / 10;
}

// GET - Get benchmark data across events
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

    const { searchParams } = new URL(request.url);
    const metric = searchParams.get("metric") || "nps";

    // Fetch all surveys for the tenant that are linked to events
    const { data: surveys, error: surveysError } = await supabase
      .from("surveys")
      .select(
        "id, title, form_id, event_id, response_count, events:event_id(id, title, start_date, end_date)"
      )
      .eq("tenant_id", profile.tenant_id)
      .not("event_id", "is", null)
      .order("created_at", { ascending: false });

    if (surveysError) {
      return NextResponse.json(
        { error: surveysError.message },
        { status: 500 }
      );
    }

    if (!surveys || surveys.length === 0) {
      return NextResponse.json({ benchmarks: [] });
    }

    // For each survey, fetch the form fields and submissions to compute the metric
    const benchmarks = [];

    for (const survey of surveys) {
      const event = survey.events as unknown as Record<string, unknown> | null;
      if (!event) continue;

      // Fetch the form
      const { data: form } = await supabase
        .from("forms")
        .select("fields")
        .eq("id", survey.form_id)
        .single();

      if (!form) continue;

      const fields = (form.fields || []) as FormField[];

      // Fetch submissions
      const { data: submissions } = await supabase
        .from("form_submissions")
        .select("data")
        .eq("form_id", survey.form_id);

      const allSubmissions = (submissions || []) as Submission[];

      if (allSubmissions.length === 0) continue;

      let metricValue: number | null = null;

      if (metric === "nps") {
        metricValue = computeNpsFromSubmissions(fields, allSubmissions);
      } else if (metric === "rating") {
        metricValue = computeAverageRatingFromSubmissions(
          fields,
          allSubmissions
        );
      }

      if (metricValue === null) continue;

      benchmarks.push({
        survey_id: survey.id,
        survey_title: survey.title,
        event_id: event.id,
        event_title: event.title,
        event_date: event.start_date || event.end_date,
        [`${metric}_score`]: metricValue,
        response_count: allSubmissions.length,
      });
    }

    // Sort by event date
    benchmarks.sort((a, b) => {
      const dateA = a.event_date ? new Date(a.event_date as string).getTime() : 0;
      const dateB = b.event_date ? new Date(b.event_date as string).getTime() : 0;
      return dateA - dateB;
    });

    return NextResponse.json({ benchmarks });
  } catch (error) {
    console.error("Survey benchmarks error:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getUserPlanInfo, checkFeatureAccess } from "@/lib/plan-limits";
import { getUserIdFromRequest } from "@/hooks/useTenantFromHeaders";

interface FormField {
  id: string;
  type: string;
  label: string;
  required?: boolean;
  options?: string[];
  max_value?: number;
  min_value?: number;
}

interface SubmissionData {
  [fieldId: string]: unknown;
}

interface Submission {
  id: string;
  data: SubmissionData;
  created_at: string;
}

function computeNpsScore(values: number[]) {
  if (values.length === 0) return { score: 0, promoters: 0, passives: 0, detractors: 0, average: 0 };

  let promoters = 0;
  let passives = 0;
  let detractors = 0;
  let sum = 0;

  for (const v of values) {
    sum += v;
    if (v >= 9) promoters++;
    else if (v >= 7) passives++;
    else detractors++;
  }

  const total = values.length;
  const score = Math.round(((promoters - detractors) / total) * 100);

  return {
    score,
    promoters,
    passives,
    detractors,
    average: Math.round((sum / total) * 10) / 10,
  };
}

function computeRatingAnalytics(values: number[], maxValue: number = 5) {
  if (values.length === 0) return { average: 0, distribution: {} };

  const sum = values.reduce((a, b) => a + b, 0);
  const distribution: Record<number, number> = {};

  for (let i = 1; i <= maxValue; i++) {
    distribution[i] = 0;
  }
  for (const v of values) {
    distribution[v] = (distribution[v] || 0) + 1;
  }

  return {
    average: Math.round((sum / values.length) * 10) / 10,
    distribution,
  };
}

function computeScaleAnalytics(values: number[], minValue: number = 1, maxValue: number = 10) {
  if (values.length === 0) return { average: 0, distribution: {} };

  const sum = values.reduce((a, b) => a + b, 0);
  const distribution: Record<number, number> = {};

  for (let i = minValue; i <= maxValue; i++) {
    distribution[i] = 0;
  }
  for (const v of values) {
    distribution[v] = (distribution[v] || 0) + 1;
  }

  return {
    average: Math.round((sum / values.length) * 10) / 10,
    distribution,
  };
}

function computeOptionCounts(values: string[]) {
  const counts: Record<string, number> = {};
  for (const v of values) {
    counts[v] = (counts[v] || 0) + 1;
  }
  return counts;
}

function computeFieldAnalytics(field: FormField, submissions: Submission[]) {
  const values = submissions
    .map((s) => s.data?.[field.id])
    .filter((v) => v !== undefined && v !== null && v !== "");

  const base = {
    field_id: field.id,
    field_label: field.label,
    field_type: field.type,
    response_count: values.length,
  };

  switch (field.type) {
    case "nps": {
      const numValues = values.map(Number).filter((v) => !isNaN(v));
      return { ...base, ...computeNpsScore(numValues) };
    }
    case "rating": {
      const numValues = values.map(Number).filter((v) => !isNaN(v));
      return { ...base, ...computeRatingAnalytics(numValues, field.max_value || 5) };
    }
    case "scale": {
      const numValues = values.map(Number).filter((v) => !isNaN(v));
      return {
        ...base,
        ...computeScaleAnalytics(numValues, field.min_value || 1, field.max_value || 10),
      };
    }
    case "testimonial": {
      const textResponses = values.map((v) => {
        if (typeof v === "object" && v !== null) {
          const obj = v as Record<string, unknown>;
          return {
            text: String(obj.text || ""),
            permission_granted: Boolean(obj.permission_granted),
          };
        }
        return { text: String(v), permission_granted: false };
      });
      return { ...base, responses: textResponses };
    }
    case "select":
    case "radio": {
      const strValues = values.map(String);
      return { ...base, option_counts: computeOptionCounts(strValues) };
    }
    case "text":
    case "textarea":
    case "email":
    default:
      return base;
  }
}

// GET - Compute analytics for a survey
export async function GET(
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

    // Fetch the survey
    const { data: survey, error: surveyError } = await supabase
      .from("surveys")
      .select("*")
      .eq("id", id)
      .eq("tenant_id", profile.tenant_id)
      .single();

    if (surveyError || !survey) {
      return NextResponse.json(
        { error: "Survey not found" },
        { status: 404 }
      );
    }

    // Fetch the underlying form
    const { data: form, error: formError } = await supabase
      .from("forms")
      .select("*")
      .eq("id", survey.form_id)
      .single();

    if (formError || !form) {
      return NextResponse.json(
        { error: "Survey form not found" },
        { status: 404 }
      );
    }

    // Fetch all submissions for this form
    const { data: submissions, error: subError } = await supabase
      .from("form_submissions")
      .select("id, data, created_at")
      .eq("form_id", form.id)
      .order("created_at", { ascending: false });

    if (subError) {
      return NextResponse.json(
        { error: subError.message },
        { status: 500 }
      );
    }

    const allSubmissions = (submissions || []) as Submission[];
    const fields = (form.fields || []) as FormField[];

    // Compute per-field analytics
    const fieldAnalytics = fields.map((field) =>
      computeFieldAnalytics(field, allSubmissions)
    );

    // Compute overall NPS score if there is an NPS field
    const npsField = fieldAnalytics.find((fa) => fa.field_type === "nps");
    const npsScore = npsField && "score" in npsField ? npsField.score : null;

    const totalResponses = allSubmissions.length;
    const sentCount = survey.sent_count || 0;
    const responseRate =
      sentCount > 0
        ? Math.round((totalResponses / sentCount) * 100 * 10) / 10
        : null;

    // Completion rate: submissions with all required fields answered
    const requiredFieldIds = fields
      .filter((f) => f.required)
      .map((f) => f.id);

    const completedSubmissions = allSubmissions.filter((s) =>
      requiredFieldIds.every(
        (fid) =>
          s.data?.[fid] !== undefined &&
          s.data?.[fid] !== null &&
          s.data?.[fid] !== ""
      )
    );

    const completionRate =
      totalResponses > 0
        ? Math.round((completedSubmissions.length / totalResponses) * 100 * 10) / 10
        : null;

    return NextResponse.json({
      survey,
      analytics: {
        total_responses: totalResponses,
        response_rate: responseRate,
        completion_rate: completionRate,
        nps_score: npsScore,
        field_analytics: fieldAnalytics,
      },
    });
  } catch (error) {
    console.error("Survey analytics error:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}

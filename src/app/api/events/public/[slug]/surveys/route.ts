import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET - Fetch active surveys for a public event
export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    // Look up the event by slug
    const { data: event, error: eventError } = await supabase
      .from("events")
      .select("id, title, status")
      .eq("slug", slug)
      .single();

    if (eventError || !event) {
      return NextResponse.json({ surveys: [] });
    }

    // Fetch active surveys linked to this event
    const { data: surveys, error: surveysError } = await supabase
      .from("surveys")
      .select("id, title, description, survey_type, form_id, forms:form_id(id, slug, title, description, fields, settings, status, conditional_rules, thank_you_title, thank_you_message, thank_you_redirect_url)")
      .eq("event_id", event.id)
      .eq("status", "active");

    if (surveysError || !surveys || surveys.length === 0) {
      return NextResponse.json({ surveys: [] });
    }

    // Only return surveys whose form is published
    const activeSurveys = surveys
      .filter((s) => {
        const form = s.forms as unknown as Record<string, unknown> | null;
        return form && form.status === "published";
      })
      .map((s) => {
        const form = s.forms as unknown as Record<string, unknown>;
        return {
          id: s.id,
          title: s.title,
          description: s.description,
          survey_type: s.survey_type,
          form: {
            id: form.id,
            slug: form.slug,
            title: form.title,
            description: form.description,
            fields: form.fields,
            settings: form.settings || null,
            status: form.status,
            conditional_rules: form.conditional_rules,
            thank_you_title: form.thank_you_title,
            thank_you_message: form.thank_you_message,
            thank_you_redirect_url: form.thank_you_redirect_url,
          },
        };
      });

    return NextResponse.json({ surveys: activeSurveys });
  } catch (error) {
    console.error("Public event surveys error:", error);
    return NextResponse.json({ surveys: [] });
  }
}

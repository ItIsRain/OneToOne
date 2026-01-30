import { NextResponse } from "next/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { checkTriggers } from "@/lib/workflows/triggers";

// POST - Submit a form (NO AUTH REQUIRED)
export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
    }

    const serviceClient = createServiceClient(supabaseUrl, supabaseServiceKey);

    // Fetch the published form
    const { data: form, error: formError } = await serviceClient
      .from("forms")
      .select("*")
      .eq("slug", slug)
      .eq("status", "published")
      .single();

    if (formError || !form) {
      return NextResponse.json({ error: "Form not found or not published" }, { status: 404 });
    }

    const body = await request.json();

    if (!body.data || typeof body.data !== "object") {
      return NextResponse.json({ error: "Submission data is required" }, { status: 400 });
    }

    // Save submission
    const submissionData = {
      form_id: form.id,
      tenant_id: form.tenant_id,
      data: body.data,
      is_read: false,
    };

    const { data: submission, error: submissionError } = await serviceClient
      .from("form_submissions")
      .insert(submissionData)
      .select("*")
      .single();

    if (submissionError) {
      console.error("Submission insert error:", submissionError);
      return NextResponse.json({ error: submissionError.message }, { status: 500 });
    }

    // Increment submissions_count on the form
    await serviceClient
      .from("forms")
      .update({ submissions_count: (form.submissions_count || 0) + 1 })
      .eq("id", form.id);

    // Auto-create lead if enabled
    if (form.auto_create_lead && form.lead_field_mapping) {
      try {
        const mapping = form.lead_field_mapping as Record<string, string>;
        const leadData: Record<string, unknown> = {
          tenant_id: form.tenant_id,
          created_by: form.created_by,
          source: "form",
          status: "new",
        };

        for (const [leadField, formFieldId] of Object.entries(mapping)) {
          if (body.data[formFieldId] !== undefined) {
            leadData[leadField] = body.data[formFieldId];
          }
        }

        if (leadData.name || leadData.email) {
          await serviceClient.from("leads").insert(leadData);
        }
      } catch (err) {
        console.error("Auto-create lead error:", err);
      }
    }

    // Auto-create contact if enabled
    if (form.auto_create_contact && form.lead_field_mapping) {
      try {
        const mapping = form.lead_field_mapping as Record<string, string>;
        const contactData: Record<string, unknown> = {
          tenant_id: form.tenant_id,
          created_by: form.created_by,
          source: "form",
          status: "active",
        };

        for (const [contactField, formFieldId] of Object.entries(mapping)) {
          if (body.data[formFieldId] !== undefined) {
            contactData[contactField] = body.data[formFieldId];
          }
        }

        if (contactData.first_name || contactData.email) {
          await serviceClient.from("contacts").insert(contactData);
        }
      } catch (err) {
        console.error("Auto-create contact error:", err);
      }
    }

    // Trigger workflow automations for form_submitted
    try {
      await checkTriggers("form_submitted", {
        entity_id: submission.id,
        entity_type: "form_submission",
        entity_name: form.title,
        form_id: form.id,
        form_title: form.title,
        form_slug: form.slug,
        submission_data: body.data,
      }, serviceClient, form.tenant_id, form.created_by);
    } catch (err) {
      console.error("Workflow trigger error:", err);
    }

    return NextResponse.json({
      submission: { id: submission.id },
      thank_you_title: form.thank_you_title,
      thank_you_message: form.thank_you_message,
      thank_you_redirect_url: form.thank_you_redirect_url,
    }, { status: 201 });
  } catch (error) {
    console.error("Submit form error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

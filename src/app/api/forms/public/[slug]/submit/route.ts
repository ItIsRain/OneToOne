import { NextResponse } from "next/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { checkTriggers } from "@/lib/workflows/triggers";
import { checkRateLimit, getClientIp, rateLimitResponse } from "@/lib/rate-limit";

// Payload limits to prevent DoS attacks
const MAX_PAYLOAD_SIZE = 1 * 1024 * 1024; // 1MB
const MAX_JSON_DEPTH = 10;

/** Check depth of nested object to prevent deeply nested payloads */
function getJsonDepth(obj: unknown, currentDepth = 0): number {
  if (currentDepth > MAX_JSON_DEPTH) return currentDepth;
  if (obj === null || typeof obj !== "object") return currentDepth;

  let maxDepth = currentDepth;
  const values = Array.isArray(obj) ? obj : Object.values(obj);
  for (const value of values) {
    const depth = getJsonDepth(value, currentDepth + 1);
    if (depth > maxDepth) maxDepth = depth;
    if (maxDepth > MAX_JSON_DEPTH) break; // Early exit
  }
  return maxDepth;
}

// Allowed fields for auto-create lead/contact with their expected types
const ALLOWED_LEAD_FIELDS: Record<string, "string" | "number" | "email"> = {
  name: "string",
  email: "email",
  phone: "string",
  company: "string",
  title: "string",
  notes: "string",
  value: "number",
  priority: "string",
};

const ALLOWED_CONTACT_FIELDS: Record<string, "string" | "number" | "email"> = {
  first_name: "string",
  last_name: "string",
  email: "email",
  phone: "string",
  company: "string",
  job_title: "string",
  notes: "string",
};

// Sanitize and validate a field value based on expected type
function sanitizeFieldValue(value: unknown, expectedType: "string" | "number" | "email"): unknown | null {
  if (value === null || value === undefined) {
    return null;
  }

  if (expectedType === "string") {
    if (typeof value !== "string") return null;
    // Trim and limit length to prevent abuse
    return value.trim().slice(0, 1000);
  }

  if (expectedType === "email") {
    if (typeof value !== "string") return null;
    const email = value.trim().toLowerCase();
    // Basic email validation
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return null;
    return email.slice(0, 255);
  }

  if (expectedType === "number") {
    const num = Number(value);
    if (isNaN(num) || !isFinite(num)) return null;
    return num;
  }

  return null;
}

// POST - Submit a form (NO AUTH REQUIRED)
export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    // Rate limit: 10 submissions per IP per minute
    const ip = getClientIp(request);
    const rateLimit = await checkRateLimit({
      key: "form-submit",
      identifier: ip,
      maxRequests: 10,
      windowSeconds: 60,
    });
    if (!rateLimit.allowed) {
      return rateLimitResponse(rateLimit.retryAfterSeconds!);
    }

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

    // Check Content-Length to prevent large payloads
    const contentLength = parseInt(request.headers.get("content-length") || "0", 10);
    if (contentLength > MAX_PAYLOAD_SIZE) {
      return NextResponse.json({ error: "Payload too large (max 1MB)" }, { status: 413 });
    }

    const body = await request.json();

    if (!body.data || typeof body.data !== "object") {
      return NextResponse.json({ error: "Submission data is required" }, { status: 400 });
    }

    // Validate JSON depth to prevent deeply nested payloads
    const depth = getJsonDepth(body);
    if (depth > MAX_JSON_DEPTH) {
      return NextResponse.json({ error: `Payload too deeply nested (max depth: ${MAX_JSON_DEPTH})` }, { status: 400 });
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

    // Atomically increment submissions_count using raw SQL to avoid race conditions
    try {
      const { error: rpcError } = await serviceClient.rpc("increment_form_submissions_count", { form_id_param: form.id });
      if (rpcError) throw rpcError;
    } catch {
      // Fallback if RPC function doesn't exist: use count-based approach
      // This is eventually consistent under concurrent load
      const { count: submissionCount } = await serviceClient
        .from("form_submissions")
        .select("*", { count: "exact", head: true })
        .eq("form_id", form.id);
      await serviceClient
        .from("forms")
        .update({ submissions_count: submissionCount || 0 })
        .eq("id", form.id);
    }

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
          // Only allow known safe fields
          const expectedType = ALLOWED_LEAD_FIELDS[leadField];
          if (!expectedType) continue;

          if (body.data[formFieldId] !== undefined) {
            const sanitizedValue = sanitizeFieldValue(body.data[formFieldId], expectedType);
            if (sanitizedValue !== null) {
              leadData[leadField] = sanitizedValue;
            }
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
          // Only allow known safe fields
          const expectedType = ALLOWED_CONTACT_FIELDS[contactField];
          if (!expectedType) continue;

          if (body.data[formFieldId] !== undefined) {
            const sanitizedValue = sanitizeFieldValue(body.data[formFieldId], expectedType);
            if (sanitizedValue !== null) {
              contactData[contactField] = sanitizedValue;
            }
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

    // Check if this form belongs to a survey and fire survey_response_submitted + update response count
    try {
      const { data: survey } = await serviceClient
        .from("surveys")
        .select("id, title, event_id")
        .eq("form_id", form.id)
        .single();

      if (survey) {
        // Atomically increment survey response_count to avoid race conditions
        try {
          const { error: rpcError } = await serviceClient.rpc("increment_survey_response_count", { survey_id_param: survey.id });
          if (rpcError) throw rpcError;
        } catch {
          // Fallback if RPC function doesn't exist: use count-based approach
          const { count: responseCount } = await serviceClient
            .from("form_submissions")
            .select("*", { count: "exact", head: true })
            .eq("form_id", form.id);
          await serviceClient
            .from("surveys")
            .update({ response_count: responseCount || 0 })
            .eq("id", survey.id);
        }

        // Look up event title if linked
        let eventTitle: string | null = null;
        if (survey.event_id) {
          const { data: event } = await serviceClient
            .from("events")
            .select("title")
            .eq("id", survey.event_id)
            .single();
          eventTitle = event?.title ?? null;
        }

        // Extract NPS value if any NPS field exists
        const formFields = form.fields as { id: string; type: string }[] | null;
        let npsScore: number | null = null;
        if (formFields) {
          const npsField = formFields.find((f) => f.type === "nps");
          if (npsField && body.data[npsField.id] !== undefined) {
            npsScore = Number(body.data[npsField.id]);
          }
        }

        await checkTriggers("survey_response_submitted", {
          entity_id: submission.id,
          entity_type: "survey_response",
          entity_name: survey.title,
          survey_id: survey.id,
          survey_title: survey.title,
          event_id: survey.event_id,
          event_title: eventTitle,
          form_id: form.id,
          submission_data: body.data,
          nps_score: npsScore,
        }, serviceClient, form.tenant_id, form.created_by);
      }
    } catch (err) {
      console.error("Survey response trigger error:", err);
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

import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { getTenantSubscription, checkAttendeeLimit } from "@/lib/plan-limits";
import { checkTriggers } from "@/lib/workflows/triggers";
import { checkRateLimit, getClientIp, rateLimitResponse } from "@/lib/rate-limit";
import { validateBody, publicRegistrationSchema } from "@/lib/validations";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    // Rate limit: 10 registrations per IP per minute
    const ip = getClientIp(request);
    const rateLimit = await checkRateLimit({
      key: "event-register",
      identifier: ip,
      maxRequests: 10,
      windowSeconds: 60,
    });
    if (!rateLimit.allowed) {
      return rateLimitResponse(rateLimit.retryAfterSeconds!);
    }

    const supabase = await createClient();
    const body = await request.json();

    // Validate input
    const validation = validateBody(publicRegistrationSchema, body);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const { name, email, phone, company } = validation.data;
    const { notes } = body;

    // Get event by slug
    const { data: event, error: eventError } = await supabase
      .from("events")
      .select("id, title, is_public, is_published, registration_required, max_attendees, attendees_count, tenant_id, event_type")
      .eq("slug", slug)
      .single();

    if (eventError || !event) {
      return NextResponse.json(
        { error: "Event not found" },
        { status: 404 }
      );
    }

    // Check if event is public and published
    if (!event.is_public || !event.is_published) {
      return NextResponse.json(
        { error: "This event is not accepting registrations" },
        { status: 403 }
      );
    }

    // Check capacity
    if (event.max_attendees && event.attendees_count >= event.max_attendees) {
      return NextResponse.json(
        { error: "This event is full" },
        { status: 400 }
      );
    }

    // Check plan limits for attendees per event
    const subscription = await getTenantSubscription(supabase, event.tenant_id);
    if (subscription) {
      const attendeeLimitCheck = await checkAttendeeLimit(supabase, event.id, subscription.plan_type);
      if (!attendeeLimitCheck.allowed) {
        return NextResponse.json(
          { error: "This event has reached its registration limit" },
          { status: 400 }
        );
      }
    }

    // Check for duplicate registration
    const { data: existingRegistration } = await supabase
      .from("event_attendees")
      .select("id")
      .eq("event_id", event.id)
      .eq("email", email.trim().toLowerCase())
      .single();

    if (existingRegistration) {
      return NextResponse.json(
        { error: "You are already registered for this event" },
        { status: 400 }
      );
    }

    // Create registration
    const { data: registration, error: registrationError } = await supabase
      .from("event_attendees")
      .insert({
        event_id: event.id,
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone: phone?.trim() || null,
        company: company?.trim() || null,
        notes: notes?.trim() || null,
        status: "confirmed",
        registered_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (registrationError) {
      console.error("Error creating registration:", registrationError);
      return NextResponse.json(
        { error: "Failed to register. Please try again." },
        { status: 500 }
      );
    }

    // Increment attendees count atomically to avoid race conditions
    await supabase.rpc("increment_attendee_count", { event_id: event.id });

    // Trigger event_registration workflows using a standalone service client
    // so the workflow execution survives after the response is sent
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (supabaseUrl && supabaseServiceKey) {
      const serviceClient = createServiceClient(supabaseUrl, supabaseServiceKey);

      // Look up a tenant admin/owner to use as userId for the workflow run
      // (public registrations have no authenticated user)
      let workflowUserId = registration.id;
      const { data: tenantAdmin } = await serviceClient
        .from("profiles")
        .select("id")
        .eq("tenant_id", event.tenant_id)
        .limit(1)
        .single();
      if (tenantAdmin) {
        workflowUserId = tenantAdmin.id;
      }

      // MUST await — fire-and-forget will be killed when Next.js ends the request
      try {
        await checkTriggers(
          "event_registration",
          {
            entity_id: registration.id,
            entity_type: "event_attendee",
            entity_name: registration.name,
            attendee_id: registration.id,
            attendee_name: registration.name,
            attendee_email: registration.email,
            attendee_phone: phone?.trim() || null,
            attendee_company: company?.trim() || null,
            event_id: event.id,
            event_title: event.title,
            event_type: event.event_type || null,
          },
          serviceClient,
          event.tenant_id,
          workflowUserId
        );
      } catch (err) {
        console.error("Workflow trigger error:", err);
      }
    }

    return NextResponse.json({
      success: true,
      registration: {
        id: registration.id,
        name: registration.name,
        email: registration.email,
      },
    });
  } catch (error) {
    console.error("Error in registration POST:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

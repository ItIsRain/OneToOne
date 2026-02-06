import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { checkTriggers } from "@/lib/workflows/triggers";
import { checkRateLimit, getClientIp, rateLimitResponse } from "@/lib/rate-limit";
import { validateBody, publicBookingSubmitSchema } from "@/lib/validations";
import { headers } from "next/headers";

// PUBLIC route - no auth required, uses service role client
// POST - Submit a booking
export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    // Rate limit: 10 bookings per IP per minute
    const ip = getClientIp(request);
    const rateLimit = await checkRateLimit({
      key: "booking-submit",
      identifier: ip,
      maxRequests: 10,
      windowSeconds: 60,
    });
    if (!rateLimit.allowed) {
      return rateLimitResponse(rateLimit.retryAfterSeconds!);
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Scope slug lookup to tenant if accessed via subdomain (x-tenant-id set by middleware)
    const headersList = await headers();
    const tenantId = headersList.get("x-tenant-id");

    // Look up booking page by slug
    let pageQuery = supabase
      .from("booking_pages")
      .select("*")
      .eq("slug", slug)
      .eq("is_active", true);

    if (tenantId) {
      pageQuery = pageQuery.eq("tenant_id", tenantId);
    }

    const { data: bookingPage, error: pageError } = await pageQuery.single();

    if (pageError || !bookingPage) {
      return NextResponse.json({ error: "Booking page not found" }, { status: 404 });
    }

    const body = await request.json();

    // Validate input
    const validation = validateBody(publicBookingSubmitSchema, body);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const requestedStart = new Date(body.start_time);
    const requestedEnd = new Date(body.end_time);
    const now = new Date();

    // Check min_notice_hours
    if (bookingPage.min_notice_hours) {
      const minNoticeMs = bookingPage.min_notice_hours * 60 * 60 * 1000;
      const timeDiff = requestedStart.getTime() - now.getTime();
      if (timeDiff < minNoticeMs) {
        return NextResponse.json(
          { error: `Bookings require at least ${bookingPage.min_notice_hours} hours notice` },
          { status: 400 }
        );
      }
    }

    // Check max_advance_days
    if (bookingPage.max_advance_days) {
      const maxAdvanceMs = bookingPage.max_advance_days * 24 * 60 * 60 * 1000;
      const timeDiff = requestedStart.getTime() - now.getTime();
      if (timeDiff > maxAdvanceMs) {
        return NextResponse.json(
          { error: `Bookings cannot be scheduled more than ${bookingPage.max_advance_days} days in advance` },
          { status: 400 }
        );
      }
    }

    // Resolve availability — match the same logic as the GET route
    const memberId = bookingPage.assigned_member_id;

    // Helper: get time string (HH:MM:SS) for a UTC date in a given timezone
    function getTimeInTimezone(utcDate: Date, timezone: string): string {
      return utcDate.toLocaleTimeString("en-GB", { timeZone: timezone, hour12: false });
    }

    // Helper: get day of week (0=Sun..6=Sat) for a UTC date in a given timezone
    function getDayInTimezone(utcDate: Date, timezone: string): number {
      // Use full weekday name for more reliable parsing
      const formatter = new Intl.DateTimeFormat("en-US", { timeZone: timezone, weekday: "long" });
      const weekdayName = formatter.format(utcDate);
      const dayMap: Record<string, number> = {
        Sunday: 0, Monday: 1, Tuesday: 2, Wednesday: 3, Thursday: 4, Friday: 5, Saturday: 6
      };
      const dayNum = dayMap[weekdayName];
      if (dayNum === undefined) {
        // This should never happen, but log and use a safe calculation
        console.error(`Unexpected weekday name: ${weekdayName} for timezone ${timezone}`);
        // Calculate day in timezone using offset-aware approach
        const tzDate = new Date(utcDate.toLocaleString("en-US", { timeZone: timezone }));
        return tzDate.getDay();
      }
      return dayNum;
    }

    // First, fetch all availability for this member/tenant to determine timezone
    let availQuery = supabase
      .from("team_availability")
      .select("*")
      .eq("tenant_id", bookingPage.tenant_id)
      .eq("is_available", true);

    if (memberId) {
      availQuery = availQuery.eq("member_id", memberId);
    }

    const { data: allAvailSlots } = await availQuery;

    // If no slots and no assigned member, try tenant owner
    let allResolvedSlots = allAvailSlots;
    if ((!allAvailSlots || allAvailSlots.length === 0) && !memberId) {
      const { data: tenantData } = await supabase
        .from("tenants")
        .select("owner_id")
        .eq("id", bookingPage.tenant_id)
        .single();

      if (tenantData?.owner_id) {
        const { data: ownerSlots } = await supabase
          .from("team_availability")
          .select("*")
          .eq("tenant_id", bookingPage.tenant_id)
          .eq("member_id", tenantData.owner_id)
          .eq("is_available", true);

        allResolvedSlots = ownerSlots;
      }
    }

    if (!allResolvedSlots || allResolvedSlots.length === 0) {
      return NextResponse.json(
        { error: "The selected time is not within available hours" },
        { status: 400 }
      );
    }

    // Filter slots for the correct day of week using timezone-aware day calculation
    // Use the first slot's timezone to determine the day of week
    const slotTimezone = allResolvedSlots[0]?.timezone || "UTC";
    const dayOfWeek = getDayInTimezone(requestedStart, slotTimezone);
    // Compute date string in the availability timezone (en-CA gives YYYY-MM-DD)
    const dateStr = new Intl.DateTimeFormat("en-CA", { timeZone: slotTimezone }).format(requestedStart);

    const resolvedSlots = allResolvedSlots.filter((slot) => slot.day_of_week === dayOfWeek);

    if (resolvedSlots.length === 0) {
      return NextResponse.json(
        { error: "The selected time is not within available hours" },
        { status: 400 }
      );
    }

    // Check if the requested time falls within any available window (timezone-aware)
    const fitsAnySlot = resolvedSlots.some((slot) => {
      const tz = slot.timezone || "UTC";
      const startInTz = getTimeInTimezone(requestedStart, tz);
      const endInTz = getTimeInTimezone(requestedEnd, tz);
      // Normalize slot times to HH:MM:SS
      const slotStart = slot.start_time.length === 5 ? slot.start_time + ":00" : slot.start_time;
      const slotEnd = slot.end_time.length === 5 ? slot.end_time + ":00" : slot.end_time;
      return startInTz >= slotStart && endInTz <= slotEnd;
    });

    if (!fitsAnySlot) {
      return NextResponse.json(
        { error: "The selected time is outside available hours" },
        { status: 400 }
      );
    }

    // Determine which member_id to use for overlap / override checks
    const resolvedMemberId = memberId || resolvedSlots[0].member_id;

    // Check for availability overrides on that date
    const { data: overrides } = await supabase
      .from("availability_overrides")
      .select("*")
      .eq("tenant_id", bookingPage.tenant_id)
      .eq("member_id", resolvedMemberId)
      .eq("override_date", dateStr);

    if (overrides && overrides.length > 0) {
      for (const override of overrides) {
        if (override.is_blocked && !override.start_time && !override.end_time) {
          return NextResponse.json(
            { error: "The selected date is not available" },
            { status: 400 }
          );
        }

        if (override.is_blocked && override.start_time && override.end_time) {
          // Compare in the availability timezone
          const startInTz = getTimeInTimezone(requestedStart, slotTimezone);
          const endInTz = getTimeInTimezone(requestedEnd, slotTimezone);
          const blockStart = override.start_time.length === 5 ? override.start_time + ":00" : override.start_time;
          const blockEnd = override.end_time.length === 5 ? override.end_time + ":00" : override.end_time;

          if (startInTz < blockEnd && endInTz > blockStart) {
            return NextResponse.json(
              { error: "The selected time overlaps with a blocked period" },
              { status: 400 }
            );
          }
        }
      }
    }

    // Check for existing appointment overlaps (considering buffers)
    const bufferBefore = bookingPage.buffer_before || 0;
    const bufferAfter = bookingPage.buffer_after || 0;

    const bufferedStart = new Date(requestedStart.getTime() - bufferBefore * 60 * 1000);
    const bufferedEnd = new Date(requestedEnd.getTime() + bufferAfter * 60 * 1000);

    // Check across ALL booking pages for the same assigned member to prevent double-booking
    let overlapQuery = supabase
      .from("appointments")
      .select("id, start_time, end_time")
      .eq("tenant_id", bookingPage.tenant_id)
      .neq("status", "cancelled")
      .lt("start_time", bufferedEnd.toISOString())
      .gt("end_time", bufferedStart.toISOString());

    if (resolvedMemberId) {
      overlapQuery = overlapQuery.eq("assigned_member_id", resolvedMemberId);
    } else {
      overlapQuery = overlapQuery.eq("booking_page_id", bookingPage.id);
    }

    const { data: conflictingAppointments } = await overlapQuery;

    if (conflictingAppointments && conflictingAppointments.length > 0) {
      return NextResponse.json(
        { error: "The selected time slot is already booked" },
        { status: 400 }
      );
    }

    // Insert the appointment
    const appointmentData = {
      tenant_id: bookingPage.tenant_id,
      booking_page_id: bookingPage.id,
      client_name: body.client_name,
      client_email: body.client_email,
      client_phone: body.client_phone || null,
      start_time: body.start_time,
      end_time: body.end_time,
      status: "confirmed",
      source: "public_booking",
      notes: body.notes || null,
      assigned_member_id: resolvedMemberId || null,
      form_response_id: body.form_response_id || null,
    };

    const { data: appointment, error: insertError } = await supabase
      .from("appointments")
      .insert(appointmentData)
      .select()
      .single();

    if (insertError) {
      console.error("Insert error:", insertError);
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    // Trigger workflow automations for booking_created
    try {
      await checkTriggers("booking_created", {
        entity_id: appointment.id,
        entity_type: "appointment",
        entity_name: appointment.client_name,
        client_name: appointment.client_name,
        client_email: appointment.client_email,
        client_phone: appointment.client_phone,
        start_time: appointment.start_time,
        end_time: appointment.end_time,
        booking_page_id: appointment.booking_page_id,
        booking_page_name: bookingPage.name,
        status: appointment.status,
        source: "public_booking",
      }, supabase, bookingPage.tenant_id, resolvedMemberId || "system");
    } catch (err) {
      console.error("Workflow trigger error (booking_created):", err);
    }

    return NextResponse.json({ appointment }, { status: 201 });
  } catch (error) {
    console.error("Submit booking error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

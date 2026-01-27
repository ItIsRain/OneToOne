import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getTenantIdFromRequest } from "@/hooks/useTenantFromHeaders";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    // Check if request is coming from a tenant subdomain/custom domain
    const tenantId = getTenantIdFromRequest(request);

    // Build query for event lookup
    let query = supabase
      .from("events")
      .select("id, slug, is_public, is_published, title, tenant_id")
      .eq("slug", slug);

    // If accessed via subdomain, filter by tenant
    if (tenantId) {
      query = query.eq("tenant_id", tenantId);
    }

    // First, try to find the event by slug (and optionally tenant)
    const { data: eventCheck, error: checkError } = await query.single();

    if (checkError) {
      console.log("Event lookup by slug failed:", checkError);

      if (checkError.code === "PGRST116") {
        return NextResponse.json(
          { error: "Event not found - no event with this slug exists" },
          { status: 404 }
        );
      }
      throw checkError;
    }

    console.log("Found event:", eventCheck);

    // Check if event is public
    // Allow if is_public is true OR is_public is null (not explicitly set to private)
    if (eventCheck.is_public === false) {
      return NextResponse.json(
        { error: "This event is private" },
        { status: 403 }
      );
    }

    // Check if event is published
    // Allow if is_published is true OR is_published is null (legacy events)
    if (eventCheck.is_published === false) {
      return NextResponse.json(
        { error: "This event is not yet published" },
        { status: 403 }
      );
    }

    // Now fetch the full event data using the already found event ID
    // This ensures we get the same event that passed the checks above
    const { data: event, error } = await supabase
      .from("events")
      .select(`
        id,
        title,
        slug,
        description,
        event_type,
        category,
        icon,
        color,
        start_date,
        end_date,
        start_time,
        end_time,
        timezone,
        location,
        is_virtual,
        virtual_platform,
        virtual_link,
        attendees_count,
        max_attendees,
        is_public,
        is_published,
        registration_required,
        registration_deadline,
        ticket_price,
        currency,
        tags,
        cover_image,
        organizer_name,
        contact_name,
        contact_email,
        contact_phone,
        status,
        requirements,
        tenant_id
      `)
      .eq("id", eventCheck.id)
      .single();

    if (error) {
      throw error;
    }

    // Get actual attendees count from event_attendees table
    const { count: actualAttendeesCount } = await supabase
      .from("event_attendees")
      .select("*", { count: "exact", head: true })
      .eq("event_id", event.id);

    return NextResponse.json({
      ...event,
      attendees_count: actualAttendeesCount || 0
    });
  } catch (error) {
    console.error("Error fetching event:", error);
    return NextResponse.json(
      { error: "Failed to fetch event" },
      { status: 500 }
    );
  }
}

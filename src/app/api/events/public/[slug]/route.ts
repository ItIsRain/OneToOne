import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

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

    // First, try to find the event by slug only to debug
    const { data: eventCheck, error: checkError } = await supabase
      .from("events")
      .select("id, slug, is_public, is_published, title")
      .eq("slug", slug)
      .single();

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

    // Now fetch the full event data
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
        requirements
      `)
      .eq("slug", slug)
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json(event);
  } catch (error) {
    console.error("Error fetching event:", error);
    return NextResponse.json(
      { error: "Failed to fetch event" },
      { status: 500 }
    );
  }
}

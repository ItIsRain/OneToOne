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
        date,
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
        registration_required,
        ticket_price,
        tags,
        cover_image,
        organizer_name,
        contact_name,
        contact_email,
        status,
        requirements
      `)
      .eq("slug", slug)
      .eq("is_public", true)
      .eq("is_published", true)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return NextResponse.json(
          { error: "Event not found" },
          { status: 404 }
        );
      }
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

import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const supabase = await createClient();
    const body = await request.json();

    const { name, email, phone, company, notes } = body;

    if (!name?.trim() || !email?.trim()) {
      return NextResponse.json(
        { error: "Name and email are required" },
        { status: 400 }
      );
    }

    // Get event by slug
    const { data: event, error: eventError } = await supabase
      .from("events")
      .select("id, title, is_public, is_published, registration_required, max_attendees, attendees_count")
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

    // Increment attendees count
    await supabase
      .from("events")
      .update({ attendees_count: (event.attendees_count || 0) + 1 })
      .eq("id", event.id);

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

import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user's tenant_id from profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("tenant_id")
      .eq("id", user.id)
      .single();

    if (!profile?.tenant_id) {
      return NextResponse.json({ error: "No tenant found" }, { status: 400 });
    }

    const { data: event, error } = await supabase
      .from("events")
      .select(`
        *,
        client:client_id(id, name, company, email, phone),
        venue:venue_id(id, name, address, city, capacity, amenities, hourly_rate)
      `)
      .eq("id", id)
      .eq("tenant_id", profile.tenant_id)
      .single();

    if (error) {
      console.error("Error fetching event:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    // Fetch assignee and creator info
    let assignee = null;
    let creator = null;

    if (event.assigned_to) {
      const { data } = await supabase
        .from("profiles")
        .select("id, first_name, last_name, avatar_url, email")
        .eq("id", event.assigned_to)
        .single();
      assignee = data;
    }

    if (event.created_by) {
      const { data } = await supabase
        .from("profiles")
        .select("id, first_name, last_name")
        .eq("id", event.created_by)
        .single();
      creator = data;
    }

    // Fetch attendees count
    const { count: attendeesCount } = await supabase
      .from("event_attendees")
      .select("*", { count: "exact", head: true })
      .eq("event_id", id)
      .in("status", ["confirmed", "attended"]);

    return NextResponse.json({
      ...event,
      assignee,
      creator,
      confirmed_attendees: attendeesCount || 0,
    });
  } catch (error) {
    console.error("Error in event GET:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user's tenant_id from profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("tenant_id")
      .eq("id", user.id)
      .single();

    if (!profile?.tenant_id) {
      return NextResponse.json({ error: "No tenant found" }, { status: 400 });
    }

    const body = await request.json();

    // Process dates if they come as separate date and time
    const updateData = { ...body };

    if (body.date && body.start_time && !body.start_date) {
      updateData.start_date = `${body.date}T${body.start_time}:00`;
    }
    if (body.end_date_value && body.end_time && !body.end_date) {
      updateData.end_date = `${body.end_date_value}T${body.end_time}:00`;
    } else if (body.date && body.end_time && !body.end_date) {
      updateData.end_date = `${body.date}T${body.end_time}:00`;
    }

    // Remove helper fields
    delete updateData.date;
    delete updateData.end_date_value;

    const { data: event, error } = await supabase
      .from("events")
      .update(updateData)
      .eq("id", id)
      .eq("tenant_id", profile.tenant_id)
      .select(`
        *,
        client:client_id(id, name, company, email),
        venue:venue_id(id, name, address, city, capacity)
      `)
      .single();

    if (error) {
      console.error("Error updating event:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Fetch assignee and creator info
    let assignee = null;
    let creator = null;

    if (event.assigned_to) {
      const { data } = await supabase
        .from("profiles")
        .select("id, first_name, last_name, avatar_url, email")
        .eq("id", event.assigned_to)
        .single();
      assignee = data;
    }

    if (event.created_by) {
      const { data } = await supabase
        .from("profiles")
        .select("id, first_name, last_name")
        .eq("id", event.created_by)
        .single();
      creator = data;
    }

    return NextResponse.json({ ...event, assignee, creator });
  } catch (error) {
    console.error("Error in event PATCH:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user's tenant_id from profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("tenant_id")
      .eq("id", user.id)
      .single();

    if (!profile?.tenant_id) {
      return NextResponse.json({ error: "No tenant found" }, { status: 400 });
    }

    const { error } = await supabase
      .from("events")
      .delete()
      .eq("id", id)
      .eq("tenant_id", profile.tenant_id);

    if (error) {
      console.error("Error deleting event:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in event DELETE:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

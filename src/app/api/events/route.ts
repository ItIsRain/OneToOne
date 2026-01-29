import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { getUserPlanInfo, checkEventLimit } from "@/lib/plan-limits";
import { checkTriggers } from "@/lib/workflows/triggers";

export async function GET(request: NextRequest) {
  try {
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

    // Get query params for filtering
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get("status");
    const category = searchParams.get("category");
    const eventType = searchParams.get("event_type");
    const startDate = searchParams.get("start_date");
    const endDate = searchParams.get("end_date");
    const clientId = searchParams.get("client_id");
    const isVirtual = searchParams.get("is_virtual");

    // Build query
    let query = supabase
      .from("events")
      .select(`
        *,
        client:client_id(id, name, company, email),
        venue:venue_id(id, name, address, city, capacity)
      `)
      .eq("tenant_id", profile.tenant_id);

    // Apply filters
    if (status) {
      query = query.eq("status", status);
    }
    if (category) {
      query = query.eq("category", category);
    }
    if (eventType) {
      query = query.eq("event_type", eventType);
    }
    if (clientId) {
      query = query.eq("client_id", clientId);
    }
    if (isVirtual !== null && isVirtual !== undefined) {
      query = query.eq("is_virtual", isVirtual === "true");
    }
    if (startDate) {
      query = query.gte("start_date", startDate);
    }
    if (endDate) {
      query = query.lte("start_date", endDate);
    }

    // Order by start_date
    query = query.order("start_date", { ascending: true });

    const { data: events, error } = await query;

    if (error) {
      console.error("Error fetching events:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Fetch assignee and creator info
    const eventsWithUsers = await Promise.all(
      (events || []).map(async (event) => {
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

        return { ...event, assignee, creator };
      })
    );

    return NextResponse.json(eventsWithUsers);
  } catch (error) {
    console.error("Error in events GET:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
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

    // Check plan limits for event creation
    const planInfo = await getUserPlanInfo(supabase, user.id);
    if (!planInfo) {
      return NextResponse.json(
        { error: "No active subscription found", upgrade_required: true },
        { status: 403 }
      );
    }

    const eventLimitCheck = await checkEventLimit(supabase, profile.tenant_id, planInfo.planType);
    if (!eventLimitCheck.allowed) {
      return NextResponse.json(
        {
          error: eventLimitCheck.reason,
          current: eventLimitCheck.current,
          limit: eventLimitCheck.limit,
          upgrade_required: eventLimitCheck.upgrade_required,
        },
        { status: 403 }
      );
    }

    const body = await request.json();

    // Process dates if they come as separate date and time
    let startDate = body.start_date;
    let endDate = body.end_date;

    if (body.date && body.start_time) {
      startDate = `${body.date}T${body.start_time}:00`;
    }
    if (body.end_date_value && body.end_time) {
      endDate = `${body.end_date_value}T${body.end_time}:00`;
    } else if (body.date && body.end_time) {
      endDate = `${body.date}T${body.end_time}:00`;
    }

    // Create the event with tenant_id and created_by
    const { data: event, error } = await supabase
      .from("events")
      .insert({
        tenant_id: profile.tenant_id,
        created_by: user.id,
        title: body.title,
        description: body.description,
        location: body.location,
        start_date: startDate,
        end_date: endDate,
        start_time: body.start_time,
        end_time: body.end_time,
        status: body.status || "upcoming",
        event_type: body.event_type || "general",
        category: body.category || "General",
        icon: body.icon || "📅",
        color: body.color,
        cover_image: body.cover_image,
        is_virtual: body.is_virtual || false,
        virtual_platform: body.virtual_platform,
        virtual_link: body.virtual_link,
        attendees_count: body.attendees_count || 0,
        max_attendees: body.max_attendees,
        is_public: body.is_public || false,
        is_published: body.is_published || false,
        registration_required: body.registration_required || false,
        registration_deadline: body.registration_deadline,
        ticket_price: body.ticket_price,
        currency: body.currency || "USD",
        tags: body.tags || [],
        notes: body.notes,
        requirements: body.requirements || {},
        client_id: body.client_id,
        venue_id: body.venue_id,
        assigned_to: body.assigned_to,
        contact_name: body.contact_name,
        contact_email: body.contact_email,
        contact_phone: body.contact_phone,
        reminder_minutes: body.reminder_minutes || [60, 1440],
      })
      .select(`
        *,
        client:client_id(id, name, company, email),
        venue:venue_id(id, name, address, city, capacity)
      `)
      .single();

    if (error) {
      console.error("Error creating event:", error);
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

    // Trigger workflow automations for event_created
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (supabaseUrl && supabaseServiceKey) {
      const serviceClient = createServiceClient(supabaseUrl, supabaseServiceKey);
      try {
        await checkTriggers("event_created", {
          entity_id: event.id,
          entity_type: "event",
          entity_name: event.title || event.name,
          event_title: event.title,
          event_date: event.start_date,
          event_type: event.event_type,
          event_client_id: event.client_id,
        }, serviceClient, profile.tenant_id, user.id);
      } catch (err) {
        console.error("Workflow trigger error:", err);
      }
    }

    return NextResponse.json({ ...event, assignee, creator }, { status: 201 });
  } catch (error) {
    console.error("Error in events POST:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

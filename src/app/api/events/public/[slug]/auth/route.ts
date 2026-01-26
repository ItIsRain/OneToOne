import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode(
  process.env.ATTENDEE_JWT_SECRET || "attendee-portal-secret-key-change-in-production"
);

// Helper to create JWT token
async function createToken(attendeeId: string, eventId: string) {
  return await new SignJWT({ attendeeId, eventId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(JWT_SECRET);
}

// Verify JWT token
export async function verifyToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as { attendeeId: string; eventId: string };
  } catch {
    return null;
  }
}

// POST - Register or Login
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const supabase = await createClient();
    const body = await request.json();
    const { action, email, password, name, phone, company, skills, bio } = body;

    // Get event by slug
    const { data: event, error: eventError } = await supabase
      .from("events")
      .select("id, title, is_public, is_published, requirements")
      .eq("slug", slug)
      .single();

    if (eventError || !event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    if (!event.is_public || !event.is_published) {
      return NextResponse.json(
        { error: "Event is not accepting registrations" },
        { status: 403 }
      );
    }

    if (action === "register") {
      // Check if email already registered
      const { data: existing } = await supabase
        .from("event_attendees")
        .select("id")
        .eq("event_id", event.id)
        .eq("email", email.toLowerCase())
        .single();

      if (existing) {
        return NextResponse.json(
          { error: "Email already registered for this event" },
          { status: 400 }
        );
      }

      // Hash password
      const passwordHash = await bcrypt.hash(password, 12);

      // Create attendee
      const { data: attendee, error: createError } = await supabase
        .from("event_attendees")
        .insert({
          event_id: event.id,
          email: email.toLowerCase(),
          name,
          phone: phone || null,
          company: company || null,
          skills: skills || [],
          bio: bio || null,
          password_hash: passwordHash,
          status: "confirmed",
          registered_at: new Date().toISOString(),
          looking_for_team: true,
        })
        .select("id, email, name, avatar_url, status")
        .single();

      if (createError) {
        console.error("Error creating attendee:", createError);
        return NextResponse.json(
          { error: "Failed to register" },
          { status: 500 }
        );
      }

      // Try to increment attendees count (non-blocking)
      try {
        const { error: rpcError } = await supabase.rpc("increment_attendees_count", { event_id: event.id });
        if (rpcError) {
          // RPC doesn't exist, ignore silently
          console.log("Attendees count RPC not available, skipping increment");
        }
      } catch {
        // Ignore errors - this is a non-critical operation
      }

      // Create token
      const token = await createToken(attendee.id, event.id);

      return NextResponse.json({
        success: true,
        attendee: {
          id: attendee.id,
          email: attendee.email,
          name: attendee.name,
          avatar_url: attendee.avatar_url,
        },
        token,
      });
    } else if (action === "login") {
      // Find attendee
      const { data: attendee, error: findError } = await supabase
        .from("event_attendees")
        .select("id, email, name, avatar_url, password_hash, status")
        .eq("event_id", event.id)
        .eq("email", email.toLowerCase())
        .single();

      if (findError || !attendee) {
        return NextResponse.json(
          { error: "Invalid email or password" },
          { status: 401 }
        );
      }

      if (!attendee.password_hash) {
        return NextResponse.json(
          { error: "Please register first to set up your password" },
          { status: 401 }
        );
      }

      // Verify password
      const isValid = await bcrypt.compare(password, attendee.password_hash);
      if (!isValid) {
        return NextResponse.json(
          { error: "Invalid email or password" },
          { status: 401 }
        );
      }

      // Update last login
      await supabase
        .from("event_attendees")
        .update({ last_login_at: new Date().toISOString() })
        .eq("id", attendee.id);

      // Create token
      const token = await createToken(attendee.id, event.id);

      return NextResponse.json({
        success: true,
        attendee: {
          id: attendee.id,
          email: attendee.email,
          name: attendee.name,
          avatar_url: attendee.avatar_url,
        },
        token,
      });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Auth error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// GET - Verify token and get attendee info
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const authHeader = request.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "");

    if (!token) {
      return NextResponse.json({ error: "No token provided" }, { status: 401 });
    }

    const payload = await verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const supabase = await createClient();

    // Get event
    const { data: event } = await supabase
      .from("events")
      .select("id, title, slug, event_type, requirements, color, start_date, end_date")
      .eq("slug", slug)
      .single();

    if (!event || event.id !== payload.eventId) {
      return NextResponse.json({ error: "Invalid token for this event" }, { status: 401 });
    }

    // Get attendee with team info
    const { data: attendee, error } = await supabase
      .from("event_attendees")
      .select(`
        id, email, name, phone, company, job_title, avatar_url,
        skills, bio, social_links, looking_for_team, status,
        registered_at, last_login_at
      `)
      .eq("id", payload.attendeeId)
      .single();

    if (error || !attendee) {
      return NextResponse.json({ error: "Attendee not found" }, { status: 404 });
    }

    // Get team membership
    const { data: teamMembership } = await supabase
      .from("event_team_members")
      .select(`
        role,
        team:team_id (
          id, name, description, logo_url, max_members, is_open, looking_for_members, join_type, join_code
        )
      `)
      .eq("attendee_id", attendee.id)
      .eq("status", "active")
      .single();

    return NextResponse.json({
      attendee,
      team: teamMembership?.team || null,
      teamRole: teamMembership?.role || null,
      event: {
        id: event.id,
        title: event.title,
        slug: event.slug,
        event_type: event.event_type,
        color: event.color,
        requirements: event.requirements,
      },
    });
  } catch (error) {
    console.error("Get attendee error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

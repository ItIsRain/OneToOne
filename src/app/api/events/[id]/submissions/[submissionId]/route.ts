import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { validateBody, updateSubmissionSchema } from "@/lib/validations";

// GET - Get single submission details (admin only)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; submissionId: string }> }
) {
  try {
    const { id: eventId, submissionId } = await params;
    const supabase = await createClient();

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
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

    // Verify tenant owns this event
    const { data: event, error: eventError } = await supabase
      .from("events")
      .select("id")
      .eq("id", eventId)
      .eq("tenant_id", profile.tenant_id)
      .single();

    if (eventError || !event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    const { data: submission, error } = await supabase
      .from("event_submissions")
      .select(`
        *,
        team:event_teams(
          id,
          name,
          logo_url,
          description,
          members:event_team_members(
            role,
            attendee:event_attendees(id, name, email, avatar_url, skills)
          )
        ),
        attendee:event_attendees(id, name, email, avatar_url, skills, company)
      `)
      .eq("id", submissionId)
      .eq("event_id", eventId)
      .single();

    if (error || !submission) {
      return NextResponse.json({ error: "Submission not found" }, { status: 404 });
    }

    return NextResponse.json({ submission });
  } catch (error) {
    console.error("Error in submission API:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PATCH - Update submission (admin only - for marking winners, scores, notes)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; submissionId: string }> }
) {
  try {
    const { id: eventId, submissionId } = await params;
    const supabase = await createClient();

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
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

    // Verify tenant owns this event
    const { data: event, error: eventError } = await supabase
      .from("events")
      .select("id")
      .eq("id", eventId)
      .eq("tenant_id", profile.tenant_id)
      .single();

    if (eventError || !event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    const body = await request.json();

    // Validate input
    const validation = validateBody(updateSubmissionSchema, body);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const { status, winner_place, winner_prize, judge_notes, score } = validation.data;

    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (status !== undefined) updateData.status = status;
    if (winner_place !== undefined) updateData.winner_place = winner_place;
    if (winner_prize !== undefined) updateData.winner_prize = winner_prize;
    if (judge_notes !== undefined) updateData.judge_notes = judge_notes;
    if (score !== undefined) updateData.score = score;

    const { data: submission, error } = await supabase
      .from("event_submissions")
      .update(updateData)
      .eq("id", submissionId)
      .eq("event_id", eventId)
      .select()
      .single();

    if (error) {
      console.error("Error updating submission:", error);
      return NextResponse.json({ error: "Failed to update submission" }, { status: 500 });
    }

    return NextResponse.json({ submission });
  } catch (error) {
    console.error("Error in submission API:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE - Remove submission (admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; submissionId: string }> }
) {
  try {
    const { id: eventId, submissionId } = await params;
    const supabase = await createClient();

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
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

    // Verify tenant owns this event
    const { data: event, error: eventError } = await supabase
      .from("events")
      .select("id")
      .eq("id", eventId)
      .eq("tenant_id", profile.tenant_id)
      .single();

    if (eventError || !event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    const { error } = await supabase
      .from("event_submissions")
      .delete()
      .eq("id", submissionId)
      .eq("event_id", eventId);

    if (error) {
      console.error("Error deleting submission:", error);
      return NextResponse.json({ error: "Failed to delete submission" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in submission API:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "../../auth/route";

// GET - Get submission details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string; submissionId: string }> }
) {
  try {
    const { slug, submissionId } = await params;
    const supabase = await createClient();

    // Get event
    const { data: event } = await supabase
      .from("events")
      .select("id")
      .eq("slug", slug)
      .single();

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    // Get submission with team/attendee info
    const { data: submission, error } = await supabase
      .from("event_submissions")
      .select(`
        *,
        team:team_id(
          id, name, description, logo_url,
          members:event_team_members(
            role,
            attendee:attendee_id(id, name, avatar_url, company)
          )
        ),
        attendee:attendee_id(id, name, avatar_url, company, bio),
        files:event_submission_files(id, file_name, file_url, file_size, file_type, uploaded_at)
      `)
      .eq("id", submissionId)
      .eq("event_id", event.id)
      .single();

    if (error || !submission) {
      return NextResponse.json({ error: "Submission not found" }, { status: 404 });
    }

    return NextResponse.json({ submission });
  } catch (error) {
    console.error("Get submission error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PATCH - Update submission
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string; submissionId: string }> }
) {
  try {
    const { slug, submissionId } = await params;
    const authHeader = request.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "");

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = await verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const supabase = await createClient();

    // Get event
    const { data: event } = await supabase
      .from("events")
      .select("id, requirements")
      .eq("slug", slug)
      .single();

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    // Get submission and verify ownership
    const { data: submission } = await supabase
      .from("event_submissions")
      .select("id, team_id, attendee_id, status")
      .eq("id", submissionId)
      .eq("event_id", event.id)
      .single();

    if (!submission) {
      return NextResponse.json({ error: "Submission not found" }, { status: 404 });
    }

    // Check ownership
    let hasAccess = submission.attendee_id === payload.attendeeId;

    if (!hasAccess && submission.team_id) {
      // Check if user is a team member
      const { data: membership } = await supabase
        .from("event_team_members")
        .select("id")
        .eq("team_id", submission.team_id)
        .eq("attendee_id", payload.attendeeId)
        .eq("status", "active")
        .single();

      hasAccess = !!membership;
    }

    if (!hasAccess) {
      return NextResponse.json({ error: "Not authorized to edit this submission" }, { status: 403 });
    }

    // Check if submission deadline has passed for final submissions
    const requirements = event.requirements as Record<string, unknown> || {};
    const submissionDeadline = requirements.submission_deadline as string;

    const body = await request.json();
    const { action, ...updateData } = body;

    if (action === "submit") {
      // Final submission
      if (submissionDeadline && new Date(submissionDeadline) < new Date()) {
        return NextResponse.json(
          { error: "Submission deadline has passed" },
          { status: 400 }
        );
      }

      // Validate required fields
      if (!updateData.title?.trim()) {
        return NextResponse.json({ error: "Title is required" }, { status: 400 });
      }

      const { data: updated, error: updateError } = await supabase
        .from("event_submissions")
        .update({
          ...updateData,
          status: "submitted",
          submitted_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", submissionId)
        .select()
        .single();

      if (updateError) {
        console.error("Error submitting:", updateError);
        return NextResponse.json({ error: "Failed to submit" }, { status: 500 });
      }

      return NextResponse.json({ submission: updated, message: "Submission successful!" });
    } else {
      // Regular update (draft)
      if (submission.status !== "draft") {
        return NextResponse.json(
          { error: "Cannot edit a submitted project" },
          { status: 400 }
        );
      }

      const { data: updated, error: updateError } = await supabase
        .from("event_submissions")
        .update({
          ...updateData,
          updated_at: new Date().toISOString(),
        })
        .eq("id", submissionId)
        .select()
        .single();

      if (updateError) {
        console.error("Error updating submission:", updateError);
        return NextResponse.json({ error: "Failed to update" }, { status: 500 });
      }

      return NextResponse.json({ submission: updated });
    }
  } catch (error) {
    console.error("Update submission error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE - Delete submission (only drafts)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string; submissionId: string }> }
) {
  try {
    const { slug, submissionId } = await params;
    const authHeader = request.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "");

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = await verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const supabase = await createClient();

    // Get submission
    const { data: submission } = await supabase
      .from("event_submissions")
      .select("id, team_id, attendee_id, status")
      .eq("id", submissionId)
      .single();

    if (!submission) {
      return NextResponse.json({ error: "Submission not found" }, { status: 404 });
    }

    if (submission.status !== "draft") {
      return NextResponse.json(
        { error: "Cannot delete a submitted project" },
        { status: 400 }
      );
    }

    // Check ownership
    let hasAccess = submission.attendee_id === payload.attendeeId;

    if (!hasAccess && submission.team_id) {
      const { data: membership } = await supabase
        .from("event_team_members")
        .select("role")
        .eq("team_id", submission.team_id)
        .eq("attendee_id", payload.attendeeId)
        .eq("status", "active")
        .single();

      hasAccess = membership?.role === "leader";
    }

    if (!hasAccess) {
      return NextResponse.json(
        { error: "Not authorized to delete this submission" },
        { status: 403 }
      );
    }

    await supabase.from("event_submissions").delete().eq("id", submissionId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete submission error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";

interface CallUpdatePayload {
  type: "call_update" | "call_completed";
  callId: string;
  callSid?: string;
  status?: string;
  durationSeconds?: number;
  recordingUrl?: string;
  recordingSid?: string;
  transcript?: Array<{
    role: "user" | "assistant" | "system";
    content: string;
    timestamp: string;
    durationMs?: number;
    confidence?: number;
  }>;
  summary?: string;
  goalAchieved?: boolean;
  errorMessage?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: CallUpdatePayload = await request.json();

    // Use service role client for internal webhook
    const supabase = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Find the call record by call_sid or internal callId
    // The voice server sends callId which is the UUID we created
    let callRecord;

    if (body.callSid) {
      const { data } = await supabase
        .from("voice_agent_calls")
        .select("id, workflow_run_id, step_execution_id, tenant_id")
        .eq("call_sid", body.callSid)
        .single();
      callRecord = data;
    }

    if (!callRecord && body.callId) {
      // Try finding by our internal callId (may be stored in metadata)
      const { data } = await supabase
        .from("voice_agent_calls")
        .select("id, workflow_run_id, step_execution_id, tenant_id")
        .eq("metadata->>voiceServerCallId", body.callId)
        .single();

      if (!data) {
        // Try finding the most recent initiated call (for cases where callId mapping isn't set)
        const { data: recentCall } = await supabase
          .from("voice_agent_calls")
          .select("id, workflow_run_id, step_execution_id, tenant_id")
          .eq("status", "initiated")
          .order("created_at", { ascending: false })
          .limit(1)
          .single();
        callRecord = recentCall;
      } else {
        callRecord = data;
      }
    }

    if (!callRecord) {
      console.warn(`Call record not found for callId: ${body.callId}, callSid: ${body.callSid}`);
      return NextResponse.json({ error: "Call not found" }, { status: 404 });
    }

    // Build update object
    const updateData: Record<string, unknown> = {};

    if (body.status) {
      updateData.status = body.status;
    }

    if (body.durationSeconds !== undefined) {
      updateData.duration_seconds = body.durationSeconds;
    }

    if (body.recordingUrl) {
      updateData.recording_url = body.recordingUrl;
    }

    if (body.recordingSid) {
      updateData.recording_sid = body.recordingSid;
    }

    if (body.transcript && body.transcript.length > 0) {
      updateData.transcript = body.transcript;
    }

    if (body.summary) {
      updateData.summary = body.summary;
    }

    if (body.goalAchieved !== undefined) {
      updateData.goal_achieved = body.goalAchieved;
    }

    if (body.errorMessage) {
      updateData.error_message = body.errorMessage;
    }

    // Update timestamps based on status
    if (body.status === "in_progress" && !updateData.started_at) {
      updateData.started_at = new Date().toISOString();
    }

    if (["completed", "failed", "busy", "no_answer", "cancelled"].includes(body.status || "")) {
      updateData.ended_at = new Date().toISOString();
    }

    // Update the call record
    const { error: updateError } = await supabase
      .from("voice_agent_calls")
      .update(updateData)
      .eq("id", callRecord.id);

    if (updateError) {
      console.error("Error updating call record:", updateError);
      return NextResponse.json({ error: "Failed to update call" }, { status: 500 });
    }

    // If call is completed and linked to a workflow, update the step execution
    if (body.type === "call_completed" && callRecord.step_execution_id) {
      const stepOutput = {
        call_id: callRecord.id,
        call_sid: body.callSid,
        status: body.status,
        transcript: body.transcript
          ? body.transcript.map((t) => `${t.role}: ${t.content}`).join("\n")
          : null,
        summary: body.summary,
        goal_achieved: body.goalAchieved,
        duration_seconds: body.durationSeconds,
        recording_url: body.recordingUrl,
      };

      // Update step execution with output
      await supabase
        .from("workflow_step_executions")
        .update({
          status: body.status === "completed" ? "completed" : "failed",
          output: stepOutput,
          completed_at: new Date().toISOString(),
          ...(body.errorMessage && { error_message: body.errorMessage }),
        })
        .eq("id", callRecord.step_execution_id);

      // If step failed, mark workflow run as failed
      if (body.status !== "completed" && callRecord.workflow_run_id) {
        await supabase
          .from("workflow_runs")
          .update({
            status: "failed",
            completed_at: new Date().toISOString(),
          })
          .eq("id", callRecord.workflow_run_id);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error processing voice agent webhook:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

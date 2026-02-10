import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getUserIdFromRequest } from "@/hooks/useTenantFromHeaders";

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

/**
 * GET /api/voice-agent/calls/[id]
 * Get a single voice agent call with full details
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const userId = getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const supabase = await createClient();

    // Fetch call with RLS enforcement
    const { data: call, error } = await supabase
      .from("voice_agent_calls")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return NextResponse.json({ error: "Call not found" }, { status: 404 });
      }
      return NextResponse.json(
        { error: `Failed to fetch call: ${error.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({ call });
  } catch (error) {
    console.error("Error fetching voice call:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/voice-agent/calls/[id]
 * Update a voice agent call (e.g., add notes, mark reviewed)
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const userId = getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const supabase = await createClient();

    const body = await request.json();

    // Only allow updating certain fields
    const allowedFields = ["metadata", "summary"];
    const updateData: Record<string, unknown> = {};

    for (const field of allowedFields) {
      if (field in body) {
        updateData[field] = body[field];
      }
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: "No valid fields to update" },
        { status: 400 }
      );
    }

    const { data: call, error } = await supabase
      .from("voice_agent_calls")
      .update(updateData)
      .eq("id", id)
      .select("id")
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return NextResponse.json({ error: "Call not found" }, { status: 404 });
      }
      return NextResponse.json(
        { error: `Failed to update call: ${error.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, call });
  } catch (error) {
    console.error("Error updating voice call:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/voice-agent/calls/[id]
 * Delete a voice agent call record
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const userId = getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const supabase = await createClient();

    const { error } = await supabase
      .from("voice_agent_calls")
      .delete()
      .eq("id", id);

    if (error) {
      return NextResponse.json(
        { error: `Failed to delete call: ${error.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting voice call:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

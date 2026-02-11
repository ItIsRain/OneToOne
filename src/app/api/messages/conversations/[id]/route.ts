import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getUserIdFromRequest } from "@/hooks/useTenantFromHeaders";

// GET - Fetch messages for a conversation
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: conversationId } = await params;
    const supabase = await createClient();

    // Get user's tenant_id from profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("tenant_id")
      .eq("id", userId)
      .single();

    if (!profile?.tenant_id) {
      return NextResponse.json({ error: "No tenant found" }, { status: 400 });
    }

    // Verify user is a participant
    const { data: participation } = await supabase
      .from("conversation_participants")
      .select("id")
      .eq("conversation_id", conversationId)
      .eq("user_id", userId)
      .single();

    if (!participation) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Fetch messages with sender info
    const { data: messages, error: msgError } = await supabase
      .from("messages")
      .select(`
        id,
        content,
        type,
        file_name,
        file_url,
        status,
        created_at,
        sender_id,
        sender:sender_id (
          id,
          first_name,
          last_name,
          avatar_url
        )
      `)
      .eq("conversation_id", conversationId)
      .eq("tenant_id", profile.tenant_id)
      .order("created_at", { ascending: true });

    if (msgError) {
      console.error("Fetch messages error:", msgError);
      return NextResponse.json({ error: msgError.message }, { status: 500 });
    }

    // Update last_read_at for current user
    await supabase
      .from("conversation_participants")
      .update({ last_read_at: new Date().toISOString() })
      .eq("conversation_id", conversationId)
      .eq("user_id", userId)
      .eq("tenant_id", profile.tenant_id);

    // Get conversation participants for header display
    const { data: participants } = await supabase
      .from("conversation_participants")
      .select(`
        user_id,
        profiles:user_id (
          id,
          first_name,
          last_name,
          avatar_url,
          status,
          last_active_at
        )
      `)
      .eq("conversation_id", conversationId)
      .eq("tenant_id", profile.tenant_id);

    // Get other participants, or self for self-messaging
    let otherParticipants = participants
      ?.filter((p) => p.user_id !== userId)
      .map((p) => p.profiles) || [];

    // If no other participants (self-messaging), include self
    if (otherParticipants.length === 0) {
      otherParticipants = participants?.map((p) => p.profiles) || [];
    }

    return NextResponse.json({
      messages: messages || [],
      participants: otherParticipants,
      currentUserId: userId,
    });
  } catch (error) {
    console.error("Get messages error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

// POST - Send a message to a conversation
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: conversationId } = await params;
    const supabase = await createClient();

    // Get user's tenant_id from profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("tenant_id")
      .eq("id", userId)
      .single();

    if (!profile?.tenant_id) {
      return NextResponse.json({ error: "No tenant found" }, { status: 400 });
    }

    // Verify user is a participant
    const { data: participation } = await supabase
      .from("conversation_participants")
      .select("id")
      .eq("conversation_id", conversationId)
      .eq("user_id", userId)
      .eq("tenant_id", profile.tenant_id)
      .single();

    if (!participation) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const body = await request.json();
    const { content, type = "text", fileName, fileUrl } = body;

    const validMessageTypes = ["text", "image", "file", "voice", "video"];
    if (!validMessageTypes.includes(type)) {
      return NextResponse.json({ error: `Invalid message type. Must be one of: ${validMessageTypes.join(", ")}` }, { status: 400 });
    }

    if (!content && !fileUrl) {
      return NextResponse.json({ error: "Content or file required" }, { status: 400 });
    }

    // Create message
    const { data: message, error: msgError } = await supabase
      .from("messages")
      .insert({
        conversation_id: conversationId,
        sender_id: userId,
        tenant_id: profile.tenant_id,
        content: content || null,
        type,
        file_name: fileName || null,
        file_url: fileUrl || null,
        status: "sent",
      })
      .select(`
        id,
        content,
        type,
        file_name,
        file_url,
        status,
        created_at,
        sender_id,
        sender:sender_id (
          id,
          first_name,
          last_name,
          avatar_url
        )
      `)
      .single();

    if (msgError) {
      console.error("Send message error:", msgError);
      return NextResponse.json({ error: msgError.message }, { status: 500 });
    }

    // Update last_read_at for sender
    await supabase
      .from("conversation_participants")
      .update({ last_read_at: new Date().toISOString() })
      .eq("conversation_id", conversationId)
      .eq("user_id", userId)
      .eq("tenant_id", profile.tenant_id);

    return NextResponse.json({ message }, { status: 201 });
  } catch (error) {
    console.error("Send message error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

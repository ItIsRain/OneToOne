import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getUserIdFromRequest } from "@/hooks/useTenantFromHeaders";

async function getSupabaseClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Ignore in Server Components
          }
        },
      },
    }
  );
}

// GET - Fetch all conversations for the current user
export async function GET(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = await getSupabaseClient();

    // Check if user has a profile (needed for RLS)
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id, tenant_id")
      .eq("id", userId)
      .single();

    if (profileError || !profile) {
      // User doesn't have a profile yet - return empty conversations
      console.log("User has no profile:", userId, profileError?.message);
      return NextResponse.json({ conversations: [] });
    }

    // Get conversations where user is a participant
    const { data: participations, error: partError } = await supabase
      .from("conversation_participants")
      .select("conversation_id, last_read_at")
      .eq("user_id", userId);

    if (partError) {
      console.error("Fetch participations error:", partError);
      return NextResponse.json({ error: partError.message }, { status: 500 });
    }

    if (!participations || participations.length === 0) {
      return NextResponse.json({ conversations: [] });
    }

    const conversationIds = participations.map((p) => p.conversation_id);
    const lastReadMap = participations.reduce((acc, p) => {
      acc[p.conversation_id] = p.last_read_at;
      return acc;
    }, {} as Record<string, string | null>);

    // Fetch conversations with participants and last message
    const { data: conversations, error: convError } = await supabase
      .from("conversations")
      .select(`
        id,
        created_at,
        last_message_at,
        conversation_participants (
          user_id,
          profiles:user_id (
            id,
            first_name,
            last_name,
            avatar_url,
            status,
            last_active_at
          )
        )
      `)
      .in("id", conversationIds)
      .order("last_message_at", { ascending: false });

    if (convError) {
      console.error("Fetch conversations error:", convError);
      return NextResponse.json({ error: convError.message }, { status: 500 });
    }

    // Batch-fetch last messages for all conversations at once
    const allConvIds = (conversations || []).map((c) => c.id);
    const lastMessageMap = new Map<string, Record<string, unknown>>();
    const unreadCountMap = new Map<string, number>();

    if (allConvIds.length > 0) {
      // Fetch recent messages for all conversations in one query, then pick last per conversation
      // Limit to last 1000 messages across all conversations for performance
      const { data: recentMessages } = await supabase
        .from("messages")
        .select("id, content, type, file_name, created_at, sender_id, conversation_id")
        .in("conversation_id", allConvIds)
        .order("created_at", { ascending: false })
        .limit(1000);

      // Group by conversation_id and pick the first (most recent)
      for (const msg of recentMessages || []) {
        if (!lastMessageMap.has(msg.conversation_id)) {
          lastMessageMap.set(msg.conversation_id, msg);
        }
      }

      // Compute unread counts from the same message set
      for (const msg of recentMessages || []) {
        if (msg.sender_id === userId) continue;
        const lastReadAt = lastReadMap[msg.conversation_id];
        if (lastReadAt && msg.created_at <= lastReadAt) continue;
        unreadCountMap.set(msg.conversation_id, (unreadCountMap.get(msg.conversation_id) || 0) + 1);
      }
    }

    const conversationsWithDetails = (conversations || []).map((conv) => {
      // Get the other participant(s) - exclude current user
      let otherParticipants = conv.conversation_participants
        .filter((p: { user_id: string }) => p.user_id !== userId)
        .map((p: { profiles: unknown }) => p.profiles);

      // If no other participants (self-messaging), include self
      if (otherParticipants.length === 0) {
        otherParticipants = conv.conversation_participants
          .map((p: { profiles: unknown }) => p.profiles);
      }

      return {
        id: conv.id,
        participants: otherParticipants,
        lastMessage: lastMessageMap.get(conv.id) ?? null,
        lastMessageAt: conv.last_message_at,
        unreadCount: unreadCountMap.get(conv.id) ?? 0,
      };
    });

    return NextResponse.json({ conversations: conversationsWithDetails });
  } catch (error) {
    console.error("Get conversations error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

// POST - Create a new conversation or return existing one
export async function POST(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = await getSupabaseClient();

    const body = await request.json();
    const { participantId } = body;

    if (!participantId) {
      return NextResponse.json({ error: "Participant ID required" }, { status: 400 });
    }

    // Get user's tenant_id
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("tenant_id")
      .eq("id", userId)
      .single();

    if (profileError) {
      console.error("Profile fetch error:", profileError);
      return NextResponse.json({ error: "Profile not found. Please complete your profile setup." }, { status: 400 });
    }

    if (!profile?.tenant_id) {
      return NextResponse.json({ error: "No organization found. Please complete your registration." }, { status: 400 });
    }

    // Check if participant is in the same tenant
    const { data: participant } = await supabase
      .from("profiles")
      .select("id, tenant_id, first_name, last_name, avatar_url, status, last_active_at")
      .eq("id", participantId)
      .single();

    if (!participant || participant.tenant_id !== profile.tenant_id) {
      return NextResponse.json({ error: "Invalid participant" }, { status: 400 });
    }

    // Check if a 1:1 conversation already exists between these users
    const { data: existingConversations } = await supabase
      .from("conversation_participants")
      .select("conversation_id")
      .eq("user_id", userId);

    if (existingConversations && existingConversations.length > 0) {
      const conversationIds = existingConversations.map((c) => c.conversation_id);

      // Check if participant is in any of these conversations
      const { data: sharedConversations } = await supabase
        .from("conversation_participants")
        .select("conversation_id")
        .eq("user_id", participantId)
        .in("conversation_id", conversationIds);

      if (sharedConversations && sharedConversations.length > 0) {
        // Check if it's a 1:1 conversation (only 2 participants)
        for (const shared of sharedConversations) {
          const { count } = await supabase
            .from("conversation_participants")
            .select("id", { count: "exact", head: true })
            .eq("conversation_id", shared.conversation_id);

          if (count === 2) {
            // Return existing conversation
            return NextResponse.json({
              conversation: {
                id: shared.conversation_id,
                isNew: false,
              },
              participant,
            });
          }
        }
      }
    }

    // Use the SECURITY DEFINER function to create conversation (bypasses RLS)
    const { data: conversationId, error: convError } = await supabase
      .rpc("find_or_create_direct_conversation", {
        p_tenant_id: profile.tenant_id,
        p_user1_id: userId,
        p_user2_id: participantId,
      });

    if (convError || !conversationId) {
      console.error("Create conversation error:", convError);
      return NextResponse.json({ error: "Failed to create conversation" }, { status: 500 });
    }

    return NextResponse.json({
      conversation: {
        id: conversationId,
        isNew: true,
      },
      participant,
    }, { status: 201 });
  } catch (error) {
    console.error("Create conversation error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

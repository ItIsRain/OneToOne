import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

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
export async function GET() {
  try {
    const supabase = await getSupabaseClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user has a profile (needed for RLS)
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id, tenant_id")
      .eq("id", user.id)
      .single();

    if (profileError || !profile) {
      // User doesn't have a profile yet - return empty conversations
      console.log("User has no profile:", user.id, profileError?.message);
      return NextResponse.json({ conversations: [] });
    }

    // Get conversations where user is a participant
    const { data: participations, error: partError } = await supabase
      .from("conversation_participants")
      .select("conversation_id, last_read_at")
      .eq("user_id", user.id);

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

    // Fetch last message and unread count for each conversation
    const conversationsWithDetails = await Promise.all(
      (conversations || []).map(async (conv) => {
        // Get last message
        const { data: lastMessages } = await supabase
          .from("messages")
          .select("id, content, type, file_name, created_at, sender_id")
          .eq("conversation_id", conv.id)
          .order("created_at", { ascending: false })
          .limit(1);

        const lastMessage = lastMessages?.[0] || null;

        // Get unread count (messages after last_read_at)
        const lastReadAt = lastReadMap[conv.id];
        let unreadCount = 0;

        if (lastReadAt) {
          const { count } = await supabase
            .from("messages")
            .select("id", { count: "exact", head: true })
            .eq("conversation_id", conv.id)
            .neq("sender_id", user.id)
            .gt("created_at", lastReadAt);
          unreadCount = count || 0;
        } else {
          // If never read, count all messages from others
          const { count } = await supabase
            .from("messages")
            .select("id", { count: "exact", head: true })
            .eq("conversation_id", conv.id)
            .neq("sender_id", user.id);
          unreadCount = count || 0;
        }

        // Get the other participant(s) - exclude current user
        // For self-messaging, include the user themselves
        let otherParticipants = conv.conversation_participants
          .filter((p: { user_id: string }) => p.user_id !== user.id)
          .map((p: { profiles: unknown }) => p.profiles);

        // If no other participants (self-messaging), include self
        if (otherParticipants.length === 0) {
          otherParticipants = conv.conversation_participants
            .map((p: { profiles: unknown }) => p.profiles);
        }

        return {
          id: conv.id,
          participants: otherParticipants,
          lastMessage,
          lastMessageAt: conv.last_message_at,
          unreadCount,
        };
      })
    );

    return NextResponse.json({ conversations: conversationsWithDetails });
  } catch (error) {
    console.error("Get conversations error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

// POST - Create a new conversation or return existing one
export async function POST(request: Request) {
  try {
    const supabase = await getSupabaseClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { participantId } = body;

    if (!participantId) {
      return NextResponse.json({ error: "Participant ID required" }, { status: 400 });
    }

    // Get user's tenant_id
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("tenant_id")
      .eq("id", user.id)
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
      .eq("user_id", user.id);

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
        p_user1_id: user.id,
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

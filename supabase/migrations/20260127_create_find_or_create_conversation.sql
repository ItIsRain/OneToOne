-- Create a SECURITY DEFINER function to find or create a direct conversation
-- This bypasses RLS policies for the insert operations
-- Handles both normal conversations and self-messaging
CREATE OR REPLACE FUNCTION find_or_create_direct_conversation(
  p_tenant_id UUID,
  p_user1_id UUID,
  p_user2_id UUID
)
RETURNS UUID AS $$
DECLARE
  v_conversation_id UUID;
  v_existing_conversation_id UUID;
  v_is_self_message BOOLEAN;
BEGIN
  v_is_self_message := (p_user1_id = p_user2_id);

  -- For self-messaging, find a conversation with only this user
  IF v_is_self_message THEN
    SELECT cp.conversation_id INTO v_existing_conversation_id
    FROM conversation_participants cp
    JOIN conversations c ON c.id = cp.conversation_id
    WHERE cp.user_id = p_user1_id
      AND c.tenant_id = p_tenant_id
      AND (
        SELECT COUNT(*)
        FROM conversation_participants
        WHERE conversation_id = cp.conversation_id
      ) = 1;
  ELSE
    -- Find an existing 1:1 conversation between these two users
    SELECT cp1.conversation_id INTO v_existing_conversation_id
    FROM conversation_participants cp1
    JOIN conversation_participants cp2 ON cp1.conversation_id = cp2.conversation_id
    JOIN conversations c ON c.id = cp1.conversation_id
    WHERE cp1.user_id = p_user1_id
      AND cp2.user_id = p_user2_id
      AND c.tenant_id = p_tenant_id
      AND (
        SELECT COUNT(*)
        FROM conversation_participants
        WHERE conversation_id = cp1.conversation_id
      ) = 2;
  END IF;

  -- If found, return it
  IF v_existing_conversation_id IS NOT NULL THEN
    RETURN v_existing_conversation_id;
  END IF;

  -- Create new conversation
  INSERT INTO conversations (tenant_id, created_at, last_message_at)
  VALUES (p_tenant_id, NOW(), NOW())
  RETURNING id INTO v_conversation_id;

  -- Add participants (only one if self-messaging)
  IF v_is_self_message THEN
    INSERT INTO conversation_participants (conversation_id, user_id, joined_at, last_read_at)
    VALUES (v_conversation_id, p_user1_id, NOW(), NOW());
  ELSE
    INSERT INTO conversation_participants (conversation_id, user_id, joined_at, last_read_at)
    VALUES
      (v_conversation_id, p_user1_id, NOW(), NOW()),
      (v_conversation_id, p_user2_id, NOW(), NOW());
  END IF;

  RETURN v_conversation_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

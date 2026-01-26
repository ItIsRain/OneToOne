-- =============================================
-- Fix infinite recursion in messaging RLS policies
-- =============================================

-- Create a SECURITY DEFINER function to get user's conversation IDs
-- This avoids the infinite recursion in RLS policies
CREATE OR REPLACE FUNCTION get_user_conversation_ids()
RETURNS SETOF UUID AS $$
  SELECT conversation_id FROM conversation_participants WHERE user_id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Users can view participants of their conversations" ON conversation_participants;
DROP POLICY IF EXISTS "Users can add participants to conversations they're in" ON conversation_participants;

-- Drop existing conversation policies that may have similar issues
DROP POLICY IF EXISTS "Users can view conversations they participate in" ON conversations;
DROP POLICY IF EXISTS "Users can update conversations they participate in" ON conversations;

-- Drop existing message policies
DROP POLICY IF EXISTS "Users can view messages in their conversations" ON messages;
DROP POLICY IF EXISTS "Users can send messages to their conversations" ON messages;

-- =============================================
-- Recreate policies using the SECURITY DEFINER function
-- =============================================

-- Conversations policies
CREATE POLICY "Users can view conversations they participate in"
  ON conversations FOR SELECT
  USING (id IN (SELECT get_user_conversation_ids()));

CREATE POLICY "Users can update conversations they participate in"
  ON conversations FOR UPDATE
  USING (id IN (SELECT get_user_conversation_ids()));

-- Participants policies (fixed - no more recursion)
CREATE POLICY "Users can view participants of their conversations"
  ON conversation_participants FOR SELECT
  USING (
    conversation_id IN (SELECT get_user_conversation_ids())
    OR user_id = auth.uid()  -- Always allow seeing your own participation
  );

CREATE POLICY "Users can add participants to conversations they're in"
  ON conversation_participants FOR INSERT
  WITH CHECK (
    conversation_id IN (SELECT get_user_conversation_ids())
    OR user_id = auth.uid()  -- Allow being added as first participant
  );

-- Messages policies
CREATE POLICY "Users can view messages in their conversations"
  ON messages FOR SELECT
  USING (conversation_id IN (SELECT get_user_conversation_ids()));

CREATE POLICY "Users can send messages to their conversations"
  ON messages FOR INSERT
  WITH CHECK (
    conversation_id IN (SELECT get_user_conversation_ids())
    AND sender_id = auth.uid()
  );

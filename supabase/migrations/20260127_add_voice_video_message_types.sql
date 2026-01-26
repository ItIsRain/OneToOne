-- Add voice and video message types to the messages table
-- Drop the existing check constraint
ALTER TABLE messages DROP CONSTRAINT messages_type_check;

-- Add new check constraint with voice and video types
ALTER TABLE messages ADD CONSTRAINT messages_type_check
  CHECK (type = ANY (ARRAY['text', 'image', 'file', 'voice', 'video']));

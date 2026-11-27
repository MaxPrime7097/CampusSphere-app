-- Add optional multimodal attachments JSON column to sphera_chat_messages
ALTER TABLE "sphera_chat_messages" ADD COLUMN IF NOT EXISTS "attachments" JSONB;

-- CreateEnum: MessageType
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'MessageType') THEN
        CREATE TYPE "MessageType" AS ENUM ('TEXT', 'IMAGE', 'AUDIO', 'FILE', 'SYSTEM');
    END IF;
END $$;

-- CreateEnum: MessageStatus
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'MessageStatus') THEN
        CREATE TYPE "MessageStatus" AS ENUM ('SENDING', 'SENT', 'DELIVERED', 'READ');
    END IF;
END $$;

-- CreateEnum: ConversationMemberRole
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ConversationMemberRole') THEN
        CREATE TYPE "ConversationMemberRole" AS ENUM ('OWNER', 'ADMIN', 'MEMBER');
    END IF;
END $$;

-- AlterTable: conversation_members
ALTER TABLE "conversation_members" ADD COLUMN IF NOT EXISTS "role" "ConversationMemberRole" NOT NULL DEFAULT 'MEMBER';

-- AlterTable: messages
ALTER TABLE "messages" ADD COLUMN IF NOT EXISTS "type" "MessageType" NOT NULL DEFAULT 'TEXT';
ALTER TABLE "messages" ADD COLUMN IF NOT EXISTS "status" "MessageStatus" NOT NULL DEFAULT 'SENT';
ALTER TABLE "messages" ADD COLUMN IF NOT EXISTS "media_url" TEXT;
ALTER TABLE "messages" ADD COLUMN IF NOT EXISTS "media_type" TEXT;
ALTER TABLE "messages" ADD COLUMN IF NOT EXISTS "file_name" TEXT;
ALTER TABLE "messages" ADD COLUMN IF NOT EXISTS "file_size" INTEGER;
ALTER TABLE "messages" ADD COLUMN IF NOT EXISTS "duration" DOUBLE PRECISION;
ALTER TABLE "messages" ADD COLUMN IF NOT EXISTS "reply_to_id" INTEGER;
ALTER TABLE "messages" ADD COLUMN IF NOT EXISTS "is_deleted" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "messages" ADD COLUMN IF NOT EXISTS "deleted_at" TIMESTAMP(3);

-- CreateIndex on messages(reply_to_id)
CREATE INDEX IF NOT EXISTS "messages_reply_to_id_idx" ON "messages"("reply_to_id");

-- AddForeignKey: messages reply_to_id
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'messages_reply_to_id_fkey') THEN
        ALTER TABLE "messages" ADD CONSTRAINT "messages_reply_to_id_fkey" FOREIGN KEY ("reply_to_id") REFERENCES "messages"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;

-- CreateTable: message_reactions
CREATE TABLE IF NOT EXISTS "message_reactions" (
    "id" SERIAL NOT NULL,
    "message_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "emoji" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "message_reactions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex on message_reactions
CREATE UNIQUE INDEX IF NOT EXISTS "message_reactions_message_id_user_id_key" ON "message_reactions"("message_id", "user_id");
CREATE INDEX IF NOT EXISTS "message_reactions_message_id_idx" ON "message_reactions"("message_id");

-- AddForeignKey: message_reactions
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'message_reactions_message_id_fkey') THEN
        ALTER TABLE "message_reactions" ADD CONSTRAINT "message_reactions_message_id_fkey" FOREIGN KEY ("message_id") REFERENCES "messages"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'message_reactions_user_id_fkey') THEN
        ALTER TABLE "message_reactions" ADD CONSTRAINT "message_reactions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

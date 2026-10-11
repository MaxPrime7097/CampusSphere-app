-- AddColumn: is_edited on messages
-- Tracks whether a message has been manually edited by its author.
-- Defaults to false for all existing messages (they were never edited).
ALTER TABLE "messages" ADD COLUMN IF NOT EXISTS "is_edited" BOOLEAN NOT NULL DEFAULT FALSE;

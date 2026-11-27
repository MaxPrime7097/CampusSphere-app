-- Add adaptive learning memory settings & custom notes to sphera_preferences
ALTER TABLE "sphera_preferences" ADD COLUMN IF NOT EXISTS "memory_enabled" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "sphera_preferences" ADD COLUMN IF NOT EXISTS "learning_notes" JSONB NOT NULL DEFAULT '[]'::jsonb;

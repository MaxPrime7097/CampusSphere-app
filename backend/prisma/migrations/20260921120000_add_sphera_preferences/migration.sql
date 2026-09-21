-- CreateTable: sphera_preferences
CREATE TABLE IF NOT EXISTS "sphera_preferences" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "default_language" TEXT NOT NULL DEFAULT 'auto',
    "detail_level" TEXT NOT NULL DEFAULT 'standard',
    "tone" TEXT NOT NULL DEFAULT 'decontracte',
    "quiz_question_count" INTEGER,
    "quiz_time_limit" INTEGER NOT NULL DEFAULT 15,
    "flashcard_count" INTEGER,
    "theme" TEXT NOT NULL DEFAULT 'sombre',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sphera_preferences_pkey" PRIMARY KEY ("id")
);

-- CreateIndex: unique user_id
CREATE UNIQUE INDEX IF NOT EXISTS "sphera_preferences_user_id_key" ON "sphera_preferences"("user_id");

-- AddForeignKey: relation to users(id) with CASCADE delete
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'sphera_preferences_user_id_fkey'
    ) THEN
        ALTER TABLE "sphera_preferences" ADD CONSTRAINT "sphera_preferences_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- Cross-device StudyProgress persistence (mastered chapters, mindmap nodes, quiz & flashcard scores)

CREATE TABLE IF NOT EXISTS "study_progress" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "session_id" INTEGER NOT NULL,
    "mastered_chapters" JSONB NOT NULL DEFAULT '{}',
    "mastered_mindmap_nodes" JSONB NOT NULL DEFAULT '{}',
    "last_quiz_score" INTEGER,
    "quiz_attempts" INTEGER NOT NULL DEFAULT 0,
    "flashcards_mastered" INTEGER NOT NULL DEFAULT 0,
    "flashcards_total" INTEGER NOT NULL DEFAULT 0,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "study_progress_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "study_progress_user_id_session_id_key" ON "study_progress"("user_id", "session_id");
CREATE INDEX IF NOT EXISTS "study_progress_user_id_idx" ON "study_progress"("user_id");

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'study_progress_user_id_fkey') THEN
        ALTER TABLE "study_progress" ADD CONSTRAINT "study_progress_user_id_fkey"
            FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'study_progress_session_id_fkey') THEN
        ALTER TABLE "study_progress" ADD CONSTRAINT "study_progress_session_id_fkey"
            FOREIGN KEY ("session_id") REFERENCES "study_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

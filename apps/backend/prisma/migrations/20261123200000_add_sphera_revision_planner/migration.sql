-- Sphera Proactive Revision Planner (StudySubject, RevisionPlan, RevisionTask)

CREATE TABLE IF NOT EXISTS "study_subjects" (
    "id" SERIAL NOT NULL,
    "owner_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "exam_date" TEXT,
    "weight" INTEGER NOT NULL DEFAULT 3,
    "color" TEXT NOT NULL DEFAULT '#22c55e',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "study_subjects_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "revision_plans" (
    "id" SERIAL NOT NULL,
    "owner_id" INTEGER NOT NULL,
    "start_date" TEXT NOT NULL,
    "end_date" TEXT NOT NULL,
    "daily_load" INTEGER NOT NULL DEFAULT 2,
    "rest_days" JSONB NOT NULL DEFAULT '[]',
    "status" TEXT NOT NULL DEFAULT 'actif',
    "generated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "revision_plans_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "revision_tasks" (
    "id" SERIAL NOT NULL,
    "plan_id" INTEGER NOT NULL,
    "subject_id" INTEGER NOT NULL,
    "session_id" INTEGER,
    "scheduled_date" TEXT NOT NULL,
    "phase" TEXT NOT NULL DEFAULT 'decouverte',
    "action_type" TEXT NOT NULL DEFAULT 'fiche',
    "chapter_title" TEXT,
    "label" TEXT NOT NULL,
    "estimated_minutes" INTEGER NOT NULL DEFAULT 20,
    "is_done" BOOLEAN NOT NULL DEFAULT false,
    "completed_at" TIMESTAMP(3),
    "position" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "revision_tasks_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "study_sessions" ADD COLUMN IF NOT EXISTS "subject_id" INTEGER;
ALTER TABLE "annale_sessions" ADD COLUMN IF NOT EXISTS "subject_id" INTEGER;

CREATE INDEX IF NOT EXISTS "study_subjects_owner_id_idx" ON "study_subjects"("owner_id");
CREATE INDEX IF NOT EXISTS "revision_plans_owner_id_status_idx" ON "revision_plans"("owner_id", "status");
CREATE INDEX IF NOT EXISTS "revision_tasks_plan_id_scheduled_date_idx" ON "revision_tasks"("plan_id", "scheduled_date");
CREATE INDEX IF NOT EXISTS "revision_tasks_subject_id_idx" ON "revision_tasks"("subject_id");
CREATE INDEX IF NOT EXISTS "revision_tasks_session_id_idx" ON "revision_tasks"("session_id");
CREATE INDEX IF NOT EXISTS "study_sessions_subject_id_idx" ON "study_sessions"("subject_id");
CREATE INDEX IF NOT EXISTS "annale_sessions_subject_id_idx" ON "annale_sessions"("subject_id");

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'study_subjects_owner_id_fkey') THEN
        ALTER TABLE "study_subjects" ADD CONSTRAINT "study_subjects_owner_id_fkey"
            FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'revision_plans_owner_id_fkey') THEN
        ALTER TABLE "revision_plans" ADD CONSTRAINT "revision_plans_owner_id_fkey"
            FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'revision_tasks_plan_id_fkey') THEN
        ALTER TABLE "revision_tasks" ADD CONSTRAINT "revision_tasks_plan_id_fkey"
            FOREIGN KEY ("plan_id") REFERENCES "revision_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'revision_tasks_subject_id_fkey') THEN
        ALTER TABLE "revision_tasks" ADD CONSTRAINT "revision_tasks_subject_id_fkey"
            FOREIGN KEY ("subject_id") REFERENCES "study_subjects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'revision_tasks_session_id_fkey') THEN
        ALTER TABLE "revision_tasks" ADD CONSTRAINT "revision_tasks_session_id_fkey"
            FOREIGN KEY ("session_id") REFERENCES "study_sessions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'study_sessions_subject_id_fkey') THEN
        ALTER TABLE "study_sessions" ADD CONSTRAINT "study_sessions_subject_id_fkey"
            FOREIGN KEY ("subject_id") REFERENCES "study_subjects"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'annale_sessions_subject_id_fkey') THEN
        ALTER TABLE "annale_sessions" ADD CONSTRAINT "annale_sessions_subject_id_fkey"
            FOREIGN KEY ("subject_id") REFERENCES "study_subjects"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;

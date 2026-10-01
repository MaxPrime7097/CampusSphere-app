-- CreateTable
CREATE TABLE IF NOT EXISTS "generation_usages" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "week_start_date" DATE NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "generation_usages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "ai_usage_logs" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER,
    "provider" TEXT NOT NULL,
    "model" TEXT NOT NULL DEFAULT '',
    "tool_type" TEXT NOT NULL,
    "input_tokens_estimate" INTEGER NOT NULL DEFAULT 0,
    "output_tokens_estimate" INTEGER NOT NULL DEFAULT 0,
    "estimated_cost_usd" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_usage_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "generation_usages_user_id_week_start_date_idx" ON "generation_usages"("user_id", "week_start_date");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "generation_usages_user_id_week_start_date_key" ON "generation_usages"("user_id", "week_start_date");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "ai_usage_logs_provider_created_at_idx" ON "ai_usage_logs"("provider", "created_at");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "ai_usage_logs_created_at_idx" ON "ai_usage_logs"("created_at");

-- AddForeignKey
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'generation_usages_user_id_fkey'
    ) THEN
        ALTER TABLE "generation_usages" ADD CONSTRAINT "generation_usages_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- AddForeignKey
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'ai_usage_logs_user_id_fkey'
    ) THEN
        ALTER TABLE "ai_usage_logs" ADD CONSTRAINT "ai_usage_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;

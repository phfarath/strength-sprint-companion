-- CreateTable
CREATE TABLE IF NOT EXISTS "user_memory" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "mode" TEXT NOT NULL,
    "userMessage" TEXT NOT NULL,
    "aiResponse" TEXT NOT NULL,
    "metadata" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_memory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "plan_feedback" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "planType" TEXT NOT NULL,
    "planReference" TEXT,
    "rating" INTEGER,
    "difficultyRating" INTEGER,
    "adherence" INTEGER,
    "notes" TEXT,
    "improvements" TEXT,
    "metadata" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "plan_feedback_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "progress_logs" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "date" DATE NOT NULL,
    "logType" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "metric" TEXT,
    "value" DOUBLE PRECISION,
    "previousValue" DOUBLE PRECISION,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "progress_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "user_memory_userId_mode_createdAt_idx" ON "user_memory"("userId", "mode", "createdAt");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "plan_feedback_userId_planType_createdAt_idx" ON "plan_feedback"("userId", "planType", "createdAt");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "progress_logs_userId_logType_date_idx" ON "progress_logs"("userId", "logType", "date");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "progress_logs_userId_category_date_idx" ON "progress_logs"("userId", "category", "date");

-- AddForeignKey
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.table_constraints
        WHERE constraint_name = 'user_memory_userId_fkey'
    ) THEN
        ALTER TABLE "user_memory" ADD CONSTRAINT "user_memory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- AddForeignKey
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.table_constraints
        WHERE constraint_name = 'plan_feedback_userId_fkey'
    ) THEN
        ALTER TABLE "plan_feedback" ADD CONSTRAINT "plan_feedback_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- AddForeignKey
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.table_constraints
        WHERE constraint_name = 'progress_logs_userId_fkey'
    ) THEN
        ALTER TABLE "progress_logs" ADD CONSTRAINT "progress_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

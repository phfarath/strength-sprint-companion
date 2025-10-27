-- Add new profile fields to users table for AI personalization
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "gender" TEXT;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "fitnessLevel" TEXT;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "goal" TEXT;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "availableDays" INTEGER;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "equipment" TEXT;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "injuries" TEXT;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "workoutPreferences" TEXT;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "dietaryRestrictions" TEXT;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "foodPreferences" TEXT;

-- CreateTable ai_feedback
CREATE TABLE IF NOT EXISTS "ai_feedback" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "planContext" TEXT NOT NULL,
    "planType" TEXT,
    "planContent" TEXT,
    "rating" INTEGER NOT NULL,
    "feedbackText" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_feedback_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "ai_feedback_userId_planContext_idx" ON "ai_feedback"("userId", "planContext");

-- AddForeignKey
ALTER TABLE "ai_feedback" ADD CONSTRAINT "ai_feedback_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

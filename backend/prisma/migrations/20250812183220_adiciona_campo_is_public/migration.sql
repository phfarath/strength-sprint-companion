/*
  Warnings:

  - You are about to drop the column `isPublic` on the `foods` table. All the data in the column will be lost.
  - You are about to drop the column `isPublic` on the `meal_plans` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "foods" DROP COLUMN "isPublic",
ADD COLUMN     "is_public" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "meal_plans" DROP COLUMN "isPublic",
ADD COLUMN     "is_public" BOOLEAN NOT NULL DEFAULT false;

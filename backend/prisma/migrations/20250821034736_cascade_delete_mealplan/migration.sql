/*
  Warnings:

  - You are about to drop the column `quantity` on the `meal_foods` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "meal_foods" DROP CONSTRAINT "meal_foods_mealId_fkey";

-- DropForeignKey
ALTER TABLE "meals" DROP CONSTRAINT "meals_mealPlanId_fkey";

-- AlterTable
ALTER TABLE "meal_foods" DROP COLUMN "quantity";

-- AddForeignKey
ALTER TABLE "meals" ADD CONSTRAINT "meals_mealPlanId_fkey" FOREIGN KEY ("mealPlanId") REFERENCES "meal_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meal_foods" ADD CONSTRAINT "meal_foods_mealId_fkey" FOREIGN KEY ("mealId") REFERENCES "meals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

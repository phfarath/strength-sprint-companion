/*
  Warnings:

  - A unique constraint covering the columns `[name,muscle_group,user_id]` on the table `exercises` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "exercises_name_muscle_group_user_id_key" ON "exercises"("name", "muscle_group", "user_id");

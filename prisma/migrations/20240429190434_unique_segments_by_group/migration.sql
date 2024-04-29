/*
  Warnings:

  - A unique constraint covering the columns `[respondentId,group]` on the table `SessionSegment` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `group` to the `SessionSegment` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "SessionSegment" ADD COLUMN     "group" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "SessionSegment_respondentId_group_key" ON "SessionSegment"("respondentId", "group");

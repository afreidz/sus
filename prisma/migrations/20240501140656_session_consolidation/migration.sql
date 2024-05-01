/*
  Warnings:

  - You are about to drop the column `segmentId` on the `KeyMoment` table. All the data in the column will be lost.
  - You are about to drop the column `segmentId` on the `SessionClip` table. All the data in the column will be lost.
  - You are about to drop the column `segmentId` on the `Summary` table. All the data in the column will be lost.
  - You are about to drop the column `segmentId` on the `TranscriptionSegment` table. All the data in the column will be lost.
  - You are about to drop the `SessionSegment` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[sessionId]` on the table `Summary` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `sessionId` to the `KeyMoment` table without a default value. This is not possible if the table is not empty.
  - Added the required column `sessionId` to the `SessionClip` table without a default value. This is not possible if the table is not empty.
  - Added the required column `sessionId` to the `TranscriptionSegment` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "KeyMoment" DROP CONSTRAINT "KeyMoment_segmentId_fkey";

-- DropForeignKey
ALTER TABLE "Response" DROP CONSTRAINT "Response_sessionId_fkey";

-- DropForeignKey
ALTER TABLE "SessionClip" DROP CONSTRAINT "SessionClip_segmentId_fkey";

-- DropForeignKey
ALTER TABLE "SessionSegment" DROP CONSTRAINT "SessionSegment_respondentId_fkey";

-- DropForeignKey
ALTER TABLE "Summary" DROP CONSTRAINT "Summary_segmentId_fkey";

-- DropForeignKey
ALTER TABLE "TranscriptionSegment" DROP CONSTRAINT "TranscriptionSegment_segmentId_fkey";

-- DropIndex
DROP INDEX "Summary_segmentId_key";

-- AlterTable
ALTER TABLE "KeyMoment" DROP COLUMN "segmentId",
ADD COLUMN     "sessionId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "SessionClip" DROP COLUMN "segmentId",
ADD COLUMN     "sessionId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Summary" DROP COLUMN "segmentId",
ADD COLUMN     "sessionId" TEXT;

-- AlterTable
ALTER TABLE "TranscriptionSegment" DROP COLUMN "segmentId",
ADD COLUMN     "sessionId" TEXT NOT NULL;

-- DropTable
DROP TABLE "SessionSegment";

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT NOT NULL,
    "moderator" TEXT,
    "respondentId" TEXT NOT NULL,
    "videoURL" TEXT,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Summary_sessionId_key" ON "Summary"("sessionId");

-- AddForeignKey
ALTER TABLE "Response" ADD CONSTRAINT "Response_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_respondentId_fkey" FOREIGN KEY ("respondentId") REFERENCES "Respondent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KeyMoment" ADD CONSTRAINT "KeyMoment_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TranscriptionSegment" ADD CONSTRAINT "TranscriptionSegment_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SessionClip" ADD CONSTRAINT "SessionClip_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Summary" ADD CONSTRAINT "Summary_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session"("id") ON DELETE SET NULL ON UPDATE CASCADE;

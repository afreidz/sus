/*
  Warnings:

  - You are about to drop the column `sessionId` on the `Summary` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Summary" DROP CONSTRAINT "Summary_sessionId_fkey";

-- DropIndex
DROP INDEX "Summary_sessionId_key";

-- AlterTable
ALTER TABLE "Summary" DROP COLUMN "sessionId";

-- CreateTable
CREATE TABLE "SummarizedFeedbackItem" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT NOT NULL,
    "revisionId" TEXT,
    "sessionId" TEXT,
    "text" TEXT NOT NULL,

    CONSTRAINT "SummarizedFeedbackItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SummarizedChecklistResult" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "revisionId" TEXT,
    "sessionId" TEXT,

    CONSTRAINT "SummarizedChecklistResult_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SummarizedSuggestion" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "revisionId" TEXT,
    "sessionId" TEXT,

    CONSTRAINT "SummarizedSuggestion_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "SummarizedFeedbackItem" ADD CONSTRAINT "SummarizedFeedbackItem_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SummarizedFeedbackItem" ADD CONSTRAINT "SummarizedFeedbackItem_revisionId_fkey" FOREIGN KEY ("revisionId") REFERENCES "Revision"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SummarizedChecklistResult" ADD CONSTRAINT "SummarizedChecklistResult_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SummarizedChecklistResult" ADD CONSTRAINT "SummarizedChecklistResult_revisionId_fkey" FOREIGN KEY ("revisionId") REFERENCES "Revision"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SummarizedSuggestion" ADD CONSTRAINT "SummarizedSuggestion_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SummarizedSuggestion" ADD CONSTRAINT "SummarizedSuggestion_revisionId_fkey" FOREIGN KEY ("revisionId") REFERENCES "Revision"("id") ON DELETE SET NULL ON UPDATE CASCADE;

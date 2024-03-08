/*
  Warnings:

  - You are about to drop the column `surveyId` on the `Revision` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Revision" DROP CONSTRAINT "Revision_surveyId_fkey";

-- AlterTable
ALTER TABLE "Question" ADD COLUMN     "mediaLocation" TEXT;

-- AlterTable
ALTER TABLE "Revision" DROP COLUMN "surveyId";

-- AlterTable
ALTER TABLE "Survey" ADD COLUMN     "scoreTypeId" TEXT;

-- CreateTable
CREATE TABLE "RevisionSurvey" (
    "surveyId" TEXT NOT NULL,
    "revisionId" TEXT NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "assignedBy" TEXT NOT NULL,

    CONSTRAINT "RevisionSurvey_pkey" PRIMARY KEY ("surveyId","revisionId")
);

-- CreateTable
CREATE TABLE "ScoreType" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT NOT NULL,
    "type" TEXT NOT NULL,

    CONSTRAINT "ScoreType_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "RevisionSurvey" ADD CONSTRAINT "RevisionSurvey_surveyId_fkey" FOREIGN KEY ("surveyId") REFERENCES "Survey"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RevisionSurvey" ADD CONSTRAINT "RevisionSurvey_revisionId_fkey" FOREIGN KEY ("revisionId") REFERENCES "Revision"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Survey" ADD CONSTRAINT "Survey_scoreTypeId_fkey" FOREIGN KEY ("scoreTypeId") REFERENCES "ScoreType"("id") ON DELETE SET NULL ON UPDATE CASCADE;

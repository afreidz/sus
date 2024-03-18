/*
  Warnings:

  - You are about to drop the `RevisionSurveyOrder` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "RevisionSurveyOrder" DROP CONSTRAINT "RevisionSurveyOrder_revisionId_fkey";

-- DropForeignKey
ALTER TABLE "RevisionSurveyOrder" DROP CONSTRAINT "RevisionSurveyOrder_surveyId_fkey";

-- AlterTable
ALTER TABLE "RevisionSurvey" ADD COLUMN     "order" TEXT[];

-- DropTable
DROP TABLE "RevisionSurveyOrder";

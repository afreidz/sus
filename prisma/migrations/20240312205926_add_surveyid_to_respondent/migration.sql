/*
  Warnings:

  - A unique constraint covering the columns `[email,revisionId,surveyId]` on the table `Respondent` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `surveyId` to the `Respondent` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "Respondent_email_revisionId_key";

-- AlterTable
ALTER TABLE "Respondent" ADD COLUMN     "surveyId" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Respondent_email_revisionId_surveyId_key" ON "Respondent"("email", "revisionId", "surveyId");

-- AddForeignKey
ALTER TABLE "Respondent" ADD CONSTRAINT "Respondent_surveyId_fkey" FOREIGN KEY ("surveyId") REFERENCES "Survey"("id") ON DELETE CASCADE ON UPDATE CASCADE;

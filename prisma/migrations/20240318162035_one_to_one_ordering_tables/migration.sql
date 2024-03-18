/*
  Warnings:

  - You are about to drop the column `questionOrderId` on the `Survey` table. All the data in the column will be lost.
  - You are about to drop the column `responseOrderId` on the `Survey` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[surveyId]` on the table `CurratedResponseOrder` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[surveyId]` on the table `SurveyQuestionOrder` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `surveyId` to the `CurratedResponseOrder` table without a default value. This is not possible if the table is not empty.
  - Added the required column `surveyId` to the `SurveyQuestionOrder` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Survey" DROP CONSTRAINT "Survey_questionOrderId_fkey";

-- DropForeignKey
ALTER TABLE "Survey" DROP CONSTRAINT "Survey_responseOrderId_fkey";

-- AlterTable
ALTER TABLE "CurratedResponseOrder" ADD COLUMN     "surveyId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Survey" DROP COLUMN "questionOrderId",
DROP COLUMN "responseOrderId";

-- AlterTable
ALTER TABLE "SurveyQuestionOrder" ADD COLUMN     "surveyId" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "CurratedResponseOrder_surveyId_key" ON "CurratedResponseOrder"("surveyId");

-- CreateIndex
CREATE UNIQUE INDEX "SurveyQuestionOrder_surveyId_key" ON "SurveyQuestionOrder"("surveyId");

-- AddForeignKey
ALTER TABLE "SurveyQuestionOrder" ADD CONSTRAINT "SurveyQuestionOrder_surveyId_fkey" FOREIGN KEY ("surveyId") REFERENCES "Survey"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CurratedResponseOrder" ADD CONSTRAINT "CurratedResponseOrder_surveyId_fkey" FOREIGN KEY ("surveyId") REFERENCES "Survey"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

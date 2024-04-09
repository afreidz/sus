-- DropForeignKey
ALTER TABLE "CurratedResponseOrder" DROP CONSTRAINT "CurratedResponseOrder_surveyId_fkey";

-- DropForeignKey
ALTER TABLE "SurveyQuestionOrder" DROP CONSTRAINT "SurveyQuestionOrder_surveyId_fkey";

-- AddForeignKey
ALTER TABLE "SurveyQuestionOrder" ADD CONSTRAINT "SurveyQuestionOrder_surveyId_fkey" FOREIGN KEY ("surveyId") REFERENCES "Survey"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CurratedResponseOrder" ADD CONSTRAINT "CurratedResponseOrder_surveyId_fkey" FOREIGN KEY ("surveyId") REFERENCES "Survey"("id") ON DELETE CASCADE ON UPDATE CASCADE;

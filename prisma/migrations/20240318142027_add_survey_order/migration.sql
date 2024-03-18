-- CreateTable
CREATE TABLE "RevisionSurveyOrder" (
    "surveyId" TEXT NOT NULL,
    "revisionId" TEXT NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "assignedBy" TEXT NOT NULL,
    "order" TEXT[]
);

-- CreateIndex
CREATE UNIQUE INDEX "RevisionSurveyOrder_surveyId_revisionId_key" ON "RevisionSurveyOrder"("surveyId", "revisionId");

-- AddForeignKey
ALTER TABLE "RevisionSurveyOrder" ADD CONSTRAINT "RevisionSurveyOrder_surveyId_fkey" FOREIGN KEY ("surveyId") REFERENCES "Survey"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RevisionSurveyOrder" ADD CONSTRAINT "RevisionSurveyOrder_revisionId_fkey" FOREIGN KEY ("revisionId") REFERENCES "Revision"("id") ON DELETE CASCADE ON UPDATE CASCADE;

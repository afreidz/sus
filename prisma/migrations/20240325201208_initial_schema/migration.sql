-- CreateTable
CREATE TABLE "Client" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT NOT NULL,
    "name" VARCHAR(255) NOT NULL,

    CONSTRAINT "Client_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "System" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "clientId" TEXT NOT NULL,

    CONSTRAINT "System_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Revision" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "systemId" TEXT NOT NULL,

    CONSTRAINT "Revision_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Survey" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT NOT NULL,
    "label" VARCHAR(255) NOT NULL,
    "scoreTypeId" TEXT,

    CONSTRAINT "Survey_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Question" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "mediaLocation" TEXT,
    "positive" BOOLEAN NOT NULL DEFAULT true,
    "media" BYTEA,
    "mediaMIME" TEXT,

    CONSTRAINT "Question_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SurveyQuestionOrder" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT NOT NULL,
    "order" TEXT[],
    "surveyId" TEXT NOT NULL,

    CONSTRAINT "SurveyQuestionOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CurratedResponseOrder" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,
    "order" TEXT[],
    "surveyId" TEXT NOT NULL,

    CONSTRAINT "CurratedResponseOrder_pkey" PRIMARY KEY ("id")
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

-- CreateTable
CREATE TABLE "CurratedResponse" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "numericalValue" INTEGER,
    "scoreTypeId" TEXT,

    CONSTRAINT "CurratedResponse_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Respondent" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "complete" BOOLEAN NOT NULL DEFAULT false,
    "surveyId" TEXT NOT NULL,
    "revisionId" TEXT NOT NULL,

    CONSTRAINT "Respondent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Response" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT NOT NULL,
    "freeformResponse" TEXT,
    "curratedResponseId" TEXT,
    "respondentId" TEXT NOT NULL,
    "revisionId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,

    CONSTRAINT "Response_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CurratedResponsesOnQuestions" (
    "questionId" TEXT NOT NULL,
    "curratedResponseId" TEXT NOT NULL,

    CONSTRAINT "CurratedResponsesOnQuestions_pkey" PRIMARY KEY ("questionId","curratedResponseId")
);

-- CreateTable
CREATE TABLE "_RevisionToSurvey" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "_QuestionToSurvey" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "_CurratedResponseToQuestion" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "Client_name_key" ON "Client"("name");

-- CreateIndex
CREATE UNIQUE INDEX "System_clientId_title_key" ON "System"("clientId", "title");

-- CreateIndex
CREATE UNIQUE INDEX "Revision_systemId_title_key" ON "Revision"("systemId", "title");

-- CreateIndex
CREATE UNIQUE INDEX "Survey_label_key" ON "Survey"("label");

-- CreateIndex
CREATE UNIQUE INDEX "SurveyQuestionOrder_surveyId_key" ON "SurveyQuestionOrder"("surveyId");

-- CreateIndex
CREATE UNIQUE INDEX "CurratedResponseOrder_surveyId_key" ON "CurratedResponseOrder"("surveyId");

-- CreateIndex
CREATE UNIQUE INDEX "Respondent_email_revisionId_surveyId_key" ON "Respondent"("email", "revisionId", "surveyId");

-- CreateIndex
CREATE UNIQUE INDEX "Response_respondentId_revisionId_questionId_key" ON "Response"("respondentId", "revisionId", "questionId");

-- CreateIndex
CREATE UNIQUE INDEX "_RevisionToSurvey_AB_unique" ON "_RevisionToSurvey"("A", "B");

-- CreateIndex
CREATE INDEX "_RevisionToSurvey_B_index" ON "_RevisionToSurvey"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_QuestionToSurvey_AB_unique" ON "_QuestionToSurvey"("A", "B");

-- CreateIndex
CREATE INDEX "_QuestionToSurvey_B_index" ON "_QuestionToSurvey"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_CurratedResponseToQuestion_AB_unique" ON "_CurratedResponseToQuestion"("A", "B");

-- CreateIndex
CREATE INDEX "_CurratedResponseToQuestion_B_index" ON "_CurratedResponseToQuestion"("B");

-- AddForeignKey
ALTER TABLE "System" ADD CONSTRAINT "System_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Revision" ADD CONSTRAINT "Revision_systemId_fkey" FOREIGN KEY ("systemId") REFERENCES "System"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Survey" ADD CONSTRAINT "Survey_scoreTypeId_fkey" FOREIGN KEY ("scoreTypeId") REFERENCES "ScoreType"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SurveyQuestionOrder" ADD CONSTRAINT "SurveyQuestionOrder_surveyId_fkey" FOREIGN KEY ("surveyId") REFERENCES "Survey"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CurratedResponseOrder" ADD CONSTRAINT "CurratedResponseOrder_surveyId_fkey" FOREIGN KEY ("surveyId") REFERENCES "Survey"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CurratedResponse" ADD CONSTRAINT "CurratedResponse_scoreTypeId_fkey" FOREIGN KEY ("scoreTypeId") REFERENCES "ScoreType"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Respondent" ADD CONSTRAINT "Respondent_surveyId_fkey" FOREIGN KEY ("surveyId") REFERENCES "Survey"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Respondent" ADD CONSTRAINT "Respondent_revisionId_fkey" FOREIGN KEY ("revisionId") REFERENCES "Revision"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Response" ADD CONSTRAINT "Response_curratedResponseId_fkey" FOREIGN KEY ("curratedResponseId") REFERENCES "CurratedResponse"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Response" ADD CONSTRAINT "Response_respondentId_fkey" FOREIGN KEY ("respondentId") REFERENCES "Respondent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Response" ADD CONSTRAINT "Response_revisionId_fkey" FOREIGN KEY ("revisionId") REFERENCES "Revision"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Response" ADD CONSTRAINT "Response_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CurratedResponsesOnQuestions" ADD CONSTRAINT "CurratedResponsesOnQuestions_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CurratedResponsesOnQuestions" ADD CONSTRAINT "CurratedResponsesOnQuestions_curratedResponseId_fkey" FOREIGN KEY ("curratedResponseId") REFERENCES "CurratedResponse"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_RevisionToSurvey" ADD CONSTRAINT "_RevisionToSurvey_A_fkey" FOREIGN KEY ("A") REFERENCES "Revision"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_RevisionToSurvey" ADD CONSTRAINT "_RevisionToSurvey_B_fkey" FOREIGN KEY ("B") REFERENCES "Survey"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_QuestionToSurvey" ADD CONSTRAINT "_QuestionToSurvey_A_fkey" FOREIGN KEY ("A") REFERENCES "Question"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_QuestionToSurvey" ADD CONSTRAINT "_QuestionToSurvey_B_fkey" FOREIGN KEY ("B") REFERENCES "Survey"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CurratedResponseToQuestion" ADD CONSTRAINT "_CurratedResponseToQuestion_A_fkey" FOREIGN KEY ("A") REFERENCES "CurratedResponse"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CurratedResponseToQuestion" ADD CONSTRAINT "_CurratedResponseToQuestion_B_fkey" FOREIGN KEY ("B") REFERENCES "Question"("id") ON DELETE CASCADE ON UPDATE CASCADE;

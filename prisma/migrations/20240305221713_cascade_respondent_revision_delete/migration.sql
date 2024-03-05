-- DropForeignKey
ALTER TABLE "RespondentResponse" DROP CONSTRAINT "RespondentResponse_respondentId_fkey";

-- DropForeignKey
ALTER TABLE "RespondentResponse" DROP CONSTRAINT "RespondentResponse_revisionId_fkey";

-- AddForeignKey
ALTER TABLE "RespondentResponse" ADD CONSTRAINT "RespondentResponse_respondentId_fkey" FOREIGN KEY ("respondentId") REFERENCES "Respondent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RespondentResponse" ADD CONSTRAINT "RespondentResponse_revisionId_fkey" FOREIGN KEY ("revisionId") REFERENCES "Revision"("id") ON DELETE CASCADE ON UPDATE CASCADE;

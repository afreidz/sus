-- DropForeignKey
ALTER TABLE "RespondentResponse" DROP CONSTRAINT "RespondentResponse_revisionId_fkey";

-- AddForeignKey
ALTER TABLE "RespondentResponse" ADD CONSTRAINT "RespondentResponse_revisionId_fkey" FOREIGN KEY ("revisionId") REFERENCES "Revision"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

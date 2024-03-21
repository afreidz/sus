/*
  Warnings:

  - You are about to drop the column `susValue` on the `CurratedResponse` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "CurratedResponse" DROP COLUMN "susValue",
ADD COLUMN     "numericalValue" INTEGER,
ADD COLUMN     "scoreTypeId" TEXT;

-- AddForeignKey
ALTER TABLE "CurratedResponse" ADD CONSTRAINT "CurratedResponse_scoreTypeId_fkey" FOREIGN KEY ("scoreTypeId") REFERENCES "ScoreType"("id") ON DELETE CASCADE ON UPDATE CASCADE;

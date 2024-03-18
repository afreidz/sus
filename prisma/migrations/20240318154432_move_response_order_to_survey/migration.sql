/*
  Warnings:

  - You are about to drop the column `responseOrderId` on the `Question` table. All the data in the column will be lost.
  - You are about to drop the column `orderId` on the `Survey` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Question" DROP CONSTRAINT "Question_responseOrderId_fkey";

-- DropForeignKey
ALTER TABLE "Survey" DROP CONSTRAINT "Survey_orderId_fkey";

-- AlterTable
ALTER TABLE "Question" DROP COLUMN "responseOrderId";

-- AlterTable
ALTER TABLE "Survey" DROP COLUMN "orderId",
ADD COLUMN     "questionOrderId" TEXT,
ADD COLUMN     "responseOrderId" TEXT;

-- AddForeignKey
ALTER TABLE "Survey" ADD CONSTRAINT "Survey_questionOrderId_fkey" FOREIGN KEY ("questionOrderId") REFERENCES "SurveyQuestionOrder"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Survey" ADD CONSTRAINT "Survey_responseOrderId_fkey" FOREIGN KEY ("responseOrderId") REFERENCES "CurratedResponseOrder"("id") ON DELETE SET NULL ON UPDATE CASCADE;

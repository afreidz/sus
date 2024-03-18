/*
  Warnings:

  - You are about to drop the column `questionOrder` on the `Survey` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Survey" DROP COLUMN "questionOrder",
ADD COLUMN     "orderId" TEXT;

-- CreateTable
CREATE TABLE "SurveyQuestionOrder" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT NOT NULL,
    "order" TEXT[],

    CONSTRAINT "SurveyQuestionOrder_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Survey" ADD CONSTRAINT "Survey_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "SurveyQuestionOrder"("id") ON DELETE SET NULL ON UPDATE CASCADE;

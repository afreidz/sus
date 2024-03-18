/*
  Warnings:

  - You are about to drop the column `order` on the `RevisionSurvey` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "RevisionSurvey" DROP COLUMN "order";

-- AlterTable
ALTER TABLE "Survey" ADD COLUMN     "questionOrder" TEXT[];

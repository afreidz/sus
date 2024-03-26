/*
  Warnings:

  - You are about to drop the `CurratedResponsesOnQuestions` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "CurratedResponsesOnQuestions" DROP CONSTRAINT "CurratedResponsesOnQuestions_curratedResponseId_fkey";

-- DropForeignKey
ALTER TABLE "CurratedResponsesOnQuestions" DROP CONSTRAINT "CurratedResponsesOnQuestions_questionId_fkey";

-- DropTable
DROP TABLE "CurratedResponsesOnQuestions";

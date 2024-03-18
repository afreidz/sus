-- AlterTable
ALTER TABLE "CurratedResponse" ADD COLUMN     "susValue" INTEGER;

-- AlterTable
ALTER TABLE "Question" ADD COLUMN     "positive" BOOLEAN NOT NULL DEFAULT true;

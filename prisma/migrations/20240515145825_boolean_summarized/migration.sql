-- AlterTable
ALTER TABLE "Revision" ADD COLUMN     "summarized" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Session" ADD COLUMN     "summarized" BOOLEAN NOT NULL DEFAULT false;

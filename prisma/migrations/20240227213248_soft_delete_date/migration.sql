/*
  Warnings:

  - The `deleted` column on the `Client` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `deleted` column on the `Question` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `deleted` column on the `Respondent` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `deleted` column on the `Response` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `deleted` column on the `Revision` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `deleted` column on the `Survey` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `deleted` column on the `System` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "Client" DROP COLUMN "deleted",
ADD COLUMN     "deleted" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Question" DROP COLUMN "deleted",
ADD COLUMN     "deleted" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Respondent" DROP COLUMN "deleted",
ADD COLUMN     "deleted" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Response" DROP COLUMN "deleted",
ADD COLUMN     "deleted" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Revision" DROP COLUMN "deleted",
ADD COLUMN     "deleted" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Survey" DROP COLUMN "deleted",
ADD COLUMN     "deleted" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "System" DROP COLUMN "deleted",
ADD COLUMN     "deleted" TIMESTAMP(3);

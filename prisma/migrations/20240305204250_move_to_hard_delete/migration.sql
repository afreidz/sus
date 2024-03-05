/*
  Warnings:

  - You are about to drop the column `deleted` on the `Client` table. All the data in the column will be lost.
  - You are about to drop the column `deleted` on the `CurratedResponse` table. All the data in the column will be lost.
  - You are about to drop the column `deleted` on the `Question` table. All the data in the column will be lost.
  - You are about to drop the column `deleted` on the `Respondent` table. All the data in the column will be lost.
  - You are about to drop the column `deleted` on the `RespondentResponse` table. All the data in the column will be lost.
  - You are about to drop the column `deleted` on the `Revision` table. All the data in the column will be lost.
  - You are about to drop the column `deleted` on the `Survey` table. All the data in the column will be lost.
  - You are about to drop the column `deleted` on the `System` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[name]` on the table `Client` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "Client_name_deleted_key";

-- AlterTable
ALTER TABLE "Client" DROP COLUMN "deleted";

-- AlterTable
ALTER TABLE "CurratedResponse" DROP COLUMN "deleted";

-- AlterTable
ALTER TABLE "Question" DROP COLUMN "deleted";

-- AlterTable
ALTER TABLE "Respondent" DROP COLUMN "deleted";

-- AlterTable
ALTER TABLE "RespondentResponse" DROP COLUMN "deleted";

-- AlterTable
ALTER TABLE "Revision" DROP COLUMN "deleted";

-- AlterTable
ALTER TABLE "Survey" DROP COLUMN "deleted";

-- AlterTable
ALTER TABLE "System" DROP COLUMN "deleted";

-- CreateIndex
CREATE UNIQUE INDEX "Client_name_key" ON "Client"("name");

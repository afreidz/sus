/*
  Warnings:

  - You are about to drop the column `media` on the `Question` table. All the data in the column will be lost.
  - You are about to drop the column `mediaMIME` on the `Question` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Question" DROP COLUMN "media",
DROP COLUMN "mediaMIME",
ADD COLUMN     "imageURL" TEXT;

/*
  Warnings:

  - Added the required column `text` to the `Summary` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Summary" ADD COLUMN     "text" TEXT NOT NULL;

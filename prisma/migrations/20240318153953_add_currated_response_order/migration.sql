-- AlterTable
ALTER TABLE "Question" ADD COLUMN     "responseOrderId" TEXT;

-- CreateTable
CREATE TABLE "CurratedResponseOrder" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT NOT NULL,
    "order" TEXT[],

    CONSTRAINT "CurratedResponseOrder_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Question" ADD CONSTRAINT "Question_responseOrderId_fkey" FOREIGN KEY ("responseOrderId") REFERENCES "CurratedResponseOrder"("id") ON DELETE SET NULL ON UPDATE CASCADE;

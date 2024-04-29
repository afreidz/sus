-- AlterTable
ALTER TABLE "Respondent" ADD COLUMN     "name" TEXT,
ADD COLUMN     "profile" TEXT,
ADD COLUMN     "title" TEXT;

-- AlterTable
ALTER TABLE "Response" ADD COLUMN     "sessionId" TEXT;

-- CreateTable
CREATE TABLE "SessionSegment" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT NOT NULL,
    "moderator" TEXT NOT NULL,
    "respondentId" TEXT NOT NULL,
    "videoURL" TEXT,

    CONSTRAINT "SessionSegment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KeyMoment" (
    "id" TEXT NOT NULL,
    "time" TIMESTAMP(3) NOT NULL,
    "text" TEXT NOT NULL,
    "createdBy" TEXT NOT NULL,
    "segmentId" TEXT NOT NULL,

    CONSTRAINT "KeyMoment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TranscriptionSegment" (
    "id" TEXT NOT NULL,
    "time" TIMESTAMP(3) NOT NULL,
    "speaker" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "segmentId" TEXT NOT NULL,

    CONSTRAINT "TranscriptionSegment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SessionClip" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3) NOT NULL,
    "segmentId" TEXT NOT NULL,
    "videoURL" TEXT,

    CONSTRAINT "SessionClip_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Summary" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT NOT NULL,
    "revisionId" TEXT,
    "segmentId" TEXT,

    CONSTRAINT "Summary_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Summary_revisionId_key" ON "Summary"("revisionId");

-- CreateIndex
CREATE UNIQUE INDEX "Summary_segmentId_key" ON "Summary"("segmentId");

-- AddForeignKey
ALTER TABLE "Response" ADD CONSTRAINT "Response_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "SessionSegment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SessionSegment" ADD CONSTRAINT "SessionSegment_respondentId_fkey" FOREIGN KEY ("respondentId") REFERENCES "Respondent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KeyMoment" ADD CONSTRAINT "KeyMoment_segmentId_fkey" FOREIGN KEY ("segmentId") REFERENCES "SessionSegment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TranscriptionSegment" ADD CONSTRAINT "TranscriptionSegment_segmentId_fkey" FOREIGN KEY ("segmentId") REFERENCES "SessionSegment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SessionClip" ADD CONSTRAINT "SessionClip_segmentId_fkey" FOREIGN KEY ("segmentId") REFERENCES "SessionSegment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Summary" ADD CONSTRAINT "Summary_segmentId_fkey" FOREIGN KEY ("segmentId") REFERENCES "SessionSegment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Summary" ADD CONSTRAINT "Summary_revisionId_fkey" FOREIGN KEY ("revisionId") REFERENCES "Revision"("id") ON DELETE SET NULL ON UPDATE CASCADE;

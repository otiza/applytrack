-- CreateTable
CREATE TABLE "CvDocument" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "filePath" TEXT NOT NULL,
    "originalFileName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CvDocument_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "Application" ADD COLUMN "cvDocumentId" TEXT;

-- CreateIndex
CREATE INDEX "CvDocument_userId_idx" ON "CvDocument"("userId");

-- CreateIndex
CREATE INDEX "Application_cvDocumentId_idx" ON "Application"("cvDocumentId");

-- AddForeignKey
ALTER TABLE "CvDocument" ADD CONSTRAINT "CvDocument_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Application" ADD CONSTRAINT "Application_cvDocumentId_fkey" FOREIGN KEY ("cvDocumentId") REFERENCES "CvDocument"("id") ON DELETE SET NULL ON UPDATE CASCADE;

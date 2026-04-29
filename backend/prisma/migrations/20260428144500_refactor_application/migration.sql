-- DropForeignKey
ALTER TABLE "Note" DROP CONSTRAINT "Note_applicationId_fkey";

-- AlterTable
ALTER TABLE "Application" DROP COLUMN IF EXISTS "appliedAt" CASCADE,
DROP COLUMN IF EXISTS "role" CASCADE,
DROP COLUMN IF EXISTS "title" CASCADE,
ADD COLUMN "jobTitle" TEXT NOT NULL DEFAULT 'Untitled Position',
ADD COLUMN "salaryRange" TEXT,
ADD COLUMN "contractType" TEXT,
ADD COLUMN "applicationDate" TIMESTAMP(3),
ADD COLUMN "interviewDate" TIMESTAMP(3),
ADD COLUMN "notes" TEXT,
ADD COLUMN "recruiterName" TEXT,
ADD COLUMN "recruiterEmail" TEXT,
ADD COLUMN "jobPostUrl" TEXT;

-- AlterTable
ALTER TABLE "Company" ADD COLUMN "industry" TEXT;

-- AddForeignKey
ALTER TABLE "Note" ADD CONSTRAINT "Note_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE CASCADE ON UPDATE CASCADE;


-- Job radar: choose job search, alert emails, or both.
-- AlterTable
ALTER TABLE "JobSearchProfile" ADD COLUMN     "sourceMode" TEXT NOT NULL DEFAULT 'both';

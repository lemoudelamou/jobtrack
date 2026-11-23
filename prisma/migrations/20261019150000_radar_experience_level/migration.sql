-- Job radar: the experience level to search for.
-- AlterTable
ALTER TABLE "JobSearchProfile" ADD COLUMN     "experienceLevel" TEXT NOT NULL DEFAULT 'any';

-- Job radar: a search radius on the profile, and a salary on each lead.
-- AlterTable
ALTER TABLE "JobSearchProfile" ADD COLUMN     "radiusKm" INTEGER NOT NULL DEFAULT 25;

-- AlterTable
ALTER TABLE "JobLead" ADD COLUMN     "salary" TEXT;

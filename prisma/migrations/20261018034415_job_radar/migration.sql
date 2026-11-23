-- CreateEnum
CREATE TYPE "JobLeadStatus" AS ENUM ('New', 'Saved', 'Dismissed');

-- CreateTable
CREATE TABLE "JobSearchProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "keywords" TEXT NOT NULL,
    "location" TEXT NOT NULL DEFAULT '',
    "radiusKm" INTEGER NOT NULL DEFAULT 25,
    "remoteOnly" BOOLEAN NOT NULL DEFAULT false,
    "lastRunAt" TIMESTAMP(3),
    "lastRunError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "JobSearchProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JobLead" (
    "id" SERIAL NOT NULL,
    "userId" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "externalId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "company" TEXT,
    "location" TEXT,
    "url" TEXT NOT NULL,
    "publishedAt" TIMESTAMP(3),
    "description" TEXT,
    "embedding" vector(1536),
    "score" DOUBLE PRECISION,
    "summary" TEXT,
    "strengths" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "gaps" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "explainedAt" TIMESTAMP(3),
    "status" "JobLeadStatus" NOT NULL DEFAULT 'New',
    "jobId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "JobLead_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "JobSearchProfile_userId_key" ON "JobSearchProfile"("userId");

-- CreateIndex
CREATE INDEX "JobLead_userId_status_score_idx" ON "JobLead"("userId", "status", "score");

-- CreateIndex
CREATE UNIQUE INDEX "JobLead_userId_source_externalId_key" ON "JobLead"("userId", "source", "externalId");

-- AddForeignKey
ALTER TABLE "JobSearchProfile" ADD CONSTRAINT "JobSearchProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobLead" ADD CONSTRAINT "JobLead_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Save AI insights per application so they aren't regenerated on every visit.
-- CreateTable
CREATE TABLE "JobInsight" (
    "id" SERIAL NOT NULL,
    "jobId" INTEGER NOT NULL,
    "content" TEXT NOT NULL,
    "jobHash" TEXT NOT NULL,
    "resumeAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "JobInsight_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "JobInsight_jobId_key" ON "JobInsight"("jobId");

-- AddForeignKey
ALTER TABLE "JobInsight" ADD CONSTRAINT "JobInsight_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE CASCADE ON UPDATE CASCADE;

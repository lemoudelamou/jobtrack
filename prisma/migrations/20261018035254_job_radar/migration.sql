/*
  Warnings:

  - You are about to drop the column `radiusKm` on the `JobSearchProfile` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "JobSearchProfile" DROP COLUMN "radiusKm",
ADD COLUMN     "visaOnly" BOOLEAN NOT NULL DEFAULT false;

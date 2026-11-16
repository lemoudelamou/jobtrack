import { createHash } from "node:crypto";

import { prisma } from "@/lib/prisma";

/*
 * Saved AI insights, one row per application (table "JobInsight").
 *
 * Written with raw SQL so it works the moment the migration has run, even
 * before the Prisma client is regenerated.
 */

type JobFields = {
    company: string;
    position: string;
    location: string;
    jobUrl: string | null;
    salary: string | null;
    notes: string | null;
};

export type SavedInsight = {
    content: string;
    generatedAt: string;
    /** What changed since they were generated, if anything. */
    outdated: { job: boolean; cv: boolean };
};

/** Fingerprint of the job details the insights were based on. */
export function jobFingerprint(job: JobFields) {
    return createHash("sha256")
        .update(
            JSON.stringify([
                job.company.trim(),
                job.position.trim(),
                job.location.trim(),
                job.jobUrl?.trim() ?? "",
                job.salary?.trim() ?? "",
                job.notes?.trim() ?? "",
            ]),
        )
        .digest("hex");
}

export async function getSavedInsight(
    job: JobFields & { id: number },
    resumeUpdatedAt: Date | null,
): Promise<SavedInsight | null> {
    const rows = await prisma.$queryRaw<Array<{ content: string; jobHash: string; resumeAt: Date; updatedAt: Date }>>`
        SELECT content, "jobHash", "resumeAt", "updatedAt" FROM "JobInsight" WHERE "jobId" = ${job.id} LIMIT 1
    `;
    const row = rows[0];
    if (!row) return null;

    return {
        content: row.content,
        generatedAt: row.updatedAt.toISOString(),
        outdated: {
            job: row.jobHash !== jobFingerprint(job),
            cv: Boolean(resumeUpdatedAt && resumeUpdatedAt.getTime() > row.resumeAt.getTime()),
        },
    };
}

export async function saveInsight(job: JobFields & { id: number }, content: string, resumeUpdatedAt: Date) {
    const jobHash = jobFingerprint(job);
    const rows = await prisma.$queryRaw<Array<{ updatedAt: Date }>>`
        INSERT INTO "JobInsight" ("jobId", content, "jobHash", "resumeAt", "updatedAt")
        VALUES (${job.id}, ${content}, ${jobHash}, ${resumeUpdatedAt}, now())
        ON CONFLICT ("jobId") DO UPDATE
            SET content = EXCLUDED.content,
                "jobHash" = EXCLUDED."jobHash",
                "resumeAt" = EXCLUDED."resumeAt",
                "updatedAt" = now()
        RETURNING "updatedAt"
    `;
    return rows[0]?.updatedAt ?? new Date();
}

import { randomUUID } from "node:crypto";
import { GoogleGenAI } from "@google/genai";

import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { createEmbedding } from "@/lib/ai/insights/embeddings";
import { JobSourceError, fetchFeed, filterJobs, type FeedJob } from "./arbeitnow";
import { jsearchConfigured, searchJSearch } from "./jsearch";
import { fetchAlertJobs } from "@/lib/gmail/alerts";
import { parseSourceMode, usesAlerts, usesSearch, type SourceMode } from "./sources";
import { parseTitles } from "./titles";
import { isInGermany, matchesLevel, parseLevel, type ExperienceLevel } from "./filters";

/*
 * Job radar pipeline
 *
 *   JSearch (Google for Jobs) + Arbeitnow feed -> filter / merge duplicates -> drop
 *   already-seen postings -> embed -> store -> score every open lead against the CV (pgvector,
 *   no AI cost) -> short AI explanation for the best few only.
 *
 * The radar tables are written with raw SQL because the vector column is
 * outside Prisma's type system anyway.
 */


const MAX_NEW_PER_RUN = 60;
const EXPLAIN_PER_RUN = 5;
const DESCRIPTION_CHARS = 3_000;
const CONCURRENCY = 4;
const STALE_AFTER_DAYS = 45;

/*
 * Match score (0-100), from how close each posting is to the CV's 3 closest
 * chunks (cosine similarity of their embeddings). Raw similarity sits in a
 * narrow band that shifts with the CV and the kind of posting, so the score
 * blends two scales:
 *   - relative (60%): where the posting falls among this user's own
 *     postings, so the best of them land near the top;
 *   - absolute (40%): a fixed band, so a list of weak matches still looks weak.
 * Alert-email jobs (title + company only) and full job ads are scaled
 * separately: short texts are always less similar, which said nothing about
 * fit. Postings whose title contains one of the user's titles get a small lift.
 * It's a ranking signal, not a probability of getting the job.
 */
const ABSOLUTE_FLOOR = 0.5;
const ABSOLUTE_CEIL = 0.78;
const RELATIVE_WEIGHT = 0.6;
const TITLE_BONUS = 0.02;
/** Below this many postings in a group, the relative scale isn't meaningful. */
const MIN_FOR_RELATIVE = 8;

export class RadarError extends Error {
    constructor(
        message: string,
        readonly status = 422,
    ) {
        super(message);
    }
}

/* -------------------------------------------------------------------------- */
/* Types + reads                                                              */
/* -------------------------------------------------------------------------- */

export type SearchProfile = {
    id: string;
    userId: string;
    keywords: string;
    location: string;
    radiusKm: number;
    remoteOnly: boolean;
    visaOnly: boolean;
    experienceLevel: ExperienceLevel;
    sourceMode: SourceMode;
    lastRunAt: Date | null;
    lastRunError: string | null;
};

export type LeadStatus = "New" | "Saved" | "Dismissed";

export type Lead = {
    id: number;
    title: string;
    company: string | null;
    location: string | null;
    salary: string | null;
    source: string;
    url: string;
    publishedAt: Date | null;
    score: number | null;
    summary: string | null;
    strengths: string[];
    gaps: string[];
    explainedAt: Date | null;
    status: LeadStatus;
    jobId: number | null;
};

export async function getProfile(userId: string) {
    const rows = await prisma.$queryRaw<SearchProfile[]>`
        SELECT id, "userId", keywords, location, "radiusKm", "remoteOnly", "visaOnly", "experienceLevel",
               "sourceMode", "lastRunAt", "lastRunError"
        FROM "JobSearchProfile" WHERE "userId" = ${userId} LIMIT 1
    `;
    const row = rows[0];
    return row
        ? { ...row, experienceLevel: parseLevel(row.experienceLevel), sourceMode: parseSourceMode(row.sourceMode) }
        : null;
}

export async function saveProfile(
    userId: string,
    input: {
        keywords: string;
        location: string;
        radiusKm: number;
        remoteOnly: boolean;
        visaOnly: boolean;
        experienceLevel: ExperienceLevel;
        sourceMode: SourceMode;
    },
) {
    await prisma.$executeRaw`
        INSERT INTO "JobSearchProfile" (id, "userId", keywords, location, "radiusKm", "remoteOnly", "visaOnly",
                                        "experienceLevel", "sourceMode", "createdAt", "updatedAt")
        VALUES (${randomUUID()}, ${userId}, ${input.keywords}, ${input.location}, ${input.radiusKm}, ${input.remoteOnly},
                ${input.visaOnly}, ${input.experienceLevel}, ${input.sourceMode}, now(), now())
        ON CONFLICT ("userId") DO UPDATE SET
            keywords = EXCLUDED.keywords,
            location = EXCLUDED.location,
            "radiusKm" = EXCLUDED."radiusKm",
            "remoteOnly" = EXCLUDED."remoteOnly",
            "visaOnly" = EXCLUDED."visaOnly",
            "experienceLevel" = EXCLUDED."experienceLevel",
            "sourceMode" = EXCLUDED."sourceMode",
            "updatedAt" = now()
    `;

    // New search criteria: forget open leads from the old search.
    await prisma.$executeRaw`
        DELETE FROM "JobLead" WHERE "userId" = ${userId} AND status = 'New'::"JobLeadStatus"
    `;

    return getProfile(userId);
}

export async function listLeads(userId: string, status: LeadStatus) {
    return prisma.$queryRaw<Lead[]>`
        SELECT id, title, company, location, salary, source, url, "publishedAt", score, summary, strengths, gaps,
               "explainedAt", status::text AS status, "jobId"
        FROM "JobLead"
        WHERE "userId" = ${userId} AND status = ${status}::"JobLeadStatus"
        ORDER BY score DESC NULLS LAST, "publishedAt" DESC NULLS LAST
        LIMIT 100
    `;
}

export async function countLeads(userId: string) {
    const rows = await prisma.$queryRaw<{ status: LeadStatus; count: bigint }[]>`
        SELECT status::text AS status, COUNT(*) AS count FROM "JobLead"
        WHERE "userId" = ${userId} GROUP BY status
    `;
    const counts: Record<LeadStatus, number> = { New: 0, Saved: 0, Dismissed: 0 };
    for (const row of rows) counts[row.status] = Number(row.count);
    return counts;
}

export async function getResumeForUser(userId: string) {
    const rows = await prisma.$queryRaw<{ id: number; fileName: string; chunks: bigint }[]>`
        SELECT r.id, r."fileName",
               (SELECT COUNT(*) FROM "ResumeChunk" c WHERE c."resumeId" = r.id AND c.embedding IS NOT NULL) AS chunks
        FROM "Resume" r WHERE r."userId" = ${userId} LIMIT 1
    `;
    const row = rows[0];
    return row ? { id: row.id, fileName: row.fileName, chunks: Number(row.chunks) } : null;
}

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

async function mapLimit<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>) {
    const results = new Array<R>(items.length);
    let next = 0;

    await Promise.all(
        Array.from({ length: Math.min(limit, items.length) }, async () => {
            while (next < items.length) {
                const index = next++;
                results[index] = await fn(items[index]);
            }
        }),
    );

    return results;
}

function vectorLiteral(values: number[]) {
    return `[${values.join(",")}]`;
}

/* -------------------------------------------------------------------------- */
/* Scoring (pgvector, no AI calls)                                            */
/* -------------------------------------------------------------------------- */

export async function scoreLeads(userId: string, resumeId: number, titles: string[] = []) {
    const lowered = titles.map((title) => title.toLowerCase()).filter((title) => title.length >= 3);

    await prisma.$executeRaw`
        WITH sims AS (
            SELECT l.id,
                   (l.source LIKE 'alert-%') AS short_text,
                   (SELECT AVG(t.sim) FROM (
                        SELECT 1 - (c.embedding <=> l.embedding) AS sim
                        FROM "ResumeChunk" c
                        WHERE c."resumeId" = ${resumeId} AND c.embedding IS NOT NULL
                        ORDER BY c.embedding <=> l.embedding
                        LIMIT 3
                   ) t)
                   + CASE WHEN EXISTS (
                        SELECT 1 FROM unnest(${lowered}::text[]) AS k(title)
                        WHERE lower(l.title) LIKE '%' || k.title || '%'
                     ) THEN ${TITLE_BONUS}::float8 ELSE 0::float8 END AS sim
            FROM "JobLead" l
            WHERE l."userId" = ${userId} AND l.embedding IS NOT NULL AND l.status <> 'Dismissed'::"JobLeadStatus"
        ),
        bands AS (
            SELECT short_text,
                   COUNT(*) AS n,
                   percentile_cont(0.05) WITHIN GROUP (ORDER BY sim) AS lo,
                   percentile_cont(0.95) WITHIN GROUP (ORDER BY sim) AS hi
            FROM sims WHERE sim IS NOT NULL
            GROUP BY short_text
        ),
        scored AS (
            SELECT s.id,
                   LEAST(1, GREATEST(0, (s.sim - ${ABSOLUTE_FLOOR}::float8) / ${ABSOLUTE_CEIL - ABSOLUTE_FLOOR}::float8)) AS absolute,
                   CASE WHEN b.n >= ${MIN_FOR_RELATIVE}::int
                        THEN LEAST(1, GREATEST(0, (s.sim - b.lo) / GREATEST(b.hi - b.lo, 0.04::float8)))
                   END AS relative
            FROM sims s JOIN bands b ON b.short_text = s.short_text
            WHERE s.sim IS NOT NULL
        )
        UPDATE "JobLead" AS l
        SET score = ROUND((100 * CASE
                        WHEN sc.relative IS NULL THEN sc.absolute
                        ELSE ${RELATIVE_WEIGHT}::float8 * sc.relative + ${1 - RELATIVE_WEIGHT}::float8 * sc.absolute
                    END)::numeric, 0)::float8,
            "updatedAt" = now()
        FROM scored sc
        WHERE l.id = sc.id
    `;
}

/* -------------------------------------------------------------------------- */
/* Explanations (Gemini, best matches only)                                   */
/* -------------------------------------------------------------------------- */

let genai: GoogleGenAI | null = null;

/** Gemini free tier allows only a few requests per minute. */
export class AiBusyError extends RadarError {
    constructor(readonly retryAfterSeconds = 60) {
        super(`The AI is busy right now (free-tier limit). Try again in about ${retryAfterSeconds} seconds.`, 429);
    }
}

function retryDelaySeconds(error: unknown) {
    const text = error instanceof Error ? error.message : String(error);
    if (!/429|RESOURCE_EXHAUSTED|quota/i.test(text)) return null;
    const match = text.match(/retry in ([\d.]+)s/i);
    return match ? Math.ceil(Number(match[1])) : 30;
}

async function generateWithRetry(request: Parameters<GoogleGenAI["models"]["generateContent"]>[0]) {
    genai ??= new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

    for (let attempt = 0; ; attempt++) {
        try {
            return await genai.models.generateContent(request);
        } catch (error) {
            const wait = retryDelaySeconds(error);
            if (wait === null) throw error;
            // Wait once for short limits; otherwise report back.
            if (attempt === 0 && wait <= 20) {
                await new Promise((resolve) => setTimeout(resolve, (wait + 1) * 1000));
                continue;
            }
            throw new AiBusyError(wait);
        }
    }
}

export async function explainLead(userId: string, leadId: number, resumeId: number) {
    const rows = await prisma.$queryRaw<{ title: string; company: string | null; description: string | null; embedding: string | null }[]>`
        SELECT title, company, description, embedding::text AS embedding
        FROM "JobLead" WHERE id = ${leadId} AND "userId" = ${userId} LIMIT 1
    `;
    const lead = rows[0];
    if (!lead) throw new RadarError("That match no longer exists.", 404);
    if (!lead.embedding) throw new RadarError("This match can't be explained yet. Refresh the radar first.");

    const chunks = await prisma.$queryRaw<{ content: string }[]>`
        SELECT content FROM "ResumeChunk"
        WHERE "resumeId" = ${resumeId} AND embedding IS NOT NULL
        ORDER BY embedding <=> ${lead.embedding}::vector
        LIMIT 3
    `;

    const response = await generateWithRetry({
        model: process.env.RADAR_AI_MODEL || process.env.JOB_IMPORT_AI_MODEL || "gemini-3.6-flash",
        contents:
            "Compare this job posting with excerpts from the candidate's CV. " +
            "Reply in English, briefly. summary: one sentence on how well they fit. " +
            "strengths: up to 3 short phrases (max 4 words each) the CV clearly shows that the job wants. " +
            "gaps: up to 3 short phrases the job asks for that the CV does not show. " +
            "Only use what is written; never invent experience.\n\n" +
            `JOB: ${lead.title}${lead.company ? ` at ${lead.company}` : ""}\n` +
            `${(lead.description ?? "").slice(0, DESCRIPTION_CHARS)}\n\n` +
            `CV EXCERPTS:\n${chunks.map((c) => c.content).join("\n---\n").slice(0, 3_000)}`,
        config: {
            temperature: 0.2,
            responseMimeType: "application/json",
            responseJsonSchema: {
                type: "object",
                properties: {
                    summary: { type: "string" },
                    strengths: { type: "array", items: { type: "string" } },
                    gaps: { type: "array", items: { type: "string" } },
                },
                required: ["summary", "strengths", "gaps"],
            },
        },
    });

    let data: { summary?: unknown; strengths?: unknown; gaps?: unknown };
    try {
        data = JSON.parse(response.text ?? "{}");
    } catch {
        throw new RadarError("The explanation couldn't be generated. Try again.", 502);
    }

    const list = (value: unknown) =>
        Array.isArray(value)
            ? value.filter((v): v is string => typeof v === "string" && v.trim() !== "").map((v) => v.trim().slice(0, 60)).slice(0, 3)
            : [];

    const summary = typeof data.summary === "string" ? data.summary.trim().slice(0, 300) : "";
    const strengths = list(data.strengths);
    const gaps = list(data.gaps);

    await prisma.$executeRaw`
        UPDATE "JobLead"
        SET summary = ${summary || null}, strengths = ${strengths}, gaps = ${gaps},
            "explainedAt" = now(), "updatedAt" = now()
        WHERE id = ${leadId} AND "userId" = ${userId}
    `;

    return { summary, strengths, gaps };
}

/* -------------------------------------------------------------------------- */
/* Sources                                                                    */
/* -------------------------------------------------------------------------- */

function dedupeKey(job: FeedJob) {
    const norm = (value?: string) => (value ?? "").toLowerCase().replace(/\(.*?\)|[^a-z0-9äöüß]+/g, " ").trim();
    return `${norm(job.title)}|${norm(job.company)}`;
}

/**
 * JSearch (when configured) plus the Arbeitnow feed, with the same job
 * posted on both kept once. Visa-sponsorship information only exists on
 * Arbeitnow, so that filter limits the search to it. One source failing
 * doesn't stop the other.
 */
async function collectPostings(profile: SearchProfile): Promise<{ jobs: FeedJob[]; warning: string | null }> {
    const search = usesSearch(profile.sourceMode);
    const alertsOn = usesAlerts(profile.sourceMode);
    const useJSearch = search && jsearchConfigured() && !profile.visaOnly;

    // Job alert emails from the last week. Jobs already on the radar are skipped
    // further down, so re-reading the same emails costs nothing.
    const sinceDays = 7;

    const [jsearch, arbeitnow, alerts] = await Promise.allSettled([
        useJSearch
            ? searchJSearch({
                keywords: profile.keywords,
                location: profile.location,
                radiusKm: profile.radiusKm,
                remoteOnly: profile.remoteOnly,
                experienceLevel: profile.experienceLevel,
            })
            : Promise.resolve([] as FeedJob[]),
        (search ? fetchFeed({ visaOnly: profile.visaOnly }) : Promise.resolve([] as FeedJob[])).then((feed) =>
            filterJobs(feed, {
                keywords: profile.keywords,
                location: profile.location,
                radiusKm: profile.radiusKm,
                remoteOnly: profile.remoteOnly,
            }),
        ),
        alertsOn ? fetchAlertJobs(profile.userId, sinceDays) : Promise.resolve([] as FeedJob[]),
    ]);

    // Alert emails only, but Gmail isn't connected: nothing to read.
    if (profile.sourceMode === "alerts" && alerts.status === "fulfilled" && alerts.value === null) {
        throw new JobSourceError("Connect Gmail (Settings → Connected apps) so the radar can read your job alert emails.");
    }
    if (profile.sourceMode === "alerts" && alerts.status === "rejected") {
        throw alerts.reason instanceof Error ? new JobSourceError(alerts.reason.message) : new JobSourceError("Your job alert emails couldn't be read.");
    }

    if (search && jsearch.status === "rejected" && arbeitnow.status === "rejected" && !(alerts.status === "fulfilled" && alerts.value?.length)) {
        throw jsearch.reason instanceof JobSourceError ? jsearch.reason : new JobSourceError("No job source could be reached. Try again later.");
    }
    if (jsearch.status === "rejected") console.error("[radar] JSearch failed:", jsearch.reason);
    if (alerts.status === "rejected") console.error("[radar] Job alert emails failed:", alerts.reason);

    // One source failing isn't fatal, but the user should know results are thinner.
    const warning =
        jsearch.status === "rejected"
            ? jsearch.reason instanceof JobSourceError
                ? jsearch.reason.message
                : "Google Jobs didn't respond, so this update only used Arbeitnow."
            : arbeitnow.status === "rejected"
              ? "Arbeitnow didn't respond, so this update only used Google Jobs."
              : alerts.status === "rejected"
                ? `Job alert emails weren't read: ${alerts.reason instanceof Error ? alerts.reason.message : "Gmail didn't respond."}`
                : null;
    if (arbeitnow.status === "rejected") console.error("[radar] Arbeitnow failed:", arbeitnow.reason);

    const merged: FeedJob[] = [];
    const seen = new Set<string>();

    const alertJobs = alerts.status === "fulfilled" ? (alerts.value ?? []) : [];

    for (const job of [
        // Alerts first: they're the user's own searches on StepStone, LinkedIn, Indeed…
        ...alertJobs,
        ...(jsearch.status === "fulfilled" ? jsearch.value : []),
        ...(arbeitnow.status === "fulfilled" ? arbeitnow.value : []),
    ]) {
        // Alert emails were already filtered by the user's own searches on those
        // sites (title, place, level…), so they're taken as they are. The radar's
        // filters only apply to the job search sources.
        if (!job.source.startsWith("alert-")) {
            if (profile.remoteOnly && !job.remote) continue;
            if (!isInGermany(job)) continue;
            if (!matchesLevel(job, profile.experienceLevel)) continue;
        }
        const key = dedupeKey(job);
        if (seen.has(key)) continue;
        seen.add(key);
        merged.push(job);
    }

    // Newest first, so the per-run cap keeps the freshest postings.
    return {
        jobs: merged.sort((a, b) => (b.publishedAt?.getTime() ?? 0) - (a.publishedAt?.getTime() ?? 0)),
        warning,
    };
}

/* -------------------------------------------------------------------------- */
/* Full run                                                                   */
/* -------------------------------------------------------------------------- */

const running = new Set<string>();

/** Marks lastRunError values that are warnings about one source, not failures. */
export const PARTIAL_PREFIX = "partial:";

export type RunResult = { found: number; added: number; explained: number };

export async function runRadar(userId: string): Promise<RunResult> {
    if (running.has(userId)) throw new RadarError("The radar is already updating. Give it a moment.", 409);

    const profile = await getProfile(userId);
    if (!profile) throw new RadarError("Set up what you're looking for first.", 400);

    const resume = await getResumeForUser(userId);
    if (!resume || resume.chunks === 0) throw new RadarError("Upload your CV first, so matches can be ranked.", 400);

    running.add(userId);

    try {
        const { jobs: found, warning } = await collectPostings(profile);

        let fresh = found;
        if (found.length > 0) {
            const existing = await prisma.$queryRaw<{ key: string }[]>`
                SELECT source || ':' || "externalId" AS key FROM "JobLead"
                WHERE "userId" = ${userId}
                  AND source || ':' || "externalId" IN (${Prisma.join(found.map((job) => `${job.source}:${job.externalId}`))})
            `;
            const known = new Set(existing.map((row) => row.key));
            fresh = found.filter((job) => !known.has(`${job.source}:${job.externalId}`)).slice(0, MAX_NEW_PER_RUN);
        }

        // Embeddings for the new postings (the feed already includes descriptions).
        const prepared = await mapLimit(fresh, CONCURRENCY, async (job) => {
            const description = job.description;
            const text = [
                job.title,
                job.company,
                job.location,
                job.remote ? "Remote" : undefined,
                job.tags.length ? `Tags: ${job.tags.join(", ")}` : undefined,
                description.slice(0, DESCRIPTION_CHARS),
            ]
                .filter(Boolean)
                .join("\n");

            const embedding = await createEmbedding(text).catch((error) => {
                console.error("[radar] embedding failed:", error);
                return null;
            });

            const location = job.remote ? (job.location ? `${job.location} (remote)` : "Remote") : job.location;

            return { job: { ...job, location }, description, embedding };
        });

        let added = 0;
        for (const { job, description, embedding } of prepared) {
            const vector = embedding ? vectorLiteral(embedding) : null;

            const inserted = await prisma.$executeRaw`
                INSERT INTO "JobLead" ("userId", source, "externalId", title, company, location, salary, url,
                                       "publishedAt", description, embedding, "createdAt", "updatedAt")
                VALUES (${userId}, ${job.source}, ${job.externalId}, ${job.title}, ${job.company ?? null},
                        ${job.location ?? null}, ${job.salary ?? null}, ${job.url}, ${job.publishedAt ?? null},
                        ${description ? description.slice(0, 8_000) : null}, ${vector}::vector, now(), now())
                ON CONFLICT ("userId", source, "externalId") DO NOTHING
            `;
            added += inserted;
        }

        await scoreLeads(userId, resume.id, profile.sourceMode === "alerts" ? [] : parseTitles(profile.keywords));

        // Explain the best open matches that don't have an explanation yet.
        const toExplain = await prisma.$queryRaw<{ id: number }[]>`
            SELECT id FROM "JobLead"
            WHERE "userId" = ${userId} AND status = 'New'::"JobLeadStatus"
              AND "explainedAt" IS NULL AND score IS NOT NULL
            ORDER BY score DESC
            LIMIT ${EXPLAIN_PER_RUN}
        `;

        let explained = 0;
        if (process.env.GEMINI_API_KEY) {
            // One at a time: the free Gemini tier allows ~5 requests a minute.
            for (const { id } of toExplain) {
                try {
                    await explainLead(userId, id, resume.id);
                    explained++;
                } catch (error) {
                    if (error instanceof AiBusyError) break; // the rest can be explained on demand
                    console.error("[radar] explanation failed:", error);
                }
            }
        }

        // Housekeeping: old, untouched leads go away.
        await prisma.$executeRaw`
            DELETE FROM "JobLead"
            WHERE "userId" = ${userId} AND status = 'New'::"JobLeadStatus"
              AND "createdAt" < now() - make_interval(days => ${STALE_AFTER_DAYS})
        `;

        await prisma.$executeRaw`
            UPDATE "JobSearchProfile"
            SET "lastRunAt" = now(),
                -- A partial run keeps a note (prefixed) instead of an error.
                "lastRunError" = ${warning ? `${PARTIAL_PREFIX}${warning}` : null},
                "updatedAt" = now()
            WHERE "userId" = ${userId}
        `;

        return { found: found.length, added, explained };
    } catch (error) {
        const message =
            error instanceof RadarError || error instanceof JobSourceError
                ? error.message
                : "The radar couldn't update. Try again later.";

        await prisma.$executeRaw`
            UPDATE "JobSearchProfile" SET "lastRunError" = ${message}, "updatedAt" = now()
            WHERE "userId" = ${userId}
        `.catch(() => undefined);

        if (error instanceof RadarError) throw error;
        if (error instanceof JobSourceError) throw new RadarError(error.message, 502);
        throw error;
    } finally {
        running.delete(userId);
    }
}

/* -------------------------------------------------------------------------- */
/* Lead actions                                                               */
/* -------------------------------------------------------------------------- */

export async function setLeadStatus(userId: string, leadId: number, status: "New" | "Dismissed") {
    const updated = await prisma.$executeRaw`
        UPDATE "JobLead" SET status = ${status}::"JobLeadStatus", "updatedAt" = now()
        WHERE id = ${leadId} AND "userId" = ${userId} AND status <> 'Saved'::"JobLeadStatus"
    `;
    if (updated === 0) throw new RadarError("That match wasn't found.", 404);
}

export async function saveLeadToWishlist(userId: string, leadId: number) {
    const rows = await prisma.$queryRaw<{ title: string; company: string | null; location: string | null; salary: string | null; url: string; summary: string | null; description: string | null; source: string | null; jobId: number | null }[]>`
        SELECT title, company, location, salary, url, summary, description, source::text AS source, "jobId" FROM "JobLead"
        WHERE id = ${leadId} AND "userId" = ${userId} LIMIT 1
    `;
    const lead = rows[0];
    if (!lead) throw new RadarError("That match wasn't found.", 404);

    if (lead.jobId) {
        const existing = await prisma.job.findFirst({ where: { id: lead.jobId, userId } });
        if (existing) return existing;
    }

    const job = await prisma.job.create({
        data: {
            userId,
            company: (lead.company ?? "Unknown company").slice(0, 200),
            position: lead.title.slice(0, 200),
            location: (lead.location ?? "Germany").slice(0, 200),
            status: "Wishlist",
            jobUrl: lead.url.slice(0, 2000),
            salary: lead.salary?.slice(0, 100) ?? null,
            notes: lead.summary ? `Job radar: ${lead.summary}` : "Found with the job radar.",
        },
    });

    // Keep the ad text with the job, for "Key points from the ad", insights and CV tailoring.
    // (Alert emails only give a snippet; that's too little to be worth keeping.)
    const description = lead.description?.trim() ?? "";
    if (description.length >= 200) {
        try {
            await prisma.$executeRaw`
                INSERT INTO "JobPosting" ("jobId", description, source)
                VALUES (${job.id}, ${description}, ${`radar:${lead.source ?? ""}`})
                ON CONFLICT ("jobId") DO NOTHING
            `;
        } catch (error) {
            console.error("[radar] keeping the ad text failed:", error);
        }
    }

    await prisma.$executeRaw`
        UPDATE "JobLead" SET status = 'Saved'::"JobLeadStatus", "jobId" = ${job.id}, "updatedAt" = now()
        WHERE id = ${leadId} AND "userId" = ${userId}
    `;

    return job;
}

/** Profiles due for the daily run (used by the cron route). */
export async function dueProfiles(limit = 25) {
    return prisma.$queryRaw<{ userId: string }[]>`
        SELECT "userId" FROM "JobSearchProfile"
        WHERE "lastRunAt" IS NULL OR "lastRunAt" < now() - interval '20 hours'
        ORDER BY "lastRunAt" ASC NULLS FIRST
        LIMIT ${limit}
    `;
}

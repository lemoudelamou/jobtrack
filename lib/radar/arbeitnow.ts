/*
 * Arbeitnow job board API (https://www.arbeitnow.com/api/job-board-api).
 *
 * Free, no key. Germany-focused, mostly tech and startup roles collected
 * from Greenhouse, SmartRecruiters, Join, Recruitee and others. The feed has
 * no keyword search, so we read the newest pages (shared by all users and
 * cached briefly) and filter locally before the expensive steps.
 */

import { ANYWHERE, parseCities } from "./cities";

const ENDPOINT = "https://www.arbeitnow.com/api/job-board-api";
const MAX_PAGES = 10;
const FEED_TTL_MS = 30 * 60 * 1000;
const TIMEOUT_MS = 12_000;

export class JobSourceError extends Error {}

export type FeedJob = {
    /** "arbeitnow", "jsearch", or "alert-<site>" for job alert emails. */
    source: string;
    externalId: string;
    title: string;
    company?: string;
    location?: string;
    remote: boolean;
    tags: string[];
    jobTypes: string[];
    publishedAt?: Date;
    url: string;
    description: string;
    salary?: string;
    /** ISO country code when the source knows it (JSearch). */
    country?: string;
};

type RawJob = {
    slug?: string;
    company_name?: string;
    title?: string;
    description?: string;
    remote?: boolean;
    url?: string;
    tags?: string[];
    job_types?: string[];
    location?: string;
    created_at?: number;
};

export function htmlToText(html: string) {
    return html
        .replace(/<(br|\/p|\/li|\/h\d|\/div)[^>]*>/gi, "\n")
        .replace(/<[^>]+>/g, " ")
        .replace(/&nbsp;/g, " ")
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&quot;/g, '"')
        .replace(/&#0?39;/g, "'")
        .replace(/[ \t]+/g, " ")
        .replace(/\s*\n\s*/g, "\n")
        .trim();
}

function mapJob(raw: RawJob): FeedJob | null {
    if (!raw.slug || !raw.title || !raw.url) return null;

    const created = raw.created_at ? new Date(raw.created_at * 1000) : undefined;

    return {
        source: "arbeitnow",
        externalId: raw.slug,
        title: raw.title.trim(),
        company: raw.company_name?.trim() || undefined,
        location: raw.location?.trim() || undefined,
        remote: Boolean(raw.remote),
        tags: Array.isArray(raw.tags) ? raw.tags.filter((t) => typeof t === "string") : [],
        jobTypes: Array.isArray(raw.job_types) ? raw.job_types.filter((t) => typeof t === "string") : [],
        publishedAt: created && !Number.isNaN(created.getTime()) ? created : undefined,
        url: raw.url,
        description: raw.description ? htmlToText(raw.description) : "",
    };
}

const feedCache = new Map<string, { at: number; jobs: FeedJob[] }>();

/** Newest postings, shared across users and cached for 30 minutes. */
export async function fetchFeed({ visaOnly = false } = {}): Promise<FeedJob[]> {
    const key = visaOnly ? "visa" : "all";
    const cached = feedCache.get(key);
    if (cached && Date.now() - cached.at < FEED_TTL_MS) return cached.jobs;

    const jobs: FeedJob[] = [];
    const seen = new Set<string>();

    for (let page = 1; page <= MAX_PAGES; page++) {
        const params = new URLSearchParams({ page: String(page) });
        if (visaOnly) params.set("visa_sponsorship", "true");

        const response = await fetch(`${ENDPOINT}?${params}`, {
            headers: { Accept: "application/json", "User-Agent": "JobTrack/1.0 (job radar)" },
            signal: AbortSignal.timeout(TIMEOUT_MS),
            cache: "no-store",
        }).catch(() => null);

        if (!response?.ok) {
            if (page === 1) {
                throw new JobSourceError(
                    response
                        ? `The job board answered with an error (${response.status}). Try again later.`
                        : "The job board couldn't be reached. Try again later.",
                );
            }
            break;
        }

        const body = (await response.json().catch(() => null)) as
            | { data?: RawJob[]; links?: { next?: string | null } }
            | null;
        const batch = body?.data ?? [];

        for (const raw of batch) {
            const job = mapJob(raw);
            if (job && !seen.has(job.externalId)) {
                seen.add(job.externalId);
                jobs.push(job);
            }
        }

        if (batch.length === 0 || !body?.links?.next) break;
    }

    feedCache.set(key, { at: Date.now(), jobs });
    return jobs;
}

/* -------------------------------------------------------------------------- */
/* Local filtering                                                            */
/* -------------------------------------------------------------------------- */

function normalize(value: string) {
    return value
        .toLowerCase()
        .replace(/ä/g, "ae")
        .replace(/ö/g, "oe")
        .replace(/ü/g, "ue")
        .replace(/ß/g, "ss")
        .normalize("NFD")
        .replace(/[̀-ͯ]/g, "");
}

const CITY_ALIASES: Record<string, string[]> = {
    muenchen: ["munich", "muenchen"],
    munich: ["munich", "muenchen"],
    koeln: ["cologne", "koeln"],
    cologne: ["cologne", "koeln"],
    nuernberg: ["nuremberg", "nuernberg"],
    nuremberg: ["nuremberg", "nuernberg"],
    frankfurt: ["frankfurt"],
    duesseldorf: ["duesseldorf", "dusseldorf"],
    dusseldorf: ["duesseldorf", "dusseldorf"],
};

function cityMatches(jobLocation: string | undefined, wanted: string) {
    if (!jobLocation) return false;
    const location = normalize(jobLocation);
    const target = normalize(wanted).trim();
    const variants = CITY_ALIASES[target] ?? [target];
    return variants.some((variant) => location.includes(variant));
}

export type FilterOptions = {
    keywords: string;
    /** Comma-separated cities. */
    location: string;
    /** 0 = anywhere in Germany. */
    radiusKm: number;
    remoteOnly: boolean;
};

/**
 * Keeps postings that match any of the comma-separated keyword phrases
 * (in the title or tags; the description is used only if that finds too
 * little) and the location: the chosen city, or remote. Ranking against
 * the CV happens later, so this filter can stay generous.
 */
export function filterJobs(jobs: FeedJob[], options: FilterOptions) {
    const phrases = options.keywords
        .split(",")
        .map((phrase) => normalize(phrase).trim())
        .filter((phrase) => phrase.length >= 2);

    const cities = parseCities(options.location);
    const inPlace = jobs.filter((job) => {
        if (options.remoteOnly) return job.remote;
        if (options.radiusKm === ANYWHERE || cities.length === 0) return true;
        return job.remote || cities.some((city) => cityMatches(job.location, city));
    });

    if (phrases.length === 0) return inPlace;

    const strong = inPlace.filter((job) => {
        const haystack = normalize(`${job.title} ${job.tags.join(" ")}`);
        return phrases.some((phrase) => haystack.includes(phrase));
    });

    if (strong.length >= 10) return strong;

    const strongIds = new Set(strong.map((job) => job.externalId));
    const loose = inPlace.filter((job) => {
        if (strongIds.has(job.externalId)) return false;
        const text = normalize(job.description.slice(0, 4_000));
        return phrases.some((phrase) => text.includes(phrase));
    });

    return [...strong, ...loose];
}

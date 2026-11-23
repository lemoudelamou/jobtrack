/*
 * JSearch (Google for Jobs) via RapidAPI: https://rapidapi.com/letscrape-6bRBa3QguO5/api/jsearch
 *
 * Widest coverage available: it returns what Google for Jobs shows, so
 * postings from StepStone, Indeed, LinkedIn, company sites and more, with
 * full descriptions. Needs JSEARCH_API_KEY (your RapidAPI key).
 *
 * The free plan allows 200 requests a month for the whole app (every user
 * shares one key), so calls are budgeted:
 *   - every real request is counted in the database, and the radar stops
 *     calling JSearch once the last 30 days reach the budget
 *     (JSEARCH_MONTHLY_LIMIT, default 200, minus a small safety margin);
 *   - one request per job title, at most two a day (taking turns through
 *     the user's titles), and only one when the budget is running low;
 *   - identical searches are reused for 12 hours.
 * When the budget is spent, Arbeitnow keeps the radar running.
 */

import { prisma } from "@/lib/prisma";
import { JobSourceError, htmlToText, type FeedJob } from "./arbeitnow";
import { ANYWHERE, cityOfTheDay, parseCities } from "./cities";
import { JSEARCH_TITLES_PER_DAY, parseTitles, titlesOfTheDay } from "./titles";
import { jsearchRequirements, type ExperienceLevel } from "./filters";

/*
 * Two ways to buy JSearch, same data:
 *   - OpenWeb Ninja directly (keys start with "ak_"): x-api-key header
 *   - RapidAPI: x-rapidapi-key + x-rapidapi-host headers
 * The provider is picked from the key; JSEARCH_PROVIDER=openwebninja|rapidapi overrides.
 */
const RAPIDAPI_HOST = "jsearch.p.rapidapi.com";

function provider() {
    const forced = process.env.JSEARCH_PROVIDER?.toLowerCase();
    if (forced === "openwebninja" || forced === "rapidapi") return forced;
    return (process.env.JSEARCH_API_KEY ?? "").startsWith("ak_") ? "openwebninja" : "rapidapi";
}

function request(params: URLSearchParams): { url: string; headers: Record<string, string> } {
    const key = process.env.JSEARCH_API_KEY ?? "";
    return provider() === "openwebninja"
        ? { url: `https://api.openwebninja.com/jsearch/search?${params}`, headers: { "x-api-key": key } }
        : {
              url: `https://${RAPIDAPI_HOST}/search?${params}`,
              headers: { "x-rapidapi-key": key, "x-rapidapi-host": RAPIDAPI_HOST },
          };
}
const TIMEOUT_MS = 20_000;
const CACHE_MS = 12 * 60 * 60 * 1000;

/*
 * Rolling 30 days rather than calendar months: RapidAPI resets the quota on
 * your subscription date, and no 30-day stretch can then exceed the budget.
 */
const USAGE_KEY = "monthly:jsearch";
const WINDOW_MS = 30 * 24 * 60 * 60 * 1000;
const SAFETY_MARGIN = 5;
const LOW_BUDGET = 40;

function monthlyLimit() {
    const configured = Number(process.env.JSEARCH_MONTHLY_LIMIT);
    const limit = Number.isFinite(configured) && configured > 0 ? configured : 200;
    return Math.max(0, limit - SAFETY_MARGIN);
}

/** Requests sent in the last 30 days, and how many the budget allows. */
export async function jsearchUsage() {
    const used = await prisma.loginAttempt.count({
        where: { key: USAGE_KEY, failedAt: { gte: new Date(Date.now() - WINDOW_MS) } },
    });
    return { used, limit: monthlyLimit() };
}

const BUDGET_SPENT =
    "JSearch's monthly allowance is used up. The radar uses Arbeitnow until requests free up again.";

type RawJob = {
    job_id?: string;
    job_title?: string;
    employer_name?: string;
    job_publisher?: string;
    job_apply_link?: string;
    job_google_link?: string;
    job_description?: string;
    job_is_remote?: boolean;
    job_employment_type?: string;
    job_posted_at_datetime_utc?: string;
    job_location?: string;
    job_city?: string;
    job_state?: string;
    job_country?: string;
    job_min_salary?: number | null;
    job_max_salary?: number | null;
    job_salary_currency?: string | null;
    job_salary_period?: string | null;
};

const cache = new Map<string, { at: number; jobs: FeedJob[] }>();

export function jsearchConfigured() {
    return Boolean(process.env.JSEARCH_API_KEY);
}

function short(n: number) {
    return n >= 1000 ? `${Math.round(n / 1000)}k` : String(Math.round(n));
}

function salaryText(raw: RawJob) {
    const lo = Number(raw.job_min_salary);
    const hi = Number(raw.job_max_salary);
    if (!(lo > 0) && !(hi > 0)) return undefined;

    const currency = (raw.job_salary_currency ?? "EUR").toUpperCase();
    const symbol = currency === "EUR" ? "€" : currency === "USD" ? "$" : currency === "GBP" ? "£" : `${currency} `;
    const period = raw.job_salary_period ? ` / ${raw.job_salary_period.toLowerCase()}` : "";

    const amount = lo > 0 && hi > 0 && lo !== hi ? `${symbol}${short(lo)}–${short(hi)}` : `${symbol}${short(lo > 0 ? lo : hi)}`;
    return `${amount}${period}`;
}

// "Beliebiger Ort" / "Anywhere": Google's wording for remote.
const ANYWHERE_TEXT = /^(beliebiger ort|anywhere|remote|ueberall|überall)$/i;

/** "Berlin     •  über Stepstone" -> "Berlin"; "Beliebiger Ort • über LinkedIn" -> undefined. */
function locationText(raw: RawJob) {
    const parts = [raw.job_city, raw.job_state].map((p) => p?.trim()).filter(Boolean);
    if (parts.length) return parts.join(", ");

    const place = raw.job_location?.split("•")[0]?.replace(/\s+/g, " ").trim();
    if (!place || ANYWHERE_TEXT.test(place)) return undefined;
    return place;
}

function isAnywhere(raw: RawJob) {
    const place = raw.job_location?.split("•")[0]?.replace(/\s+/g, " ").trim() ?? "";
    return ANYWHERE_TEXT.test(place);
}

/** Drops aggregator junk glued to titles, e.g. "… · $76k – $102k Germany just now". */
function cleanTitle(title: string) {
    return title.split(" · ")[0].trim();
}

function mapJob(raw: RawJob): FeedJob | null {
    const url = raw.job_apply_link || raw.job_google_link;
    if (!raw.job_id || !raw.job_title || !url) return null;

    const posted = raw.job_posted_at_datetime_utc ? new Date(raw.job_posted_at_datetime_utc) : undefined;
    const title = cleanTitle(htmlToText(raw.job_title));
    const description = raw.job_description ? htmlToText(raw.job_description) : "";

    return {
        source: "jsearch",
        externalId: raw.job_id,
        title,
        company: raw.employer_name?.trim() || undefined,
        location: locationText(raw),
        remote: Boolean(raw.job_is_remote) || isAnywhere(raw) || /\b(remote|home[\s-]?office)\b/i.test(title),
        tags: raw.job_publisher ? [raw.job_publisher] : [],
        jobTypes: raw.job_employment_type ? [raw.job_employment_type.toLowerCase().replace(/_/g, " ")] : [],
        publishedAt: posted && !Number.isNaN(posted.getTime()) ? posted : undefined,
        url,
        description,
        salary: salaryText(raw),
        // Every request asks for Germany (country=de); trust that unless the API says otherwise.
        country: raw.job_country?.trim() || "DE",
    };
}

async function searchOnce(params: URLSearchParams): Promise<FeedJob[]> {
    const key = params.toString();
    const hit = cache.get(key);
    if (hit && Date.now() - hit.at < CACHE_MS) return hit.jobs;

    // Check and record before calling, so parallel runs can't overshoot.
    const { used, limit } = await jsearchUsage();
    if (used >= limit) throw new JobSourceError(BUDGET_SPENT);
    const usage = await prisma.loginAttempt.create({ data: { key: USAGE_KEY } });

    const { url, headers } = request(params);
    const response = await fetch(url, {
        headers: { ...headers, Accept: "application/json" },
        signal: AbortSignal.timeout(TIMEOUT_MS),
        cache: "no-store",
    }).catch(() => null);

    if (!response) throw new JobSourceError("JSearch couldn't be reached. Try again later.");
    if (response.status === 401 || response.status === 403) {
        // Rejected requests aren't billed, so don't count them either.
        await prisma.loginAttempt.delete({ where: { id: usage.id } }).catch(() => undefined);
        const reason = ((await response.json().catch(() => null)) as { message?: string } | null)?.message ?? "";
        throw new JobSourceError(
            /not subscribed/i.test(reason)
                ? "Google Jobs is off: your RapidAPI account isn't subscribed to JSearch. Open JSearch on RapidAPI and choose the free Basic plan."
                : provider() === "openwebninja"
                  ? "Google Jobs is off: OpenWeb Ninja rejected the JSearch key, or the account has no active JSearch plan. Check JSEARCH_API_KEY in .env."
                  : "Google Jobs is off: RapidAPI rejected the JSearch key. Check JSEARCH_API_KEY in .env.",
        );
    }
    if (response.status === 429) {
        throw new JobSourceError("JSearch's monthly or per-second limit was reached. The radar will try again later.");
    }
    if (!response.ok) throw new JobSourceError(`JSearch returned an error (${response.status}).`);

    const body = (await response.json().catch(() => null)) as { status?: string; data?: RawJob[] } | null;
    const jobs = (body?.data ?? []).map(mapJob).filter((job): job is FeedJob => job !== null);

    cache.set(key, { at: Date.now(), jobs });
    return jobs;
}

export async function searchJSearch(options: {
    keywords: string;
    location: string;
    radiusKm: number;
    remoteOnly: boolean;
    experienceLevel: ExperienceLevel;
}): Promise<FeedJob[]> {
    const { used, limit } = await jsearchUsage();
    if (used >= limit) throw new JobSourceError(BUDGET_SPENT);

    // Two titles a day (one when the budget runs low), taking turns.
    const phrases = titlesOfTheDay(
        parseTitles(options.keywords),
        limit - used <= LOW_BUDGET ? 1 : JSEARCH_TITLES_PER_DAY,
    );

    // One city per day, taking turns, so more cities cost no extra requests.
    const city = options.radiusKm === ANYWHERE ? undefined : cityOfTheDay(parseCities(options.location));
    const jobs: FeedJob[] = [];
    const seen = new Set<string>();
    let lastError: unknown;

    for (const phrase of phrases.length ? phrases : [options.keywords.trim()]) {
        const params = new URLSearchParams({
            query: options.remoteOnly || !city ? `${phrase} in Germany` : `${phrase} in ${city}, Germany`,
            page: "1",
            num_pages: "1",
            country: "de",
            date_posted: "week",
        });
        const requirements = jsearchRequirements(options.experienceLevel);
        if (requirements) params.set("job_requirements", requirements);
        if (options.remoteOnly) params.set("work_from_home", "true");
        else if (city) params.set("radius", String(options.radiusKm));

        try {
            for (const job of await searchOnce(params)) {
                if (seen.has(job.externalId)) continue;
                seen.add(job.externalId);
                jobs.push(job);
            }
        } catch (error) {
            lastError = error;
            // A bad key or exhausted quota won't fix itself on the next phrase.
            if (error instanceof JobSourceError && /key|limit|allowance/.test(error.message)) break;
        }
    }

    if (jobs.length === 0 && lastError) throw lastError;
    return jobs;
}

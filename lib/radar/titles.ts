/*
 * Job titles the radar searches for. Stored in the profile's `keywords`
 * as a comma list. Arbeitnow (free) matches all of them on every run;
 * JSearch searches two per day, taking turns, to save its allowance.
 */

export const MAX_TITLES = 5;
export const JSEARCH_TITLES_PER_DAY = 2;

/** Common roles in the German market, offered as one-click suggestions. */
export const COMMON_TITLES = [
    "Software Engineer",
    "Frontend Developer",
    "Backend Developer",
    "Full-stack Developer",
    "React Developer",
    "Web Developer",
    "Softwareentwickler",
    "Mobile Developer",
    "DevOps Engineer",
    "Cloud Engineer",
    "Data Analyst",
    "Data Engineer",
    "Data Scientist",
    "Machine Learning Engineer",
    "QA Engineer",
    "IT Support",
    "Fachinformatiker Anwendungsentwicklung",
    "Product Manager",
    "UX/UI Designer",
    "Werkstudent Softwareentwicklung",
];

export function parseTitles(keywords: string | null | undefined): string[] {
    const seen = new Set<string>();
    const titles: string[] = [];
    for (const raw of (keywords ?? "").split(",")) {
        const title = raw.trim().replace(/\s+/g, " ").slice(0, 60);
        const key = title.toLowerCase();
        if (title.length < 2 || seen.has(key)) continue;
        seen.add(key);
        titles.push(title);
        if (titles.length === MAX_TITLES) break;
    }
    return titles;
}

export function joinTitles(titles: string[]) {
    return parseTitles(titles.join(",")).join(", ");
}

/** The titles JSearch searches today; stable for the whole day. */
export function titlesOfTheDay(titles: string[], count = JSEARCH_TITLES_PER_DAY, now = new Date()) {
    if (titles.length <= count) return titles;
    const day = Math.floor(now.getTime() / 86_400_000);
    const start = (day * count) % titles.length;
    return Array.from({ length: count }, (_, i) => titles[(start + i) % titles.length]);
}

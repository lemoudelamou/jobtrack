import type { FeedJob } from "./arbeitnow";

/*
 * Post-search filters shared by every source:
 *   - Germany only: the Arbeitnow feed also carries jobs in London,
 *     Amsterdam and elsewhere, and "remote" can mean remote from abroad.
 *   - Experience level, from the title and the years of experience the
 *     posting asks for.
 */

function norm(value: string) {
    return value
        .toLowerCase()
        .replace(/ä/g, "ae")
        .replace(/ö/g, "oe")
        .replace(/ü/g, "ue")
        .replace(/ß/g, "ss")
        .normalize("NFD")
        .replace(/[̀-ͯ]/g, "");
}

/* -------------------------------------------------------------------------- */
/* Germany                                                                    */
/* -------------------------------------------------------------------------- */

// Germany, its states, and its larger cities and well-known tech towns.
const GERMAN_PLACES = [
    "germany", "deutschland", "bundesweit",
    "baden-wuerttemberg", "bayern", "bavaria", "brandenburg", "bremen", "hessen", "hesse",
    "mecklenburg", "niedersachsen", "lower saxony", "nordrhein-westfalen", "north rhine", "nrw",
    "rheinland-pfalz", "saarland", "sachsen", "saxony", "schleswig-holstein", "thueringen", "thuringia",
    "berlin", "hamburg", "muenchen", "munich", "koeln", "cologne", "frankfurt", "stuttgart", "duesseldorf",
    "dusseldorf", "leipzig", "dortmund", "essen", "dresden", "hannover", "hanover", "nuernberg", "nuremberg",
    "duisburg", "bochum", "wuppertal", "bielefeld", "bonn", "muenster", "mannheim", "karlsruhe", "augsburg",
    "wiesbaden", "moenchengladbach", "gelsenkirchen", "aachen", "braunschweig", "kiel", "chemnitz", "halle",
    "magdeburg", "freiburg", "krefeld", "mainz", "luebeck", "erfurt", "oberhausen", "rostock", "kassel",
    "hagen", "potsdam", "saarbruecken", "hamm", "ludwigshafen", "oldenburg", "osnabrueck", "leverkusen",
    "heidelberg", "darmstadt", "solingen", "regensburg", "herne", "paderborn", "neuss", "ingolstadt",
    "offenbach", "fuerth", "wuerzburg", "ulm", "heilbronn", "pforzheim", "wolfsburg", "goettingen",
    "bottrop", "reutlingen", "koblenz", "bremerhaven", "recklinghausen", "erlangen", "bergisch gladbach",
    "jena", "remscheid", "trier", "salzgitter", "moers", "siegen", "hildesheim", "cottbus", "kaiserslautern",
    "guetersloh", "schwerin", "witten", "gera", "iserlohn", "ludwigsburg", "esslingen", "zwickau",
    "dueren", "ratingen", "flensburg", "villingen", "konstanz", "marburg", "giessen", "bamberg", "bayreuth",
    "passau", "landshut", "rosenheim", "tuebingen", "walldorf", "eschborn", "garching", "unterfoehring",
    "sindelfingen", "boeblingen", "herzogenaurach", "gilching", "ismaning", "neckarsulm", "wetzlar",
    "jena", "weimar", "lueneburg", "aschaffenburg", "fulda", "friedrichshafen", "baden-baden", "dessau",
];

// Places that are clearly not Germany (checked only when no German place matched).
const FOREIGN_PLACES = [
    "london", "united kingdom", "uk", "england", "manchester", "edinburgh", "dublin", "ireland",
    "amsterdam", "rotterdam", "utrecht", "eindhoven", "netherlands", "holland", "brussels", "belgium",
    "paris", "france", "lyon", "madrid", "barcelona", "spain", "lisbon", "porto", "portugal", "milan",
    "rome", "italy", "vienna", "wien", "austria", "oesterreich", "graz", "linz", "zurich", "zuerich",
    "geneva", "basel", "bern", "switzerland", "schweiz", "warsaw", "krakow", "poland", "prague",
    "czech", "budapest", "hungary", "bucharest", "romania", "sofia", "bulgaria", "copenhagen", "denmark",
    "stockholm", "sweden", "oslo", "norway", "helsinki", "finland", "tallinn", "estonia", "riga", "vilnius",
    "luxembourg", "athens", "greece", "istanbul", "turkey", "usa", "united states", "new york",
    "san francisco", "canada", "toronto", "india", "bangalore", "singapore", "dubai", "australia",
    "emea", "europe", "eu remote", "worldwide", "latam", "apac",
];

const GERMAN_POSTCODE = /\b[0-9]{5}\b/;
const GERMAN_WORDS = /\b(und|wir|sie|fuer|mit|der|die|das|ihre|deine|unser|unsere|bei|eine|einen|aufgaben|kenntnisse)\b/g;

function hasPlace(text: string, places: string[]) {
    return places.some((place) => new RegExp(`(^|[^a-z])${place.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}($|[^a-z])`).test(text));
}

/** "de" when the text names a German place or postcode, "foreign" for a known foreign place. */
export function placeKind(text: string): "de" | "foreign" | null {
    const value = norm(text);
    if (hasPlace(value, GERMAN_PLACES) || /\b[0-9]{5}\b/.test(value)) return "de";
    if (hasPlace(value, FOREIGN_PLACES)) return "foreign";
    return null;
}

/** Rough check that a posting is written in German (so most likely DACH). */
function looksGerman(description: string) {
    const sample = norm(description.slice(0, 1500));
    return (sample.match(GERMAN_WORDS)?.length ?? 0) >= 12;
}

/**
 * True when the job is in Germany (or remote from Germany).
 * Sources that know the country (JSearch) are trusted; otherwise the
 * location text decides, with German-language postings as a tiebreak for
 * small towns we don't list.
 */
export function isInGermany(job: FeedJob) {
    if (job.country) return job.country.toUpperCase() === "DE";

    const location = norm(job.location ?? "");
    if (hasPlace(location, GERMAN_PLACES) || GERMAN_POSTCODE.test(location)) return true;
    if (hasPlace(location, FOREIGN_PLACES)) return false;

    // Empty / just "Remote": keep when the posting mentions Germany or is in German.
    const generic = !location || /^(remote|home ?office|anywhere|hybrid|homeoffice)$/.test(location.trim());
    const text = norm(`${job.title} ${job.description.slice(0, 3000)}`);
    if (generic) return /\b(germany|deutschland)\b/.test(text) || looksGerman(job.description);

    // An unlisted place name: most likely a small German town if the ad is in German.
    return looksGerman(job.description);
}

/* -------------------------------------------------------------------------- */
/* Experience level                                                           */
/* -------------------------------------------------------------------------- */

export const EXPERIENCE_LEVELS = ["any", "student", "junior", "mid", "senior"] as const;
export type ExperienceLevel = (typeof EXPERIENCE_LEVELS)[number];

export const EXPERIENCE_LABELS: Record<ExperienceLevel, string> = {
    any: "Any level",
    student: "Student, internship or Werkstudent",
    junior: "Entry level / junior (0–2 years)",
    mid: "Mid level (2–5 years)",
    senior: "Senior (5+ years)",
};

export function parseLevel(value: unknown): ExperienceLevel {
    return EXPERIENCE_LEVELS.includes(value as ExperienceLevel) ? (value as ExperienceLevel) : "any";
}

const STUDENT_TITLE =
    /\b(werkstudent|werkstudentin|working student|intern|internship|praktikum|praktikant|praktikantin|thesis|abschlussarbeit|bachelorarbeit|masterarbeit|ausbildung|azubi|student)\b/;
const JUNIOR_TITLE = /\b(junior|jr|entry|entry level|graduate|berufseinsteiger|einsteiger|trainee|absolvent|absolventin)\b/;
const SENIOR_TITLE = /\b(senior|sr|lead|principal|staff|head of|director|vp|architect|leiter|leiterin|leitung|chief|expert|experte)\b/;
const TOP_TITLE = /\b(principal|staff|head of|director|vp|chief|leiter|leiterin|leitung)\b/;

/** Smallest "N years of experience" the posting asks for, if it says. */
export function requiredYears(description: string): number | null {
    const text = norm(description);
    const patterns = [
        /(\d{1,2})\s*\+?\s*(?:-|–|bis|to)?\s*(?:\d{1,2}\s*)?(?:years?|yrs?|jahre?n?)\b[^.\n]{0,40}?(?:experience|erfahrung|berufserfahrung)/g,
        /(?:mindestens|at least|minimum(?: of)?|min\.)\s*(\d{1,2})\s*\+?\s*(?:years?|yrs?|jahre?n?)/g,
    ];
    let min: number | null = null;
    for (const pattern of patterns) {
        for (const match of text.matchAll(pattern)) {
            const years = Number(match[1]);
            if (years >= 1 && years <= 20) min = min === null ? years : Math.min(min, years);
        }
    }
    return min;
}

export function matchesLevel(job: FeedJob, level: ExperienceLevel) {
    if (level === "any") return true;

    const title = norm(job.title);
    const years = requiredYears(job.description);

    switch (level) {
        case "student":
            return STUDENT_TITLE.test(title);
        case "junior":
            if (STUDENT_TITLE.test(title) && !/\btrainee\b/.test(title)) return false;
            if (SENIOR_TITLE.test(title)) return false;
            return years === null || years <= 3;
        case "mid":
            if (STUDENT_TITLE.test(title) || TOP_TITLE.test(title)) return false;
            return years === null || years <= 6;
        case "senior":
            return !STUDENT_TITLE.test(title) && !JUNIOR_TITLE.test(title);
    }
}

/** JSearch's own experience filter, so the search starts closer to the level. */
export function jsearchRequirements(level: ExperienceLevel) {
    switch (level) {
        case "student":
            return "no_experience";
        case "junior":
            return "under_3_years_experience,no_experience";
        case "senior":
            return "more_than_3_years_experience";
        default:
            return undefined;
    }
}

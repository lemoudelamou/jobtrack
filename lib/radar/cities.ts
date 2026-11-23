/*
 * Where the radar searches. Shared by the server and the settings UI.
 *
 * The profile's `location` stores up to MAX_CITIES cities as a comma list
 * ("Berlin, München, Hamburg"), and `radiusKm` = 0 means anywhere in
 * Germany. Free sources (Arbeitnow) check every city on every run; JSearch
 * has a small monthly allowance, so it searches one city per day, taking
 * turns.
 */

export const MAX_CITIES = 5;
export const ANYWHERE = 0;
export const RADIUS_OPTIONS = [25, 50, 100, ANYWHERE] as const;
export const DEFAULT_RADIUS = 50;

const COUNTRY_NAMES = new Set(["germany", "deutschland", "de"]);

export function parseCities(location: string | null | undefined): string[] {
    const seen = new Set<string>();
    const cities: string[] = [];
    for (const raw of (location ?? "").split(",")) {
        const city = raw.trim().replace(/\s+/g, " ");
        const key = city.toLowerCase();
        // "Germany" isn't a city; with no cities the radar searches all of Germany.
        if (city.length < 2 || seen.has(key) || COUNTRY_NAMES.has(key)) continue;
        seen.add(key);
        cities.push(city);
        if (cities.length === MAX_CITIES) break;
    }
    return cities;
}

export function joinCities(cities: string[]) {
    return parseCities(cities.join(",")).join(", ");
}

/** The city JSearch looks in today; the same all day so caching works. */
export function cityOfTheDay(cities: string[], now = new Date()) {
    if (cities.length === 0) return undefined;
    const day = Math.floor(now.getTime() / 86_400_000);
    return cities[day % cities.length];
}

export function radiusLabel(radiusKm: number) {
    return radiusKm === ANYWHERE ? "Anywhere in Germany" : `${radiusKm} km`;
}

export function describeArea(profile: { location: string; radiusKm: number; remoteOnly: boolean }) {
    if (profile.remoteOnly) return "remote";
    const cities = parseCities(profile.location);
    if (profile.radiusKm === ANYWHERE || cities.length === 0) return "anywhere in Germany, or remote";
    const list =
        cities.length <= 1
            ? cities[0] ?? ""
            : `${cities.slice(0, -1).join(", ")} or ${cities[cities.length - 1]}`;
    return `within ${profile.radiusKm} km of ${list}, or remote`;
}

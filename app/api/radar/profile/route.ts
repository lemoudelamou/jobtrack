import { NextResponse } from "next/server";
import { z } from "zod";

import { getValidSession } from "@/lib/auth/session";
import { badRequest, parseJson, unauthorized, withErrorHandling, zodErrorMessage } from "@/lib/api/server";
import { saveProfile } from "@/lib/radar";
import { DEFAULT_RADIUS, RADIUS_OPTIONS, joinCities, parseCities } from "@/lib/radar/cities";
import { joinTitles, parseTitles } from "@/lib/radar/titles";
import { EXPERIENCE_LEVELS } from "@/lib/radar/filters";
import { SOURCE_MODES } from "@/lib/radar/sources";

const schema = z.object({
    keywords: z.string().trim().max(400).default(""),
    location: z.string().trim().max(300).default(""),
    radiusKm: z.coerce
        .number()
        .int()
        .refine((km) => (RADIUS_OPTIONS as readonly number[]).includes(km), "Choose a radius from the list.")
        .default(DEFAULT_RADIUS),
    remoteOnly: z.boolean().default(false),
    visaOnly: z.boolean().default(false),
    experienceLevel: z.enum(EXPERIENCE_LEVELS).default("any"),
    sourceMode: z.enum(SOURCE_MODES).default("both"),
});

export const PUT = withErrorHandling(async (request) => {
    const session = await getValidSession();
    if (!session?.user?.id) return unauthorized();

    const parsed = schema.safeParse(await parseJson(request));
    if (!parsed.success) return badRequest(zodErrorMessage(parsed.error));

    // Alert emails follow your own alerts, so titles and cities only matter for job search.
    const searching = parsed.data.sourceMode !== "alerts";
    const cities = parseCities(parsed.data.location);
    if (searching && cities.length === 0 && !parsed.data.remoteOnly && parsed.data.radiusKm !== 0) {
        return badRequest("Add at least one city, or search anywhere in Germany.");
    }

    const titles = parseTitles(parsed.data.keywords);
    if (searching && titles.length === 0) return badRequest("Add at least one job title.");

    const profile = await saveProfile(session.user.id, {
        ...parsed.data,
        keywords: joinTitles(titles),
        location: joinCities(cities),
    });
    return NextResponse.json({ profile });
});

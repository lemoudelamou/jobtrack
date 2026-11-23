import { NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";

import { dueProfiles, runRadar } from "@/lib/radar";

export const maxDuration = 300;

/*
 * Daily radar run for every user whose radar is older than 20 hours.
 * Called by a scheduler (vercel.json cron, or any external cron) with
 * `Authorization: Bearer $CRON_SECRET`. Disabled when CRON_SECRET is unset.
 */
function authorized(request: Request) {
    const secret = process.env.CRON_SECRET;
    if (!secret) return false;

    const given = Buffer.from(request.headers.get("authorization") ?? "");
    const expected = Buffer.from(`Bearer ${secret}`);
    return given.length === expected.length && timingSafeEqual(given, expected);
}

export async function GET(request: Request) {
    if (!authorized(request)) {
        return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const startedAt = Date.now();
    const results: Array<{ userId: string; ok: boolean; added?: number; error?: string }> = [];

    for (const { userId } of await dueProfiles()) {
        // Leave headroom before the platform's time limit.
        if (Date.now() - startedAt > 240_000) break;

        try {
            const result = await runRadar(userId);
            results.push({ userId, ok: true, added: result.added });
        } catch (error) {
            results.push({ userId, ok: false, error: error instanceof Error ? error.message : "failed" });
        }
    }

    return NextResponse.json({ ran: results.length, results });
}

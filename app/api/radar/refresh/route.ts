import { NextResponse } from "next/server";

import { getValidSession } from "@/lib/auth/session";
import { consumeUserQuota } from "@/lib/auth/rate-limit";
import { apiError, tooManyRequests, unauthorized, withErrorHandling } from "@/lib/api/server";
import { RadarError, runRadar } from "@/lib/radar";

export const maxDuration = 60;

export const POST = withErrorHandling(async () => {
    const session = await getValidSession();
    if (!session?.user?.id) return unauthorized();

    if (!(await consumeUserQuota("radar-refresh", session.user.id))) {
        return tooManyRequests("The radar was refreshed several times just now. Try again in a few minutes.");
    }

    try {
        const result = await runRadar(session.user.id);
        return NextResponse.json(result);
    } catch (error) {
        if (error instanceof RadarError) return apiError(error.message, error.status);
        throw error;
    }
});

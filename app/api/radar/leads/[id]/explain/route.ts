import { NextResponse } from "next/server";

import { getValidSession } from "@/lib/auth/session";
import { consumeUserQuota } from "@/lib/auth/rate-limit";
import { apiError, badRequest, tooManyRequests, unauthorized, withErrorHandling } from "@/lib/api/server";
import { RadarError, explainLead, getResumeForUser } from "@/lib/radar";

/** POST /api/radar/leads/:id/explain -> on-demand AI explanation. */
export const POST = withErrorHandling(
    async (_request: Request, context: { params: Promise<{ id: string }> }) => {
        const session = await getValidSession();
        if (!session?.user?.id) return unauthorized();

        const userId = session.user.id;
        const id = Number((await context.params).id);
        if (!Number.isInteger(id) || id <= 0) return badRequest("Invalid match id.");

        if (!process.env.GEMINI_API_KEY) return apiError("AI explanations aren't set up on this server.", 501);

        const resume = await getResumeForUser(userId);
        if (!resume?.chunks) return badRequest("Upload your CV first.");

        if (!(await consumeUserQuota("radar-explain", userId))) {
            return tooManyRequests("You've asked for a lot of explanations just now. Try again in a few minutes.");
        }

        try {
            const explanation = await explainLead(userId, id, resume.id);
            return NextResponse.json(explanation);
        } catch (error) {
            if (error instanceof RadarError) return apiError(error.message, error.status);
            throw error;
        }
    },
);

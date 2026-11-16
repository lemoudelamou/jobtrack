import { NextResponse } from "next/server";
import { z } from "zod";
import { getAuthedUser } from "@/lib/auth-user";
import { prisma } from "@/lib/prisma";
import { searchResume } from "@/lib/search-resume";
import { consumeUserQuota } from "@/lib/auth/rate-limit";
import {
    badRequest,
    notFound,
    parseJson,
    tooManyRequests,
    unauthorized,
    withErrorHandling,
    zodErrorMessage,
} from "@/lib/api/server";

const DEFAULT_RESULT_LIMIT = 5;
const MAX_RESULT_LIMIT = 20;

const searchSchema = z.object({
    query: z
        .string()
        .trim()
        .min(1, "Query is required.")
        .max(500, "Query must be 500 characters or fewer."),
    // Optional so existing callers that don't send it keep the old default.
    limit: z.coerce.number().int().min(1).max(MAX_RESULT_LIMIT).optional(),
});

export const POST = withErrorHandling(async (request) => {
    const user = await getAuthedUser();
    if (!user) return unauthorized();

    const body = await parseJson(request);
    const result = searchSchema.safeParse(body);

    if (!result.success) {
        return badRequest(zodErrorMessage(result.error));
    }

    const { query, limit } = result.data;

    const resume = await prisma.resume.findUnique({
        where: { userId: user.id },
        select: { id: true },
    });

    if (!resume) {
        return notFound("No resume found.");
    }

    if (!(await consumeUserQuota("resume-search", user.id))) {
        return tooManyRequests("Too many searches. Please wait a few minutes and try again.");
    }

    const results = await searchResume(resume.id, query, limit ?? DEFAULT_RESULT_LIMIT);

    return NextResponse.json({ query, results });
});
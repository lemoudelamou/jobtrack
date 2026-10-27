import { prisma } from "@/lib/prisma";

import {
    createPasswordResetToken,
} from "@/lib/auth/password-reset";

import {
    getClientIp,
    isPasswordResetRateLimited,
    recordPasswordResetRequest,
} from "@/lib/auth/rate-limit";

import {
    badRequest,
    tooManyRequests,
    parseJson,
    withErrorHandling,
} from "@/lib/api/server";

const MAX_EMAIL_LENGTH = 320;

export const POST = withErrorHandling(async (request) => {
    const body = await parseJson(request);

    if (
        typeof body !== "object" ||
        body === null
    ) {
        return badRequest("Invalid request body.");
    }

    const email =
        "email" in body &&
        typeof body.email === "string"
            ? body.email.trim().toLowerCase()
            : "";

    if (
        !email ||
        email.length > MAX_EMAIL_LENGTH
    ) {
        return badRequest(
            "Please enter a valid email address.",
        );
    }

    const ip = getClientIp(
        request.headers,
    );

    const rateLimited =
        await isPasswordResetRateLimited(
            email,
            ip,
        );

    if (rateLimited) {
        return tooManyRequests(
            "Too many password reset requests. Please wait 15 minutes and try again.",
        );
    }

    await recordPasswordResetRequest(
        email,
        ip,
    );

    const user =
        await prisma.user.findUnique({
            where: {
                email,
            },
            select: {
                id: true,
                email: true,
            },
        });

    if (user?.email) {
        await createPasswordResetToken(
            user.id,
            user.email,
        );
    }

    return Response.json({
        message:
            "If an account exists for that email, a password reset link has been sent.",
    });
});
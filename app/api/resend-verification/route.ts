import { prisma } from "@/lib/prisma";

import {
    canResendVerificationEmail,
    createEmailVerificationToken,
} from "@/lib/auth/email-verification";

import {
    parseJson,
    withErrorHandling,
} from "@/lib/api/server";

export const POST = withErrorHandling(
    async (request: Request) => {
        const body =
            await parseJson(request);

        /*
         * Always return the same response.
         * This prevents email/account enumeration.
         */
        const genericResponse =
            Response.json({
                message:
                    "If your account requires email verification, a new verification email has been sent.",
            });

        if (
            typeof body !== "object" ||
            body === null
        ) {
            return genericResponse;
        }

        const email =
            "email" in body &&
                typeof body.email === "string"
                ? body.email.trim().toLowerCase()
                : "";

        if (!email) {
            return genericResponse;
        }

        const user =
            await prisma.user.findUnique({
                where: {
                    email,
                },
                select: {
                    id: true,
                    email: true,
                    emailVerified: true,
                },
            });

        if (!user || user.emailVerified) {
            return genericResponse;
        }

        const allowed =
            await canResendVerificationEmail(
                user.id,
            );

        if (!allowed) {
            return genericResponse;
        }

        await createEmailVerificationToken(
            user.id,
            user.email!,
        );

        return genericResponse;
    },
);
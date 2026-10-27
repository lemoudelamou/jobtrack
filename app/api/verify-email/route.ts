import { verifyEmailToken } from "@/lib/auth/email-verification";

import {
    withErrorHandling,
} from "@/lib/api/server";

export const GET = withErrorHandling(
    async (request: Request) => {
        const url =
            new URL(request.url);

        const token =
            url.searchParams.get("token");

        console.log("VERIFY EMAIL", {
            hasToken: Boolean(token),
            tokenLength:
                token?.length ?? 0,
        });

        if (!token) {
            return Response.redirect(
                new URL(
                    "/login?error=invalid_verification",
                    request.url,
                ),
            );
        }

        const verified =
            await verifyEmailToken(token);

        console.log("VERIFY EMAIL RESULT", {
            verified,
        });

        if (!verified) {
            return Response.redirect(
                new URL(
                    "/login?error=invalid_verification",
                    request.url,
                ),
            );
        }

        return Response.redirect(
            new URL(
                "/login?verified=true",
                request.url,
            ),
        );
    },
);
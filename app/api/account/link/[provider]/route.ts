import { auth } from "@/auth";
import {
    badRequest,
    withErrorHandling,
} from "@/lib/api/server";

const allowedProviders = [
    "google",
    "github",
] as const;

type Provider = (typeof allowedProviders)[number];

function isAllowedProvider(
    provider: string,
): provider is Provider {
    return allowedProviders.includes(
        provider as Provider,
    );
}

export const GET = withErrorHandling(
    async (
        request: Request,
        context: {
            params: Promise<{
                provider: string;
            }>;
        },
    ) => {
        const session = await auth();

        if (!session?.user?.email) {
            return Response.redirect(
                new URL("/login", request.url),
            );
        }

        const { provider } = await context.params;

        if (!isAllowedProvider(provider)) {
            return badRequest(
                "Unsupported provider.",
            );
        }

        const callbackUrl =
            `/api/account/link/${provider}/callback`;

        const searchParams = new URLSearchParams({
            callbackUrl,
        });

        return Response.redirect(
            new URL(
                `/api/auth/signin/${provider}?${searchParams.toString()}`,
                request.url,
            ),
        );
    },
);

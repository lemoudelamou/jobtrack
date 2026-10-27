
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { withErrorHandling } from "@/lib/api/server";

const allowedProviders = ["google", "github"] as const;

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
            return Response.redirect(
                new URL(
                    "/settings?error=unsupported-provider",
                    request.url,
                ),
            );
        }

        const user = await prisma.user.findUnique({
            where: {
                email: session.user.email,
            },
            select: {
                id: true,
            },
        });

        if (!user) {
            return Response.redirect(
                new URL("/login", request.url),
            );
        }

        return Response.redirect(
            new URL("/settings", request.url),
        );
    },
);

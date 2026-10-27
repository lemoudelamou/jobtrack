import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

import {
    badRequest,
    unauthorized,
    notFound,
    conflict,
    withErrorHandling,
} from "@/lib/api/server";

type RouteContext = {
    params: Promise<{
        id: string;
    }>;
};

export const DELETE = withErrorHandling(
    async (
        _request: Request,
        context: RouteContext,
    ) => {
        const session = await auth();

        if (!session?.user?.id) {
            return unauthorized(
                "You must be signed in.",
            );
        }

        const { id } =
            await context.params;

        if (!id) {
            return badRequest(
                "Passkey ID is required.",
            );
        }

        const user =
            await prisma.user.findUnique({
                where: {
                    id: session.user.id,
                },
                select: {
                    id: true,
                    passwordHash: true,

                    accounts: {
                        select: {
                            id: true,
                        },
                    },

                    passkeys: {
                        select: {
                            id: true,
                        },
                    },
                },
            });

        if (!user) {
            return notFound(
                "User not found.",
            );
        }

        const hasOtherSignInMethod =
            Boolean(user.passwordHash) ||
            user.accounts.length > 0 ||
            user.passkeys.length > 1;

        if (!hasOtherSignInMethod) {
            return conflict(
                "You cannot remove your only sign-in method. Add a password or connect another account first.",
            );
        }

        /*
         * The userId is deliberately included in the
         * delete condition. This prevents deleting
         * another user's passkey even if its ID is known.
         */
        const deleted =
            await prisma.passkey.deleteMany({
                where: {
                    id,
                    userId: user.id,
                },
            });

        if (deleted.count !== 1) {
            return notFound(
                "Passkey not found.",
            );
        }

        return Response.json({
            success: true,
        });
    },
);
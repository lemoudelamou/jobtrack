import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

import { verifyRegistration } from "@/lib/auth/passkey";
import {
    consumePasskeyChallenge,
} from "@/lib/auth/passkey-challenge";

import {
    unauthorized,
    badRequest,
    internalServerError,
    withErrorHandling,
} from "@/lib/api/server";

export const POST = withErrorHandling(
    async (request: Request) => {
        const session = await auth();

        if (!session?.user?.id) {
            return unauthorized(
                "You must be signed in.",
            );
        }

        const challenge =
            await consumePasskeyChallenge(
                "registration",
                session.user.id,
            );

        if (!challenge) {
            return badRequest(
                "Passkey registration session expired. Please try again.",
            );
        }

        const response =
            await request.json();

        const result =
            await verifyRegistration(
                session.user.id,
                response,
                challenge,
            );

        if (!result.verified) {
            return badRequest(
                result.error ||
                "Passkey registration failed.",
            );
        }

        /*
         * Load the passkey that was just created so the client
         * can immediately add it to its local state.
         *
         * response.id is the WebAuthn credential ID returned
         * by the browser and stored by verifyRegistration().
         */
        const passkey =
            await prisma.passkey.findFirst({
                where: {
                    userId:
                        session.user.id,
                    credentialId:
                        response.id,
                },
                select: {
                    id: true,
                    deviceType: true,
                    backedUp: true,
                    createdAt: true,
                },
            });

        if (!passkey) {
            return internalServerError(
                "Passkey was registered but could not be loaded.",
            );
        }

        return Response.json({
            verified: true,
            passkey: {
                id: passkey.id,
                deviceType:
                    passkey.deviceType,
                backedUp:
                    passkey.backedUp,
                createdAt:
                    passkey.createdAt.toISOString(),
            },
        });
    },
);
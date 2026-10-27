import { auth } from "@/auth";

import {
    createRegistrationOptions,
} from "@/lib/auth/passkey";

import {
    storePasskeyChallenge,
} from "@/lib/auth/passkey-challenge";

import {
    unauthorized,
    withErrorHandling,
} from "@/lib/api/server";

export const GET = withErrorHandling(
    async () => {
        const session =
            await auth();

        if (!session?.user?.id) {
            return unauthorized(
                "You must be signed in.",
            );
        }

        const userName =
            session.user.email ||
            session.user.name ||
            session.user.id;

        const options =
            await createRegistrationOptions(
                session.user.id,
                userName,
            );

        await storePasskeyChallenge(
            options.challenge,
            "registration",
            session.user.id,
        );

        return Response.json(
            options,
        );
    },
);
import { createAuthenticationOptions } from "@/lib/auth/passkey";
import { storePasskeyChallenge } from "@/lib/auth/passkey-challenge";

import { withErrorHandling } from "@/lib/api/server";

export const GET = withErrorHandling(
    async () => {
        const options =
            await createAuthenticationOptions();

        await storePasskeyChallenge(
            options.challenge,
            "authentication",
        );

        return Response.json(options);
    },
);
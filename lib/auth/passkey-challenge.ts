import { prisma } from "@/lib/prisma";

const CHALLENGE_DURATION_MS =
    2 * 60 * 1000;

type ChallengePurpose =
    | "registration"
    | "authentication";

export async function storePasskeyChallenge(
    challenge: string,
    purpose: ChallengePurpose,
    userId?: string,
) {
    if (!challenge) {
        throw new Error(
            "A WebAuthn challenge is required.",
        );
    }

    if (
        purpose === "registration" &&
        !userId
    ) {
        throw new Error(
            "A user ID is required for registration challenges.",
        );
    }

    if (
        purpose === "authentication" &&
        userId
    ) {
        throw new Error(
            "Authentication challenges must not contain a user ID.",
        );
    }

    const expiresAt =
        new Date(
            Date.now() +
            CHALLENGE_DURATION_MS,
        );

    await prisma.passkeyChallenge.create({
        data: {
            challenge,
            purpose,
            userId:
                purpose === "registration"
                    ? userId
                    : null,
            expiresAt,
        },
    });
}

export async function consumePasskeyChallenge(
    purpose: ChallengePurpose,
    userId?: string,
    /*
     * For authentication, the exact challenge the browser signed
     * (read from clientDataJSON). Authentication challenges aren't tied
     * to a user, so without this we would grab whichever challenge was
     * issued most recently - possibly to someone else's browser.
     */
    expectedChallenge?: string,
) {
    if (
        purpose === "registration" &&
        !userId
    ) {
        return null;
    }

    if (
        purpose === "authentication" &&
        !expectedChallenge
    ) {
        return null;
    }

    /*
     * Find the newest valid challenge first.
     *
     * We intentionally do not perform global
     * expired-challenge cleanup here. Cleanup is
     * housekeeping and should not be part of the
     * authentication-critical path.
     */
    const challenge =
        await prisma.passkeyChallenge.findFirst({
            where: {
                purpose,
                ...(expectedChallenge
                    ? {
                        challenge:
                            expectedChallenge,
                    }
                    : {}),
                expiresAt: {
                    gt: new Date(),
                },
                ...(purpose === "registration"
                    ? {
                        userId,
                    }
                    : {
                        userId: null,
                    }),
            },
            orderBy: {
                createdAt: "desc",
            },
            select: {
                id: true,
                challenge: true,
            },
        });

    if (!challenge) {
        return null;
    }

    /*
     * Consume the exact challenge we just selected.
     *
     * The challenge is only considered consumed if
     * this DELETE succeeds.
     */
    const consumed =
        await prisma.passkeyChallenge.deleteMany({
            where: {
                id: challenge.id,
                purpose,
                ...(purpose === "registration"
                    ? {
                        userId,
                    }
                    : {
                        userId: null,
                    }),
                expiresAt: {
                    gt: new Date(),
                },
            },
        });

    if (consumed.count !== 1) {
        return null;
    }

    return challenge.challenge;
}

export async function cleanupExpiredPasskeyChallenges() {
    return prisma.passkeyChallenge.deleteMany({
        where: {
            expiresAt: {
                lte: new Date(),
            },
        },
    });
}
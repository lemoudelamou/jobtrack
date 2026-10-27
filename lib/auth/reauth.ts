import crypto from "crypto";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";

import { prisma } from "@/lib/prisma";
import {
    hashPassword,
    isArgon2Hash,
    verifyPassword,
} from "@/lib/auth/password";
import {
    clearReauthAttempts,
    getReauthBackoffMs,
    isReauthRateLimited,
    recordFailedReauth,
} from "@/lib/auth/rate-limit";
const REAUTH_COOKIE = "jobtrack-reauth";

const REAUTH_DURATION_MS =
    10 * 60 * 1000;

function getSecret() {
    const secret =
        process.env.AUTH_SECRET;

    if (!secret) {
        throw new Error(
            "AUTH_SECRET is not configured.",
        );
    }

    return secret;
}

function createSignature(
    userId: string,
    expiresAt: number,
) {
    return crypto
        .createHmac(
            "sha256",
            getSecret(),
        )
        .update(
            `${userId}.${expiresAt}`,
        )
        .digest("hex");
}

function createToken(
    userId: string,
    expiresAt: number,
) {
    const signature =
        createSignature(
            userId,
            expiresAt,
        );

    return [
        userId,
        expiresAt,
        signature,
    ].join(".");
}

function verifyToken(
    token: string | undefined,
    userId: string,
) {
    if (!token) {
        return false;
    }

    const parts = token.split(".");

    if (parts.length !== 3) {
        return false;
    }

    const [
        tokenUserId,
        expiresAtString,
        signature,
    ] = parts;

    if (tokenUserId !== userId) {
        return false;
    }

    const expiresAt =
        Number(expiresAtString);

    if (
        !Number.isSafeInteger(
            expiresAt,
        )
    ) {
        return false;
    }

    if (
        expiresAt <= Date.now()
    ) {
        return false;
    }

    const expectedSignature =
        createSignature(
            tokenUserId,
            expiresAt,
        );

    const actualBuffer =
        Buffer.from(
            signature,
            "hex",
        );

    const expectedBuffer =
        Buffer.from(
            expectedSignature,
            "hex",
        );

    if (
        actualBuffer.length !==
        expectedBuffer.length
    ) {
        return false;
    }

    return crypto.timingSafeEqual(
        actualBuffer,
        expectedBuffer,
    );
}

export async function createReauthGrant(
    userId: string,
) {
    const expiresAt =
        Date.now() +
        REAUTH_DURATION_MS;

    const token = createToken(
        userId,
        expiresAt,
    );

    const cookieStore =
        await cookies();

    cookieStore.set({
        name: REAUTH_COOKIE,
        value: token,
        httpOnly: true,
        secure:
            process.env.NODE_ENV ===
            "production",
        sameSite: "lax",
        path: "/dashboard",
        expires: new Date(
            expiresAt,
        ),
    });
}

export async function hasRecentReauthentication(
    userId: string,
) {
    const cookieStore =
        await cookies();

    const token =
        cookieStore.get(
            REAUTH_COOKIE,
        )?.value;

    return verifyToken(
        token,
        userId,
    );
}

export async function clearReauthGrant() {
    const cookieStore =
        await cookies();

    cookieStore.delete(
        REAUTH_COOKIE,
    );
}


export async function reauthenticateUser(
    userId: string,
    password: string,
) {
    if (!password) {
        return false;
    }

    const rateLimited =
        await isReauthRateLimited(
            userId,
        );

    if (rateLimited) {
        return false;
    }

    const backoffMs =
        await getReauthBackoffMs(
            userId,
        );

    if (backoffMs > 0) {
        await new Promise((resolve) =>
            setTimeout(
                resolve,
                backoffMs,
            ),
        );
    }

    const user =
        await prisma.user.findUnique({
            where: {
                id: userId,
            },
            select: {
                passwordHash: true,
            },
        });

    if (!user?.passwordHash) {
        await recordFailedReauth(
            userId,
        );

        return false;
    }

    let passwordMatches = false;

    /*
     * New passwords use Argon2id.
     */
    if (
        isArgon2Hash(
            user.passwordHash,
        )
    ) {
        passwordMatches =
            await verifyPassword(
                password,
                user.passwordHash,
            );
    } else {
        /*
         * Support existing bcrypt hashes.
         *
         * Successful verification upgrades
         * the hash to Argon2id.
         */
        passwordMatches =
            await bcrypt.compare(
                password,
                user.passwordHash,
            );

        if (passwordMatches) {
            const upgradedHash =
                await hashPassword(
                    password,
                );

            await prisma.user.update({
                where: {
                    id: userId,
                },
                data: {
                    passwordHash:
                        upgradedHash,
                },
            });
        }
    }

    if (!passwordMatches) {
        await recordFailedReauth(
            userId,
        );

        return false;
    }

    await clearReauthAttempts(
        userId,
    );

    await createReauthGrant(
        userId,
    );

    return true;
}


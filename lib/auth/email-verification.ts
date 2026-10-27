import crypto from "crypto";

import { prisma } from "@/lib/prisma";
import { sendVerificationEmail } from "@/lib/email";

const TOKEN_EXPIRATION_MS = 30 * 60 * 1000;
const RESEND_COOLDOWN_MS = 60 * 1000;

function hashToken(token: string) {
    return crypto
        .createHash("sha256")
        .update(token)
        .digest("hex");
}

export async function createEmailVerificationToken(
    userId: string,
    email: string,
) {
    const now = new Date();

    await prisma.emailVerificationToken.deleteMany({
        where: {
            OR: [
                {
                    userId,
                },
                {
                    expiresAt: {
                        lte: now,
                    },
                },
            ],
        },
    });

    const token = crypto
        .randomBytes(32)
        .toString("hex");

    const tokenHash = hashToken(token);

    const expiresAt = new Date(
        now.getTime() +
        TOKEN_EXPIRATION_MS,
    );

    const verificationToken =
        await prisma.emailVerificationToken.create({
            data: {
                userId,
                tokenHash,
                expiresAt,
            },
        });

    try {
        await sendVerificationEmail(
            email,
            token,
        );
    } catch (error) {
        await prisma.emailVerificationToken.deleteMany({
            where: {
                id: verificationToken.id,
            },
        });

        throw error;
    }
}

export async function canResendVerificationEmail(
    userId: string,
) {
    const latestToken =
        await prisma.emailVerificationToken.findFirst({
            where: {
                userId,
            },
            orderBy: {
                createdAt: "desc",
            },
            select: {
                createdAt: true,
            },
        });

    if (!latestToken) {
        return true;
    }

    return (
        Date.now() -
        latestToken.createdAt.getTime() >=
        RESEND_COOLDOWN_MS
    );
}

export async function verifyEmailToken(
    token: string,
) {
    if (
        typeof token !== "string" ||
        token.length !== 64
    ) {
        return false;
    }

    const tokenHash = hashToken(token);

    const verificationToken =
        await prisma.emailVerificationToken.findUnique({
            where: {
                tokenHash,
            },
            select: {
                id: true,
                userId: true,
                expiresAt: true,
            },
        });

    if (!verificationToken) {
        return false;
    }

    const now = new Date();

    if (
        verificationToken.expiresAt <= now
    ) {
        await prisma.emailVerificationToken.deleteMany({
            where: {
                id: verificationToken.id,
            },
        });

        return false;
    }

    /*
     * Consume the token first.
     *
     * deleteMany gives us an atomic "claim":
     * exactly one request can successfully consume
     * this token.
     */
    const consumed =
        await prisma.emailVerificationToken.deleteMany({
            where: {
                id: verificationToken.id,
                tokenHash,
                expiresAt: {
                    gt: now,
                },
            },
        });

    if (consumed.count !== 1) {
        return false;
    }

    try {
        await prisma.user.update({
            where: {
                id: verificationToken.userId,
            },
            data: {
                emailVerified: now,
            },
        });

        return true;
    } catch (error) {
        /*
         * The token has already been consumed. We intentionally
         * do not restore it because verification tokens must be
         * one-time credentials.
         */
        console.error(
            "Email verification user update failed:",
            error,
        );

        return false;
    }
}
import crypto from "crypto";

import { prisma } from "@/lib/prisma";
import { sendPasswordResetEmail } from "@/lib/email";

const TOKEN_EXPIRATION_MS =
    30 * 60 * 1000;

function hashToken(token: string) {
    return crypto
        .createHash("sha256")
        .update(token)
        .digest("hex");
}

export function hashPasswordResetToken(
    token: string,
) {
    return hashToken(token);
}

export async function createPasswordResetToken(
    userId: string,
    email: string,
    purpose: "reset" | "set" = "reset",
) {
    const now =
        new Date();

    await prisma.passwordResetToken.deleteMany(
        {
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
        },
    );

    const token =
        crypto
            .randomBytes(32)
            .toString("hex");

    const tokenHash =
        hashToken(token);

    const expiresAt =
        new Date(
            now.getTime() +
            TOKEN_EXPIRATION_MS,
        );

    const resetToken =
        await prisma.passwordResetToken.create(
            {
                data: {
                    userId,
                    tokenHash,
                    expiresAt,
                },
            },
        );

    try {
        await sendPasswordResetEmail(
            email,
            token,
            purpose,
        );
    } catch (error) {
        await prisma.passwordResetToken.deleteMany(
            {
                where: {
                    id: resetToken.id,
                },
            },
        );

        throw error;
    }
}
import { sendPasswordChangedEmail } from "@/lib/email";
import { prisma } from "@/lib/prisma";

import {
    hashPassword,
    validatePassword,
} from "@/lib/auth/password";

import {
    hashPasswordResetToken,
} from "@/lib/auth/password-reset";

import {
    badRequest,
    parseJson,
    withErrorHandling,
} from "@/lib/api/server";

export const POST = withErrorHandling(
    async (request: Request) => {
        const body =
            await parseJson(request);

        if (
            typeof body !== "object" ||
            body === null
        ) {
            return badRequest(
                "Reset token and password are required.",
            );
        }

        const token =
            "token" in body &&
                typeof body.token === "string"
                ? body.token
                : "";

        const password =
            "password" in body &&
                typeof body.password === "string"
                ? body.password
                : "";

        if (
            !token ||
            !password
        ) {
            return badRequest(
                "Reset token and password are required.",
            );
        }

        if (
            token.length !== 64
        ) {
            return badRequest(
                "This password reset link is invalid or has expired.",
            );
        }

        const passwordError =
            validatePassword(
                password,
            );

        if (passwordError) {
            return badRequest(
                passwordError,
            );
        }

        /*
         * Hash before opening the transaction.
         *
         * Argon2 is intentionally expensive,
         * so we don't want to hold a database
         * transaction open while hashing.
         */
        const passwordHash =
            await hashPassword(
                password,
            );

        const tokenHash =
            hashPasswordResetToken(
                token,
            );

        const now =
            new Date();

        let resetUserId: string | null = null;

        const resetSucceeded =
            await prisma.$transaction(
                async (tx) => {
                    const resetToken =
                        await tx.passwordResetToken.findUnique(
                            {
                                where: {
                                    tokenHash,
                                },
                                select: {
                                    id: true,
                                    userId: true,
                                    expiresAt:
                                        true,
                                },
                            },
                        );

                    if (
                        !resetToken
                    ) {
                        return false;
                    }

                    if (
                        resetToken.expiresAt <=
                        now
                    ) {
                        await tx.passwordResetToken.deleteMany(
                            {
                                where: {
                                    id: resetToken.id,
                                },
                            },
                        );

                        return false;
                    }

                    /*
                     * Atomically consume the token.
                     *
                     * If two requests arrive
                     * simultaneously, only one
                     * can delete it.
                     */
                    const consumed =
                        await tx.passwordResetToken.deleteMany(
                            {
                                where: {
                                    id: resetToken.id,
                                    tokenHash,
                                    expiresAt: {
                                        gt: now,
                                    },
                                },
                            },
                        );

                    if (
                        consumed.count !==
                        1
                    ) {
                        return false;
                    }

                    /*
                     * Change the password and
                     * invalidate existing JWT
                     * sessions.
                     */
                    await tx.user.update({
                        where: {
                            id: resetToken.userId,
                        },
                        data: {
                            passwordHash,
                            sessionVersion: {
                                increment: 1,
                            },
                        },
                    });

                    /*
                     * Remove any other outstanding
                     * password reset tokens.
                     */
                    await tx.passwordResetToken.deleteMany(
                        {
                            where: {
                                userId:
                                    resetToken.userId,
                            },
                        },
                    );

                    resetUserId = resetToken.userId;
                    return true;
                },
            );

        if (
            !resetSucceeded
        ) {
            return badRequest(
                "This password reset link is invalid or has expired.",
            );
        }

        const owner = await prisma.user.findUnique({
            where: { id: resetUserId ?? "" },
            select: { email: true },
        });
        if (owner?.email) await sendPasswordChangedEmail(owner.email);

        return Response.json({
            message:
                "Your password has been reset successfully.",
        });
    },
);
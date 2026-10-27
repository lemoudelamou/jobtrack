import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import type { AuthenticationResponseJSON } from "@simplewebauthn/types";

import { PrismaAdapter } from "@auth/prisma-adapter";

import { prisma } from "@/lib/prisma";

import {
    isArgon2Hash,
    verifyPassword,
    hashPassword,
} from "@/lib/auth/password";

import {
    isLoginRateLimited,
    getLoginBackoffMs,
    recordFailedLogin,
    clearLoginAttempts,
    getClientIp,
    isPasskeyRateLimited,
    recordFailedPasskey,
    clearPasskeyAttempts,
} from "@/lib/auth/rate-limit";

import {
    verifyAuthentication,
} from "@/lib/auth/passkey";

import {
    consumePasskeyChallenge,
} from "@/lib/auth/passkey-challenge";

import bcrypt from "bcryptjs";

/**
 * Reads the challenge the authenticator signed from clientDataJSON.
 */
function getSignedChallenge(
    response: AuthenticationResponseJSON,
): string | null {
    try {
        const clientData = JSON.parse(
            Buffer.from(
                response.response.clientDataJSON,
                "base64url",
            ).toString("utf8"),
        ) as { challenge?: unknown };

        return typeof clientData.challenge === "string"
            ? clientData.challenge
            : null;
    } catch {
        return null;
    }
}

export const {
    handlers,
    signIn,
    signOut,
    auth,
    unstable_update: updateSession,
} = NextAuth({
    adapter: PrismaAdapter(prisma),

    session: {
        strategy: "jwt",
    },

    pages: {
        signIn: "/login",
        error: "/login",
    },

    providers: [
        /*
         * GitHub OAuth
         */
        GitHub({
            clientId: process.env.AUTH_GITHUB_ID,
            clientSecret: process.env.AUTH_GITHUB_SECRET,
        }),

        /*
         * Google OAuth
         */
        Google({
            clientId: process.env.AUTH_GOOGLE_ID,
            clientSecret: process.env.AUTH_GOOGLE_SECRET,
        }),

        /*
         * Email + password
         */
        Credentials({
            id: "credentials",
            name: "Email and password",

            credentials: {
                email: {
                    label: "Email",
                    type: "email",
                },

                password: {
                    label: "Password",
                    type: "password",
                },
            },

            async authorize(credentials, request) {
                const email =
                    typeof credentials?.email === "string"
                        ? credentials.email.trim().toLowerCase()
                        : "";

                const password =
                    typeof credentials?.password === "string"
                        ? credentials.password
                        : "";

                if (!email || !password) {
                    return null;
                }

                const ip = getClientIp(request.headers);

                /*
                 * Rate-limit password login attempts
                 * by both email and IP.
                 */
                const rateLimited =
                    await isLoginRateLimited(
                        email,
                        ip,
                    );

                if (rateLimited) {
                    return null;
                }

                /*
                 * Progressive delay after failed attempts.
                 */
                const backoffMs =
                    await getLoginBackoffMs(
                        email,
                        ip,
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
                            email,
                        },

                        select: {
                            id: true,
                            email: true,
                            name: true,
                            image: true,
                            passwordHash: true,
                            emailVerified: true,
                        },
                    });

                /*
                 * Do not reveal whether the account exists,
                 * has a password, or has been verified.
                 */
                if (
                    !user ||
                    !user.passwordHash ||
                    !user.emailVerified
                ) {
                    await recordFailedLogin(
                        email,
                        ip,
                    );

                    return null;
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
                     * Existing bcrypt hashes are supported
                     * for migration.
                     */
                    passwordMatches =
                        await bcrypt.compare(
                            password,
                            user.passwordHash,
                        );

                    /*
                     * Upgrade bcrypt -> Argon2id after
                     * successful authentication.
                     */
                    if (passwordMatches) {
                        const upgradedHash =
                            await hashPassword(
                                password,
                            );

                        await prisma.user.update({
                            where: {
                                id: user.id,
                            },

                            data: {
                                passwordHash:
                                    upgradedHash,
                            },
                        });
                    }
                }

                if (!passwordMatches) {
                    await recordFailedLogin(
                        email,
                        ip,
                    );

                    return null;
                }

                /*
                 * Successful login clears the failed-attempt
                 * history for this email/IP combination.
                 */
                await clearLoginAttempts(
                    email,
                    ip,
                );

                return {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    image: user.image,
                };
            },
        }),

        /*
         * Passkey authentication
         */
        Credentials({
            id: "passkey",
            name: "Passkey",

            credentials: {
                response: {
                    label: "Passkey response",
                    type: "text",
                },
            },

            async authorize(credentials, request) {
                const response =
                    typeof credentials?.response === "string"
                        ? credentials.response
                        : "";

                if (!response) {
                    return null;
                }

                const ip =
                    getClientIp(
                        request.headers,
                    );

                /*
                 * IP-based passkey rate limiting.
                 */
                const rateLimited =
                    await isPasskeyRateLimited(
                        ip,
                    );

                if (rateLimited) {
                    return null;
                }

                /*
                 * Parse the WebAuthn response.
                 */
                let parsedResponse:
                    AuthenticationResponseJSON;

                try {
                    parsedResponse =
                        JSON.parse(
                            response,
                        ) as AuthenticationResponseJSON;
                } catch {
                    await recordFailedPasskey(
                        ip,
                    );

                    return null;
                }

                /*
                 * Consume the exact one-time challenge this
                 * browser signed. The signature itself is still
                 * verified against it below.
                 */
                const challenge =
                    await consumePasskeyChallenge(
                        "authentication",
                        undefined,
                        getSignedChallenge(
                            parsedResponse,
                        ) ?? undefined,
                    );

                if (!challenge) {
                    await recordFailedPasskey(
                        ip,
                    );

                    return null;
                }

                /*
                 * Verify the WebAuthn assertion.
                 */
                const result =
                    await verifyAuthentication(
                        parsedResponse,
                        challenge,
                    );

                if (
                    !result.verified ||
                    !result.user
                ) {
                    await recordFailedPasskey(
                        ip,
                    );

                    return null;
                }

                await clearPasskeyAttempts(
                    ip,
                );

                /*
                 * Your existing verifyAuthentication()
                 * returns the authenticated user here.
                 */
                return {
                    id: result.user.id,
                    email: result.user.email,
                    name: result.user.name,
                    image: result.user.image,
                };
            },
        }),
    ],

    callbacks: {
        /*
         * JWT CALLBACK
         *
         * sessionVersion is intentionally loaded from the
         * database ONLY when a user initially signs in.
         *
         * DO NOT query the database on every JWT callback.
         *
         * This allows password changes to invalidate old JWTs:
         *
         * Old JWT:
         *   sessionVersion = 0
         *
         * Database after password change:
         *   sessionVersion = 1
         *
         * requireValidSession() detects the mismatch and
         * redirects the old session to /login.
         */
        async jwt({
            token,
            user,
            trigger,
            session,
        }) {
            /*
             * Settings → Profile renames the user; keep the token in step
             * so the navbar shows the new name without signing in again.
             */
            if (
                trigger === "update" &&
                typeof session?.user?.name === "string"
            ) {
                token.name = session.user.name;
            }

            if (user?.id) {
                const dbUser =
                    await prisma.user.findUnique({
                        where: {
                            id: user.id,
                        },

                        select: {
                            sessionVersion: true,
                        },
                    });

                if (!dbUser) {
                    return token;
                }

                token.sub = user.id;

                token.sessionVersion =
                    dbUser.sessionVersion;
            }

            return token;
        },

        /*
         * SESSION CALLBACK
         *
         * Copies the user ID and sessionVersion from
         * the JWT into the Auth.js session object.
         */
        async session({
            session,
            token,
        }) {
            if (
                session.user &&
                token.sub
            ) {
                session.user.id =
                    token.sub;
            }

            if (
                typeof token.sessionVersion ===
                "number"
            ) {
                session.sessionVersion =
                    token.sessionVersion;
            }

            return session;
        },

        /*
         * SIGN-IN CALLBACK
         *
         * OAuth account linking remains controlled by
         * Auth.js/Prisma.
         *
         * We intentionally do NOT enable:
         *
         * allowDangerousEmailAccountLinking: true
         *
         * because that would weaken account-linking
         * security.
         */
        async signIn({
            user,
            account,
        }) {
            if (!user.id) {
                return false;
            }

            /*
             * Credentials authentication has already
             * performed password/passkey verification.
             */
            if (
                account?.provider ===
                "credentials"
            ) {
                return true;
            }

            /*
             * OAuth providers.
             */
            if (
                account?.provider ===
                "github" ||
                account?.provider ===
                "google"
            ) {
                return true;
            }

            return true;
        },
    },
});
import { prisma } from "@/lib/prisma";
import { getValidSession } from "@/lib/auth/session";
import { clearReauthGrant, reauthenticateUser } from "@/lib/auth/reauth";
import {
    clearReauthAttempts,
    getReauthRateLimitRemainingMs,
    isReauthRateLimited,
} from "@/lib/auth/rate-limit";
import { hashPassword, isArgon2Hash, validatePassword, verifyPassword } from "@/lib/auth/password";
import { sendPasswordChangedEmail } from "@/lib/email";

import bcrypt from "bcryptjs";

import {
    badRequest,
    forbidden,
    parseJson,
    tooManyRequests,
    unauthorized,
    withErrorHandling,
} from "@/lib/api/server";

/*
 * Change the password of an account that already has one.
 *
 * - The current password is always required, and wrong guesses count
 *   towards the same lockout as other re-authentication prompts.
 * - Accounts without a password can't set one here; they get an email link
 *   instead (POST /api/auth/set-password-link), so a hijacked session
 *   alone can never add a password.
 * - Every other session is signed out, and the owner gets an email.
 */

function field(body: object, key: string) {
    const value = (body as Record<string, unknown>)[key];
    return typeof value === "string" ? value : "";
}

function samePassword(password: string, hash: string) {
    return isArgon2Hash(hash) ? verifyPassword(password, hash) : bcrypt.compare(password, hash);
}

export const POST = withErrorHandling(async (request) => {
    const session = await getValidSession();
    if (!session?.user?.id) {
        return unauthorized("Your session has expired. Please sign in again.");
    }

    const body = await parseJson(request);
    if (typeof body !== "object" || body === null) {
        return badRequest("Invalid request body.");
    }

    const currentPassword = field(body, "currentPassword");
    const newPassword = field(body, "newPassword");
    const confirmPassword = field(body, "confirmPassword");

    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { id: true, email: true, passwordHash: true },
    });

    if (!user) {
        return unauthorized("Your session is no longer valid. Please sign in again.");
    }

    if (!user.passwordHash) {
        return forbidden("To add a password, use the email link from Settings.");
    }

    // Current password, with lockout after repeated wrong guesses.
    if (!currentPassword) {
        return badRequest("Enter your current password.");
    }

    if (await isReauthRateLimited(user.id)) {
        const minutes = Math.max(1, Math.ceil((await getReauthRateLimitRemainingMs(user.id)) / 60_000));
        return tooManyRequests(
            `Too many wrong attempts. Wait ${minutes} minute${minutes === 1 ? "" : "s"} and try again.`,
        );
    }

    if (!(await reauthenticateUser(user.id, currentPassword))) {
        return badRequest("Your current password is incorrect.");
    }

    // New password.
    if (!newPassword) return badRequest("Enter a new password.");
    if (newPassword !== confirmPassword) return badRequest("The new passwords don't match.");

    const passwordError = validatePassword(newPassword);
    if (passwordError) return badRequest(passwordError);

    if (await samePassword(newPassword, user.passwordHash)) {
        return badRequest("Choose a password different from your current one.");
    }

    await prisma.user.update({
        where: { id: user.id },
        data: {
            passwordHash: await hashPassword(newPassword),
            sessionVersion: { increment: 1 },
        },
    });

    await Promise.all([clearReauthGrant(), clearReauthAttempts(user.id)]);
    if (user.email) await sendPasswordChangedEmail(user.email);

    return Response.json({ success: true });
});

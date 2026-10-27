import { prisma } from "@/lib/prisma";
import { getValidSession } from "@/lib/auth/session";
import { createPasswordResetToken } from "@/lib/auth/password-reset";
import {
    getClientIp,
    isPasswordResetRateLimited,
    recordPasswordResetRequest,
} from "@/lib/auth/rate-limit";
import { badRequest, tooManyRequests, unauthorized, withErrorHandling } from "@/lib/api/server";

/*
 * Accounts that only use Google, GitHub or a passkey add a password by
 * proving they own the email address: we send a one-time link (the same
 * token as a password reset) instead of letting the session set it.
 */
export const POST = withErrorHandling(async (request) => {
    const session = await getValidSession();
    if (!session?.user?.id) {
        return unauthorized("Your session has expired. Please sign in again.");
    }

    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { id: true, email: true, passwordHash: true },
    });

    if (!user?.email) return unauthorized("Your session is no longer valid. Please sign in again.");
    if (user.passwordHash) return badRequest("Your account already has a password. Change it instead.");

    const ip = getClientIp(request.headers);
    if (await isPasswordResetRateLimited(user.email, ip)) {
        return tooManyRequests("We already sent a few links. Wait 15 minutes and try again.");
    }
    await recordPasswordResetRequest(user.email, ip);

    await createPasswordResetToken(user.id, user.email, "set");

    return Response.json({ email: user.email });
});

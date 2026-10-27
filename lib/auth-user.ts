import { prisma } from "@/lib/prisma";
import { getValidSession } from "@/lib/auth/session";

/**
 * Returns the signed-in user, or null if there's no valid session.
 *
 * Uses getValidSession() so sessions invalidated by a password change
 * (sessionVersion mismatch) are rejected here too, and looks the user up
 * by id rather than email.
 */
export async function getAuthedUser() {
    const session = await getValidSession();
    const id = session?.user?.id;

    if (!id) return null;

    return prisma.user.findUnique({ where: { id } });
}

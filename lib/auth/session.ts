import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function getValidSession() {
    const session = await auth();

    if (!session?.user?.id) {
        return null;
    }

    /*
     * During a fresh login, Auth.js should have placed
     * sessionVersion into the JWT/session.
     *
     * If it isn't present yet, don't immediately destroy
     * the newly-created session.
     *
     * The database check below is only used when the
     * session contains a version.
     */
    if (typeof session.sessionVersion !== "number") {
        return session;
    }

    const user = await prisma.user.findUnique({
        where: {
            id: session.user.id,
        },
        select: {
            sessionVersion: true,
        },
    });

    if (!user) {
        return null;
    }

    if (
        session.sessionVersion !==
        user.sessionVersion
    ) {
        return null;
    }

    return session;
}

export async function requireValidSession() {
    const session = await getValidSession();

    if (!session) {
        redirect("/login");
    }

    return session;
}
import { NextResponse } from "next/server";

import { getValidSession } from "@/lib/auth/session";
import { apiError, badRequest, unauthorized, withErrorHandling } from "@/lib/api/server";
import { RadarError, saveLeadToWishlist } from "@/lib/radar";

/** POST /api/radar/leads/:id/save -> creates a Wishlist application. */
export const POST = withErrorHandling(
    async (_request: Request, context: { params: Promise<{ id: string }> }) => {
        const session = await getValidSession();
        if (!session?.user?.id) return unauthorized();

        const id = Number((await context.params).id);
        if (!Number.isInteger(id) || id <= 0) return badRequest("Invalid match id.");

        try {
            const job = await saveLeadToWishlist(session.user.id, id);
            return NextResponse.json({ job }, { status: 201 });
        } catch (error) {
            if (error instanceof RadarError) return apiError(error.message, error.status);
            throw error;
        }
    },
);

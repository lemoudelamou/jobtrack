import { NextResponse } from "next/server";
import { z } from "zod";

import { getValidSession } from "@/lib/auth/session";
import { apiError, badRequest, parseJson, unauthorized, withErrorHandling, zodErrorMessage } from "@/lib/api/server";
import { RadarError, setLeadStatus } from "@/lib/radar";

const schema = z.object({ status: z.enum(["New", "Dismissed"]) });

/** PATCH /api/radar/leads/:id  { status: "Dismissed" | "New" } */
export const PATCH = withErrorHandling(
    async (request: Request, context: { params: Promise<{ id: string }> }) => {
        const session = await getValidSession();
        if (!session?.user?.id) return unauthorized();

        const id = Number((await context.params).id);
        if (!Number.isInteger(id) || id <= 0) return badRequest("Invalid match id.");

        const parsed = schema.safeParse(await parseJson(request));
        if (!parsed.success) return badRequest(zodErrorMessage(parsed.error));

        try {
            await setLeadStatus(session.user.id, id, parsed.data.status);
            return NextResponse.json({ ok: true });
        } catch (error) {
            if (error instanceof RadarError) return apiError(error.message, error.status);
            throw error;
        }
    },
);

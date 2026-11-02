import { NextResponse } from "next/server";
import { z } from "zod";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { getValidSession } from "@/lib/auth/session";
import {
    badRequest,
    notFound,
    parseJson,
    unauthorized,
    withErrorHandling,
    zodErrorMessage,
} from "@/lib/api/server";

const JOB_STATUSES = [
    "Wishlist",
    "Applied",
    "Interview",
    "Offer",
    "Rejected",
] as const;

const MAX_PAGE_SIZE = 100;
const DEFAULT_PAGE_SIZE = 50;

// --- local helpers ------------------------------------------------------

function parseId(value: unknown): number | null {
    const id = Number(value);
    return Number.isInteger(id) && id > 0 ? id : null;
}

/** Drops keys whose value is `undefined` so Prisma only updates fields the client actually sent. */
function pickDefined<T extends Record<string, unknown>>(
    obj: T,
): Partial<T> {
    return Object.fromEntries(
        Object.entries(obj).filter(
            ([, value]) => value !== undefined,
        ),
    ) as Partial<T>;
}

// --- validation schemas ------------------------------------------------------

const jobStatusSchema = z.enum(JOB_STATUSES);

const requiredText = (
    label: string,
    max: number,
) =>
    z
        .string()
        .trim()
        .min(1, `${label} is required.`)
        .max(
            max,
            `${label} must be ${max} characters or fewer.`,
        );

/** Optional free text: blank strings become `null` rather than being stored as "". */
const optionalText = (max: number) =>
    z.preprocess(
        (value) =>
            typeof value === "string"
                ? value.trim() || null
                : value ?? null,
        z.string().max(max).nullable(),
    );

/** Optional URL: blank becomes `null`; anything else must be a valid absolute URL. */
const optionalUrl = z.preprocess(
    (value) =>
        typeof value === "string"
            ? value.trim() || null
            : value ?? null,
    z
        .string()
        .max(2000)
        .url("Job URL must be a valid URL.")
        .nullable(),
);

const createJobSchema = z.object({
    company: requiredText("Company", 200),
    position: requiredText("Position", 200),
    location: requiredText("Location", 200),
    status: jobStatusSchema,
    jobUrl: optionalUrl,
    salary: optionalText(100),
    notes: optionalText(5000),
    appliedDate: z.coerce.date().optional(),
});

const updateJobSchema = z.object({
    id: z.coerce.number().int().positive(),
    company: requiredText("Company", 200).optional(),
    position: requiredText("Position", 200).optional(),
    location: requiredText("Location", 200).optional(),
    status: jobStatusSchema.optional(),
    jobUrl: optionalUrl.optional(),
    salary: optionalText(100).optional(),
    notes: optionalText(5000).optional(),
    appliedDate: z.coerce.date().optional(),
});

// --- GET ---------------------------------------------------------------------

export const GET = withErrorHandling(async (request) => {
    const session = await getValidSession();

    if (!session?.user?.id) {
        return unauthorized();
    }

    const userId = session.user.id;

    const { searchParams } = new URL(request.url);

    const limitParam = searchParams.get("limit");

    const parsedLimit =
        limitParam !== null
            ? Number(limitParam)
            : DEFAULT_PAGE_SIZE;

    const take = Math.min(
        Number.isInteger(parsedLimit) &&
            parsedLimit > 0
            ? parsedLimit
            : DEFAULT_PAGE_SIZE,
        MAX_PAGE_SIZE,
    );

    const cursor = parseId(
        searchParams.get("cursor"),
    );

    const status = searchParams.get("status");

    if (
        status &&
        !jobStatusSchema.safeParse(status).success
    ) {
        return badRequest("Invalid job status.");
    }

    try {
        const jobs =
            await prisma.job.findMany({
                where: {
                    userId,

                    ...(status
                        ? {
                            status:
                                status as (typeof JOB_STATUSES)[number],
                        }
                        : {}),
                },

                // Tiebreak on id so pagination stays stable
                // even if two jobs share the same createdAt.
                orderBy: [
                    {
                        createdAt: "desc",
                    },
                    {
                        id: "desc",
                    },
                ],

                take: take + 1,

                ...(cursor
                    ? {
                        cursor: {
                            id: cursor,
                        },
                        skip: 1,
                    }
                    : {}),
            });

        const hasMore =
            jobs.length > take;

        const items = hasMore
            ? jobs.slice(0, take)
            : jobs;

        return NextResponse.json({
            jobs: items,

            nextCursor: hasMore
                ? items[items.length - 1].id
                : null,
        });
    } catch (error) {
        /*
         * A cursor that doesn't exist, for example because
         * the job was deleted, causes Prisma to throw P2025.
         */
        if (
            error instanceof
            Prisma.PrismaClientKnownRequestError &&
            error.code === "P2025"
        ) {
            return badRequest(
                "Invalid or expired cursor.",
            );
        }

        throw error;
    }
});

// --- POST --------------------------------------------------------------------

export const POST = withErrorHandling(async (request) => {
    const session = await getValidSession();

    if (!session?.user?.id) {
        return unauthorized();
    }

    const userId = session.user.id;

    const body = await parseJson(request);

    const result =
        createJobSchema.safeParse(body);

    if (!result.success) {
        return badRequest(
            zodErrorMessage(result.error),
        );
    }

    const {
        appliedDate,
        ...rest
    } = result.data;

    const job =
        await prisma.job.create({
            data: {
                ...rest,

                appliedDate:
                    appliedDate ?? new Date(),

                userId,
            },
        });

    return NextResponse.json(
        job,
        {
            status: 201,
        },
    );
});

// --- DELETE ------------------------------------------------------------------

export const DELETE = withErrorHandling(
    async (request) => {
        const session =
            await getValidSession();

        if (!session?.user?.id) {
            return unauthorized();
        }

        const userId = session.user.id;

        const body =
            await parseJson(request);

        const id = parseId(
            (
                body as Record<
                    string,
                    unknown
                > | null
            )?.id,
        );

        if (!id) {
            return badRequest(
                "Invalid job id.",
            );
        }

        /*
         * Ownership check is part of the delete.
         * One query, no race window.
         */
        const { count } =
            await prisma.job.deleteMany({
                where: {
                    id,
                    userId,
                },
            });

        if (count === 0) {
            return notFound(
                "Job not found.",
            );
        }

        return NextResponse.json({
            message:
                "Job deleted successfully.",
        });
    },
);

// --- PATCH -------------------------------------------------------------------

export const PATCH = withErrorHandling(
    async (request) => {
        const session =
            await getValidSession();

        if (!session?.user?.id) {
            return unauthorized();
        }

        const userId = session.user.id;

        const body =
            await parseJson(request);

        const result =
            updateJobSchema.safeParse(body);

        if (!result.success) {
            return badRequest(
                zodErrorMessage(result.error),
            );
        }

        const {
            id,
            ...fields
        } = result.data;

        const data =
            pickDefined(fields);

        if (
            Object.keys(data).length === 0
        ) {
            return badRequest(
                "No fields to update.",
            );
        }

        /*
         * Ownership check is part of the update.
         * One query, no race window.
         */
        const { count } =
            await prisma.job.updateMany({
                where: {
                    id,
                    userId,
                },

                data,
            });

        if (count === 0) {
            return notFound(
                "Job not found.",
            );
        }

        const job =
            await prisma.job.findUnique({
                where: {
                    id,
                },
            });

        return NextResponse.json(job);
    },
);
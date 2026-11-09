import { prisma } from "@/lib/prisma";

import { getValidSession } from "@/lib/auth/session";

import {
    badRequest,
    conflict,
    notFound,
    parseJson,
    unauthorized,
    withErrorHandling,
} from "@/lib/api/server";

const INTERVIEW_TYPES = [
    "Phone",
    "Video",
    "On-site",
    "Technical",
    "HR",
    "Other",
] as const;

type InterviewType =
    (typeof INTERVIEW_TYPES)[number];

function isInterviewType(
    value: string,
): value is InterviewType {
    return INTERVIEW_TYPES.includes(
        value as InterviewType,
    );
}

function parseInterviewDate(
    value: unknown,
) {
    if (
        typeof value !== "string" ||
        !value
    ) {
        return null;
    }

    const date = new Date(
        `${value}T12:00:00.000Z`,
    );

    if (Number.isNaN(date.getTime())) {
        return null;
    }

    return date;
}

function isValidTime(
    value: unknown,
) {
    if (typeof value !== "string") {
        return false;
    }

    return /^([01]\d|2[0-3]):[0-5]\d$/.test(
        value,
    );
}

async function getOwnedJob(
    jobId: number,
    userId: string,
) {
    return prisma.job.findFirst({
        where: {
            id: jobId,
            userId,
        },
        select: {
            id: true,
            company: true,
            position: true,
            interviewDate: true,
            interviewTime: true,
            interviewType: true,
            interviewLocation: true,
            interviewNotes: true,
        },
    });
}

export const POST = withErrorHandling(
    async (
        request,
        context: {
            params: Promise<{
                id: string;
            }>;
        },
    ) => {
        const session =
            await getValidSession();

        if (!session?.user?.id) {
            return unauthorized();
        }

        const { id } =
            await context.params;

        const jobId = Number(id);

        if (!Number.isInteger(jobId)) {
            return badRequest(
                "Invalid job ID.",
            );
        }

        const body =
            await parseJson(request);

        if (
            typeof body !== "object" ||
            body === null
        ) {
            return badRequest(
                "Invalid request body.",
            );
        }

        const interviewDate =
            "interviewDate" in body
                ? parseInterviewDate(
                    body.interviewDate,
                )
                : null;

        const interviewTime =
            "interviewTime" in body &&
            typeof body.interviewTime === "string"
                ? body.interviewTime
                : "";

        const interviewType =
            "interviewType" in body &&
            typeof body.interviewType === "string"
                ? body.interviewType
                : "";

        const interviewLocation =
            "interviewLocation" in body &&
            typeof body.interviewLocation === "string"
                ? body.interviewLocation.trim()
                : "";

        const interviewNotes =
            "interviewNotes" in body &&
            typeof body.interviewNotes === "string"
                ? body.interviewNotes.trim()
                : "";

        if (!interviewDate) {
            return badRequest(
                "Please provide a valid interview date.",
            );
        }

        if (!isValidTime(interviewTime)) {
            return badRequest(
                "Please provide a valid interview time.",
            );
        }

        if (!isInterviewType(interviewType)) {
            return badRequest(
                "Please select a valid interview type.",
            );
        }

        const job =
            await getOwnedJob(
                jobId,
                session.user.id,
            );

        if (!job) {
            return notFound(
                "Job not found.",
            );
        }

        if (job.interviewDate) {
            return conflict(
                "This application already has an interview scheduled.",
            );
        }

        const updatedJob =
            await prisma.job.update({
                where: {
                    id: job.id,
                },
                data: {
                    interviewDate,
                    interviewTime,
                    interviewType,
                    interviewLocation:
                        interviewLocation ||
                        null,
                    interviewNotes:
                        interviewNotes ||
                        null,
                },
                select: {
                    id: true,
                    company: true,
                    position: true,
                    interviewDate: true,
                    interviewTime: true,
                    interviewType: true,
                    interviewLocation: true,
                    interviewNotes: true,
                },
            });

        return Response.json(
            {
                interview: {
                    jobId:
                        updatedJob.id,
                    company:
                        updatedJob.company,
                    position:
                        updatedJob.position,
                    interviewDate:
                        updatedJob.interviewDate?.toISOString() ??
                        null,
                    interviewTime:
                        updatedJob.interviewTime,
                    interviewType:
                        updatedJob.interviewType,
                    interviewLocation:
                        updatedJob.interviewLocation,
                    interviewNotes:
                        updatedJob.interviewNotes,
                },
            },
            {
                status: 201,
            },
        );
    },
);

export const PATCH = withErrorHandling(
    async (
        request,
        context: {
            params: Promise<{
                id: string;
            }>;
        },
    ) => {
        const session =
            await getValidSession();

        if (!session?.user?.id) {
            return unauthorized();
        }

        const { id } =
            await context.params;

        const jobId = Number(id);

        if (!Number.isInteger(jobId)) {
            return badRequest(
                "Invalid job ID.",
            );
        }

        const body =
            await parseJson(request);

        if (
            typeof body !== "object" ||
            body === null
        ) {
            return badRequest(
                "Invalid request body.",
            );
        }

        const interviewDate =
            "interviewDate" in body
                ? parseInterviewDate(
                    body.interviewDate,
                )
                : null;

        const interviewTime =
            "interviewTime" in body &&
            typeof body.interviewTime === "string"
                ? body.interviewTime
                : "";

        const interviewType =
            "interviewType" in body &&
            typeof body.interviewType === "string"
                ? body.interviewType
                : "";

        const interviewLocation =
            "interviewLocation" in body &&
            typeof body.interviewLocation === "string"
                ? body.interviewLocation.trim()
                : "";

        const interviewNotes =
            "interviewNotes" in body &&
            typeof body.interviewNotes === "string"
                ? body.interviewNotes.trim()
                : "";

        if (!interviewDate) {
            return badRequest(
                "Please provide a valid interview date.",
            );
        }

        if (!isValidTime(interviewTime)) {
            return badRequest(
                "Please provide a valid interview time.",
            );
        }

        if (!isInterviewType(interviewType)) {
            return badRequest(
                "Please select a valid interview type.",
            );
        }

        const job =
            await getOwnedJob(
                jobId,
                session.user.id,
            );

        if (!job) {
            return notFound(
                "Job not found.",
            );
        }

        const updatedJob =
            await prisma.job.update({
                where: {
                    id: job.id,
                },
                data: {
                    interviewDate,
                    interviewTime,
                    interviewType,
                    interviewLocation:
                        interviewLocation ||
                        null,
                    interviewNotes:
                        interviewNotes ||
                        null,
                },
                select: {
                    id: true,
                    company: true,
                    position: true,
                    interviewDate: true,
                    interviewTime: true,
                    interviewType: true,
                    interviewLocation: true,
                    interviewNotes: true,
                },
            });

        return Response.json({
            interview: {
                jobId:
                    updatedJob.id,
                company:
                    updatedJob.company,
                position:
                    updatedJob.position,
                interviewDate:
                    updatedJob.interviewDate?.toISOString() ??
                    null,
                interviewTime:
                    updatedJob.interviewTime,
                interviewType:
                    updatedJob.interviewType,
                interviewLocation:
                    updatedJob.interviewLocation,
                interviewNotes:
                    updatedJob.interviewNotes,
            },
        });
    },
);

export const DELETE = withErrorHandling(
    async (
        _request,
        context: {
            params: Promise<{
                id: string;
            }>;
        },
    ) => {
        const session =
            await getValidSession();

        if (!session?.user?.id) {
            return unauthorized();
        }

        const { id } =
            await context.params;

        const jobId = Number(id);

        if (!Number.isInteger(jobId)) {
            return badRequest(
                "Invalid job ID.",
            );
        }

        const job =
            await getOwnedJob(
                jobId,
                session.user.id,
            );

        if (!job) {
            return notFound(
                "Job not found.",
            );
        }

        await prisma.job.update({
            where: {
                id: job.id,
            },
            data: {
                interviewDate: null,
                interviewTime: null,
                interviewType: null,
                interviewLocation: null,
                interviewNotes: null,
            },
        });

        return Response.json({
            success: true,
        });
    },
);
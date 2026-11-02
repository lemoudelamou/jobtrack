import { getValidSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

import {
    badRequest,
    notFound,
    parseJson,
    unauthorized,
    withErrorHandling,
} from "@/lib/api/server";

const VALID_STATUSES = [
    "Wishlist",
    "Applied",
    "Interview",
    "Offer",
    "Rejected",
] as const;

type JobStatus =
    (typeof VALID_STATUSES)[number];

function isJobStatus(
    status: string,
): status is JobStatus {
    return VALID_STATUSES.includes(
        status as JobStatus,
    );
}

export const PATCH = withErrorHandling(
    async (
        request: Request,
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

        const status =
            "status" in body &&
                typeof body.status === "string"
                ? body.status
                : "";

        if (!isJobStatus(status)) {
            return badRequest(
                "Invalid job status.",
            );
        }

        const updated =
            await prisma.job.updateMany({
                where: {
                    id: jobId,
                    userId:
                        session.user.id,
                },
                data: {
                    status,
                },
            });

        if (updated.count !== 1) {
            return notFound(
                "Job not found.",
            );
        }

        const job =
            await prisma.job.findFirst({
                where: {
                    id: jobId,
                    userId:
                        session.user.id,
                },
                select: {
                    id: true,
                    position: true,
                    company: true,
                    status: true,
                    appliedDate: true,
                    createdAt: true,
                },
            });

        if (!job) {
            return notFound(
                "Job not found.",
            );
        }

        return Response.json({
            job: {
                id: job.id,
                position:
                    job.position,
                company:
                    job.company,
                status:
                    job.status,
                appliedDate:
                    job.appliedDate.toISOString(),
                createdAt:
                    job.createdAt.toISOString(),
            },
        });
    },
);
import { NextResponse } from "next/server";

import { getValidSession } from "@/lib/auth/session";
import { badRequest, unauthorized, withErrorHandling } from "@/lib/api/server";
import { jsearchConfigured, jsearchUsage } from "@/lib/radar/jsearch";
import { prisma } from "@/lib/prisma";
import { getGmailStatus, gmailConfigured } from "@/lib/gmail/connection";
import { countLeads, getProfile, getResumeForUser, listLeads, type LeadStatus } from "@/lib/radar";

const STATUSES: LeadStatus[] = ["New", "Saved", "Dismissed"];

/** GET /api/radar?status=New -> profile, CV state, counts and leads. */
export const GET = withErrorHandling(async (request) => {
    const session = await getValidSession();
    if (!session?.user?.id) return unauthorized();

    const userId = session.user.id;
    const status = (new URL(request.url).searchParams.get("status") ?? "New") as LeadStatus;
    if (!STATUSES.includes(status)) return badRequest("Unknown status.");

    const [profile, resume, counts, leads, recentJobs, gmailStatus] = await Promise.all([
        getProfile(userId),
        getResumeForUser(userId),
        countLeads(userId),
        listLeads(userId, status),
        // Titles from the user's own applications, offered as suggestions.
        prisma.job.findMany({
            where: { userId },
            select: { position: true },
            orderBy: { createdAt: "desc" },
            take: 40,
        }),
        getGmailStatus(userId),
    ]);

    const seen = new Set<string>();
    const titleSuggestions = recentJobs
        .map((job) => job.position.trim().replace(/\s+/g, " "))
        .filter((title) => {
            const key = title.toLowerCase();
            if (title.length < 2 || title.length > 60 || seen.has(key)) return false;
            seen.add(key);
            return true;
        })
        .slice(0, 8);

    return NextResponse.json({
        profile,
        resume: resume ? { fileName: resume.fileName, ready: resume.chunks > 0 } : null,
        counts,
        leads,
        aiEnabled: Boolean(process.env.GEMINI_API_KEY),
        titleSuggestions,
        gmail: { available: gmailConfigured(), status: gmailStatus },
        sources: {
            jsearch: jsearchConfigured(),
            jsearchUsage: jsearchConfigured() ? await jsearchUsage() : null,
            arbeitnow: true,
        },
    });
});

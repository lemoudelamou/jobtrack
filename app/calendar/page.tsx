import {
    BriefcaseBusiness,
    CalendarDays,
    Clock3,
    Sparkles,
} from "lucide-react";

import Navbar from "@/app/components/navbar/Navbar";
import JobCalendar from "@/app/components/calendar/JobCalendar";

import { requireValidSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

export const metadata = {
    title: "Calendar",
};

export default async function CalendarPage() {
    const session = await requireValidSession();

    const jobs = await prisma.job.findMany({
        where: {
            userId: session.user.id,
        },

        select: {
            id: true,
            position: true,
            company: true,
            location: true,
            salary: true,
            notes: true,
            jobUrl: true,
            status: true,
            appliedDate: true,
            createdAt: true,

            interviewDate: true,
            interviewTime: true,
            interviewType: true,
            interviewLocation: true,
            interviewNotes: true,
        },

        orderBy: {
            createdAt: "desc",
        },
    });

    const calendarJobs = jobs.map((job) => ({
        id: job.id,

        position: job.position,
        company: job.company,
        location: job.location,
        salary: job.salary,
        notes: job.notes,
        jobUrl: job.jobUrl,

        status: String(job.status),

        appliedDate: job.appliedDate
            ? job.appliedDate.toISOString()
            : null,

        createdAt: job.createdAt.toISOString(),

        interviewDate: job.interviewDate?.toISOString() ?? null,

        interviewTime: job.interviewTime,

        interviewType: job.interviewType,

        interviewLocation: job.interviewLocation,

        interviewNotes: job.interviewNotes,
    }));

    const applicationCount = calendarJobs.length;

    const interviewCount = calendarJobs.filter(
        (job) => job.interviewDate,
    ).length;

    const activeCount = calendarJobs.filter((job) => {
        const status = job.status.toLowerCase();

        return (
            status !== "rejected" &&
            status !== "offer"
        );
    }).length;

    const offerCount = calendarJobs.filter(
        (job) =>
            job.status.toLowerCase() === "offer",
    ).length;

    return (
        <main className="min-h-screen overflow-hidden bg-canvas text-ink">

            {/* Existing Navbar */}
            <Navbar />

            <div className="mx-auto max-w-[1520px] px-4 py-8 sm:px-8 sm:py-12">

                {/* =================================
                    GREEN ANIMATED HEADER
                ================================== */}
                <section className="relative mb-8 overflow-hidden rounded-3xl border border-accent bg-accent text-on-accent shadow-[0_18px_50px_rgba(var(--accent-rgb),0.25)]">

                    {/* Animated background */}
                    <div className="pointer-events-none absolute inset-0 overflow-hidden">

                        {/* Main wave */}
                        <div className="calendar-wave absolute -left-1/4 -top-1/2 h-[140%] w-[70%] rounded-[45%] bg-accent/20 blur-3xl" />

                        {/* Second wave */}
                        <div className="calendar-wave-reverse absolute -bottom-1/2 -right-1/4 h-[130%] w-[65%] rounded-[45%] bg-accent-line/15 blur-3xl" />

                        {/* Central glow */}
                        <div className="absolute left-1/4 top-[-40%] h-[80%] w-1/2 rotate-[-8deg] rounded-full bg-surface/[0.07] blur-2xl" />

                        {/* Moving glossy shine */}
                        <div className="calendar-shine absolute -left-[40%] top-0 h-full w-[35%] rotate-[15deg] bg-gradient-to-r from-transparent via-surface/[0.09] to-transparent blur-xl" />

                        {/* Small floating glow */}
                        <div className="absolute right-[15%] top-[20%] h-24 w-24 animate-pulse rounded-full bg-accent-line/10 blur-2xl" />

                        {/* Decorative dots */}
                        <div className="absolute right-20 top-16 h-2 w-2 rounded-full bg-white/25" />

                        <div className="absolute right-36 top-28 h-1.5 w-1.5 rounded-full bg-accent-soft/50" />

                        <div className="absolute bottom-16 right-16 h-2 w-2 rounded-full bg-white/20" />
                    </div>

                    {/* Header content */}
                    <div className="relative px-5 py-7 sm:px-8 sm:py-8">

                        <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">

                            {/* Title */}
                            <div className="max-w-2xl">

                                {/* Small label */}
                                <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-[11px] font-medium text-on-accent/90 backdrop-blur-md">

                                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/15">
                                        <CalendarDays className="h-3 w-3 text-on-accent" />
                                    </span>

                                    Job search timeline
                                </div>

                                {/* Heading */}
                                <h1 className="text-[30px] font-semibold leading-[1.08] tracking-[-0.035em] text-on-accent sm:text-[38px]">

                                    Your application

                                    <span className="text-on-accent">
                                        {" "}
                                        calendar.
                                    </span>
                                </h1>

                                {/* Description */}
                                <p className="mt-3 max-w-xl text-[14px] leading-6 text-on-accent/75 sm:text-[15px]">
                                    Keep your applications,
                                    interviews, offers, and
                                    important job-search
                                    moments organized in one
                                    place.
                                </p>
                            </div>

                            {/* Statistics */}
                            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:min-w-[430px]">

                                <SummaryItem
                                    icon={
                                        <BriefcaseBusiness className="h-4 w-4" />
                                    }
                                    value={applicationCount}
                                    label="Applications"
                                />

                                <SummaryItem
                                    icon={
                                        <Clock3 className="h-4 w-4" />
                                    }
                                    value={interviewCount}
                                    label="Interviews"
                                />

                                <SummaryItem
                                    icon={
                                        <Sparkles className="h-4 w-4" />
                                    }
                                    value={activeCount}
                                    label="Active"
                                />

                                <SummaryItem
                                    icon={
                                        <span className="text-[15px] font-semibold">
                                            $
                                        </span>
                                    }
                                    value={offerCount}
                                    label="Offers"
                                />
                            </div>
                        </div>

                        {/* Bottom activity line */}
                        <div className="mt-7 flex flex-col gap-3 border-t border-white/15 pt-4 sm:flex-row sm:items-center sm:justify-between">

                            <div className="flex items-center gap-2 text-[11px] text-on-accent/65">

                                <span className="relative flex h-2 w-2">

                                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent-line/40" />

                                    <span className="relative inline-flex h-2 w-2 rounded-full bg-accent-line" />
                                </span>

                                Calendar synced with your
                                application activity
                            </div>

                            <div className="text-[11px] text-on-accent/50">
                                Select a day below to explore
                                activity
                            </div>
                        </div>
                    </div>
                </section>

                {/* Calendar */}
                <JobCalendar jobs={calendarJobs} />
            </div>
        </main>
    );
}

/* ============================================
   SUMMARY CARD
============================================ */

function SummaryItem({
    icon,
    value,
    label,
}: {
    icon: React.ReactNode;
    value: number;
    label: string;
}) {
    return (
        <div className="group rounded-2xl border border-white/15 bg-white/10 p-3 backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:border-white/25 hover:bg-white/15 hover:shadow-[0_10px_30px_rgba(0,0,0,0.15)]">

            <div className="flex items-center justify-between">

                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/10 text-on-accent transition-transform duration-300 group-hover:scale-110">
                    {icon}
                </div>

                <span className="text-lg font-semibold tracking-tight text-on-accent">
                    {value}
                </span>
            </div>

            <p className="mt-2 text-[10px] font-medium uppercase tracking-[0.08em] text-on-accent/55">
                {label}
            </p>
        </div>
    );
}


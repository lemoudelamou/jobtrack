import Link from "next/link";
import Navbar from "@/app/components/navbar/Navbar";
import { serif, sans } from "@/lib/fonts";
import { notFound } from "next/navigation";

import {
    ArrowLeft,
    ArrowUpRight,
    CalendarDays,
    Check,
    ClipboardList,
    ExternalLink,
    FileText,
    MapPin,
    Sparkles,
    Wallet,
} from "lucide-react";
import type { ReactNode } from "react";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

import AIInsights from "./AIInsights";
import TailorCv from "./TailorCv";
import JobAdNotes from "./JobAdNotes";
import JobInterview from "@/app/components/jobs/JobInterview";



type JobDetailsPageProps = {
    params: Promise<{
        id: string;
    }>;
};

const statusStyles: Record<
    string,
    {
        bg: string;
        text: string;
        dot: string;
        border: string;
        accent: string;
    }
> = {
    Wishlist: {
        bg: "bg-surface-2",
        text: "text-ink-2",
        dot: "var(--color-ink-2)",
        border: "border-line",
        accent: "var(--color-ink-2)",
    },
    Applied: {
        bg: "bg-applied-soft",
        text: "text-applied-ink",
        dot: "var(--color-applied)",
        border: "border-applied-line",
        accent: "var(--color-applied)",
    },
    Interview: {
        bg: "bg-interview-soft",
        text: "text-interview-ink",
        dot: "var(--color-interview)",
        border: "border-interview-line",
        accent: "var(--color-interview)",
    },
    Offer: {
        bg: "bg-accent-soft",
        text: "text-accent-ink",
        dot: "var(--color-accent)",
        border: "border-accent-line",
        accent: "var(--color-accent)",
    },
    Rejected: {
        bg: "bg-rejected-soft",
        text: "text-rejected-ink",
        dot: "var(--color-rejected)",
        border: "border-rejected-line",
        accent: "var(--color-rejected)",
    },
};

const AVATAR_PALETTE = [
    {
        bg: "var(--color-accent-soft)",
        text: "var(--color-accent-ink)",
    },
    {
        bg: "var(--color-applied-soft)",
        text: "var(--color-applied-ink)",
    },
    {
        bg: "var(--color-interview-soft)",
        text: "var(--color-interview-ink)",
    },
    {
        bg: "var(--color-rejected-soft)",
        text: "var(--color-rejected-ink)",
    },
    {
        bg: "var(--color-applied-soft)",
        text: "var(--color-applied-ink)",
    },
    {
        bg: "var(--color-surface-2)",
        text: "var(--color-ink-2)",
    },
    {
        bg: "var(--color-accent-soft)",
        text: "var(--color-accent)",
    },
    {
        bg: "var(--color-interview-line)",
        text: "var(--color-interview-ink)",
    },
];

function hashString(value: string): number {
    let hash = 0;

    for (let index = 0; index < value.length; index++) {
        hash = (hash << 5) - hash + value.charCodeAt(index);
        hash |= 0;
    }

    return Math.abs(hash);
}

function getAvatarPalette(company: string) {
    return AVATAR_PALETTE[
        hashString(company) % AVATAR_PALETTE.length
    ];
}

function getInitials(company: string): string {
    const words = company
        .trim()
        .split(/\s+/)
        .filter(Boolean);

    if (words.length === 0) {
        return "?";
    }

    if (words.length === 1) {
        return words[0].slice(0, 2).toUpperCase();
    }

    return `${words[0][0]}${words[1][0]}`.toUpperCase();
}

function getRelativeTime(date: Date): string {
    const millisecondsPerDay = 1000 * 60 * 60 * 24;

    const days = Math.floor(
        (Date.now() - date.getTime()) / millisecondsPerDay,
    );

    if (days <= 0) {
        return "today";
    }

    if (days === 1) {
        return "yesterday";
    }

    if (days < 30) {
        return `${days} days ago`;
    }

    const months = Math.floor(days / 30);

    if (months < 12) {
        return `${months} month${months === 1 ? "" : "s"} ago`;
    }

    const years = Math.floor(months / 12);

    return `${years} year${years === 1 ? "" : "s"} ago`;
}

function formatDate(date: Date): string {
    return new Intl.DateTimeFormat("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
    }).format(date);
}

function MetaItem({
    icon,
    label,
    value,
}: {
    icon: ReactNode;
    label: string;
    value: string;
}) {
    return (
        <div className="group relative flex min-w-0 items-center gap-3 border-line px-4 py-4 sm:px-5">
            <span className="absolute bottom-0 left-4 right-4 h-px origin-left scale-x-0 bg-accent/30 transition-transform duration-300 group-hover:scale-x-100 sm:left-5 sm:right-5" />

            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-line bg-canvas text-ink-2 transition-all duration-300 group-hover:-translate-y-0.5 group-hover:border-accent-line group-hover:bg-accent-soft group-hover:text-accent">
                {icon}
            </span>

            <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">
                    {label}
                </p>

                <p className="mt-1 truncate text-sm font-semibold text-ink">
                    {value}
                </p>
            </div>
        </div>
    );
}

function SectionHeading({
    icon,
    title,
    description,
}: {
    icon: ReactNode;
    title: string;
    description: string;
}) {
    return (
        <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-line bg-canvas text-accent shadow-[0_4px_12px_-8px_rgba(20,24,26,0.3)]">
                {icon}
            </span>

            <div>
                <h2 className="text-sm font-semibold text-ink">
                    {title}
                </h2>

                <p className="mt-0.5 text-xs text-muted">
                    {description}
                </p>
            </div>
        </div>
    );
}

function TimelineStep({
    label,
    active,
    current,
    color,
}: {
    label: string;
    active: boolean;
    current: boolean;
    color: string;
}) {
    return (
        <div className="flex items-center gap-2.5">
            <span
                className={`relative flex h-6 w-6 shrink-0 items-center justify-center rounded-full border transition-all duration-300 ${active
                    ? "border-transparent text-on-accent shadow-sm"
                    : "border-line bg-surface text-transparent"
                    } ${current ? "ring-4 ring-accent/8" : ""}`}
                style={active ? { backgroundColor: color } : undefined}
            >
                {active && <Check className="h-3 w-3" strokeWidth={3} />}
            </span>

            <span
                className={`text-xs font-medium transition-colors ${current
                    ? "text-ink"
                    : active
                        ? "text-ink-2"
                        : "text-faint"
                    }`}
            >
                {label}
            </span>
        </div>
    );
}

export default async function JobDetailsPage({
    params,
}: JobDetailsPageProps) {
    const session = await auth();

    if (!session?.user?.email) {
        return (
            <main
                className={`${sans.className} min-h-screen bg-canvas px-4 py-10 text-ink sm:px-8 sm:py-16`}
            >
                <div className="mx-auto max-w-xl">
                    <div className="overflow-hidden rounded-[30px] border border-line bg-surface shadow-[0_30px_80px_-40px_rgba(20,24,26,0.3)]">
                        <div className="relative overflow-hidden bg-accent p-8 text-on-accent sm:p-10">
                            <div
                                aria-hidden="true"
                                className="absolute -right-16 -top-16 h-48 w-48 rounded-full border border-white/10"
                            />

                            <div
                                aria-hidden="true"
                                className="absolute bottom-0 right-24 h-20 w-20 rounded-full bg-white/5"
                            />

                            <div className="relative">
                                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/10">
                                    <FileText className="h-5 w-5 text-on-accent" />
                                </span>

                                <p className="mt-7 text-[11px] font-semibold uppercase tracking-[0.16em] text-accent">
                                    JobTrack
                                </p>

                                <h1
                                    className={`${serif.className} mt-2 text-4xl text-on-accent`}
                                >
                                    Sign in required
                                </h1>

                                <p className="mt-3 max-w-md text-sm leading-6 text-on-accent">
                                    Sign in to access the details and insights
                                    for this application.
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center justify-between gap-4 p-6 sm:p-8">
                            <p className="text-xs text-muted">
                                Your applications are private to your account.
                            </p>

                            <Link
                                href="/dashboatd"
                                className="group inline-flex shrink-0 items-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-on-accent shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-accent hover:shadow-[0_10px_25px_-12px_rgba(var(--accent-rgb),0.7)]"
                            >
                                <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
                                Dashboard
                            </Link>
                        </div>
                    </div>
                </div>
            </main>
        );
    }

    const { id } = await params;
    const jobId = Number(id);

    if (!Number.isInteger(jobId)) {
        notFound();
    }

    const user = await prisma.user.findUnique({
        where: {
            email: session.user.email,
        },
        select: {
            id: true,
        },
    });

    if (!user) {
        notFound();
    }

    const job = await prisma.job.findFirst({
        where: {
            id: jobId,
            userId: user.id,
        },
    });

    if (!job) {
        notFound();
    }

    const appliedDate = new Date(job.appliedDate);

    const status =
        statusStyles[job.status] ?? statusStyles.Wishlist;

    const avatar = getAvatarPalette(job.company);

    const formattedDate = formatDate(appliedDate);

    const relativeAppliedDate =
        getRelativeTime(appliedDate);

    const timeline = [
        "Wishlist",
        "Applied",
        "Interview",
        "Offer",
    ];

    const currentTimelineIndex =
        job.status === "Rejected"
            ? 1
            : Math.max(timeline.indexOf(job.status), 0);

    return (
        <>
        <Navbar />
        <main
            className={`${sans.className} min-h-screen bg-canvas text-ink`}
        >
            {/* Subtle page texture */}
            <div
                aria-hidden="true"
                className="pointer-events-none fixed inset-0 opacity-[0.28] [background-image:radial-gradient(var(--color-line-strong)_0.65px,transparent_0.65px)] [background-size:28px_28px]"
            />

            <div className="relative mx-auto max-w-[1520px] px-4 py-6 sm:px-8 sm:py-10">
                {/* Top navigation */}
                <div className="mb-6 flex items-center justify-between gap-4">
                    <Link
                        href="/dashboard"
                        className="group inline-flex items-center gap-2 rounded-xl border border-line bg-surface/75 px-3.5 py-2 text-sm font-medium text-ink-2 shadow-[0_5px_20px_-14px_rgba(20,24,26,0.3)] backdrop-blur-sm transition-all duration-200 hover:-translate-x-0.5 hover:border-line hover:bg-surface hover:text-accent"
                    >
                        <ArrowLeft className="h-4 w-4 transition-transform duration-200 group-hover:-translate-x-1" />
                        Dashboard
                    </Link>

                    <span className="hidden text-xs font-medium text-muted sm:block">
                        Application #{job.id}
                    </span>
                </div>

                {/* Main application shell */}
                <article className="overflow-hidden rounded-[30px] border border-line bg-surface shadow-[0_30px_80px_-40px_rgba(20,24,26,0.3)]">
                    {/* Application header */}
                    <header className="relative overflow-hidden bg-accent text-on-accent">
                        <div
                            aria-hidden="true"
                            className="absolute inset-0 opacity-[0.08] [background-image:linear-gradient(120deg,transparent_0%,transparent_42%,white_42.3%,transparent_42.7%,transparent_100%)] [background-size:42px_42px]"
                        />

                        <div
                            aria-hidden="true"
                            className="absolute -right-24 -top-28 h-80 w-80 rounded-full border border-white/10"
                        />

                        <div
                            aria-hidden="true"
                            className="absolute -right-8 bottom-[-100px] h-64 w-64 rounded-full bg-accent-line/10 blur-2xl"
                        />

                        <div className="relative grid lg:grid-cols-[1fr_280px]">
                            <div className="p-7 sm:p-10">
                                <div className="flex flex-wrap items-start justify-between gap-5">
                                    <div
                                        className="flex h-16 w-16 shrink-0 items-center justify-center rounded-[20px] text-xl font-semibold shadow-[0_16px_35px_-18px_rgba(0,0,0,0.6)] transition-transform duration-300 hover:-rotate-2 hover:scale-105"
                                        style={{
                                            backgroundColor: avatar.bg,
                                            color: avatar.text,
                                        }}
                                        aria-hidden="true"
                                    >
                                        {getInitials(job.company)}
                                    </div>

                                    <span
                                        className={`inline-flex items-center gap-2 rounded-full border px-3.5 py-2 text-xs font-semibold ${status.bg} ${status.text} ${status.border}`}
                                    >
                                        <span
                                            className="h-1.5 w-1.5 rounded-full"
                                            style={{
                                                backgroundColor: status.dot,
                                            }}
                                            aria-hidden="true"
                                        />

                                        {job.status}
                                    </span>
                                </div>

                                <div className="mt-8">
                                    <p className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-accent">
                                        <Sparkles className="h-3.5 w-3.5" />
                                        Application
                                    </p>

                                    <h1
                                        className={`${serif.className} mt-2 max-w-3xl text-4xl leading-[1.05] tracking-tight text-on-accent sm:text-6xl`}
                                    >
                                        {job.position}
                                    </h1>

                                    <p className="mt-4 text-lg font-medium text-on-accent">
                                        {job.company}
                                    </p>

                                    <div className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-sm text-accent">
                                        <span className="inline-flex items-center gap-1.5">
                                            <MapPin className="h-4 w-4" />
                                            {job.location}
                                        </span>

                                        <span className="hidden h-4 w-px bg-white/15 sm:block" />

                                        <span className="inline-flex items-center gap-1.5">
                                            <CalendarDays className="h-4 w-4" />
                                            Applied {relativeAppliedDate}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Status snapshot */}
                            <aside className="border-t border-white/10 bg-black/10 p-6 lg:border-l lg:border-t-0 lg:p-7">
                                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-accent">
                                    Application status
                                </p>

                                <div className="mt-5 flex items-center gap-3">
                                    <span
                                        className="h-3 w-3 rounded-full shadow-[0_0_0_6px_rgba(255,255,255,0.06)]"
                                        style={{
                                            backgroundColor: status.dot,
                                        }}
                                    />

                                    <span className="text-lg font-semibold text-on-accent">
                                        {job.status}
                                    </span>
                                </div>

                                <div className="mt-7 h-px bg-white/10" />

                                <div className="mt-6">
                                    <p className="text-xs text-accent">
                                        Applied on
                                    </p>

                                    <p className="mt-1 text-sm font-medium text-on-accent">
                                        {formattedDate}
                                    </p>
                                </div>
                            </aside>
                        </div>
                    </header>

                    {/* Metadata strip */}
                    <div className="grid border-b border-line bg-canvas sm:grid-cols-3">
                        <MetaItem
                            icon={
                                <CalendarDays
                                    className="h-4 w-4"
                                    aria-hidden="true"
                                />
                            }
                            label="Applied on"
                            value={formattedDate}
                        />

                        <MetaItem
                            icon={
                                <MapPin
                                    className="h-4 w-4"
                                    aria-hidden="true"
                                />
                            }
                            label="Location"
                            value={job.location}
                        />

                        <MetaItem
                            icon={
                                <Wallet
                                    className="h-4 w-4"
                                    aria-hidden="true"
                                />
                            }
                            label="Salary"
                            value={job.salary || "Not specified"}
                        />
                    </div>

                    {/* Content */}
                    <div className="grid lg:grid-cols-[minmax(0,1fr)_260px]">
                        <div className="min-w-0 p-6 sm:p-9">
                            {/* Job posting */}
                            {job.jobUrl ? (
                                <section
                                    aria-labelledby="job-posting-heading"
                                    className="group relative overflow-hidden rounded-2xl border border-line bg-canvas p-5 transition-all duration-300 hover:border-accent-line hover:bg-surface hover:shadow-[0_18px_40px_-28px_rgba(20,24,26,0.35)] sm:p-6"
                                >
                                    <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                                        <div className="flex min-w-0 items-start gap-4">
                                            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent-soft text-accent transition-transform duration-300 group-hover:scale-105">
                                                <ExternalLink className="h-5 w-5" />
                                            </span>

                                            <div className="min-w-0">
                                                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">
                                                    Original source
                                                </p>

                                                <h2
                                                    id="job-posting-heading"
                                                    className="mt-1 font-semibold text-ink"
                                                >
                                                    Job posting
                                                </h2>

                                                <p className="mt-1 max-w-xl text-sm leading-6 text-muted">
                                                    Review the original listing,
                                                    requirements, and company
                                                    details.
                                                </p>
                                            </div>
                                        </div>

                                        <a
                                            href={job.jobUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="group/button inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-on-accent shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-accent hover:shadow-[0_12px_24px_-14px_rgba(var(--accent-rgb),0.8)] focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2"
                                        >
                                            Open listing
                                            <ArrowUpRight className="h-4 w-4 transition-transform duration-200 group-hover/button:-translate-y-0.5 group-hover/button:translate-x-0.5" />

                                            <span className="sr-only">
                                                (opens in a new tab)
                                            </span>
                                        </a>
                                    </div>
                                </section>
                            ) : null}

                            {/* Key points from the ad */}
                            <section
                                aria-label="Key points from the ad"
                                className="mt-9 border-t border-line pt-9"
                            >
                                <div className="flex items-center justify-between gap-4">
                                    <SectionHeading
                                        icon={
                                            <ClipboardList
                                                className="h-4 w-4"
                                                aria-hidden="true"
                                            />
                                        }
                                        title="Key points from the ad"
                                        description="The important parts of the listing, at a glance"
                                    />
                                </div>

                                <div className="mt-5">
                                    <JobAdNotes jobId={job.id} />
                                </div>
                            </section>

                            {/* Notes */}
                            <section
                                aria-labelledby="notes-heading"
                                className="mt-9 border-t border-line pt-9"
                            >
                                <SectionHeading
                                    icon={
                                        <FileText
                                            className="h-4 w-4"
                                            aria-hidden="true"
                                        />
                                    }
                                    title="Notes"
                                    description="Your personal notes for this application"
                                />

                                {job.notes ? (
                                    <div className="group relative mt-5 overflow-hidden rounded-2xl border border-line bg-canvas p-5 transition-all duration-300 hover:border-accent-line hover:bg-surface hover:shadow-[0_18px_35px_-28px_rgba(20,24,26,0.35)] sm:p-6">
                                        <div
                                            aria-hidden="true"
                                            className="absolute bottom-0 left-0 top-0 w-1 bg-accent-soft transition-colors duration-300 group-hover:bg-accent"
                                        />

                                        <p className="whitespace-pre-wrap pl-3 text-sm leading-7 text-ink-2">
                                            {job.notes}
                                        </p>
                                    </div>
                                ) : (
                                    <div className="mt-5 rounded-2xl border border-dashed border-line bg-canvas p-8 text-center">
                                        <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-surface-2 text-muted">
                                            <FileText className="h-4 w-4" />
                                        </span>

                                        <p className="mt-4 text-sm font-semibold text-ink-2">
                                            No notes yet
                                        </p>

                                        <p className="mx-auto mt-1 max-w-sm text-xs leading-5 text-muted">
                                            Add notes from your dashboard to
                                            keep track of thoughts, follow-ups,
                                            or interview preparation.
                                        </p>
                                    </div>
                                )}
                            </section>


                            {/* Interview */}
                            <section
                                aria-labelledby="interview-heading"
                                className="mt-9 border-t border-line pt-9"
                            >
                                <SectionHeading
                                    icon={
                                        <CalendarDays
                                            className="h-4 w-4"
                                            aria-hidden="true"
                                        />
                                    }
                                    title="Interview"
                                    description="Schedule and manage your interview for this application"
                                />

                                <div className="mt-5">
                                    <JobInterview
                                        jobId={job.id}
                                        initialInterview={{
                                            interviewDate:
                                                job.interviewDate?.toISOString() ??
                                                null,
                                            interviewTime:
                                                job.interviewTime,
                                            interviewType:
                                                job.interviewType,
                                            interviewLocation:
                                                job.interviewLocation,
                                            interviewNotes:
                                                job.interviewNotes,
                                        }}
                                    />
                                </div>
                            </section>



                            {/* AI insights */}
                            <section
                                aria-labelledby="ai-insights-heading"
                                className="mt-9 border-t border-line pt-9"
                            >
                                <div className="flex items-center justify-between gap-4">
                                    <SectionHeading
                                        icon={
                                            <Sparkles
                                                className="h-4 w-4"
                                                aria-hidden="true"
                                            />
                                        }
                                        title="AI insights"
                                        description="Helpful context for this application"
                                    />

                                    <span className="hidden items-center gap-1.5 rounded-full border border-applied-line bg-applied-soft px-2.5 py-1 text-[10px] font-semibold text-applied sm:inline-flex">
                                        <Sparkles className="h-3 w-3" />
                                        AI assisted
                                    </span>
                                </div>

                                <div className="mt-5 rounded-2xl border border-applied-line bg-applied-soft p-4 sm:p-5">
                                    <AIInsights jobId={job.id} />
                                </div>
                            </section>

                            {/* Tailor CV */}
                            <section
                                aria-labelledby="tailor-cv-heading"
                                className="mt-9 border-t border-line pt-9"
                            >
                                <h2 id="tailor-cv-heading" className="flex items-center gap-2 text-base font-bold text-ink">
                                    <FileText className="h-4 w-4 text-accent" aria-hidden="true" />
                                    Tailor your CV for this job
                                </h2>
                                <div className="mt-5">
                                    <TailorCv jobId={job.id} jobLabel={`${job.position} at ${job.company}`} />
                                </div>
                            </section>
                        </div>

                        {/* Application timeline */}
                        <aside className="border-t border-line bg-canvas p-6 lg:border-l lg:border-t-0 lg:p-7">
                            <div className="sticky top-6">
                                <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted">
                                    Application journey
                                </p>

                                <h2
                                    className={`${serif.className} mt-2 text-2xl text-ink`}
                                >
                                    Where you are
                                </h2>

                                <p className="mt-2 text-xs leading-5 text-muted">
                                    Keep your progress visible as the
                                    application moves forward.
                                </p>

                                <div className="relative mt-7">
                                    <div className="absolute left-3 top-3 h-[calc(100%-24px)] w-px bg-line-strong" />

                                    <div className="relative space-y-5">
                                        {timeline.map(
                                            (label, index) => {
                                                const active =
                                                    index <=
                                                    currentTimelineIndex;

                                                const current =
                                                    job.status === label;

                                                return (
                                                    <div
                                                        key={label}
                                                        className="relative"
                                                    >
                                                        <TimelineStep
                                                            label={label}
                                                            active={active}
                                                            current={current}
                                                            color={
                                                                current
                                                                    ? status.dot
                                                                    : "var(--color-accent)"
                                                            }
                                                        />
                                                    </div>
                                                );
                                            },
                                        )}
                                    </div>
                                </div>

                                {job.status === "Rejected" ? (
                                    <div className="mt-7 rounded-xl border border-rejected-line bg-rejected-soft p-4">
                                        <p className="text-xs font-semibold text-rejected-ink">
                                            Application closed
                                        </p>

                                        <p className="mt-1 text-[11px] leading-5 text-rejected">
                                            This application is currently
                                            marked as rejected.
                                        </p>
                                    </div>
                                ) : null}

                                <div className="mt-8 border-t border-line pt-6">
                                    <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted">
                                        Quick details
                                    </p>

                                    <dl className="mt-4 space-y-4">
                                        <div className="flex items-start justify-between gap-3">
                                            <dt className="text-xs text-muted">
                                                Added
                                            </dt>
                                            <dd className="text-right text-xs font-medium text-ink-2">
                                                {relativeAppliedDate}
                                            </dd>
                                        </div>

                                        <div className="flex items-start justify-between gap-3">
                                            <dt className="text-xs text-muted">
                                                Location
                                            </dt>
                                            <dd className="max-w-[140px] text-right text-xs font-medium text-ink-2">
                                                {job.location}
                                            </dd>
                                        </div>

                                        <div className="flex items-start justify-between gap-3">
                                            <dt className="text-xs text-muted">
                                                Salary
                                            </dt>
                                            <dd className="max-w-[140px] text-right text-xs font-medium text-ink-2">
                                                {job.salary ||
                                                    "Not specified"}
                                            </dd>
                                        </div>
                                    </dl>
                                </div>
                            </div>
                        </aside>
                    </div>
                </article>
            </div>
        </main>
        </>
    );
}
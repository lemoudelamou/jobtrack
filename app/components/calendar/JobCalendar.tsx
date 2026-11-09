"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
    BriefcaseBusiness,
    CalendarDays,
    ChevronLeft,
    ChevronRight,
    Clock3,
    ExternalLink,
    Filter,
    MapPin,
    Sparkles,
    Video,
} from "lucide-react";

type CalendarJob = {
    id: number;
    position: string;
    company: string;
    location?: string | null;
    status: string;
    appliedDate?: string | null;
    createdAt: string;
    interviewDate?: string | null;
    interviewTime?: string | null;
    interviewType?: string | null;
    interviewLocation?: string | null;
    interviewNotes?: string | null;
};

type JobCalendarProps = {
    jobs: CalendarJob[];
};

type DayEvents = {
    applications: CalendarJob[];
    interviews: CalendarJob[];
};

const STATUS_OPTIONS = [
    "All",
    "Wishlist",
    "Applied",
    "Interview",
    "Offer",
    "Rejected",
];

const ACTIVITY_OPTIONS = [
    "All activity",
    "Applications",
    "Interviews",
];

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const ITEMS_PER_PAGE = 4;

function getLocalDayKey(value: string) {
    const date = new Date(value);

    return [
        date.getFullYear(),
        String(date.getMonth() + 1).padStart(2, "0"),
        String(date.getDate()).padStart(2, "0"),
    ].join("-");
}

function getInterviewDayKey(value: string | null) {
    if (!value) return null;

    const date = new Date(value);

    return [
        date.getUTCFullYear(),
        String(date.getUTCMonth() + 1).padStart(2, "0"),
        String(date.getUTCDate()).padStart(2, "0"),
    ].join("-");
}

function getDayKey(date: Date) {
    return [
        date.getFullYear(),
        String(date.getMonth() + 1).padStart(2, "0"),
        String(date.getDate()).padStart(2, "0"),
    ].join("-");
}

function getCalendarDays(month: Date) {
    const year = month.getFullYear();
    const monthIndex = month.getMonth();

    const firstDay = new Date(year, monthIndex, 1);
    const lastDay = new Date(year, monthIndex + 1, 0);

    const leadingEmptyDays = firstDay.getDay();
    const totalDays = lastDay.getDate();

    const days: Array<Date | null> = [];

    for (let i = 0; i < leadingEmptyDays; i += 1) {
        days.push(null);
    }

    for (let day = 1; day <= totalDays; day += 1) {
        days.push(new Date(year, monthIndex, day));
    }

    while (days.length % 7 !== 0) {
        days.push(null);
    }

    return days;
}

function formatMonth(date: Date) {
    return new Intl.DateTimeFormat("en-US", {
        month: "long",
        year: "numeric",
    }).format(date);
}

function formatDate(value: string) {
    return new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
    }).format(new Date(`${value}T00:00:00`));
}

function formatInterviewDate(value: string) {
    return new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        timeZone: "UTC",
    }).format(new Date(value));
}

function formatStatus(status: string) {
    return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
}

function getStatusClasses(status: string) {
    switch (status.toLowerCase()) {
        case "wishlist":
            return {
                dot: "bg-ink-2",
                bg: "bg-surface-2",
                text: "text-ink-2",
            };

        case "applied":
            return {
                dot: "bg-applied",
                bg: "bg-applied-soft",
                text: "text-applied-ink",
            };

        case "interview":
            return {
                dot: "bg-interview",
                bg: "bg-interview-soft",
                text: "text-interview-ink",
            };

        case "offer":
            return {
                dot: "bg-accent",
                bg: "bg-accent-soft",
                text: "text-accent-ink",
            };

        case "rejected":
            return {
                dot: "bg-rejected",
                bg: "bg-rejected-soft",
                text: "text-rejected-ink",
            };

        default:
            return {
                dot: "bg-faint",
                bg: "bg-surface-2",
                text: "text-ink-2",
            };
    }
}

function Pagination({
    currentPage,
    totalPages,
    totalItems,
    onPageChange,
}: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    onPageChange: (page: number) => void;
}) {
    if (totalItems === 0) return null;

    const start = (currentPage - 1) * ITEMS_PER_PAGE + 1;
    const end = Math.min(
        currentPage * ITEMS_PER_PAGE,
        totalItems,
    );

    if (totalPages <= 1) {
        return (
            <div className="mt-5 border-t border-line pt-4 text-xs text-muted">
                Showing {start}–{end} of {totalItems}
            </div>
        );
    }

    return (
        <div className="mt-5 flex flex-col gap-3 border-t border-line pt-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-muted">
                Showing{" "}
                <span className="font-medium text-ink-2">
                    {start}–{end}
                </span>{" "}
                of{" "}
                <span className="font-medium text-ink-2">
                    {totalItems}
                </span>
            </p>

            <div className="flex items-center gap-1.5">
                <button
                    type="button"
                    onClick={() =>
                        onPageChange(Math.max(1, currentPage - 1))
                    }
                    disabled={currentPage === 1}
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-line bg-surface text-ink-2 transition-all duration-200 hover:-translate-y-0.5 hover:border-line hover:text-accent-ink disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-y-0"
                    aria-label="Previous page"
                >
                    <ChevronLeft className="h-4 w-4" />
                </button>

                {Array.from(
                    { length: totalPages },
                    (_, index) => index + 1,
                ).map((page) => (
                    <button
                        key={page}
                        type="button"
                        onClick={() => onPageChange(page)}
                        className={[
                            "h-8 min-w-8 rounded-lg px-2 text-xs font-medium transition-all duration-200",
                            page === currentPage
                                ? "bg-accent-strong text-on-accent shadow-sm"
                                : "border border-transparent text-muted hover:-translate-y-0.5 hover:border-line hover:bg-surface hover:text-accent-ink",
                        ].join(" ")}
                    >
                        {page}
                    </button>
                ))}

                <button
                    type="button"
                    onClick={() =>
                        onPageChange(
                            Math.min(totalPages, currentPage + 1),
                        )
                    }
                    disabled={currentPage === totalPages}
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-line bg-surface text-ink-2 transition-all duration-200 hover:-translate-y-0.5 hover:border-line hover:text-accent-ink disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-y-0"
                    aria-label="Next page"
                >
                    <ChevronRight className="h-4 w-4" />
                </button>
            </div>
        </div>
    );
}

function StatusBadge({ status }: { status: string }) {
    const styles = getStatusClasses(status);

    return (
        <span
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium ${styles.bg} ${styles.text}`}
        >
            <span
                className={`h-1.5 w-1.5 rounded-full ${styles.dot}`}
            />
            {formatStatus(status)}
        </span>
    );
}

export default function JobCalendar({
    jobs,
}: JobCalendarProps) {
    const [currentMonth, setCurrentMonth] = useState(
        () => new Date(),
    );

    const [selectedDay, setSelectedDay] = useState<string | null>(
        null,
    );

    const [statusFilter, setStatusFilter] = useState("All");

    const [activityFilter, setActivityFilter] =
        useState("All activity");

    const [applicationsPage, setApplicationsPage] = useState(1);

    const [interviewsPage, setInterviewsPage] = useState(1);

    const statusFilteredJobs = useMemo(() => {
        if (statusFilter === "All") {
            return jobs;
        }

        return jobs.filter(
            (job) =>
                formatStatus(job.status) === statusFilter,
        );
    }, [jobs, statusFilter]);

    const activity = useMemo(() => {
        const applications =
            activityFilter === "Interviews"
                ? []
                : statusFilteredJobs;

        const interviews =
            activityFilter === "Applications"
                ? []
                : statusFilteredJobs.filter(
                    (job) => Boolean(job.interviewDate),
                );

        return {
            applications,
            interviews,
        };
    }, [activityFilter, statusFilteredJobs]);

    const calendarDays = useMemo(
        () => getCalendarDays(currentMonth),
        [currentMonth],
    );

    const eventsByDay = useMemo(() => {
        const map = new Map<string, DayEvents>();

        for (const job of activity.applications) {
            const key = getLocalDayKey(job.createdAt);

            const existing = map.get(key) ?? {
                applications: [],
                interviews: [],
            };

            existing.applications.push(job);
            map.set(key, existing);
        }

        for (const job of activity.interviews) {
            const key = getInterviewDayKey(job.interviewDate ?? null);

            if (!key) continue;

            const existing = map.get(key) ?? {
                applications: [],
                interviews: [],
            };

            existing.interviews.push(job);
            map.set(key, existing);
        }

        return map;
    }, [activity]);

    const selectedEvents = selectedDay
        ? eventsByDay.get(selectedDay) ?? {
            applications: [],
            interviews: [],
        }
        : null;

    const todayKey = getDayKey(new Date());

    const upcomingInterviews = useMemo(() => {
        const now = Date.now();

        return jobs
            .filter((job) => {
                if (!job.interviewDate) return false;

                return (
                    new Date(job.interviewDate).getTime() >= now
                );
            })
            .sort(
                (a, b) =>
                    new Date(a.interviewDate!).getTime() -
                    new Date(b.interviewDate!).getTime(),
            )
            .slice(0, 5);
    }, [jobs]);

    const monthStats = useMemo(() => {
        const year = currentMonth.getFullYear();
        const month = currentMonth.getMonth();

        const applications = jobs.filter((job) => {
            const date = new Date(job.createdAt);

            return (
                date.getFullYear() === year &&
                date.getMonth() === month
            );
        });

        const interviews = jobs.filter((job) => {
            if (!job.interviewDate) return false;

            const date = new Date(job.interviewDate);

            return (
                date.getUTCFullYear() === year &&
                date.getUTCMonth() === month
            );
        });

        const wishlist = applications.filter(
            (job) => job.status.toLowerCase() === "wishlist",
        ).length;

        const applied = applications.filter(
            (job) => job.status.toLowerCase() === "applied",
        ).length;

        const offers = applications.filter(
            (job) => job.status.toLowerCase() === "offer",
        ).length;

        const rejected = applications.filter(
            (job) => job.status.toLowerCase() === "rejected",
        ).length;

        return {
            applications: applications.length,
            interviews: interviews.length,
            wishlist,
            applied,
            offers,
            rejected,
        };
    }, [currentMonth, jobs]);

    const selectedApplications =
        selectedEvents?.applications ?? [];

    const selectedInterviews =
        selectedEvents?.interviews ?? [];

    const totalApplicationPages = Math.max(
        1,
        Math.ceil(
            selectedApplications.length / ITEMS_PER_PAGE,
        ),
    );

    const totalInterviewPages = Math.max(
        1,
        Math.ceil(
            selectedInterviews.length / ITEMS_PER_PAGE,
        ),
    );

    const visibleApplications = selectedApplications.slice(
        (applicationsPage - 1) * ITEMS_PER_PAGE,
        applicationsPage * ITEMS_PER_PAGE,
    );

    const visibleInterviews = selectedInterviews.slice(
        (interviewsPage - 1) * ITEMS_PER_PAGE,
        interviewsPage * ITEMS_PER_PAGE,
    );

    useEffect(() => {
        setApplicationsPage(1);
        setInterviewsPage(1);
    }, [
        selectedDay,
        statusFilter,
        activityFilter,
    ]);

    useEffect(() => {
        setApplicationsPage((page) =>
            Math.min(page, totalApplicationPages),
        );
    }, [totalApplicationPages]);

    useEffect(() => {
        setInterviewsPage((page) =>
            Math.min(page, totalInterviewPages),
        );
    }, [totalInterviewPages]);

    function previousMonth() {
        setCurrentMonth(
            (month) =>
                new Date(
                    month.getFullYear(),
                    month.getMonth() - 1,
                    1,
                ),
        );

        setSelectedDay(null);
    }

    function nextMonth() {
        setCurrentMonth(
            (month) =>
                new Date(
                    month.getFullYear(),
                    month.getMonth() + 1,
                    1,
                ),
        );

        setSelectedDay(null);
    }

    function goToToday() {
        const today = new Date();

        setCurrentMonth(
            new Date(
                today.getFullYear(),
                today.getMonth(),
                1,
            ),
        );

        setSelectedDay(todayKey);
    }

    function handleStatusChange(
        event: React.ChangeEvent<HTMLSelectElement>,
    ) {
        setStatusFilter(event.target.value);
        setSelectedDay(null);
    }

    function handleActivityChange(
        event: React.ChangeEvent<HTMLSelectElement>,
    ) {
        setActivityFilter(event.target.value);
        setSelectedDay(null);
    }

    const selectedDayHasEvents =
        selectedApplications.length > 0 ||
        selectedInterviews.length > 0;

    return (
        <div className="space-y-6">
            {/* Filters */}
            <section className="overflow-hidden rounded-2xl border border-line bg-surface shadow-[0_8px_30px_rgba(25,45,35,0.04)]">
                <div className="flex flex-col gap-5 p-5 sm:p-6 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                        <div className="flex items-center gap-2">
                            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent-soft text-accent">
                                <Filter className="h-4 w-4" />
                            </div>

                            <div>
                                <p className="text-sm font-semibold text-accent-ink">
                                    Calendar activity
                                </p>

                                <p className="text-xs text-muted">
                                    Filter what appears on your
                                    calendar.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col gap-3 sm:flex-row">
                        <label className="group relative">
                            <span className="sr-only">
                                Filter by status
                            </span>

                            <select
                                value={statusFilter}
                                onChange={handleStatusChange}
                                className="h-10 w-full min-w-[165px] appearance-none rounded-xl border border-line bg-canvas px-3 pr-9 text-sm text-ink-2 outline-none transition-all duration-200 hover:border-line focus:border-muted focus:bg-surface focus:ring-4 focus:ring-accent/5 sm:w-auto"
                            >
                                {STATUS_OPTIONS.map(
                                    (option) => (
                                        <option
                                            key={option}
                                            value={option}
                                        >
                                            {option}
                                        </option>
                                    ),
                                )}
                            </select>

                            <ChevronRight className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 rotate-90 text-muted" />
                        </label>

                        <label className="relative">
                            <span className="sr-only">
                                Filter by activity
                            </span>

                            <select
                                value={activityFilter}
                                onChange={handleActivityChange}
                                className="h-10 w-full min-w-[165px] appearance-none rounded-xl border border-line bg-canvas px-3 pr-9 text-sm text-ink-2 outline-none transition-all duration-200 hover:border-line focus:border-muted focus:bg-surface focus:ring-4 focus:ring-accent/5 sm:w-auto"
                            >
                                {ACTIVITY_OPTIONS.map(
                                    (option) => (
                                        <option
                                            key={option}
                                            value={option}
                                        >
                                            {option}
                                        </option>
                                    ),
                                )}
                            </select>

                            <ChevronRight className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 rotate-90 text-muted" />
                        </label>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-line bg-canvas px-5 py-3.5 text-xs text-muted sm:px-6">
                    <span className="inline-flex items-center gap-2">
                        <span className="h-1.5 w-1.5 rounded-full bg-applied" />
                        {activity.applications.length} applications
                    </span>

                    <span className="inline-flex items-center gap-2">
                        <span className="h-1.5 w-1.5 rounded-full bg-interview" />
                        {activity.interviews.length} interviews
                    </span>

                    <span className="ml-auto hidden text-muted sm:inline">
                        Click a day to view activity
                    </span>
                </div>
            </section>

            {/* Calendar */}
            <section className="overflow-hidden rounded-2xl border border-line bg-surface shadow-[0_8px_30px_rgba(25,45,35,0.05)]">
                <div className="flex flex-col gap-4 border-b border-line p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
                    <div>
                        <div className="flex items-center gap-2">
                            <CalendarDays className="h-[18px] w-[18px] text-accent" />

                            <h2 className="text-[17px] font-semibold tracking-tight text-accent-ink">
                                {formatMonth(currentMonth)}
                            </h2>
                        </div>

                        <p className="mt-1 text-xs text-muted">
                            Select a date to inspect your job
                            activity.
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={goToToday}
                            className="hidden h-9 items-center gap-2 rounded-lg border border-line bg-canvas px-3 text-xs font-medium text-ink-2 transition-all duration-200 hover:-translate-y-0.5 hover:border-line hover:bg-surface hover:text-accent-ink sm:flex"
                        >
                            <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                            Today
                        </button>

                        <button
                            type="button"
                            onClick={previousMonth}
                            className="flex h-9 w-9 items-center justify-center rounded-lg border border-line bg-canvas text-ink-2 transition-all duration-200 hover:-translate-y-0.5 hover:border-line hover:bg-surface hover:text-accent-ink active:translate-y-0"
                            aria-label="Previous month"
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </button>

                        <button
                            type="button"
                            onClick={nextMonth}
                            className="flex h-9 w-9 items-center justify-center rounded-lg border border-line bg-canvas text-ink-2 transition-all duration-200 hover:-translate-y-0.5 hover:border-line hover:bg-surface hover:text-accent-ink active:translate-y-0"
                            aria-label="Next month"
                        >
                            <ChevronRight className="h-4 w-4" />
                        </button>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <div className="min-w-[700px]">
                        <div className="grid grid-cols-7 border-b border-line bg-canvas">
                            {WEEKDAYS.map((day) => (
                                <div
                                    key={day}
                                    className="px-3 py-3 text-center text-[10px] font-semibold uppercase tracking-[0.14em] text-muted"
                                >
                                    {day}
                                </div>
                            ))}
                        </div>

                        <div className="grid grid-cols-7">
                            {calendarDays.map((day, index) => {
                                if (!day) {
                                    return (
                                        <div
                                            key={`empty-${index}`}
                                            className="min-h-[132px] border-b border-r border-line bg-canvas"
                                        />
                                    );
                                }

                                const dayKey = getDayKey(day);

                                const events =
                                    eventsByDay.get(dayKey) ?? {
                                        applications: [],
                                        interviews: [],
                                    };

                                const applicationCount =
                                    events.applications.length;

                                const interviewCount =
                                    events.interviews.length;

                                const totalCount =
                                    applicationCount +
                                    interviewCount;

                                const isToday =
                                    dayKey === todayKey;

                                const isSelected =
                                    dayKey === selectedDay;

                                return (
                                    <button
                                        key={dayKey}
                                        type="button"
                                        onClick={() =>
                                            setSelectedDay(
                                                dayKey,
                                            )
                                        }
                                        className={[
                                            "group relative min-h-[132px] border-b border-r border-line p-2.5 text-left align-top transition-all duration-200 sm:p-3",
                                            isSelected
                                                ? "bg-canvas shadow-[inset_0_0_0_1px_var(--color-accent)]"
                                                : "bg-surface hover:bg-canvas",
                                        ].join(" ")}
                                    >
                                        <div className="flex items-center justify-between">
                                            <span
                                                className={[
                                                    "flex h-7 w-7 items-center justify-center rounded-full text-xs font-medium transition-all duration-200",
                                                    isToday
                                                        ? "bg-accent-strong text-on-accent shadow-sm"
                                                        : isSelected
                                                            ? "bg-accent-soft text-accent-ink"
                                                            : "text-ink-2 group-hover:bg-canvas group-hover:text-accent-ink",
                                                ].join(" ")}
                                            >
                                                {day.getDate()}
                                            </span>

                                            {totalCount > 0 && (
                                                <span className="rounded-full bg-canvas px-1.5 py-0.5 text-[9px] font-semibold text-muted">
                                                    {totalCount}
                                                </span>
                                            )}
                                        </div>

                                        <div className="mt-3 space-y-1.5">
                                            {applicationCount >
                                                0 && (
                                                    <div className="rounded-lg border border-line bg-canvas px-2 py-1.5 transition-all duration-200 group-hover:border-accent-soft group-hover:bg-canvas">
                                                        <div className="flex items-center gap-1.5">
                                                            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-applied" />

                                                            <span className="truncate text-[10px] font-medium text-ink-2">
                                                                {applicationCount ===
                                                                    1
                                                                    ? "Application"
                                                                    : `${applicationCount} applications`}
                                                            </span>
                                                        </div>
                                                    </div>
                                                )}

                                            {interviewCount >
                                                0 && (
                                                    <div className="rounded-lg border border-interview-line bg-interview-soft px-2 py-1.5 transition-all duration-200 group-hover:border-interview-line group-hover:bg-interview-soft">
                                                        <div className="flex items-center gap-1.5">
                                                            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-interview" />

                                                            <span className="truncate text-[10px] font-medium text-interview-ink">
                                                                {interviewCount ===
                                                                    1
                                                                    ? "Interview"
                                                                    : `${interviewCount} interviews`}
                                                            </span>
                                                        </div>
                                                    </div>
                                                )}

                                            {totalCount === 0 && (
                                                <div className="pt-2 text-[10px] text-faint opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                                                    No activity
                                                </div>
                                            )}
                                        </div>

                                        {isSelected && (
                                            <span className="absolute bottom-2 left-1/2 h-0.5 w-6 -translate-x-1/2 rounded-full bg-accent" />
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </section>

            {/* Selected day */}
            <section
                className={[
                    "overflow-hidden rounded-2xl border bg-surface shadow-[0_8px_30px_rgba(25,45,35,0.04)] transition-all duration-300",
                    selectedDay
                        ? "border-line"
                        : "border-line",
                ].join(" ")}
            >
                <div className="border-b border-line px-5 py-5 sm:px-6">
                    {selectedDay ? (
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <div className="flex items-center gap-2">
                                    <div className="h-2 w-2 rounded-full bg-accent" />

                                    <h2 className="text-[16px] font-semibold text-accent-ink">
                                        {formatDate(
                                            selectedDay,
                                        )}
                                    </h2>
                                </div>

                                <p className="mt-1 text-xs text-muted">
                                    {selectedDayHasEvents
                                        ? "Activity scheduled for this day."
                                        : "Nothing scheduled for this day yet."}
                                </p>
                            </div>

                            {selectedDayHasEvents && (
                                <div className="flex items-center gap-2 text-xs text-muted">
                                    <span>
                                        {
                                            selectedApplications.length
                                        }{" "}
                                        applications
                                    </span>

                                    <span className="text-faint">
                                        ·
                                    </span>

                                    <span>
                                        {
                                            selectedInterviews.length
                                        }{" "}
                                        interviews
                                    </span>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-canvas text-muted">
                                <CalendarDays className="h-4 w-4" />
                            </div>

                            <div>
                                <h2 className="text-[16px] font-semibold text-ink-2">
                                    Select a day
                                </h2>

                                <p className="mt-1 text-xs text-muted">
                                    Choose a date above to see its
                                    activity.
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                {selectedDay && (
                    <div className="grid gap-6 p-5 sm:p-6 lg:grid-cols-2">
                        {/* Applications */}
                        <div>
                            <div className="mb-4 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-applied-soft text-applied">
                                        <BriefcaseBusiness className="h-4 w-4" />
                                    </div>

                                    <div>
                                        <h3 className="text-sm font-semibold text-ink">
                                            Applications
                                        </h3>

                                        <p className="text-[11px] text-muted">
                                            {
                                                selectedApplications.length
                                            }{" "}
                                            total
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {visibleApplications.length >
                                0 ? (
                                <div className="space-y-2.5">
                                    {visibleApplications.map(
                                        (job) => (
                                            <Link
                                                key={job.id}
                                                href={`/jobs/${job.id}`}
                                                className="group block rounded-xl border border-line bg-canvas p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-line hover:bg-surface hover:shadow-[0_8px_20px_rgba(25,45,35,0.06)]"
                                            >
                                                <div className="flex items-start justify-between gap-4">
                                                    <div className="min-w-0">
                                                        <p className="truncate text-sm font-semibold text-ink transition-colors group-hover:text-accent-ink">
                                                            {
                                                                job.position
                                                            }
                                                        </p>

                                                        <p className="mt-1 text-xs text-muted">
                                                            {
                                                                job.company
                                                            }
                                                        </p>

                                                        {job.location && (
                                                            <div className="mt-2 flex items-center gap-1.5 text-[11px] text-muted">
                                                                <MapPin className="h-3 w-3" />

                                                                <span className="truncate">
                                                                    {
                                                                        job.location
                                                                    }
                                                                </span>
                                                            </div>
                                                        )}
                                                    </div>

                                                    <ExternalLink className="h-3.5 w-3.5 shrink-0 text-faint transition-all duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-accent" />
                                                </div>

                                                <div className="mt-3">
                                                    <StatusBadge
                                                        status={
                                                            job.status
                                                        }
                                                    />
                                                </div>
                                            </Link>
                                        ),
                                    )}
                                </div>
                            ) : (
                                <div className="rounded-xl border border-dashed border-line bg-canvas px-5 py-8 text-center">
                                    <BriefcaseBusiness className="mx-auto h-5 w-5 text-faint" />

                                    <p className="mt-2 text-xs font-medium text-muted">
                                        No applications
                                    </p>

                                    <p className="mt-1 text-[11px] text-muted">
                                        Nothing was added on this
                                        day.
                                    </p>
                                </div>
                            )}

                            <Pagination
                                currentPage={
                                    applicationsPage
                                }
                                totalPages={
                                    totalApplicationPages
                                }
                                totalItems={
                                    selectedApplications.length
                                }
                                onPageChange={
                                    setApplicationsPage
                                }
                            />
                        </div>

                        {/* Interviews */}
                        <div>
                            <div className="mb-4 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-interview-soft text-interview">
                                        <Video className="h-4 w-4" />
                                    </div>

                                    <div>
                                        <h3 className="text-sm font-semibold text-ink">
                                            Interviews
                                        </h3>

                                        <p className="text-[11px] text-muted">
                                            {
                                                selectedInterviews.length
                                            }{" "}
                                            total
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {visibleInterviews.length >
                                0 ? (
                                <div className="space-y-2.5">
                                    {visibleInterviews.map(
                                        (job) => (
                                            <Link
                                                key={job.id}
                                                href={`/jobs/${job.id}`}
                                                className="group block rounded-xl border border-interview-line bg-interview-soft p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-interview-line hover:bg-surface hover:shadow-[0_8px_20px_rgba(120,90,35,0.07)]"
                                            >
                                                <div className="flex items-start justify-between gap-4">
                                                    <div className="min-w-0">
                                                        <p className="truncate text-sm font-semibold text-ink transition-colors group-hover:text-interview-ink">
                                                            {
                                                                job.position
                                                            }
                                                        </p>

                                                        <p className="mt-1 text-xs text-muted">
                                                            {
                                                                job.company
                                                            }
                                                        </p>
                                                    </div>

                                                    <ExternalLink className="h-3.5 w-3.5 shrink-0 text-faint transition-all duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-interview" />
                                                </div>

                                                <div className="mt-3 space-y-1.5 text-[11px] text-muted">
                                                    {job.interviewDate && (
                                                        <div className="flex items-center gap-2">
                                                            <CalendarDays className="h-3.5 w-3.5 text-interview" />

                                                            <span>
                                                                {formatInterviewDate(
                                                                    job.interviewDate,
                                                                )}
                                                            </span>
                                                        </div>
                                                    )}

                                                    {job.interviewTime && (
                                                        <div className="flex items-center gap-2">
                                                            <Clock3 className="h-3.5 w-3.5 text-interview" />

                                                            <span>
                                                                {
                                                                    job.interviewTime
                                                                }
                                                            </span>
                                                        </div>
                                                    )}

                                                    {job.interviewType && (
                                                        <div className="pt-1">
                                                            <span className="inline-flex rounded-full bg-interview-soft px-2 py-1 text-[10px] font-medium text-interview-ink">
                                                                {
                                                                    job.interviewType
                                                                }
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                            </Link>
                                        ),
                                    )}
                                </div>
                            ) : (
                                <div className="rounded-xl border border-dashed border-interview-line bg-interview-soft px-5 py-8 text-center">
                                    <Video className="mx-auto h-5 w-5 text-interview" />

                                    <p className="mt-2 text-xs font-medium text-muted">
                                        No interviews
                                    </p>

                                    <p className="mt-1 text-[11px] text-muted">
                                        Nothing is scheduled for
                                        this day.
                                    </p>
                                </div>
                            )}

                            <Pagination
                                currentPage={
                                    interviewsPage
                                }
                                totalPages={
                                    totalInterviewPages
                                }
                                totalItems={
                                    selectedInterviews.length
                                }
                                onPageChange={
                                    setInterviewsPage
                                }
                            />
                        </div>
                    </div>
                )}
            </section>

            {/* Bottom overview */}
            <div className="grid gap-6 lg:grid-cols-[1.25fr_0.75fr]">
                {/* Upcoming interviews */}
                <section className="rounded-2xl border border-line bg-surface p-5 shadow-[0_8px_30px_rgba(25,45,35,0.04)] sm:p-6">
                    <div className="mb-5 flex items-center justify-between">
                        <div>
                            <div className="flex items-center gap-2">
                                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-interview-soft text-interview">
                                    <Clock3 className="h-4 w-4" />
                                </div>

                                <h2 className="text-sm font-semibold text-ink">
                                    Upcoming interviews
                                </h2>
                            </div>

                            <p className="mt-1 pl-10 text-[11px] text-muted">
                                Your next scheduled conversations.
                            </p>
                        </div>

                        <span className="rounded-full bg-canvas px-2.5 py-1 text-[10px] font-medium text-muted">
                            {upcomingInterviews.length}
                        </span>
                    </div>

                    {upcomingInterviews.length > 0 ? (
                        <div className="space-y-2.5">
                            {upcomingInterviews.map(
                                (job) => (
                                    <Link
                                        key={job.id}
                                        href={`/jobs/${job.id}`}
                                        className="group flex items-center justify-between gap-4 rounded-xl border border-line bg-canvas p-3.5 transition-all duration-200 hover:-translate-y-0.5 hover:border-line hover:bg-surface hover:shadow-[0_6px_18px_rgba(25,45,35,0.05)]"
                                    >
                                        <div className="flex min-w-0 items-center gap-3">
                                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-interview-soft text-interview">
                                                <CalendarDays className="h-4 w-4" />
                                            </div>

                                            <div className="min-w-0">
                                                <p className="truncate text-xs font-semibold text-ink-2 group-hover:text-accent-ink">
                                                    {
                                                        job.position
                                                    }
                                                </p>

                                                <p className="mt-0.5 truncate text-[11px] text-muted">
                                                    {
                                                        job.company
                                                    }
                                                </p>
                                            </div>
                                        </div>

                                        <div className="shrink-0 text-right">
                                            <p className="text-[11px] font-medium text-muted">
                                                {formatInterviewDate(
                                                    job.interviewDate!,
                                                )}
                                            </p>

                                            {job.interviewTime && (
                                                <p className="mt-0.5 text-[10px] text-muted">
                                                    {
                                                        job.interviewTime
                                                    }
                                                </p>
                                            )}
                                        </div>
                                    </Link>
                                ),
                            )}
                        </div>
                    ) : (
                        <div className="rounded-xl border border-dashed border-line bg-canvas px-5 py-10 text-center">
                            <Sparkles className="mx-auto h-5 w-5 text-faint" />

                            <p className="mt-2 text-xs font-medium text-muted">
                                No upcoming interviews
                            </p>

                            <p className="mt-1 text-[11px] text-muted">
                                Scheduled interviews will appear
                                here.
                            </p>
                        </div>
                    )}
                </section>

                {/* Monthly statistics */}
                <section className="rounded-2xl border border-line bg-surface p-5 shadow-[0_8px_30px_rgba(25,45,35,0.04)] sm:p-6">
                    <div className="mb-5">
                        <div className="flex items-center gap-2">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent-soft text-accent">
                                <Sparkles className="h-4 w-4" />
                            </div>

                            <h2 className="text-sm font-semibold text-ink">
                                Monthly overview
                            </h2>
                        </div>

                        <p className="mt-1 pl-10 text-[11px] text-muted">
                            {formatMonth(currentMonth)}
                        </p>
                    </div>

                    <div className="grid grid-cols-2 gap-2.5">
                        <div className="group rounded-xl border border-line bg-canvas p-3.5 transition-all duration-200 hover:-translate-y-0.5 hover:bg-surface hover:shadow-sm">
                            <p className="text-[10px] font-medium uppercase tracking-wide text-muted">
                                Applications
                            </p>

                            <p className="mt-1 text-xl font-semibold tracking-tight text-ink">
                                {monthStats.applications}
                            </p>
                        </div>

                        <div className="group rounded-xl border border-line bg-canvas p-3.5 transition-all duration-200 hover:-translate-y-0.5 hover:bg-surface hover:shadow-sm">
                            <p className="text-[10px] font-medium uppercase tracking-wide text-muted">
                                Interviews
                            </p>

                            <p className="mt-1 text-xl font-semibold tracking-tight text-interview-ink">
                                {monthStats.interviews}
                            </p>
                        </div>

                        <div className="group rounded-xl border border-line bg-canvas p-3.5 transition-all duration-200 hover:-translate-y-0.5 hover:bg-surface hover:shadow-sm">
                            <p className="text-[10px] font-medium uppercase tracking-wide text-muted">
                                Wishlist
                            </p>

                            <p className="mt-1 text-xl font-semibold tracking-tight text-ink-2">
                                {monthStats.wishlist}
                            </p>
                        </div>

                        <div className="group rounded-xl border border-line bg-canvas p-3.5 transition-all duration-200 hover:-translate-y-0.5 hover:bg-surface hover:shadow-sm">
                            <p className="text-[10px] font-medium uppercase tracking-wide text-muted">
                                Applied
                            </p>

                            <p className="mt-1 text-xl font-semibold tracking-tight text-applied-ink">
                                {monthStats.applied}
                            </p>
                        </div>

                        <div className="group rounded-xl border border-line bg-canvas p-3.5 transition-all duration-200 hover:-translate-y-0.5 hover:bg-surface hover:shadow-sm">
                            <p className="text-[10px] font-medium uppercase tracking-wide text-muted">
                                Offers
                            </p>

                            <p className="mt-1 text-xl font-semibold tracking-tight text-accent">
                                {monthStats.offers}
                            </p>
                        </div>

                        <div className="group rounded-xl border border-line bg-canvas p-3.5 transition-all duration-200 hover:-translate-y-0.5 hover:bg-surface hover:shadow-sm">
                            <p className="text-[10px] font-medium uppercase tracking-wide text-muted">
                                Rejected
                            </p>

                            <p className="mt-1 text-xl font-semibold tracking-tight text-rejected-ink">
                                {monthStats.rejected}
                            </p>
                        </div>
                    </div>
                </section>
            </div>

            {/* Legend */}
            <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 pb-2 text-[10px] text-muted">
                <span className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-applied" />
                    Application
                </span>

                <span className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-interview" />
                    Interview
                </span>

                <span className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                    Today
                </span>
            </div>
        </div>
    );
}
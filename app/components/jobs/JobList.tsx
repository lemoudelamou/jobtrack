"use client";

import Link from "next/link";
import { ExternalLink, Pencil, Trash2 } from "lucide-react";

import { Job } from "@/app/types/job";
import { formatShortDate } from "@/app/components/jobs/JobBoard";
import { STATUS_META, STATUS_ORDER, getInitials } from "@/lib/theme";
import { button, cx } from "@/lib/ui";

function StageSelect({
    job,
    onStatusChange,
}: {
    job: Job;
    onStatusChange?: (id: number, status: Job["status"]) => void;
}) {
    const meta = STATUS_META[job.status];

    if (!onStatusChange) {
        return (
            <span className={cx("inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium", meta.bg, meta.text)}>
                <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: meta.dot }} />
                {job.status}
            </span>
        );
    }

    return (
        <span className={cx("relative inline-flex items-center rounded-md", meta.bg)}>
            <span
                aria-hidden="true"
                className="pointer-events-none absolute left-2 h-1.5 w-1.5 rounded-full"
                style={{ backgroundColor: meta.dot }}
            />
            <select
                value={job.status}
                onChange={(event) => onStatusChange(job.id, event.target.value as Job["status"])}
                aria-label={`Stage for ${job.position} at ${job.company}`}
                className={cx(
                    "h-6 cursor-pointer appearance-none rounded-md bg-transparent pl-5 pr-5 text-xs font-medium outline-none focus-visible:outline-2 focus-visible:outline-accent",
                    meta.text,
                )}
            >
                {STATUS_ORDER.map((status) => (
                    <option key={status} value={status}>
                        {status}
                    </option>
                ))}
            </select>
            <svg
                aria-hidden="true"
                viewBox="0 0 12 12"
                className={cx("pointer-events-none absolute right-1.5 h-2.5 w-2.5", meta.text)}
            >
                <path d="M3 4.5 6 7.5 9 4.5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
        </span>
    );
}

function RowActions({
    job,
    onEdit,
    onDelete,
}: {
    job: Job;
    onEdit: (job: Job) => void;
    onDelete: (job: Job) => void;
}) {
    return (
        <div className="flex items-center justify-end gap-0.5">
            {job.jobUrl && (
                <a
                    href={job.jobUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Open job posting"
                    title="Open job posting"
                    className={button.icon}
                >
                    <ExternalLink className="h-4 w-4" strokeWidth={1.75} />
                </a>
            )}
            <button
                type="button"
                onClick={() => onEdit(job)}
                aria-label={`Edit ${job.position}`}
                title="Edit"
                className={button.icon}
            >
                <Pencil className="h-4 w-4" strokeWidth={1.75} />
            </button>
            <button
                type="button"
                onClick={() => onDelete(job)}
                aria-label={`Delete ${job.position}`}
                title="Delete"
                className={cx(button.icon, "hover:bg-rejected-soft hover:text-rejected-ink")}
            >
                <Trash2 className="h-4 w-4" strokeWidth={1.75} />
            </button>
        </div>
    );
}

export default function JobList({
    jobs,
    onEdit,
    onDelete,
    onStatusChange,
}: {
    jobs: Job[];
    onEdit: (job: Job) => void;
    onDelete: (job: Job) => void;
    onStatusChange?: (id: number, status: Job["status"]) => void;
}) {
    return (
        <div className="panel overflow-hidden">
            {/* Wide screens: table */}
            <table className="hidden w-full table-fixed text-sm md:table">
                <colgroup>
                    <col className="w-[36%]" />
                    <col className="w-[15%]" />
                    <col className="w-[16%]" />
                    <col className="w-[13%]" />
                    <col className="w-[9%]" />
                    <col className="w-[11%]" />
                </colgroup>
                <thead>
                    <tr className="border-b border-[var(--glass-line)] text-left text-xs font-semibold text-muted">
                        <th scope="col" className="py-2.5 pl-4 pr-3 font-medium">Role</th>
                        <th scope="col" className="px-3 py-2.5 font-medium">Stage</th>
                        <th scope="col" className="px-3 py-2.5 font-medium">Location</th>
                        <th scope="col" className="px-3 py-2.5 font-medium">Salary</th>
                        <th scope="col" className="px-3 py-2.5 text-right font-medium">Date</th>
                        <th scope="col" className="py-2.5 pl-3 pr-3">
                            <span className="sr-only">Actions</span>
                        </th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-[var(--glass-line)]">
                    {jobs.map((job) => (
                        <tr key={job.id} className="group transition-colors hover:bg-[var(--glass-strong)]">
                            <td className="py-2.5 pl-4 pr-3">
                                <div className="flex items-center gap-3">
                                    <span
                                        aria-hidden="true"
                                        className="bg-accent-gradient flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-[11px] font-extrabold text-white"
                                    >
                                        {getInitials(job.company)}
                                    </span>
                                    <div className="min-w-0">
                                        <Link
                                            href={`/jobs/${job.id}`}
                                            className="block truncate font-bold text-ink hover:text-accent hover:underline hover:underline-offset-2"
                                        >
                                            {job.position}
                                        </Link>
                                        <p className="truncate text-xs text-muted">{job.company}</p>
                                    </div>
                                </div>
                            </td>
                            <td className="whitespace-nowrap px-3 py-2.5">
                                <StageSelect job={job} onStatusChange={onStatusChange} />
                            </td>
                            <td className="truncate px-3 py-2.5 text-ink-2">{job.location}</td>
                            <td className="truncate px-3 py-2.5 text-ink-2">
                                {job.salary || <span className="text-faint">—</span>}
                            </td>
                            <td className="whitespace-nowrap px-3 py-2.5 text-right tabular-nums text-ink-2">
                                {formatShortDate(job.appliedDate)}
                            </td>
                            <td className="py-2.5 pl-3 pr-3">
                                <div className="opacity-60 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
                                    <RowActions job={job} onEdit={onEdit} onDelete={onDelete} />
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {/* Small screens: stacked rows */}
            <ul className="divide-y divide-[var(--glass-line)] md:hidden">
                {jobs.map((job) => (
                    <li key={job.id} className="px-4 py-3">
                        <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                                <Link href={`/jobs/${job.id}`} className="block truncate font-medium text-ink">
                                    {job.position}
                                </Link>
                                <p className="truncate text-sm text-muted">
                                    {job.company}
                                    {job.location ? `, ${job.location}` : ""}
                                </p>
                            </div>
                            <span className="shrink-0 pt-0.5 text-xs tabular-nums text-muted">
                                {formatShortDate(job.appliedDate)}
                            </span>
                        </div>
                        <div className="mt-2 flex items-center justify-between">
                            <StageSelect job={job} onStatusChange={onStatusChange} />
                            <RowActions job={job} onEdit={onEdit} onDelete={onDelete} />
                        </div>
                    </li>
                ))}
            </ul>
        </div>
    );
}

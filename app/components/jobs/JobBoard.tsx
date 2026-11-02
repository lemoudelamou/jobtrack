"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, MapPin, Pencil } from "lucide-react";

import { Job } from "@/app/types/job";
import { STATUS_META, STATUS_ORDER, getInitials } from "@/lib/theme";
import { cx } from "@/lib/ui";

export function formatShortDate(value: string | null | undefined) {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";

    return date.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        ...(date.getFullYear() !== new Date().getFullYear() ? { year: "numeric" } : {}),
    });
}

// Card buttons: tiny icons for the mouse toolbar; labelled, finger-sized buttons on touchscreens.
const TOUCH_BUTTON =
    "flex h-6 w-6 items-center justify-center gap-1 rounded text-muted hover:bg-surface-2 hover:text-ink " +
    "[@media(hover:none)]:h-8 [@media(hover:none)]:w-auto [@media(hover:none)]:px-2 [@media(hover:none)]:active:bg-surface-2";

function BoardCard({
    job,
    isDragging,
    onDragStart,
    onDragEnd,
    onMove,
    onEdit,
}: {
    job: Job;
    isDragging: boolean;
    onDragStart: () => void;
    onDragEnd: () => void;
    onMove: (direction: -1 | 1) => void;
    onEdit?: (job: Job) => void;
}) {
    const index = STATUS_ORDER.indexOf(job.status);
    const previous = STATUS_ORDER[index - 1];
    const next = STATUS_ORDER[index + 1];

    return (
        <li
            draggable
            onDragStart={(event) => {
                event.dataTransfer.setData("text/plain", String(job.id));
                event.dataTransfer.effectAllowed = "move";
                onDragStart();
            }}
            onDragEnd={onDragEnd}
            className={cx(
                "panel panel-lift group relative !rounded-2xl p-3 sm:p-3.5",
                "cursor-grab active:cursor-grabbing",
                isDragging && "opacity-40",
            )}
        >
            <div className="flex items-start gap-2.5">
                <span
                    aria-hidden="true"
                    className="bg-accent-gradient mt-0.5 flex h-7 w-7 shrink-0 sm:h-8 sm:w-8 lg:hidden xl:flex items-center justify-center rounded-xl text-[11px] font-extrabold text-white"
                >
                    {getInitials(job.company)}
                </span>

                <div className="min-w-0 flex-1">
                    {/* The title link covers the card so the whole card opens it. */}
                    <Link
                        href={`/jobs/${job.id}`}
                        draggable={false}
                        className="line-clamp-2 break-words text-sm font-bold leading-5 text-ink after:absolute after:inset-0 after:rounded-lg focus-visible:outline-none focus-visible:after:outline-2 focus-visible:after:outline-accent"
                    >
                        {job.position}
                    </Link>
                    <p className="truncate text-xs leading-5 text-muted">{job.company}</p>
                </div>
            </div>

            <div className="mt-2 flex items-center justify-between gap-2 text-xs text-muted sm:mt-2.5">
                <span className="flex min-w-0 items-center gap-1">
                    {job.location && (
                        <>
                            <MapPin className="h-3 w-3 shrink-0" strokeWidth={1.75} />
                            <span className="truncate">{job.location}</span>
                        </>
                    )}
                </span>
                <span className="shrink-0 tabular-nums">{formatShortDate(job.appliedDate)}</span>
            </div>

            {/* Quick actions sit above the link layer. With a mouse: a small toolbar on hover.
                On touchscreens (no hover): always visible, as a labelled row under the card. */}
            <div
                className={cx(
                    "absolute right-2 top-2 z-10 flex gap-0.5 rounded-lg bg-surface/95 opacity-0 shadow-card backdrop-blur transition-opacity group-hover:opacity-100 focus-within:opacity-100",
                    "[@media(hover:none)]:relative [@media(hover:none)]:right-auto [@media(hover:none)]:top-auto [@media(hover:none)]:mt-2.5 [@media(hover:none)]:-mx-1 [@media(hover:none)]:-mb-1",
                    "[@media(hover:none)]:justify-between [@media(hover:none)]:rounded-none [@media(hover:none)]:border-t [@media(hover:none)]:border-line [@media(hover:none)]:bg-transparent [@media(hover:none)]:pt-1.5 [@media(hover:none)]:opacity-100 [@media(hover:none)]:shadow-none [@media(hover:none)]:backdrop-blur-none",
                )}
            >
                {previous && (
                    <button
                        type="button"
                        onClick={() => onMove(-1)}
                        aria-label={`Move to ${previous}`}
                        title={`Move to ${previous}`}
                        className={TOUCH_BUTTON}
                    >
                        <ChevronLeft className="h-3.5 w-3.5" strokeWidth={2} />
                        <span className="hidden text-xs font-semibold [@media(hover:none)]:inline">{previous}</span>
                    </button>
                )}
                {onEdit && (
                    <button
                        type="button"
                        onClick={() => onEdit(job)}
                        aria-label={`Edit ${job.position}`}
                        title="Edit"
                        className={TOUCH_BUTTON}
                    >
                        <Pencil className="h-3 w-3" strokeWidth={2} />
                        <span className="hidden text-xs font-semibold [@media(hover:none)]:inline">Edit</span>
                    </button>
                )}
                {next && (
                    <button
                        type="button"
                        onClick={() => onMove(1)}
                        aria-label={`Move to ${next}`}
                        title={`Move to ${next}`}
                        className={TOUCH_BUTTON}
                    >
                        <span className="hidden text-xs font-semibold [@media(hover:none)]:inline">{next}</span>
                        <ChevronRight className="h-3.5 w-3.5" strokeWidth={2} />
                    </button>
                )}
            </div>
        </li>
    );
}

export default function JobBoard({
    jobs,
    onStatusChange,
    onEdit,
    statuses = STATUS_ORDER,
}: {
    jobs: Job[];
    onStatusChange: (id: number, newStatus: Job["status"]) => void;
    onEdit?: (job: Job) => void;
    /** Columns to show (all stages by default). */
    statuses?: Job["status"][];
}) {
    const [draggingId, setDraggingId] = useState<number | null>(null);
    const [dropTarget, setDropTarget] = useState<Job["status"] | null>(null);
    // Phones show one column at a time, picked with the tabs above the board.
    const [phoneColumn, setPhoneColumn] = useState<Job["status"] | null>(null);

    const columns = useMemo(() => {
        const grouped = Object.fromEntries(
            STATUS_ORDER.map((status) => [status, [] as Job[]]),
        ) as Record<Job["status"], Job[]>;

        for (const job of jobs) grouped[job.status]?.push(job);

        return grouped;
    }, [jobs]);

    const showTabs = statuses.length > 1;
    const activeColumn =
        phoneColumn && statuses.includes(phoneColumn)
            ? phoneColumn
            : (statuses.find((status) => columns[status].length > 0) ?? statuses[0]);

    function move(job: Job, direction: -1 | 1) {
        const nextStatus = STATUS_ORDER[STATUS_ORDER.indexOf(job.status) + direction];
        if (nextStatus) onStatusChange(job.id, nextStatus);
    }

    return (
        <div>
        {showTabs && (
            <div role="tablist" aria-label="Board columns" className="mb-3 grid grid-cols-5 gap-1 rounded-2xl border border-[var(--glass-line)] bg-[var(--glass)] p-1 backdrop-blur-xl sm:hidden">
                {statuses.map((status) => {
                    const active = status === activeColumn;
                    return (
                        <button
                            key={status}
                            type="button"
                            role="tab"
                            aria-selected={active}
                            onClick={() => setPhoneColumn(status)}
                            className={cx(
                                "flex min-w-0 flex-col items-center rounded-xl px-1 py-1.5 transition-colors",
                                active ? "bg-surface text-ink shadow-card" : "text-muted",
                            )}
                        >
                            <span className="flex items-center gap-1 text-base font-extrabold tabular-nums leading-5">
                                <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: STATUS_META[status].dot }} />
                                {columns[status].length}
                            </span>
                            <span className="max-w-full truncate text-[10px] font-semibold leading-4">{status}</span>
                        </button>
                    );
                })}
            </div>
        )}
        {/* Phones: one column (tabs above). Tablets: columns scroll sideways. Laptops: columns share the width. */}
        <div className="pb-2 sm:overflow-x-auto lg:overflow-visible">
            <div
                className={cx("flex snap-x gap-3", statuses.length > 1 && "lg:grid lg:gap-2.5 xl:gap-3")}
                style={{ gridTemplateColumns: `repeat(${statuses.length}, minmax(0, 1fr))` }}
            >
                {statuses.map((status) => {
                    const meta = STATUS_META[status];
                    const columnJobs = columns[status];
                    const isTarget = dropTarget === status;

                    return (
                        <section
                            key={status}
                            aria-label={`${status}, ${columnJobs.length} applications`}
                            onDragOver={(event) => {
                                event.preventDefault();
                                event.dataTransfer.dropEffect = "move";
                                if (dropTarget !== status) setDropTarget(status);
                            }}
                            onDragLeave={(event) => {
                                if (!event.currentTarget.contains(event.relatedTarget as Node)) {
                                    setDropTarget((current) => (current === status ? null : current));
                                }
                            }}
                            onDrop={(event) => {
                                event.preventDefault();
                                setDropTarget(null);
                                setDraggingId(null);

                                const id = Number(event.dataTransfer.getData("text/plain"));
                                const job = jobs.find((item) => item.id === id);

                                if (job && job.status !== status) onStatusChange(id, status);
                            }}
                            className={cx(
                                "flex w-full shrink-0 snap-start flex-col rounded-3xl border p-2.5 backdrop-blur-xl transition-colors sm:w-[16rem]",
                                // On phones the active column is plain (no frame), the others are hidden.
                                showTabs && "max-sm:border-0 max-sm:bg-transparent max-sm:p-0 max-sm:backdrop-blur-none",
                                showTabs && status !== activeColumn && "max-sm:hidden",
                                statuses.length > 1 && "lg:w-auto lg:min-w-0 lg:p-2 xl:p-2.5",
                                statuses.length === 1 && "w-full max-w-md",
                                isTarget
                                    ? cx(meta.border, meta.bg)
                                    : "border-[var(--glass-line)] bg-[var(--glass)]",
                            )}
                        >
                            <header className={cx("flex items-center gap-2 px-1.5 pb-2 pt-1", showTabs && "max-sm:hidden")}>
                                <span
                                    aria-hidden="true"
                                    className="h-2 w-2 rounded-full"
                                    style={{ backgroundColor: meta.dot, boxShadow: `0 0 10px ${meta.dot}` }}
                                />
                                <h3 className="text-sm font-bold text-ink">{status}</h3>
                                <span className="text-sm tabular-nums text-muted">{columnJobs.length}</span>
                            </header>

                            {columnJobs.length > 0 ? (
                                <ul className="flex flex-col gap-2">
                                    {columnJobs.map((job) => (
                                        <BoardCard
                                            key={job.id}
                                            job={job}
                                            isDragging={draggingId === job.id}
                                            onDragStart={() => setDraggingId(job.id)}
                                            onDragEnd={() => {
                                                setDraggingId(null);
                                                setDropTarget(null);
                                            }}
                                            onMove={(direction) => move(job, direction)}
                                            onEdit={onEdit}
                                        />
                                    ))}
                                </ul>
                            ) : (
                                <p
                                    className={cx(
                                        "rounded-lg border border-dashed px-3 py-6 text-center text-xs text-muted",
                                        isTarget ? meta.border : "border-line-strong",
                                    )}
                                >
                                    {draggingId !== null ? `Drop to move to ${status}` : meta.hint}
                                </p>
                            )}
                        </section>
                    );
                })}
            </div>
        </div>
        </div>
    );
}

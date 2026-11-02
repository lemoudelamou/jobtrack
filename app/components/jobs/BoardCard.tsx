"use client";

import { useRouter } from "next/navigation";
import { GripVertical } from "lucide-react";

import { Job } from "@/app/types/job";
import {
    STATUS_ORDER,
    getStatusMeta,
} from "@/lib/job/job-status";
import {
    getAvatarPalette,
    getInitials,
    formatShortJobDate,
} from "@/lib/job/job-utils";

import { IconChevron } from "@/app/components/icons/Icons";

type BoardCardProps = {
    job: Job;
    isDragging: boolean;
    onDragStart: (
        event: React.DragEvent,
    ) => void;
    onDragEnd: () => void;
    onMove: (
        direction: "left" | "right",
    ) => void;
};

export default function BoardCard({
    job,
    isDragging,
    onDragStart,
    onDragEnd,
    onMove,
}: BoardCardProps) {
    const router = useRouter();

    const meta =
        getStatusMeta(job.status);

    const avatar =
        getAvatarPalette(job.company);

    const index =
        STATUS_ORDER.indexOf(job.status);

    const canMoveLeft = index > 0;
    const canMoveRight =
        index <
        STATUS_ORDER.length - 1;

    function openJob() {
        router.push(`/jobs/${job.id}`);
    }

    return (
        <div
            draggable
            onDragStart={(event) => {
                event.dataTransfer.setData(
                    "text/plain",
                    String(job.id),
                );

                event.dataTransfer.effectAllowed =
                    "move";

                onDragStart(event);
            }}
            onDragEnd={onDragEnd}
            onClick={openJob}
            onKeyDown={(event) => {
                if (
                    event.key === "Enter" ||
                    event.key === " "
                ) {
                    event.preventDefault();
                    openJob();
                }
            }}
            role="button"
            tabIndex={0}
            className={[
                "group relative cursor-grab select-none overflow-hidden rounded-2xl",
                "border border-line bg-surface",
                "shadow-[0_2px_5px_rgba(20,24,26,0.035)]",
                "transition-all duration-200 ease-out",
                "active:cursor-grabbing",
                "focus:outline-none focus:ring-2 focus:ring-accent/20",
                isDragging
                    ? "rotate-1 scale-[0.98] opacity-40 shadow-none"
                    : "hover:-translate-y-1 hover:border-accent/25 hover:shadow-[0_14px_28px_-18px_rgba(20,24,26,0.38)]",
            ].join(" ")}
        >
            <div
                className="absolute inset-x-0 top-0 h-0.5 opacity-0 transition-opacity duration-200 group-hover:opacity-100"
                style={{
                    backgroundColor:
                        meta.dot,
                }}
            />

            <div className="p-3.5">
                <div className="flex items-start gap-3">
                    <div
                        className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-xs font-bold shadow-sm transition-transform duration-200 group-hover:scale-105"
                        style={{
                            backgroundColor:
                                avatar.bg,
                            color: avatar.text,
                        }}
                    >
                        {getInitials(
                            job.company,
                        )}

                        <span
                            className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full border-2 border-surface"
                            style={{
                                backgroundColor:
                                    meta.dot,
                            }}
                        />
                    </div>

                    <div className="min-w-0 flex-1 pr-1">
                        <p className="truncate text-[13px] font-semibold leading-5 text-ink">
                            {job.position}
                        </p>

                        <p className="mt-0.5 truncate text-xs text-muted">
                            {job.company}
                        </p>
                    </div>

                    <GripVertical className="mt-0.5 h-4 w-4 shrink-0 text-faint opacity-0 transition-opacity duration-200 group-hover:opacity-100" />
                </div>

                <div className="mt-3 flex items-center justify-between">
                    <span className="rounded-full bg-canvas px-2 py-1 text-[10px] font-medium uppercase tracking-[0.08em] text-muted">
                        {formatShortJobDate(
                            job.appliedDate,
                        )}
                    </span>

                    <div className="flex items-center gap-0.5 opacity-0 transition-all duration-200 group-hover:opacity-100 group-focus-within:opacity-100">
                        <button
                            type="button"
                            disabled={
                                !canMoveLeft
                            }
                            onClick={(event) => {
                                event.stopPropagation();
                                onMove("left");
                            }}
                            aria-label={`Move ${job.position} to ${canMoveLeft ? STATUS_ORDER[index - 1] : "previous stage"}`}
                            className="flex h-7 w-7 items-center justify-center rounded-lg text-muted transition-all hover:bg-surface-2 hover:text-ink disabled:pointer-events-none disabled:opacity-0"
                        >
                            <IconChevron
                                direction="left"
                                className="h-3.5 w-3.5"
                            />
                        </button>

                        <button
                            type="button"
                            disabled={
                                !canMoveRight
                            }
                            onClick={(event) => {
                                event.stopPropagation();
                                onMove("right");
                            }}
                            aria-label={`Move ${job.position} to ${canMoveRight ? STATUS_ORDER[index + 1] : "next stage"}`}
                            className="flex h-7 w-7 items-center justify-center rounded-lg text-muted transition-all hover:bg-surface-2 hover:text-ink disabled:pointer-events-none disabled:opacity-0"
                        >
                            <IconChevron
                                direction="right"
                                className="h-3.5 w-3.5"
                            />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}


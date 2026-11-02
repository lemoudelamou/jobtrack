"use client";

import { Job } from "@/app/types/job";
import { STATUS_META, STATUS_ORDER } from "@/lib/theme";
import { cx } from "@/lib/ui";

type Counts = Record<Job["status"], number>;

function percent(value: number, total: number) {
    return total > 0 ? Math.round((value / total) * 100) : 0;
}

/*
 * Five frosted-glass stage tiles. Each is a filter; the selected one turns
 * into the aurora gradient. Rates sit in a slim strip below.
 */
export default function PipelineOverview({
    counts,
    total,
    selected,
    onSelect,
    hideTilesOnPhone = false,
}: {
    counts: Counts;
    total: number;
    selected: Job["status"] | "All";
    onSelect: (status: Job["status"] | "All") => void;
    /** The board shows its own status tabs on phones, so the tiles would repeat them. */
    hideTilesOnPhone?: boolean;
}) {
    const responded = counts.Interview + counts.Offer + counts.Rejected;
    const reachedInterview = counts.Interview + counts.Offer;
    const sent = total - counts.Wishlist;

    return (
        <section aria-labelledby="pipeline-title" className="space-y-3">
            <h2 id="pipeline-title" className="sr-only">
                Pipeline
            </h2>

            {/* Phones: one row of five small tiles. From 640px: the large tiles. */}
            <div className={cx("grid grid-cols-5 gap-1.5 sm:gap-3.5", hideTilesOnPhone && "max-sm:hidden")}>
                {STATUS_ORDER.map((status, index) => {
                    const meta = STATUS_META[status];
                    const isSelected = selected === status;
                    const dimmed = selected !== "All" && !isSelected;

                    return (
                        <button
                            key={status}
                            type="button"
                            aria-pressed={isSelected}
                            onClick={() => onSelect(isSelected ? "All" : status)}
                            style={{ animationDelay: `${index * 60}ms` }}
                            className={cx(
                                "jt-enter panel panel-lift min-w-0 rounded-2xl px-1 py-2.5 text-center sm:rounded-3xl sm:px-5 sm:py-5 sm:text-left",
                                isSelected &&
                                    "!border-white/40 bg-[linear-gradient(135deg,rgba(240,171,252,0.38),rgba(129,140,248,0.38))] shadow-[0_18px_44px_-16px_rgba(var(--accent-rgb),0.7)]",
                                dimmed && "opacity-60",
                            )}
                        >
                            <span className="flex min-w-0 items-center justify-center gap-1 text-[10px] font-bold tracking-[-0.01em] sm:justify-start sm:gap-1.5 sm:text-sm">
                                <span
                                    aria-hidden="true"
                                    className="h-1.5 w-1.5 shrink-0 rounded-full sm:h-2 sm:w-2"
                                    style={{ backgroundColor: meta.dot, boxShadow: `0 0 12px ${meta.dot}` }}
                                />
                                <span className="truncate" style={{ color: isSelected ? undefined : meta.dot }}>
                                    {status}
                                </span>
                            </span>
                            <span className="mt-1.5 block text-xl font-extrabold tabular-nums leading-none tracking-[-0.04em] text-ink sm:mt-3 sm:text-5xl">
                                {counts[status]}
                            </span>
                            <span className="mt-1.5 hidden text-xs font-semibold tabular-nums text-muted sm:block">
                                {percent(counts[status], total)}% of all
                            </span>
                        </button>
                    );
                })}
            </div>

            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 px-1 text-sm">
                <span title="Share of sent applications that got any reply">
                    <span className="text-muted">Response rate </span>
                    <span className="font-extrabold tabular-nums text-ink">{percent(responded, sent)}%</span>
                </span>
                <span title="Share of sent applications that reached an interview">
                    <span className="text-muted">Interview rate </span>
                    <span className="text-accent-gradient font-extrabold tabular-nums">{percent(reachedInterview, sent)}%</span>
                </span>
                <span
                    className="ml-auto hidden h-1.5 w-56 gap-0.5 overflow-hidden rounded-full bg-[var(--glass)] sm:flex"
                    role="img"
                    aria-label={STATUS_ORDER.map((s) => `${counts[s]} ${s}`).join(", ")}
                >
                    {total > 0 &&
                        STATUS_ORDER.filter((s) => counts[s] > 0).map((s) => (
                            <span key={s} className="h-full" style={{ width: `${(counts[s] / total) * 100}%`, backgroundColor: STATUS_META[s].dot }} />
                        ))}
                </span>
            </div>
        </section>
    );
}

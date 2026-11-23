"use client";

import Link from "next/link";
import { ArrowUpRight, Check, LoaderCircle, Minus, Sparkles, Undo2, X } from "lucide-react";

import { button, cx } from "@/lib/ui";
import { timeAgo, type RadarLead } from "./types";

const SOURCE_LABEL: Record<string, string> = {
    jsearch: "Google Jobs",
    adzuna: "Adzuna",
    arbeitnow: "Arbeitnow",
    "alert-linkedin": "LinkedIn alert",
    "alert-stepstone": "StepStone alert",
    "alert-indeed": "Indeed alert",
    "alert-xing": "XING alert",
    "alert-glassdoor": "Glassdoor alert",
};

function Score({ value }: { value: number | null }) {
    const score = value == null ? null : Math.round(value);

    return (
        <span
            className="shrink-0 text-[28px] font-extrabold tabular-nums leading-none tracking-[-0.04em] text-ink"
            title="How closely this posting matches your CV, compared with the other results"
        >
            {score ?? "–"}
            <span className="text-accent-gradient text-base">%</span>
            <span className="sr-only"> match</span>
        </span>
    );
}

function ScoreBar({ value }: { value: number | null }) {
    return (
        <div aria-hidden="true" className="mt-3 h-1.5 overflow-hidden rounded-full bg-[var(--glass-strong)]">
            <div
                className="h-full rounded-full bg-[linear-gradient(90deg,var(--accent-2),var(--accent),var(--accent-3))] transition-[width] duration-700"
                style={{ width: `${Math.max(0, Math.min(100, value ?? 0))}%` }}
            />
        </div>
    );
}

function Tag({ children, tone = "neutral" }: { children: React.ReactNode; tone?: "neutral" | "accent" }) {
    return (
        <span
            className={cx(
                "inline-flex h-6 items-center rounded-full border px-2.5 text-[11px] font-bold",
                tone === "accent" ? "border-accent-line bg-accent-soft text-accent-ink" : "border-[var(--glass-line)] bg-[var(--glass-strong)] text-ink-2",
            )}
        >
            {children}
        </span>
    );
}

export default function MatchCard({
    lead,
    aiEnabled,
    busy,
    onSave,
    onDismiss,
    onRestore,
    onExplain,
}: {
    lead: RadarLead;
    aiEnabled: boolean;
    busy: null | "save" | "dismiss" | "explain";
    onSave: () => void;
    onDismiss: () => void;
    onRestore: () => void;
    onExplain: () => void;
}) {
    const posted = timeAgo(lead.publishedAt);
    const remote = /remote|homeoffice|home office/i.test(lead.location ?? "");

    return (
        <li className="jt-enter panel panel-lift group flex flex-col p-5 sm:p-6">
            <div className="flex items-start justify-between gap-3">
                <div className="flex flex-wrap gap-1.5">
                    <Tag>{SOURCE_LABEL[lead.source] ?? lead.source}</Tag>
                    {remote && <Tag tone="accent">Remote</Tag>}
                    {lead.salary && <Tag>{lead.salary}</Tag>}
                </div>
                <Score value={lead.score} />
            </div>

            <a
                href={lead.url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 block text-lg font-bold leading-snug tracking-[-0.01em] text-ink hover:text-accent"
            >
                <span className="line-clamp-2">{lead.title}</span>
            </a>
            <p className="mt-1 text-sm text-ink-2">
                {[lead.company, lead.location].filter(Boolean).join(", ")}
            </p>
            <ScoreBar value={lead.score} />

            {lead.summary && <p className="mt-3 text-sm leading-6 text-ink-2">{lead.summary}</p>}

            {(lead.strengths.length > 0 || lead.gaps.length > 0) && (
                <ul className="mt-3 flex flex-wrap gap-1.5" aria-label="How your CV compares">
                    {lead.strengths.map((item) => (
                        <li key={`s-${item}`} className="inline-flex items-center gap-1 rounded-md bg-offer-soft px-2 py-0.5 text-xs text-offer-ink">
                            <Check className="h-3 w-3" strokeWidth={2.5} aria-hidden="true" />
                            <span className="sr-only">Shown in your CV: </span>
                            {item}
                        </li>
                    ))}
                    {lead.gaps.map((item) => (
                        <li key={`g-${item}`} className="inline-flex items-center gap-1 rounded-md bg-interview-soft px-2 py-0.5 text-xs text-interview-ink">
                            <Minus className="h-3 w-3" strokeWidth={2.5} aria-hidden="true" />
                            <span className="sr-only">Not shown in your CV: </span>
                            {item}
                        </li>
                    ))}
                </ul>
            )}

            {!lead.explainedAt && aiEnabled && lead.status !== "Dismissed" && (
                <button
                    type="button"
                    onClick={onExplain}
                    disabled={busy !== null}
                    className="mt-3 inline-flex w-fit items-center gap-1.5 text-sm font-semibold text-accent hover:underline hover:underline-offset-2 disabled:opacity-60"
                >
                    {busy === "explain" ? (
                        <LoaderCircle className="h-3.5 w-3.5 animate-spin" strokeWidth={2} />
                    ) : (
                        <Sparkles className="h-3.5 w-3.5" strokeWidth={1.75} />
                    )}
                    {busy === "explain" ? "Comparing with your CV…" : "Explain this match"}
                </button>
            )}

            <div className="flex-1" />

            <div className="mt-5 flex items-center justify-between gap-2">
                <span className="text-xs text-faint">{posted && `Posted ${posted}`}</span>

                <div className="flex items-center gap-1.5">
                    {lead.status === "Saved" ? (
                        <Link href={lead.jobId ? `/jobs/${lead.jobId}` : "/dashboard"} className={cx(button.secondary, "h-8 px-3")}>
                            Open application
                            <ArrowUpRight className="h-3.5 w-3.5" strokeWidth={2} />
                        </Link>
                    ) : lead.status === "Dismissed" ? (
                        <button type="button" onClick={onRestore} disabled={busy !== null} className={cx(button.secondary, "h-8 px-3")}>
                            <Undo2 className="h-3.5 w-3.5" strokeWidth={1.75} />
                            Restore
                        </button>
                    ) : (
                        <>
                            <button
                                type="button"
                                onClick={onDismiss}
                                disabled={busy !== null}
                                aria-label={`Not for me: ${lead.title}`}
                                title="Not for me"
                                className={cx(button.icon, "h-8 w-8")}
                            >
                                <X className="h-4 w-4" strokeWidth={1.75} />
                            </button>
                            <button type="button" onClick={onSave} disabled={busy !== null} className={cx(button.primary, "h-8 px-3.5")}>
                                {busy === "save" ? "Saving…" : "Save to wishlist"}
                            </button>
                        </>
                    )}
                </div>
            </div>
        </li>
    );
}

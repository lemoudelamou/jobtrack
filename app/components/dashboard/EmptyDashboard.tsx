"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { ArrowRight, Link2, PenLine, Radar } from "lucide-react";

import { STATUS_META } from "@/lib/theme";
import { button, cx } from "@/lib/ui";

const PREVIEW_COLUMNS = [
    { status: "Wishlist" as const, cards: 3 },
    { status: "Applied" as const, cards: 2 },
    { status: "Interview" as const, cards: 1 },
];

/** Faded, gently floating preview of a filled board. Decorative only. */
function BoardPreview() {
    return (
        <div aria-hidden="true" className="relative select-none">
            <div className="pointer-events-none absolute -inset-10 rounded-full bg-[radial-gradient(circle,rgba(var(--accent-rgb),0.35),transparent_65%)] blur-2xl" />
            <div className="relative grid grid-cols-3 gap-3 [mask-image:linear-gradient(to_bottom,black_55%,transparent)]">
                {PREVIEW_COLUMNS.map((column, columnIndex) => (
                    <div key={column.status} className="rounded-3xl border border-[var(--glass-line)] bg-[var(--glass)] p-2.5 backdrop-blur-xl">
                        <p className="flex items-center gap-1.5 px-1 pb-2.5 pt-1 text-xs font-bold text-ink">
                            <span
                                className="h-1.5 w-1.5 rounded-full"
                                style={{ backgroundColor: STATUS_META[column.status].dot, boxShadow: `0 0 10px ${STATUS_META[column.status].dot}` }}
                            />
                            {column.status}
                        </p>
                        <div className="space-y-2">
                            {Array.from({ length: column.cards }).map((_, cardIndex) => (
                                <div
                                    key={cardIndex}
                                    className="empty-float rounded-2xl border border-[var(--glass-line)] bg-[var(--glass-strong)] p-3"
                                    style={{ animationDelay: `${(columnIndex * 3 + cardIndex) * 0.45}s` }}
                                >
                                    <div className="flex items-center gap-2">
                                        <span className="bg-accent-gradient h-6 w-6 shrink-0 rounded-lg opacity-80" />
                                        <span className="h-2 flex-1 rounded-full bg-ink/20" />
                                    </div>
                                    <span className="mt-2.5 block h-1.5 w-2/3 rounded-full bg-ink/10" />
                                    <span className="mt-1.5 block h-1.5 w-1/2 rounded-full bg-ink/10" />
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default function EmptyDashboard({
    onAddManually,
    onAddFromLink,
}: {
    onAddManually: () => void;
    onAddFromLink: (url: string) => void;
}) {
    const [url, setUrl] = useState("");
    const [error, setError] = useState("");

    function submit(event: FormEvent) {
        event.preventDefault();
        const value = url.trim();
        if (!/^https?:\/\/\S+\.\S+/i.test(value)) {
            setError("Paste the full link to a job posting, starting with https://");
            return;
        }
        setError("");
        onAddFromLink(value);
    }

    return (
        <section aria-labelledby="empty-title" className="jt-enter panel overflow-hidden">
            <div className="grid items-center gap-12 p-6 sm:p-10 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] lg:p-14">
                <div>
                    <h2 id="empty-title" className="text-3xl font-extrabold leading-[1.08] tracking-[-0.04em] text-ink sm:text-4xl">
                        Your pipeline <span className="text-accent-gradient">starts here.</span>
                    </h2>
                    <p className="mt-4 max-w-md text-base leading-7 text-ink-2">
                        Add the jobs you&apos;re considering and move each one from wishlist to offer. Paste a link and
                        JobTrack fills in the title, company and location for you.
                    </p>

                    <form onSubmit={submit} className="mt-8 max-w-lg" noValidate>
                        <label htmlFor="empty-link" className="sr-only">
                            Job posting link
                        </label>
                        <div className="flex flex-col gap-2 rounded-[22px] border border-[var(--glass-line)] bg-[var(--glass-strong)] p-1.5 backdrop-blur-xl transition-shadow focus-within:border-accent focus-within:shadow-[0_0_0_4px_rgba(var(--accent-rgb),0.2)] sm:flex-row sm:rounded-full">
                            <div className="relative flex-1">
                                <Link2 aria-hidden="true" className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" strokeWidth={2} />
                                <input
                                    id="empty-link"
                                    type="url"
                                    inputMode="url"
                                    value={url}
                                    onChange={(e) => {
                                        setUrl(e.target.value);
                                        if (error) setError("");
                                    }}
                                    placeholder="Paste a job posting link"
                                    aria-invalid={error ? true : undefined}
                                    aria-describedby={error ? "empty-link-error" : "empty-link-hint"}
                                    className="block h-11 w-full rounded-full bg-transparent pl-11 pr-3 text-sm text-ink outline-none placeholder:text-muted"
                                />
                            </div>
                            <button type="submit" className={cx(button.primary, "h-11 px-5")}>
                                Fill from link
                                <ArrowRight className="h-4 w-4" strokeWidth={2.25} />
                            </button>
                        </div>
                        {error ? (
                            <p id="empty-link-error" className="mt-2 pl-4 text-sm text-rejected-ink">
                                {error}
                            </p>
                        ) : (
                            <p id="empty-link-hint" className="mt-2 pl-4 text-xs text-muted">
                                Works with company career pages, StepStone, Personio, Greenhouse, Lever and most job boards.
                            </p>
                        )}
                    </form>

                    <div className="mt-8 grid max-w-lg gap-3 sm:grid-cols-2">
                        <button
                            type="button"
                            onClick={onAddManually}
                            className="panel panel-lift flex items-start gap-3 !rounded-2xl p-4 text-left"
                        >
                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[var(--glass-strong)] text-ink">
                                <PenLine className="h-4 w-4" strokeWidth={2} />
                            </span>
                            <span>
                                <span className="block text-sm font-bold text-ink">Add manually</span>
                                <span className="mt-0.5 block text-xs leading-5 text-muted">Type in a role you heard about.</span>
                            </span>
                        </button>
                        <Link href="/radar" className="panel panel-lift flex items-start gap-3 !rounded-2xl p-4">
                            <span className="bg-accent-gradient flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-white">
                                <Radar className="h-4 w-4" strokeWidth={2} />
                            </span>
                            <span>
                                <span className="block text-sm font-bold text-ink">Find jobs for me</span>
                                <span className="mt-0.5 block text-xs leading-5 text-muted">Daily matches ranked against your CV.</span>
                            </span>
                        </Link>
                    </div>
                </div>

                <div className="hidden lg:block">
                    <BoardPreview />
                </div>
            </div>
        </section>
    );
}

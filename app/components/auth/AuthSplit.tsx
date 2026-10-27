import { ReactNode } from "react";
import Link from "next/link";

import { Brand } from "@/app/components/Brand";
import { STATUS_META } from "@/lib/theme";
import { cx } from "@/lib/ui";

/* -------------------------------------------------------------------------- */
/* Auth layout: form on the left, a quiet preview of the board on the right. */
/* The preview is illustrative, built from the same tokens as the real app.  */
/* -------------------------------------------------------------------------- */

const PREVIEW_STAGES = [
    { status: "Wishlist" as const, count: 6 },
    { status: "Applied" as const, count: 11 },
    { status: "Interview" as const, count: 3 },
    { status: "Offer" as const, count: 1 },
];

function PipelinePreview() {
    return (
        <div aria-hidden="true" className="w-full max-w-[34rem] select-none">
            <div className="grid grid-cols-4 gap-3">
                {PREVIEW_STAGES.map(({ status, count }, index) => {
                    const dot = STATUS_META[status].dot;
                    const active = index === 2;
                    return (
                        <div
                            key={status}
                            className={cx(
                                "panel rounded-2xl px-4 py-4",
                                active &&
                                    "!border-white/40 bg-[linear-gradient(135deg,rgba(240,171,252,0.38),rgba(129,140,248,0.38))] shadow-[0_18px_44px_-16px_rgba(var(--accent-rgb),0.7)]",
                            )}
                        >
                            <div>
                                <p className="flex items-center gap-1.5 text-xs font-medium text-ink-2">
                                    <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: dot, boxShadow: `0 0 8px ${dot}` }} />
                                    {status}
                                </p>
                                <p className="mt-2 text-4xl font-extrabold tabular-nums tracking-[-0.04em] text-ink">{count}</p>
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="panel mt-5 max-w-sm p-5">
                <div className="flex items-start justify-between gap-3">
                    <div>
                        <p className="text-sm font-semibold text-ink">Frontend Engineer</p>
                        <p className="text-xs text-muted">Northwind, Berlin</p>
                    </div>
                    <span className="rounded-full border border-accent-line bg-accent-soft px-2 py-0.5 text-xs font-semibold text-accent-ink">
                        86% match
                    </span>
                </div>
                <div className="mt-3 flex flex-wrap gap-1.5 text-[11px]">
                    <span className="rounded-md bg-offer-soft px-2 py-0.5 text-offer-ink">React</span>
                    <span className="rounded-md bg-offer-soft px-2 py-0.5 text-offer-ink">TypeScript</span>
                    <span className="rounded-md bg-interview-soft px-2 py-0.5 text-interview-ink">GraphQL</span>
                </div>
            </div>
        </div>
    );
}

export default function AuthSplit({
    title,
    description,
    topLink,
    children,
    footer,
}: {
    title: string;
    description?: ReactNode;
    topLink?: { href: string; label: string; prompt: string };
    children: ReactNode;
    footer?: ReactNode;
}) {
    return (
        <div className="min-h-screen lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
            <div className="flex min-h-screen flex-col px-5 py-6 sm:px-10">
                <div className="flex items-center justify-between">
                    <Link href="/" className="rounded-md">
                        <Brand />
                    </Link>
                    {topLink && (
                        <p className="text-sm text-muted">
                            <span className="hidden sm:inline">{topLink.prompt} </span>
                            <Link href={topLink.href} className="font-medium text-accent hover:underline hover:underline-offset-2">
                                {topLink.label}
                            </Link>
                        </p>
                    )}
                </div>

                <main className="flex flex-1 items-center justify-center py-10">
                    <div className="jt-enter w-full max-w-sm">
                        <h1 className="text-4xl font-extrabold tracking-[-0.045em] text-ink">{title}</h1>
                        {description && <p className="mt-1.5 text-sm leading-6 text-muted">{description}</p>}
                        <div className="mt-7">{children}</div>
                    </div>
                </main>

                {footer && <div className="text-center text-xs text-muted">{footer}</div>}
            </div>

            <aside className="theme-dark relative m-3 hidden overflow-hidden rounded-[32px] bg-canvas lg:flex lg:flex-col lg:justify-center lg:px-14 xl:px-20">
                <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 overflow-hidden"
                >
                    <div className="aurora-blob aurora-1" style={{ left: "-20%", top: "-25%", width: "75%", height: "75%" }} />
                    <div className="aurora-blob aurora-2" style={{ right: "-25%", top: "15%", width: "65%", height: "65%" }} />
                    <div className="aurora-blob aurora-3" style={{ left: "10%", bottom: "-40%", width: "85%", height: "85%" }} />
                </div>
                <div className="relative">
                    <h2 className="max-w-lg text-5xl font-extrabold leading-[1.02] tracking-[-0.045em] text-ink">
                        Track every application, <span className="text-accent-gradient">from wishlist to offer</span>
                    </h2>
                    <p className="mt-4 max-w-sm text-sm leading-6 text-ink-2">
                        One board for every role, a daily radar of new jobs ranked against your CV, and AI notes on what
                        to highlight.
                    </p>
                    <div className="mt-12">
                        <PipelinePreview />
                    </div>
                </div>
            </aside>
        </div>
    );
}

/* -------------------------------------------------------------------------- */
/* Small pieces shared by the auth forms                                      */
/* -------------------------------------------------------------------------- */

export function Notice({
    tone = "info",
    children,
}: {
    tone?: "info" | "success" | "error";
    children: ReactNode;
}) {
    return (
        <div
            role={tone === "error" ? "alert" : "status"}
            className={cx(
                "mb-5 rounded-lg border px-3.5 py-3 text-sm leading-6",
                tone === "success" && "border-offer-line bg-offer-soft text-offer-ink",
                tone === "error" && "border-rejected-line bg-rejected-soft text-rejected-ink",
                tone === "info" && "border-line bg-surface-2 text-ink-2",
            )}
        >
            {children}
        </div>
    );
}

export function OrDivider({ label = "or" }: { label?: string }) {
    return (
        <div className="my-5 flex items-center gap-3 text-xs text-muted">
            <span className="h-px flex-1 bg-line" />
            {label}
            <span className="h-px flex-1 bg-line" />
        </div>
    );
}

export function GoogleLogo({ className = "h-4 w-4" }: { className?: string }) {
    return (
        <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
            <path fill="#4285F4" d="M23.5 12.27c0-.85-.08-1.67-.22-2.45H12v4.63h6.45a5.52 5.52 0 0 1-2.39 3.62v3h3.87c2.26-2.08 3.57-5.15 3.57-8.8Z" />
            <path fill="#34A853" d="M12 24c3.24 0 5.95-1.07 7.93-2.9l-3.87-3c-1.07.72-2.45 1.15-4.06 1.15-3.12 0-5.77-2.11-6.71-4.95H1.29v3.1A12 12 0 0 0 12 24Z" />
            <path fill="#FBBC05" d="M5.29 14.3a7.2 7.2 0 0 1 0-4.6V6.6H1.29a12 12 0 0 0 0 10.8l4-3.1Z" />
            <path fill="#EA4335" d="M12 4.75c1.76 0 3.34.6 4.58 1.8l3.43-3.43A11.5 11.5 0 0 0 12 0 12 12 0 0 0 1.29 6.6l4 3.1C6.23 6.86 8.88 4.75 12 4.75Z" />
        </svg>
    );
}

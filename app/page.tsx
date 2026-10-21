import type { Metadata } from "next";
import Link from "next/link";
import { CalendarDays, Fingerprint, Link2, MoonStar } from "lucide-react";

import { Brand } from "@/app/components/Brand";
import BoardDemo from "@/app/components/landing/BoardDemo";
import { button, cx } from "@/lib/ui";

export const metadata: Metadata = {
    title: "JobTrack: every job application on one board",
    description:
        "Track job applications from wishlist to offer, fill them in from a job link, and get daily job matches ranked against your CV.",
};

/* Signed-in visitors are sent to /dashboard by proxy.tsx before this renders. */

function LinkFillDemo() {
    const fields = [
        ["Role", "Product Engineer"],
        ["Company", "Lumen Labs"],
        ["Location", "Munich · Hybrid"],
        ["Salary", "€70k–85k"],
    ];
    return (
        <div aria-hidden="true" className="panel rounded-[28px] p-5 sm:p-6">
            <p className="text-sm font-bold text-ink">New application</p>
            <div className="mt-4 flex items-center gap-2 rounded-xl border border-accent bg-[var(--glass)] px-3 py-2.5 shadow-[0_0_0_3px_rgba(var(--accent-rgb),0.18)]">
                <Link2 className="h-4 w-4 shrink-0 text-accent" />
                <span className="truncate text-sm text-ink">jobs.ashbyhq.com/lumen-labs/product-engineer</span>
            </div>
            <p className="mt-2 text-xs font-semibold text-offer-ink">Filled 6 fields from the posting. Check them and save.</p>
            <dl className="mt-5 grid grid-cols-2 gap-3">
                {fields.map(([label, value]) => (
                    <div key={label} className="rounded-xl border border-[var(--glass-line)] bg-[var(--glass)] px-3 py-2.5">
                        <dt className="text-[11px] font-semibold text-muted">{label}</dt>
                        <dd className="mt-0.5 truncate text-sm font-semibold text-ink">{value}</dd>
                    </div>
                ))}
            </dl>
        </div>
    );
}

function RadarDemo() {
    return (
        <div aria-hidden="true" className="panel rounded-[28px] p-5 sm:p-6">
            <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                    <p className="text-lg font-extrabold tracking-[-0.02em] text-ink">Frontend Engineer</p>
                    <p className="mt-0.5 text-sm text-muted">Northwind · Berlin · posted today</p>
                </div>
                <p className="shrink-0 text-4xl font-extrabold tracking-[-0.04em] text-ink">
                    92<span className="text-base text-accent">%</span>
                </p>
            </div>
            <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-[var(--glass-strong)]">
                <div className="bg-accent-gradient h-full w-[92%] rounded-full" />
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-offer-line bg-offer-soft px-3 py-2.5">
                    <p className="text-xs font-bold text-offer-ink">What fits</p>
                    <p className="mt-1 text-sm leading-5 text-ink-2">Four years of React and TypeScript, design-system work at your last job.</p>
                </div>
                <div className="rounded-xl border border-interview-line bg-interview-soft px-3 py-2.5">
                    <p className="text-xs font-bold text-interview-ink">What&apos;s missing</p>
                    <p className="mt-1 text-sm leading-5 text-ink-2">They ask for GraphQL; mention any API work you&apos;ve done.</p>
                </div>
            </div>
            <div className="mt-5 flex gap-2">
                <span className={cx(button.primary, "pointer-events-none")}>Save to Wishlist</span>
                <span className={cx(button.secondary, "pointer-events-none")}>Not for me</span>
            </div>
        </div>
    );
}

const EXTRAS = [
    { icon: CalendarDays, title: "Interviews on a calendar", text: "Every interview and follow-up date from your board, in one month view." },
    { icon: Fingerprint, title: "Sign in your way", text: "Passkey, Google, GitHub or a password, all linked to one account." },
    { icon: MoonStar, title: "Light or dark, any screen", text: "Built for your phone between interviews as much as your laptop." },
];

export default function LandingPage() {
    return (
        <div className="min-h-screen">
            <header className="mx-auto flex max-w-[1360px] items-center justify-between px-5 py-5 sm:px-8">
                <Brand />
                <nav aria-label="Account" className="flex items-center gap-2">
                    <Link href="/login" className={button.ghost}>
                        Sign in
                    </Link>
                    <Link href="/signup" className={button.primary}>
                        Create account
                    </Link>
                </nav>
            </header>

            <main>
                {/* Hero */}
                <section className="mx-auto grid max-w-[1360px] items-center gap-12 px-5 pb-20 pt-10 sm:px-8 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:gap-14 lg:pt-16">
                    <div className="jt-enter">
                        <h1 className="text-[2.75rem] font-extrabold leading-[1.02] tracking-[-0.045em] text-ink sm:text-6xl lg:text-[3.6rem]">
                            Know where every job application stands.
                        </h1>
                        <p className="mt-5 max-w-[34rem] text-lg leading-8 text-ink-2">
                            JobTrack keeps your applications on one board, from the roles you&apos;re eyeing to the offer,
                            and finds new openings in Germany that fit your CV.
                        </p>
                        <div className="mt-8 flex flex-wrap gap-3">
                            <Link href="/signup" className={cx(button.primary, button.large, "px-6")}>
                                Create your account
                            </Link>
                            <Link href="/login" className={cx(button.secondary, button.large, "px-6")}>
                                Sign in
                            </Link>
                        </div>
                    </div>

                    <BoardDemo />
                </section>

                {/* Fill from a link */}
                <section className="mx-auto grid max-w-[1360px] items-center gap-10 px-5 py-16 sm:px-8 lg:grid-cols-2 lg:gap-16">
                    <div>
                        <h2 className="text-3xl font-extrabold leading-tight tracking-[-0.035em] text-ink sm:text-4xl">
                            Paste a job link. The details fill themselves in.
                        </h2>
                        <p className="mt-4 max-w-[32rem] text-base leading-7 text-ink-2">
                            Works with Greenhouse, Lever, Ashby, Personio, SmartRecruiters and many company career pages.
                            Role, company, location, salary and the description are copied over. You only check them and
                            save.
                        </p>
                    </div>
                    <LinkFillDemo />
                </section>

                {/* Radar */}
                <section className="mx-auto grid max-w-[1360px] items-center gap-10 px-5 py-16 sm:px-8 lg:grid-cols-2 lg:gap-16">
                    <div className="lg:order-2">
                        <h2 className="text-3xl font-extrabold leading-tight tracking-[-0.035em] text-ink sm:text-4xl">
                            New jobs that fit your CV, every morning.
                        </h2>
                        <p className="mt-4 max-w-[32rem] text-base leading-7 text-ink-2">
                            Upload your CV once. The job radar searches Google Jobs and Arbeitnow each day, ranks new
                            postings by how closely they match you, and notes what fits and what to address. Save one and
                            it lands in your Wishlist, already filled in.
                        </p>
                    </div>
                    <div className="lg:order-1">
                        <RadarDemo />
                    </div>
                </section>

                {/* Smaller things */}
                <section aria-label="More in JobTrack" className="mx-auto max-w-[1360px] px-5 py-16 sm:px-8">
                    <ul className="grid gap-8 border-t border-[var(--glass-line)] pt-10 sm:grid-cols-3">
                        {EXTRAS.map(({ icon: Icon, title, text }) => (
                            <li key={title}>
                                <Icon className="h-5 w-5 text-accent" aria-hidden="true" />
                                <h3 className="mt-3 text-base font-bold text-ink">{title}</h3>
                                <p className="mt-1.5 text-sm leading-6 text-muted">{text}</p>
                            </li>
                        ))}
                    </ul>
                </section>

                {/* Closing call to action */}
                <section className="mx-auto max-w-[1360px] px-5 pb-24 pt-8 sm:px-8">
                    <div className="theme-dark relative overflow-hidden rounded-[32px] bg-canvas px-6 py-14 text-center sm:px-12">
                        <div aria-hidden="true" className="pointer-events-none absolute inset-0">
                            <div className="aurora-blob aurora-1" style={{ left: "-15%", top: "-60%", width: "60%", height: "160%" }} />
                            <div className="aurora-blob aurora-2" style={{ right: "-15%", top: "-40%", width: "55%", height: "160%" }} />
                        </div>
                        <div className="relative">
                            <h2 className="mx-auto max-w-2xl text-3xl font-extrabold leading-tight tracking-[-0.035em] text-ink sm:text-5xl">
                                Start with the job you&apos;re looking at right now.
                            </h2>
                            <p className="mx-auto mt-4 max-w-md text-base leading-7 text-ink-2">
                                Paste its link after you sign up and it&apos;s on your board in seconds.
                            </p>
                            <Link href="/signup" className={cx(button.primary, button.large, "mt-8 px-7")}>
                                Create your account
                            </Link>
                        </div>
                    </div>
                </section>
            </main>

            <footer className="mx-auto flex max-w-[1360px] flex-wrap items-center justify-between gap-4 border-t border-[var(--glass-line)] px-5 py-8 text-sm text-muted sm:px-8">
                <Brand />
                <p>© {new Date().getFullYear()} JobTrack</p>
            </footer>
        </div>
    );
}

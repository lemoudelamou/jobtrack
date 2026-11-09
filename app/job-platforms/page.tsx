
import {
    ArrowRight,
    ArrowUpRight,
    BriefcaseBusiness,
    Building2,
    Check,
    Globe2,
    Landmark,
    MapPin,
    Search,
    Sparkles,
} from "lucide-react";

import Navbar from "@/app/components/navbar/Navbar";

type JobBoard = {
    name: string;
    description: string;
    category: string;
    url: string;
    domain: string;
    icon: React.ReactNode;
    accent: string;
};

const jobBoards: JobBoard[] = [
    {
        name: "StepStone",
        description:
            "Search thousands of opportunities from employers across Germany with powerful filters for location, experience, salary, and remote work.",
        category: "Germany",
        domain: "stepstone.de",
        url: "https://www.stepstone.de/",
        icon: <BriefcaseBusiness className="h-5 w-5" />,
        accent: "green",
    },
    {
        name: "Indeed",
        description:
            "Explore millions of job opportunities from companies and recruiting organizations across Germany and around the world.",
        category: "International",
        domain: "de.indeed.com",
        url: "https://de.indeed.com/",
        icon: <Search className="h-5 w-5" />,
        accent: "blue",
    },
    {
        name: "LinkedIn Jobs",
        description:
            "Discover opportunities from companies and recruiters while using your professional network to explore your next move.",
        category: "Professional network",
        domain: "linkedin.com/jobs",
        url: "https://www.linkedin.com/jobs/",
        icon: <Globe2 className="h-5 w-5" />,
        accent: "violet",
    },
    {
        name: "XING Jobs",
        description:
            "Explore career opportunities across Germany, Austria, and Switzerland through the leading German-speaking professional network.",
        category: "DACH",
        domain: "xing.com/jobs",
        url: "https://www.xing.com/jobs",
        icon: <Building2 className="h-5 w-5" />,
        accent: "teal",
    },
    {
        name: "Bundesagentur für Arbeit",
        description:
            "Search Germany's official employment-service portal for vacancies across industries, professions, and regions.",
        category: "Germany · Public",
        domain: "arbeitsagentur.de",
        url: "https://www.arbeitsagentur.de/jobsuche/",
        icon: <Landmark className="h-5 w-5" />,
        accent: "orange",
    },
    {
        name: "Jobware",
        description:
            "Browse professional opportunities from companies and organizations looking for qualified candidates across Germany.",
        category: "Germany",
        domain: "jobware.de",
        url: "https://www.jobware.de/",
        icon: <BriefcaseBusiness className="h-5 w-5" />,
        accent: "green",
    },
];

const accentStyles = {
    green: {
        icon: "bg-accent-soft text-accent group-hover:bg-accent-soft",
        glow: "bg-accent-soft",
        text: "text-accent",
    },
    blue: {
        icon: "bg-applied-soft text-applied group-hover:bg-applied-soft",
        glow: "bg-applied-line",
        text: "text-applied",
    },
    violet: {
        icon: "bg-applied-soft text-applied group-hover:bg-applied-soft",
        glow: "bg-applied-line",
        text: "text-applied",
    },
    teal: {
        icon: "bg-accent-soft text-accent group-hover:bg-accent-soft",
        glow: "bg-accent-soft",
        text: "text-accent",
    },
    orange: {
        icon: "bg-interview-soft text-interview group-hover:bg-interview-line",
        glow: "bg-interview-line",
        text: "text-interview",
    },
} as const;

export default function JobBoardsPage() {
    return (
        <>
            <Navbar />

            <main className="relative min-h-screen overflow-hidden bg-canvas text-ink">
                {/* =====================================================
                    BACKGROUND
                ====================================================== */}

                <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0"
                >
                    {/* Large atmospheric blobs */}
                    <div className="absolute -right-[180px] -top-[180px] h-[600px] w-[600px] rounded-full bg-accent-soft opacity-70 blur-3xl animate-float-slow" />

                    <div className="absolute -left-[250px] top-[480px] h-[500px] w-[500px] rounded-full bg-interview-line opacity-60 blur-3xl animate-float-reverse" />

                    {/* Small floating circles */}
                    <div className="absolute right-[12%] top-[180px] h-3 w-3 rounded-full bg-accent-line opacity-40 animate-float" />

                    <div className="absolute left-[8%] top-[340px] h-2 w-2 rounded-full bg-interview opacity-50 animate-float-delayed" />

                    <div className="absolute right-[22%] top-[470px] h-2 w-2 rounded-full bg-applied opacity-40 animate-float" />

                    {/* Dot texture */}
                    <div
                        className="absolute inset-0 opacity-[0.035]"
                        style={{
                            backgroundImage:
                                "radial-gradient(var(--color-ink) 0.7px, transparent 0.7px)",
                            backgroundSize: "22px 22px",
                        }}
                    />
                </div>

                <div className="relative mx-auto max-w-[1520px] px-4 py-10 sm:px-8 sm:py-14 lg:py-20">
                    {/* =================================================
                        HERO
                    ================================================== */}

                    <section className="relative mb-14 lg:mb-20">
                        <div className="grid items-end gap-10 lg:grid-cols-[1fr_auto]">
                            <div className="max-w-3xl">
                                {/* Eyebrow */}
                                <div className="animate-fade-up mb-6 inline-flex items-center gap-2 rounded-full border border-line bg-surface/75 px-3.5 py-2 text-[10px] font-bold uppercase tracking-[0.16em] text-muted shadow-[0_4px_20px_rgba(21,24,22,0.04)] backdrop-blur-md">
                                    <Sparkles className="h-3 w-3 text-interview" />
                                    Your next move starts here
                                </div>

                                {/* Heading */}
                                <h1 className="animate-fade-up-delay-1 text-[42px] font-semibold leading-[0.98] tracking-[-0.055em] sm:text-[56px] lg:text-[68px]">
                                    Find your next{" "}
                                    <span className="relative inline-block text-accent">
                                        opportunity.
                                        <span className="absolute -bottom-1 left-0 h-[3px] w-[72%] rounded-full bg-accent-line sm:h-1" />
                                    </span>
                                </h1>

                                <p className="animate-fade-up-delay-2 mt-7 max-w-2xl text-[16px] leading-7 text-muted sm:text-[18px]">
                                    One place to discover trusted job platforms
                                    across Germany and the DACH region. Pick
                                    where you want to search and take the next
                                    step.
                                </p>

                                {/* Quick filters */}
                                <div className="animate-fade-up-delay-3 mt-7 flex flex-wrap gap-2">
                                    <QuickPill
                                        icon={<MapPin className="h-3.5 w-3.5" />}
                                        label="Germany"
                                    />

                                    <QuickPill
                                        label="DACH"
                                    />

                                    <QuickPill
                                        label="International"
                                    />

                                    <QuickPill
                                        label="Professional"
                                    />
                                </div>
                            </div>

                            {/* Hero visual */}
                            <div className="relative hidden h-[190px] w-[250px] lg:block">
                                {/* Main floating panel */}
                                <div className="animate-float absolute right-0 top-0 w-[230px] rounded-2xl border border-surface/80 bg-surface/85 p-5 shadow-[0_20px_60px_rgba(21,24,22,0.10)] backdrop-blur-xl">
                                    <div className="flex items-center justify-between">
                                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent-soft text-accent">
                                            <BriefcaseBusiness className="h-4 w-4" />
                                        </div>

                                        <span className="flex items-center gap-1.5 text-[10px] font-semibold text-muted">
                                            <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                                            Active
                                        </span>
                                    </div>

                                    <p className="mt-5 text-xs font-medium text-muted">
                                        Job platforms
                                    </p>

                                    <p className="mt-1 text-3xl font-semibold tracking-[-0.04em] text-ink">
                                        06
                                    </p>

                                    <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-canvas">
                                        <div className="h-full w-[82%] rounded-full bg-accent animate-progress" />
                                    </div>
                                </div>

                                {/* Floating badge */}
                                <div className="animate-float-delayed absolute -bottom-2 -left-4 rounded-xl border border-surface/80 bg-surface/90 px-4 py-3 shadow-[0_14px_40px_rgba(21,24,22,0.09)] backdrop-blur-xl">
                                    <div className="flex items-center gap-2">
                                        <div className="flex -space-x-2">
                                            <span className="h-6 w-6 rounded-full border-2 border-surface bg-accent-soft" />
                                            <span className="h-6 w-6 rounded-full border-2 border-surface bg-interview-line" />
                                            <span className="h-6 w-6 rounded-full border-2 border-surface bg-applied-line" />
                                        </div>

                                        <span className="text-[10px] font-semibold text-ink-2">
                                            DACH market
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Stats */}
                        <div className="animate-fade-up-delay-4 mt-10 flex flex-wrap gap-3">
                            <HeroStat
                                value="6"
                                label="trusted platforms"
                            />

                            <HeroStat
                                value="DACH"
                                label="regional coverage"
                            />

                            <HeroStat
                                value="Direct"
                                label="application links"
                            />
                        </div>
                    </section>

                    {/* =================================================
                        SECTION HEADER
                    ================================================== */}

                    <section>
                        <div className="animate-fade-up-delay-5 mb-6 flex items-end justify-between">
                            <div>
                                <div className="flex items-center gap-2">
                                    <span className="h-1.5 w-1.5 rounded-full bg-accent" />

                                    <p className="text-xs font-bold uppercase tracking-[0.12em] text-muted">
                                        Explore platforms
                                    </p>
                                </div>

                                <h2 className="mt-2 text-xl font-semibold tracking-[-0.025em] text-ink sm:text-2xl">
                                    Where do you want to search?
                                </h2>
                            </div>

                            <span className="hidden rounded-full border border-line bg-surface/60 px-3 py-1.5 text-xs font-medium text-muted sm:block">
                                {jobBoards.length} platforms
                            </span>
                        </div>

                        {/* =================================================
                            CARDS
                        ================================================== */}

                        <div className="grid gap-5 md:grid-cols-2">
                            {jobBoards.map((board, index) => (
                                <JobBoardCard
                                    key={board.name}
                                    board={board}
                                    index={index}
                                />
                            ))}
                        </div>
                    </section>

                    {/* =================================================
                        HOW IT WORKS
                    ================================================== */}

                    <section className="animate-fade-up-delay-8 mt-8">
                        <div className="overflow-hidden rounded-3xl border border-line bg-surface shadow-[0_12px_50px_rgba(21,24,22,0.045)]">
                            <div className="grid lg:grid-cols-[0.75fr_1.25fr]">
                                {/* Intro */}
                                <div className="relative overflow-hidden border-b border-line bg-canvas p-7 sm:p-9 lg:border-b-0 lg:border-r">
                                    <div className="absolute -right-12 -top-12 h-32 w-32 rounded-full bg-accent-soft blur-2xl" />

                                    <div className="relative">
                                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-accent-soft text-accent shadow-sm">
                                            <Check className="h-5 w-5" />
                                        </div>

                                        <h2 className="mt-6 text-xl font-semibold tracking-[-0.025em] text-ink">
                                            Three steps.
                                            <br />
                                            <span className="text-accent">
                                                One direction.
                                            </span>
                                        </h2>

                                        <p className="mt-3 max-w-sm text-sm leading-6 text-muted">
                                            JobTrack gets you from discovery to
                                            the right job platform without
                                            unnecessary steps.
                                        </p>
                                    </div>
                                </div>

                                {/* Steps */}
                                <div className="grid sm:grid-cols-3">
                                    <HowItWorksStep
                                        number="01"
                                        title="Choose"
                                        description="Pick the platform that fits your search."
                                    />

                                    <HowItWorksStep
                                        number="02"
                                        title="Explore"
                                        description="Browse current vacancies directly on the platform."
                                    />

                                    <HowItWorksStep
                                        number="03"
                                        title="Apply"
                                        description="Continue to the original website and apply."
                                        last
                                    />
                                </div>
                            </div>
                        </div>
                    </section>

                    <p className="animate-fade-up-delay-9 mt-7 text-center text-[11px] leading-5 text-muted">
                        Listings, availability, and application processes are
                        controlled by the respective job platforms.
                    </p>
                </div>
            </main>
        </>
    );
}

/* ================================================================
   JOB BOARD CARD
================================================================ */

function JobBoardCard({
    board,
    index,
}: {
    board: JobBoard;
    index: number;
}) {
    const accent = accentStyles[board.accent as keyof typeof accentStyles];

    return (
        <a
            href={board.url}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Visit ${board.name}`}
            className={`
                group
                relative
                flex
                min-h-[285px]
                animate-card-${Math.min(index + 1, 6)}
                flex-col
                overflow-hidden
                rounded-[22px]
                border
                border-line
                bg-surface
                p-6
                shadow-[0_5px_25px_rgba(21,24,22,0.025)]
                transition-all
                duration-300
                ease-out
                hover:-translate-y-1.5
                hover:border-line
                hover:shadow-[0_22px_60px_rgba(21,24,22,0.10)]
                active:translate-y-0
                active:scale-[0.995]
                focus:outline-none
                focus-visible:ring-2
                focus-visible:ring-accent/30
                focus-visible:ring-offset-2
                sm:p-7
            `}
        >
            {/* Accent glow */}
            <div
                className={`
                    pointer-events-none
                    absolute
                    -right-24
                    -top-24
                    h-48
                    w-48
                    rounded-full
                    ${accent.glow}
                    opacity-0
                    blur-3xl
                    transition-all
                    duration-500
                    group-hover:opacity-60
                    group-hover:scale-125
                `}
            />

            {/* Small top line */}
            <div className="absolute inset-x-0 top-0 h-[2px] origin-left scale-x-0 bg-accent transition-transform duration-500 group-hover:scale-x-100" />

            {/* Header */}
            <div className="relative flex items-start justify-between">
                <div className="flex items-center gap-3">
                    <div
                        className={`
                            flex
                            h-12
                            w-12
                            items-center
                            justify-center
                            rounded-2xl
                            transition-all
                            duration-300
                            group-hover:scale-110
                            group-hover:rotate-[-3deg]
                            ${accent.icon}
                        `}
                    >
                        {board.icon}
                    </div>

                    <div>
                        <span className="block text-[9px] font-bold uppercase tracking-[0.14em] text-muted">
                            Platform
                        </span>

                        <span className="mt-0.5 block text-[11px] font-medium text-muted">
                            {String(index + 1).padStart(2, "0")} / 06
                        </span>
                    </div>
                </div>

                {/* Arrow */}
                <div
                    className="
                        flex
                        h-9
                        w-9
                        items-center
                        justify-center
                        rounded-full
                        border
                        border-line
                        text-muted
                        transition-all
                        duration-300
                        group-hover:-translate-y-1
                        group-hover:translate-x-1
                        group-hover:border-accent-line
                        group-hover:bg-canvas
                        group-hover:text-accent
                    "
                >
                    <ArrowUpRight className="h-4 w-4" />
                </div>
            </div>

            {/* Main content */}
            <div className="relative mt-7">
                <div className="mb-3 flex items-center gap-2">
                    <span className="rounded-full bg-canvas px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.1em] text-muted">
                        {board.category}
                    </span>

                    <span className="text-[10px] text-faint">
                        {board.domain}
                    </span>
                </div>

                <h3 className="text-[21px] font-semibold tracking-[-0.03em] text-ink transition-colors duration-200 group-hover:text-accent">
                    {board.name}
                </h3>

                <p className="mt-3 max-w-lg text-[13px] leading-6 text-muted">
                    {board.description}
                </p>
            </div>

            {/* Footer */}
            <div className="relative mt-auto flex items-center justify-between border-t border-line pt-5">
                <span
                    className={`
                        text-xs
                        font-semibold
                        transition-colors
                        duration-200
                        ${accent.text}
                    `}
                >
                    Open platform
                </span>

                <span className="flex items-center gap-2 text-xs font-semibold text-muted transition-colors duration-200 group-hover:text-accent">
                    Explore
                    <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-1" />
                </span>
            </div>
        </a>
    );
}

/* ================================================================
   QUICK PILL
================================================================ */

function QuickPill({
    label,
    icon,
}: {
    label: string;
    icon?: React.ReactNode;
}) {
    return (
        <span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface/65 px-3 py-1.5 text-[11px] font-medium text-muted shadow-sm backdrop-blur-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-line hover:bg-surface">
            {icon}
            {label}
        </span>
    );
}

/* ================================================================
   HERO STAT
================================================================ */

function HeroStat({
    value,
    label,
}: {
    value: string;
    label: string;
}) {
    return (
        <div className="group flex items-center gap-3 rounded-2xl border border-line bg-surface/65 px-4 py-3 shadow-sm backdrop-blur-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-surface">
            <span className="text-base font-semibold tracking-[-0.02em] text-ink transition-colors group-hover:text-accent">
                {value}
            </span>

            <span className="h-4 w-px bg-surface-2" />

            <span className="text-[11px] text-muted">
                {label}
            </span>
        </div>
    );
}

/* ================================================================
   HOW IT WORKS STEP
================================================================ */

function HowItWorksStep({
    number,
    title,
    description,
    last = false,
}: {
    number: string;
    title: string;
    description: string;
    last?: boolean;
}) {
    return (
        <div
            className={`
                group
                relative
                p-7
                transition-colors
                duration-300
                hover:bg-canvas
                sm:p-8
                ${!last
                    ? "border-b border-line sm:border-b-0 sm:border-r"
                    : ""
                }
            `}
        >
            <span className="text-[10px] font-bold tracking-[0.16em] text-faint transition-colors group-hover:text-accent">
                {number}
            </span>

            <h3 className="mt-5 text-sm font-semibold text-ink">
                {title}
            </h3>

            <p className="mt-2 text-xs leading-5 text-muted">
                {description}
            </p>

            {!last && (
                <ArrowRight className="absolute right-6 top-1/2 hidden h-4 w-4 -translate-y-1/2 text-faint transition-transform duration-300 group-hover:translate-x-1 group-hover:text-accent sm:block" />
            )}
        </div>
    );
}


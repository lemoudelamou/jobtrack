import { cx } from "@/lib/ui";

/*
 * Hero demo: a small board where one application moves from Applied to
 * Interview on a loop. It's the only motion on the landing page, and it
 * stops for people who prefer reduced motion.
 */

type Card = { role: string; company: string; meta: string };
type Tone = "wishlist" | "applied" | "interview" | "offer";

// Literal class names so Tailwind generates them.
const TONE: Record<Tone, { dot: string; chip: string }> = {
    wishlist: { dot: "bg-wishlist", chip: "bg-wishlist-soft text-wishlist-ink" },
    applied: { dot: "bg-applied", chip: "bg-applied-soft text-applied-ink" },
    interview: { dot: "bg-interview", chip: "bg-interview-soft text-interview-ink" },
    offer: { dot: "bg-offer", chip: "bg-offer-soft text-offer-ink" },
};

const COLUMNS: Array<{ name: string; tone: Tone; cards: Card[] }> = [
    {
        name: "Wishlist",
        tone: "wishlist",
        cards: [
            { role: "Frontend Engineer", company: "Northwind", meta: "Berlin" },
            { role: "React Developer", company: "Halcyon", meta: "Hamburg" },
        ],
    },
    {
        name: "Applied",
        tone: "applied",
        cards: [{ role: "Full-stack Developer", company: "Kiln", meta: "Remote" }],
    },
    {
        name: "Interview",
        tone: "interview",
        cards: [{ role: "UI Engineer", company: "Ostwind", meta: "Thu, 10:00" }],
    },
    {
        name: "Offer",
        tone: "offer",
        cards: [{ role: "Web Developer", company: "Pilot", meta: "€68k" }],
    },
];

const TRAVELLER: Card = { role: "Product Engineer", company: "Lumen Labs", meta: "Applied" };

function MiniCard({ card, tone, className }: { card: Card; tone: Tone; className?: string }) {
    return (
        <div
            className={cx(
                "rounded-xl border border-[var(--glass-line)] bg-[var(--glass-strong)] p-2.5 shadow-[0_8px_24px_-16px_rgba(0,0,0,0.5)] backdrop-blur-xl",
                className,
            )}
        >
            <p className="truncate text-[12px] font-bold leading-tight text-ink">{card.role}</p>
            <p className="mt-0.5 truncate text-[11px] text-muted">{card.company}</p>
            <span
                className={cx("mt-2 inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-semibold", TONE[tone].chip)}
            >
                <span className={cx("h-1.5 w-1.5 rounded-full", TONE[tone].dot)} />
                {card.meta}
            </span>
        </div>
    );
}

export default function BoardDemo() {
    return (
        <div
            role="img"
            aria-label="A JobTrack board with columns Wishlist, Applied, Interview and Offer. An application for Product Engineer at Lumen Labs moves from Applied to Interview."
            className="panel relative overflow-hidden rounded-[28px] p-3 sm:p-4"
        >
            {/* Window chrome */}
            <div aria-hidden="true" className="mb-3 flex items-center justify-between px-1">
                <div className="flex gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-[var(--glass-line)]" />
                    <span className="h-2.5 w-2.5 rounded-full bg-[var(--glass-line)]" />
                    <span className="h-2.5 w-2.5 rounded-full bg-[var(--glass-line)]" />
                </div>
                <span className="text-[11px] font-semibold text-muted">5 active · 1 interview this week</span>
            </div>

            <div aria-hidden="true" className="lp-board relative grid grid-cols-3 gap-2.5 sm:grid-cols-4">
                {COLUMNS.map((column, i) => (
                    <div key={column.name} className={cx("min-w-0 rounded-2xl bg-[var(--glass)] p-2", i === 3 && "hidden sm:block")}>
                        <p className="mb-2 flex items-center gap-1.5 px-0.5 text-[11px] font-bold text-ink-2">
                            <span className={cx("h-2 w-2 rounded-full", TONE[column.tone].dot)} />
                            {column.name}
                        </p>
                        <div className="space-y-2">
                            {/* Slot the travelling card lands in. */}
                            {column.name === "Interview" && (
                                <div className="lp-landing relative">
                                    {/* Invisible copy keeps the slot exactly one card tall. */}
                                    <MiniCard card={TRAVELLER} tone="interview" className="invisible" />
                                    <div className="absolute inset-0 rounded-xl border border-dashed border-interview-line" />
                                </div>
                            )}
                            {column.name === "Applied" && <MiniCard card={TRAVELLER} tone="applied" className="invisible" />}
                            {column.cards.map((card) => (
                                <MiniCard key={card.role} card={card} tone={column.tone} />
                            ))}
                        </div>
                    </div>
                ))}

                {/* The application that moves: starts in Applied, ends in Interview. */}
                <div className="lp-travel pointer-events-none absolute left-0 top-[32px] w-[calc((100%-1.25rem)/3)] px-2 sm:w-[calc((100%-1.875rem)/4)]">
                    <div className="lp-travel-card relative">
                        <MiniCard
                            card={TRAVELLER}
                            tone="applied"
                            className="lp-before"
                        />
                        <MiniCard
                            card={{ role: "Product Engineer", company: "Lumen Labs", meta: "Interview Tue" }}
                            tone="interview"
                            className="lp-after absolute inset-0"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}

/*
 * Placeholder shown while applications load, shaped like the real
 * pipeline tiles and board so the page doesn't jump (and doesn't flash the
 * "no applications yet" screen for people who have some).
 */
const COLUMNS = [3, 2, 2, 1, 1];

export default function DashboardSkeleton() {
    return (
        <div aria-busy="true" aria-label="Loading your applications" className="space-y-6">
            <div className="space-y-4 pt-2">
                <div className="h-8 w-56 animate-pulse rounded-full bg-[var(--glass)]" />
                <div className="h-12 w-72 animate-pulse rounded-2xl bg-[var(--glass-strong)] sm:h-14 sm:w-96" />
                <div className="h-12 w-52 animate-pulse rounded-2xl bg-[var(--glass)] sm:h-14" />
            </div>

            <div className="flex gap-3 overflow-hidden">
                {COLUMNS.map((_, i) => (
                    <div key={i} className="panel h-[104px] min-w-[150px] flex-1 animate-pulse rounded-3xl" />
                ))}
            </div>

            <div className="flex items-center justify-between gap-3">
                <div className="h-10 w-full max-w-xs animate-pulse rounded-xl bg-[var(--glass)]" />
                <div className="h-9 w-36 animate-pulse rounded-full bg-[var(--glass)]" />
            </div>

            <div className="grid grid-flow-col auto-cols-[minmax(240px,1fr)] gap-4 overflow-hidden">
                {COLUMNS.map((cards, i) => (
                    <div key={i} className="space-y-3">
                        <div className="h-4 w-24 animate-pulse rounded-full bg-[var(--glass-strong)]" />
                        {Array.from({ length: cards }, (_, j) => (
                            <div key={j} className="panel h-28 animate-pulse rounded-2xl" style={{ animationDelay: `${(i + j) * 90}ms` }} />
                        ))}
                    </div>
                ))}
            </div>
            <span className="sr-only" role="status">Loading your applications…</span>
        </div>
    );
}

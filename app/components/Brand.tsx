/* -------------------------------------------------------------------------- */
/* Brand: gradient tile with a "J" and the wordmark.                          */
/* -------------------------------------------------------------------------- */

export function BrandMark({ className = "h-8 w-8" }: { className?: string }) {
    return (
        <span
            aria-hidden="true"
            className={`bg-accent-gradient inline-flex shrink-0 items-center justify-center rounded-[10px] text-sm font-extrabold text-white shadow-[0_6px_20px_-6px_rgba(var(--accent-rgb),0.8)] ${className}`}
        >
            J
        </span>
    );
}

export function Brand({ subtitle = false }: { subtitle?: boolean }) {
    return (
        <span className="flex items-center gap-2.5" aria-label="JobTrack">
            <BrandMark />
            <span className="leading-tight">
                <span className="block text-[17px] font-extrabold tracking-[-0.02em] text-ink">JobTrack</span>
                {subtitle && <span className="block text-xs text-muted">Application tracker</span>}
            </span>
        </span>
    );
}

import { serif } from "@/lib/fonts";

export function AnalyticsCard({
  label,
  value,
  description,
  icon,
}: {
  label: string;
  value: number;
  description: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="group rounded-2xl border border-line bg-surface/70 p-6 shadow-sm backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:bg-surface hover:shadow-[0_18px_45px_rgba(20,24,26,0.07)]">
      <div className="flex items-center justify-between">
        <p className="flex items-center gap-2 text-sm font-medium text-muted">
          {icon}
          {label}
        </p>
        <span className="h-2 w-2 rounded-full bg-accent dashboard-pulse" />
      </div>

      <p className={`${serif.className} mt-6 text-5xl leading-none text-ink`}>{value}</p>
      <p className="mt-4 text-xs text-muted">{description}</p>
    </div>
  );
}

export function RateCard({
  label,
  value,
  description,
  icon,
  color,
}: {
  label: string;
  value: number;
  description: string;
  icon: React.ReactNode;
  color: string;
}) {
  const radius = 30;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (Math.min(value, 100) / 100) * circumference;

  return (
    <div className="group flex items-center gap-5 rounded-2xl border border-line bg-surface/70 p-6 shadow-sm backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:bg-surface hover:shadow-[0_18px_45px_rgba(20,24,26,0.07)]">
      <div className="relative flex h-20 w-20 shrink-0 items-center justify-center">
        <svg viewBox="0 0 72 72" className="-rotate-90 h-20 w-20">
          <circle cx="36" cy="36" r={radius} fill="none" stroke="var(--color-surface-2)" strokeWidth="6" />
          <circle
            cx="36"
            cy="36"
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className="transition-all duration-700"
          />
        </svg>

        <span className="absolute text-sm font-bold" style={{ color }}>
          {value}%
        </span>
      </div>

      <div>
        <p className="flex items-center gap-2 text-sm font-medium text-muted">
          {icon}
          {label}
        </p>
        <p className="mt-2 text-lg font-semibold" style={{ color }}>
          {value}%
        </p>
        <p className="mt-1 text-xs leading-5 text-muted">{description}</p>
      </div>
    </div>
  );
}

export function InsightCard({
  title,
  value,
  description,
  icon,
  positive = false,
}: {
  title: string;
  value: number;
  description: string;
  icon: React.ReactNode;
  positive?: boolean;
}) {
  return (
    <div className="group rounded-2xl border border-line bg-surface/70 p-6 shadow-sm backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:bg-surface">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-muted">{title}</p>
        <span
          className={`flex h-9 w-9 items-center justify-center rounded-xl ${
            positive ? "bg-accent-soft text-accent" : "bg-surface-2 text-ink-2"
          }`}
        >
          {icon}
        </span>
      </div>

      <p className={`${serif.className} mt-5 text-4xl ${positive ? "text-accent" : "text-ink"}`}>{value}</p>
      <p className="mt-2 max-w-sm text-xs leading-5 text-muted">{description}</p>
    </div>
  );
}

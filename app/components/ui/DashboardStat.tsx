
import { serif } from "@/lib/fonts";

export function DashboardStat({
  value,
  label,
  detail,
  icon,
  tone,
}: {
  value: number;
  label: string;
  detail: string;
  icon: React.ReactNode;
  tone: "green" | "gold" | "blue";
}) {
  const styles = {
    green: {
      icon: "bg-accent-soft text-accent",
      number: "text-accent",
      line: "bg-accent",
    },
    gold: {
      icon: "bg-interview-soft text-interview",
      number: "text-interview-ink",
      line: "bg-interview",
    },
    blue: {
      icon: "bg-applied-soft text-applied-ink",
      number: "text-applied-ink",
      line: "bg-applied-ink",
    },
  }[tone];

  return (
    <div className="group relative px-5 py-5 sm:px-7 sm:py-6">
      {/* Icon + label */}
      <div className="flex items-center gap-3">
        <span
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-all duration-300 group-hover:scale-110 group-hover:-rotate-3 ${styles.icon}`}
        >
          {icon}
        </span>

        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-faint">
            Overview
          </p>

          <p className="mt-0.5 text-sm font-semibold text-ink-2">
            {label}
          </p>
        </div>
      </div>

      {/* Number */}
      <div className="mt-5 flex items-end justify-between">
        <p
          className={`${serif.className} text-5xl leading-none tracking-[-0.04em] ${styles.number} transition-transform duration-300 group-hover:translate-x-1`}
        >
          {value}
        </p>

        <span className="mb-1 text-xs text-muted">
          {detail}
        </span>
      </div>

      {/* Animated accent line */}
      <div className="mt-5 h-1 overflow-hidden rounded-full bg-canvas">
        <div
          className={`h-full w-1/3 rounded-full ${styles.line} opacity-70 transition-all duration-500 group-hover:w-2/3`}
        />
      </div>
    </div>
  );
}


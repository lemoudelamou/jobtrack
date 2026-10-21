import { serif } from "@/lib/fonts";

export function SectionHeader({
  icon,
  title,
  description,
  badge,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  badge?: string;
}) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-line bg-surface/65 px-5 py-4 shadow-sm backdrop-blur-sm sm:px-6">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent-soft text-accent">
          {icon}
        </span>

        <div>
          <h2 className={`${serif.className} text-xl leading-tight text-ink`}>{title}</h2>
          <p className="mt-0.5 text-xs leading-5 text-muted sm:text-sm">{description}</p>
        </div>
      </div>

      {badge && (
        <span className="hidden rounded-full bg-canvas px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.1em] text-muted sm:block">
          {badge}
        </span>
      )}
    </div>
  );
}

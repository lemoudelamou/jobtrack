import { IconBriefcase } from "@/app/components/Icons";

export function EmptyApplications({ hasJobs, onAdd }: { hasJobs: boolean; onAdd: () => void }) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-dashed border-line bg-surface/55 p-12 text-center">
      <div className="pointer-events-none absolute -right-20 -top-20 h-40 w-40 rounded-full bg-accent-soft opacity-60 blur-3xl" />

      <div className="relative">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-surface-2 text-ink-2">
          <IconBriefcase className="h-6 w-6" />
        </span>

        <h3 className="mt-5 text-lg font-semibold text-ink">
          {hasJobs ? "Nothing matches." : "Start your application tracker."}
        </h3>

        <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-muted">
          {hasJobs
            ? "Try another search term or status filter."
            : "Add your first application and keep your entire job search in one place."}
        </p>

        {!hasJobs && (
          <button
            type="button"
            onClick={onAdd}
            className="mt-6 rounded-xl bg-accent px-5 py-2.5 text-sm font-semibold text-on-accent shadow-sm transition-all hover:-translate-y-0.5 hover:bg-accent-strong hover:shadow-lg"
          >
            + New application
          </button>
        )}
      </div>
    </div>
  );
}

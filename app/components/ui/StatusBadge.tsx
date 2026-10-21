import { Job } from "@/app/types/job";
import { getStatusMeta } from "@/lib/theme";

export function StatusDot({
  status,
  className = "h-2 w-2",
}: {
  status: Job["status"];
  className?: string;
}) {
  return (
    <span
      aria-hidden="true"
      className={`inline-block shrink-0 rounded-full ${className}`}
      style={{ backgroundColor: getStatusMeta(status).dot }}
    />
  );
}

export function StatusBadge({ status }: { status: Job["status"] }) {
  const meta = getStatusMeta(status);

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium ${meta.text} ${meta.bg}`}
    >
      <StatusDot status={status} className="h-1.5 w-1.5" />
      {status}
    </span>
  );
}

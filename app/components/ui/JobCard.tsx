"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { Job } from "@/app/types/job";
import { getStatusMeta, getAvatarPalette, getInitials } from "@/lib/theme";
import { StatusBadge } from "@/app/components/ui/StatusBadge";
import {
  IconArrowUpRight,
  IconCalendar,
  IconExternal,
  IconMapPin,
  IconNote,
  IconPencil,
  IconTrash,
  IconWallet,
} from "@/app/components/Icons";

export function JobCard({
  job,
  onEdit,
  onRequestDelete,
}: {
  job: Job;
  onEdit: (job: Job) => void;
  onRequestDelete: (job: Job) => void;
}) {
  const router = useRouter();
  const meta = getStatusMeta(job.status);
  const avatar = getAvatarPalette(job.company);

  function goToJob() {
    router.push(`/jobs/${job.id}`);
  }

  const formattedDate = (() => {
    const date = new Date(job.appliedDate);

    if (Number.isNaN(date.getTime())) {
      return job.appliedDate;
    }

    return new Intl.DateTimeFormat("en", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(date);
  })();

  return (
    <div
      role="link"
      tabIndex={0}
      onClick={goToJob}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          goToJob();
        }
      }}
      className="
        group
        relative
        flex
        min-h-[285px]
        cursor-pointer
        flex-col
        overflow-hidden
        rounded-[22px]
        border
        border-line
        bg-surface
        p-5
        shadow-[0_8px_30px_rgba(20,24,26,0.035)]
        transition-all
        duration-300
        ease-out
        hover:-translate-y-1
        hover:border-line
        hover:bg-canvas
        hover:shadow-[0_18px_45px_rgba(20,24,26,0.08)]
        focus-visible:outline-none
        focus-visible:ring-2
        focus-visible:ring-accent/30
        sm:p-5
      "
    >
      {/* Status rail */}
      <span
        className="
          absolute
          inset-y-0
          left-0
          w-[3px]
          origin-bottom
          scale-y-0
          rounded-r-full
          transition-transform
          duration-300
          group-hover:scale-y-100
        "
        style={{ backgroundColor: meta.dot }}
      />

      {/* Subtle top accent */}
      <span
        className="
          pointer-events-none
          absolute
          left-5
          right-5
          top-0
          h-px
          opacity-0
          transition-opacity
          duration-300
          group-hover:opacity-100
        "
        style={{ backgroundColor: meta.dot }}
      />

      {/* Header / actions */}
      <div className="relative flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          {/* Company avatar */}
          <div
            className="
              relative
              flex
              h-11
              w-11
              shrink-0
              items-center
              justify-center
              rounded-[14px]
              text-xs
              font-bold
              shadow-[0_4px_14px_rgba(20,24,26,0.05)]
              transition-all
              duration-300
              group-hover:-translate-y-0.5
              group-hover:scale-105
            "
            style={{ backgroundColor: avatar.bg, color: avatar.text }}
          >
            {getInitials(job.company)}

            {/* Status indicator */}
            <span
              className="
                absolute
                -right-1
                -top-1
                h-2.5
                w-2.5
                rounded-full
                border-2
                border-surface
                transition-transform
                duration-300
                group-hover:scale-125
              "
              style={{ backgroundColor: meta.dot }}
            />
          </div>

          <div className="min-w-0">
            <p className="truncate text-xs font-medium text-ink-2">{job.company}</p>
            <p className="mt-0.5 text-[11px] text-muted">Application</p>
          </div>
        </div>

        {/* Actions */}
        <div
          className="
            flex
            shrink-0
            items-center
            gap-1
            opacity-0
            translate-y-0.5
            transition-all
            duration-200
            group-hover:translate-y-0
            group-hover:opacity-100
            group-focus-within:translate-y-0
            group-focus-within:opacity-100
          "
        >
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onEdit(job);
            }}
            aria-label={`Edit ${job.position} at ${job.company}`}
            title="Edit"
            className="
              flex
              h-8
              w-8
              items-center
              justify-center
              rounded-lg
              text-muted
              transition-all
              duration-200
              hover:-translate-y-0.5
              hover:bg-surface-2
              hover:text-ink
            "
          >
            <IconPencil className="h-3.5 w-3.5" />
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onRequestDelete(job);
            }}
            aria-label={`Delete ${job.position} at ${job.company}`}
            title="Delete"
            className="
              flex
              h-8
              w-8
              items-center
              justify-center
              rounded-lg
              text-rejected
              transition-all
              duration-200
              hover:-translate-y-0.5
              hover:bg-rejected-soft
              hover:text-rejected
            "
          >
            <IconTrash className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Position */}
      <div className="relative mt-5">
        <h3
          className="
            break-words
            text-[17px]
            font-semibold
            leading-snug
            text-ink
            transition-all
            duration-300
            group-hover:translate-x-0.5
            group-hover:text-accent
          "
        >
          {job.position}
        </h3>

        {job.location && (
          <p className="mt-1.5 flex items-center gap-1.5 text-xs text-muted">
            <IconMapPin className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{job.location}</span>
          </p>
        )}
      </div>

      {/* Status */}
      <div className="relative mt-4 flex items-center justify-between gap-3">
        <StatusBadge status={job.status} />

        <span className="flex items-center gap-1.5 text-[11px] text-muted">
          <span
            className="h-1.5 w-1.5 rounded-full transition-transform duration-300 group-hover:scale-125"
            style={{ backgroundColor: meta.dot }}
          />
          {job.status}
        </span>
      </div>

      {/* Timeline / metadata */}
      <div className="relative mt-4 border-t border-line pt-3.5">
        <div className="flex items-center justify-between gap-3">
          <span className="flex items-center gap-1.5 text-[11px] text-muted">
            <IconCalendar className="h-3.5 w-3.5 text-muted" />
            {formattedDate}
          </span>

          {job.salary && (
            <span className="flex max-w-[48%] items-center gap-1 text-[11px] font-medium text-ink-2">
              <IconWallet className="h-3.5 w-3.5 shrink-0 text-muted" />
              <span className="truncate">{job.salary}</span>
            </span>
          )}
        </div>

        {/* Status progress */}
        <div className="mt-3 h-1 overflow-hidden rounded-full bg-surface-2">
          <div
            className="h-full origin-left rounded-full transition-all duration-500 ease-out group-hover:brightness-105"
            style={{
              width:
                job.status === "Wishlist"
                  ? "20%"
                  : job.status === "Applied"
                    ? "40%"
                    : job.status === "Interview"
                      ? "70%"
                      : "100%",
              backgroundColor: meta.dot,
            }}
          />
        </div>
      </div>

      {/* Notes */}
      {job.notes && (
        <div
          className="
            mt-3
            rounded-xl
            border
            border-transparent
            bg-canvas
            px-3
            py-2.5
            transition-all
            duration-300
            group-hover:border-line
            group-hover:bg-accent-soft
          "
        >
          <div className="flex items-start gap-2">
            <IconNote
              className="
                mt-0.5
                h-3.5
                w-3.5
                shrink-0
                text-muted
                transition-transform
                duration-300
                group-hover:rotate-[-4deg]
                group-hover:text-accent
              "
            />
            <p className="line-clamp-2 text-xs leading-5 text-ink-2">{job.notes}</p>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="mt-auto flex items-center justify-between pt-4">
        <span className="text-[11px] font-medium text-faint transition-colors duration-300 group-hover:text-muted">
          View application
        </span>

        <div className="flex items-center gap-2">
          {job.jobUrl && (
            <Link
              href={job.jobUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              aria-label={`Open posting for ${job.position}`}
              title="Open posting"
              className="
                flex
                h-8
                w-8
                items-center
                justify-center
                rounded-lg
                bg-canvas
                text-muted
                transition-all
                duration-200
                hover:-translate-y-0.5
                hover:bg-applied-soft
                hover:text-applied-ink
              "
            >
              <IconExternal className="h-3.5 w-3.5" />
            </Link>
          )}

          <span
            className="
              flex
              h-8
              w-8
              items-center
              justify-center
              rounded-lg
              bg-canvas
              text-muted
              transition-all
              duration-300
              group-hover:translate-x-0.5
              group-hover:bg-accent
              group-hover:text-on-accent
            "
          >
            <IconArrowUpRight
              className="
                h-3.5
                w-3.5
                transition-transform
                duration-300
                group-hover:translate-x-0.5
                group-hover:-translate-y-0.5
              "
            />
          </span>
        </div>
      </div>
    </div>
  );
}

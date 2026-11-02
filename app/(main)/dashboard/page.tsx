"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AlertCircle, Columns3, Plus, Rows3, Search, X } from "lucide-react";

import { Job } from "@/app/types/job";
import JobBoard from "@/app/components/jobs/JobBoard";
import JobForm, { type JobFormData } from "@/app/components/jobs/JobForm";
import JobList from "@/app/components/jobs/JobList";
import PipelineOverview from "@/app/components/dashboard/PipelineOverview";
import InboxUpdates from "@/app/components/dashboard/InboxUpdates";
import EmptyDashboard from "@/app/components/dashboard/EmptyDashboard";
import DashboardSkeleton from "@/app/components/dashboard/DashboardSkeleton";
import Sheet from "@/app/components/ui/Sheet";
import { ConfirmDialog } from "@/app/components/ui/ConfirmDialog";

import { ApiError, apiRequest } from "@/lib/api/client";
import { STATUS_META, STATUS_ORDER } from "@/lib/theme";
import { button, cx, field } from "@/lib/ui";

type View = "board" | "list";
const VIEW_KEY = "jobtrack:dashboard-view";

function greeting() {
  const hour = new Date().getHours();
  if (hour < 5) return "Good evening";
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

function readStoredView(): View {
  try {
    return window.localStorage.getItem(VIEW_KEY) === "list" ? "list" : "board";
  } catch {
    return "board";
  }
}

function errorMessage(error: unknown, fallback: string) {
  if (error instanceof ApiError && error.message) return error.message;
  return fallback;
}

/* -------------------------------------------------------------------------- */
/* Loading skeleton                                                           */
/* -------------------------------------------------------------------------- */

/* -------------------------------------------------------------------------- */
/* Page                                                                       */
/* -------------------------------------------------------------------------- */

export default function DashboardPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [actionError, setActionError] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<Job["status"] | "All">("All");
  const [view, setView] = useState<View>("board");

  const [formOpen, setFormOpen] = useState(false);
  const [editingJob, setEditingJob] = useState<Job | null>(null);
  const [pendingUrl, setPendingUrl] = useState("");

  const [firstName, setFirstName] = useState("");
  const [newMatches, setNewMatches] = useState<number | null>(null);

  const [jobToDelete, setJobToDelete] = useState<Job | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  /* Greeting name + new radar matches (both optional; failures are ignored). */
  useEffect(() => {
    fetch("/api/auth/session")
      .then((r) => (r.ok ? r.json() : null))
      .then((session) => {
        const name: string = session?.user?.name || "";
        setFirstName(name.trim().split(/\s+/)[0] ?? "");
      })
      .catch(() => {});

    fetch("/api/radar?status=New", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.profile) setNewMatches(Number(data.counts?.New ?? 0));
      })
      .catch(() => {});
  }, []);

  /* Remembered view (per browser). */
  useEffect(() => {
    const stored = readStoredView();
    if (stored !== "board") setView(stored); // eslint-disable-line react-hooks/set-state-in-effect
  }, []);

  function changeView(next: View) {
    setView(next);
    try {
      window.localStorage.setItem(VIEW_KEY, next);
    } catch {
      /* storage unavailable: keep the choice for this visit only */
    }
  }

  /* ---------------------------------------------------------------------- */
  /* Data                                                                   */
  /* ---------------------------------------------------------------------- */

  const loadJobs = useCallback(async (signal?: AbortSignal) => {
    try {
      setLoadError("");

      const data = await apiRequest<Job[] | { jobs: Job[] }>("/api/jobs?limit=100", {
        cache: "no-store",
        signal,
      });

      setJobs(Array.isArray(data) ? data : data?.jobs ?? []);
      setLoaded(true);
    } catch (error) {
      /*
       * A cancelled request (React re-running the effect, or leaving the
       * page) must not mark the list as loaded: that briefly showed the
       * "no applications yet" screen before the real board.
       */
      if (signal?.aborted || (error as DOMException)?.name === "AbortError") return;
      if (error instanceof ApiError && error.status === 401) return;

      console.error("Error loading jobs:", error);
      setLoadError("Your applications didn't load. Check your connection and try again.");
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    // Fetch on mount; loadJobs only sets state after awaiting the request.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadJobs(controller.signal);
    return () => controller.abort();
  }, [loadJobs]);

  const openFromLink = useCallback((url: string) => {
    setEditingJob(null);
    setPendingUrl(url);
    setActionError("");
    setFormOpen(true);
  }, []);

  const openNewForm = useCallback(() => {
    setEditingJob(null);
    setPendingUrl("");
    setActionError("");
    setFormOpen(true);
  }, []);

  const openEditForm = useCallback((job: Job) => {
    setEditingJob(job);
    setPendingUrl("");
    setActionError("");
    setFormOpen(true);
  }, []);

  const closeForm = useCallback(() => setFormOpen(false), []);

  const saveJob = useCallback(
    async (jobData: JobFormData) => {
      try {
        const savedJob = await apiRequest<Job>("/api/jobs", {
          method: editingJob ? "PATCH" : "POST",
          body: JSON.stringify(editingJob ? { id: editingJob.id, ...jobData } : jobData),
        });

        setJobs((current) =>
          editingJob
            ? current.map((job) => (job.id === savedJob.id ? savedJob : job))
            : [savedJob, ...current],
        );

        setFormOpen(false);
      } catch (error) {
        console.error("Error saving job:", error);
        // Shown inside the form, which stays open so nothing typed is lost.
        throw new Error(
          errorMessage(error, "The application wasn't saved. Check your connection and try again."),
        );
      }
    },
    [editingJob],
  );

  const deleteJob = useCallback(async (id: number) => {
    try {
      setIsDeleting(true);
      setActionError("");

      await apiRequest<void>("/api/jobs", {
        method: "DELETE",
        body: JSON.stringify({ id }),
      });

      setJobs((current) => current.filter((job) => job.id !== id));
      setJobToDelete(null);
    } catch (error) {
      console.error("Error deleting job:", error);
      setJobToDelete(null);
      setActionError(errorMessage(error, "The application wasn't deleted. Try again."));
    } finally {
      setIsDeleting(false);
    }
  }, []);

  const changeJobStatus = useCallback(async (id: number, newStatus: Job["status"]) => {
    setActionError("");

    let previousJobs: Job[] = [];

    setJobs((current) => {
      previousJobs = current;
      return current.map((job) => (job.id === id ? { ...job, status: newStatus } : job));
    });

    try {
      const updatedJob = await apiRequest<Job>("/api/jobs", {
        method: "PATCH",
        body: JSON.stringify({ id, status: newStatus }),
      });

      setJobs((current) => current.map((job) => (job.id === updatedJob.id ? updatedJob : job)));
    } catch (error) {
      console.error("Error updating job status:", error);
      setJobs(previousJobs);
      setActionError(`The stage didn't change to ${newStatus}. Try again.`);
    }
  }, []);

  /* ---------------------------------------------------------------------- */
  /* Derived                                                                */
  /* ---------------------------------------------------------------------- */

  const counts = useMemo(() => {
    const result = Object.fromEntries(STATUS_ORDER.map((s) => [s, 0])) as Record<Job["status"], number>;
    for (const job of jobs) if (job.status in result) result[job.status] += 1;
    return result;
  }, [jobs]);

  const searched = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return jobs;

    return jobs.filter((job) =>
      [job.company, job.position, job.location].some((value) => value?.toLowerCase().includes(term)),
    );
  }, [jobs, search]);

  const visibleJobs = useMemo(
    () => (statusFilter === "All" ? searched : searched.filter((job) => job.status === statusFilter)),
    [searched, statusFilter],
  );

  const active = counts.Wishlist + counts.Applied + counts.Interview;
  const isFiltered = search.trim() !== "" || statusFilter !== "All";

  const summary =
    jobs.length === 0
      ? "Every job you're considering, in one place."
      : [
          `${jobs.length} ${jobs.length === 1 ? "application" : "applications"}`,
          `${active} still active`,
          counts.Interview > 0 ? `${counts.Interview} in interviews` : null,
        ]
          .filter(Boolean)
          .join(", ") + ".";

  /* ---------------------------------------------------------------------- */
  /* Render                                                                 */
  /* ---------------------------------------------------------------------- */

  return (
    <main className="mx-auto w-full max-w-[1520px] px-4 pb-16 pt-4 sm:px-6 lg:px-8">
      {!loaded ? (
        <DashboardSkeleton />
      ) : (
        <div className="space-y-8">
          {/* Header */}
          <header className="jt-enter flex flex-col gap-6 pt-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              {newMatches !== null && newMatches > 0 ? (
                <Link
                  href="/radar"
                  className="inline-flex items-center gap-2 rounded-full border border-[var(--glass-line)] bg-[var(--glass)] px-3.5 py-1.5 text-[13px] font-semibold text-ink backdrop-blur-xl transition-colors hover:bg-[var(--glass-strong)]"
                >
                  <span className="live-dot h-2 w-2 rounded-full bg-accent" />
                  {newMatches} new {newMatches === 1 ? "match" : "matches"} on your radar
                </Link>
              ) : (
                <p className="inline-flex items-center gap-2 rounded-full border border-[var(--glass-line)] bg-[var(--glass)] px-3.5 py-1.5 text-[13px] font-semibold text-ink-2 backdrop-blur-xl">
                  {summary}
                </p>
              )}
              <h1 className="mt-4 text-[2.6rem] font-extrabold leading-[1.02] tracking-[-0.045em] text-ink sm:text-6xl">
                {greeting()},
                <br />
                <span className="text-accent-gradient">{firstName ? `${firstName}.` : "welcome back."}</span>
              </h1>
            </div>

            {jobs.length > 0 && (
              <button type="button" onClick={openNewForm} className={cx(button.primary, button.large, "self-start px-6 sm:self-auto")}>
                <Plus className="h-4 w-4" strokeWidth={2.5} />
                Add application
              </button>
            )}
          </header>

          {/* Errors */}
          {loadError && (
            <div role="alert" className="flex flex-col gap-3 rounded-xl border border-rejected-line bg-rejected-soft px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="flex items-center gap-2.5 text-sm text-rejected-ink">
                <AlertCircle className="h-4 w-4 shrink-0" strokeWidth={2} />
                {loadError}
              </p>
              <button type="button" onClick={() => loadJobs()} className={cx(button.secondary, "self-start")}>
                Try again
              </button>
            </div>
          )}

          {actionError && (
            <div role="alert" className="flex items-center justify-between gap-3 rounded-xl border border-rejected-line bg-rejected-soft px-4 py-3">
              <p className="flex items-center gap-2.5 text-sm text-rejected-ink">
                <AlertCircle className="h-4 w-4 shrink-0" strokeWidth={2} />
                {actionError}
              </p>
              <button
                type="button"
                onClick={() => setActionError("")}
                aria-label="Dismiss"
                className={button.icon}
              >
                <X className="h-4 w-4" strokeWidth={1.75} />
              </button>
            </div>
          )}

          {jobs.length === 0 && !loadError ? (
            <EmptyDashboard onAddManually={openNewForm} onAddFromLink={openFromLink} />
          ) : jobs.length > 0 ? (
            <>
              <InboxUpdates onBoardChanged={() => loadJobs()} />

              <PipelineOverview
                counts={counts}
                total={jobs.length}
                selected={statusFilter}
                onSelect={setStatusFilter}
                hideTilesOnPhone={view === "board"}
              />

              {/* Toolbar */}
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-1 items-center gap-3">
                  <div className="relative w-full sm:max-w-xs">
                    <Search
                      aria-hidden="true"
                      className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-faint"
                      strokeWidth={1.75}
                    />
                    <input
                      type="search"
                      value={search}
                      onChange={(event) => setSearch(event.target.value)}
                      placeholder="Search role, company or location"
                      aria-label="Search applications"
                      className={cx(field.input, "h-9 rounded-full pl-9")}
                    />
                  </div>

                  {isFiltered && (
                    <p className="hidden shrink-0 text-sm text-muted md:block">
                      {visibleJobs.length} of {jobs.length}
                      {statusFilter !== "All" && (
                        <>
                          {" in "}
                          <span className={STATUS_META[statusFilter].text}>{statusFilter}</span>
                        </>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          setSearch("");
                          setStatusFilter("All");
                        }}
                        className="ml-2 font-medium text-accent hover:underline hover:underline-offset-2"
                      >
                        Clear
                      </button>
                    </p>
                  )}
                </div>

                <div role="radiogroup" aria-label="View" className="inline-flex self-start rounded-full border border-[var(--glass-line)] bg-[var(--glass)] p-1 backdrop-blur-xl sm:self-auto">
                  {(
                    [
                      { id: "board", label: "Board", Icon: Columns3 },
                      { id: "list", label: "List", Icon: Rows3 },
                    ] as const
                  ).map(({ id, label, Icon }) => (
                    <button
                      key={id}
                      type="button"
                      role="radio"
                      aria-checked={view === id}
                      onClick={() => changeView(id)}
                      className={cx(
                        "inline-flex h-8 items-center gap-1.5 rounded-full px-3.5 text-sm transition-colors",
                        view === id ? "bg-btn font-bold text-btn-fg" : "font-semibold text-ink-2 hover:text-ink",
                      )}
                    >
                      <Icon className="h-4 w-4" strokeWidth={1.75} />
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Results */}
              {visibleJobs.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-line-strong px-6 py-12 text-center">
                  <p className="text-sm font-medium text-ink">No applications match</p>
                  <p className="mt-1 text-sm text-muted">
                    Try another search, or{" "}
                    <button
                      type="button"
                      onClick={() => {
                        setSearch("");
                        setStatusFilter("All");
                      }}
                      className="font-medium text-accent hover:underline hover:underline-offset-2"
                    >
                      clear the filters
                    </button>
                    .
                  </p>
                </div>
              ) : view === "board" ? (
                <JobBoard
                  jobs={visibleJobs}
                  onStatusChange={changeJobStatus}
                  onEdit={openEditForm}
                  statuses={statusFilter === "All" ? STATUS_ORDER : [statusFilter]}
                />
              ) : (
                <JobList
                  jobs={visibleJobs}
                  onEdit={openEditForm}
                  onDelete={(job) => {
                    setActionError("");
                    setJobToDelete(job);
                  }}
                  onStatusChange={changeJobStatus}
                />
              )}
            </>
          ) : null}
        </div>
      )}

      <Sheet open={formOpen} onClose={closeForm} labelledBy="job-form-title">
        <JobForm
          key={editingJob?.id ?? `new-${pendingUrl}`}
          editingJob={editingJob}
          initialUrl={pendingUrl}
          onSave={saveJob}
          onCancel={closeForm}
        />
      </Sheet>

      {jobToDelete && (
        <ConfirmDialog
          title="Delete this application?"
          description={
            <>
              <span className="font-medium text-ink">{jobToDelete.position}</span> at{" "}
              <span className="font-medium text-ink">{jobToDelete.company}</span> will be removed, along
              with its notes and interview details.
            </>
          }
          note="This can't be undone."
          confirmLabel="Delete application"
          confirmingLabel="Deleting…"
          isLoading={isDeleting}
          onConfirm={() => deleteJob(jobToDelete.id)}
          onCancel={() => setJobToDelete(null)}
        />
      )}
    </main>
  );
}

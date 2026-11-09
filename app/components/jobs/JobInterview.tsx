"use client";

import {
    useEffect,
    useState,
} from "react";

import {
    CalendarDays,
    Clock3,
    ExternalLink,
    Loader2,
    MapPin,
    Pencil,
    Trash2,
    Video,
    X,
} from "lucide-react";

import {
    api,
    ApiError,
} from "@/lib/api/client";

const INTERVIEW_TYPES = [
    "Phone",
    "Video",
    "On-site",
    "Technical",
    "HR",
    "Other",
] as const;

type InterviewType =
    (typeof INTERVIEW_TYPES)[number];

type InterviewData = {
    interviewDate: string | null;
    interviewTime: string | null;
    interviewType: string | null;
    interviewLocation: string | null;
    interviewNotes: string | null;
};

type InterviewResponse = {
    interview?: InterviewData & {
        jobId: number;
    };
};

type JobInterviewProps = {
    jobId: number;
    initialInterview: InterviewData;
};

type InterviewForm = {
    date: string;
    time: string;
    type: InterviewType | string;
    location: string;
    notes: string;
};

function formatInterviewDate(
    value: string,
) {
    return new Intl.DateTimeFormat(
        undefined,
        {
            weekday: "long",
            month: "long",
            day: "numeric",
            year: "numeric",
        },
    ).format(new Date(value));
}

function getDateInputValue(
    value: string | null,
) {
    if (!value) {
        return "";
    }

    const date = new Date(value);

    const year =
        date.getUTCFullYear();

    const month =
        String(
            date.getUTCMonth() + 1,
        ).padStart(2, "0");

    const day =
        String(
            date.getUTCDate(),
        ).padStart(2, "0");

    return `${year}-${month}-${day}`;
}

function createEmptyInterview(): InterviewData {
    return {
        interviewDate: null,
        interviewTime: null,
        interviewType: null,
        interviewLocation: null,
        interviewNotes: null,
    };
}

function createFormFromInterview(
    interview: InterviewData,
): InterviewForm {
    return {
        date: getDateInputValue(
            interview.interviewDate,
        ),

        time:
            interview.interviewTime ??
            "",

        type:
            interview.interviewType ??
            "Video",

        location:
            interview.interviewLocation ??
            "",

        notes:
            interview.interviewNotes ??
            "",
    };
}

function getRequestErrorMessage(
    error: unknown,
    fallback: string,
) {
    if (error instanceof ApiError) {
        return (
            error.message ||
            fallback
        );
    }

    if (error instanceof Error) {
        return (
            error.message ||
            fallback
        );
    }

    return fallback;
}

export default function JobInterview({
    jobId,
    initialInterview,
}: JobInterviewProps) {
    const [
        interview,
        setInterview,
    ] = useState<InterviewData>(
        initialInterview,
    );

    const [
        isModalOpen,
        setIsModalOpen,
    ] = useState(false);

    const [
        isSaving,
        setIsSaving,
    ] = useState(false);

    const [
        isDeleting,
        setIsDeleting,
    ] = useState(false);

    const [
        isDeleteConfirmOpen,
        setIsDeleteConfirmOpen,
    ] = useState(false);

    const [
        error,
        setError,
    ] = useState("");

    const [
        form,
        setForm,
    ] = useState<InterviewForm>(
        () =>
            createFormFromInterview(
                initialInterview,
            ),
    );

    const hasInterview =
        Boolean(
            interview.interviewDate,
        );

    useEffect(() => {
        if (
            !isModalOpen &&
            !isDeleteConfirmOpen
        ) {
            return;
        }

        function handleKeyDown(
            event: KeyboardEvent,
        ) {
            if (
                event.key !== "Escape" ||
                isSaving ||
                isDeleting
            ) {
                return;
            }

            if (isDeleteConfirmOpen) {
                closeDeleteConfirm();
            } else {
                closeModal();
            }
        }

        window.addEventListener(
            "keydown",
            handleKeyDown,
        );

        return () => {
            window.removeEventListener(
                "keydown",
                handleKeyDown,
            );
        };
    }, [
        isModalOpen,
        isDeleteConfirmOpen,
        isSaving,
        isDeleting,
    ]);

    function openCreateModal() {
        setForm({
            date: "",
            time: "",
            type: "Video",
            location: "",
            notes: "",
        });

        setError("");
        setIsModalOpen(true);
    }

    function openEditModal() {
        setForm(
            createFormFromInterview(
                interview,
            ),
        );

        setError("");
        setIsModalOpen(true);
    }

    function closeModal() {
        if (
            isSaving ||
            isDeleting
        ) {
            return;
        }

        setIsModalOpen(false);
        setError("");
    }

    function updateForm(
        field: keyof InterviewForm,
        value: string,
    ) {
        setForm(
            (current) => ({
                ...current,
                [field]: value,
            }),
        );
    }

    async function saveInterview() {
        if (isSaving) {
            return;
        }

        setError("");

        if (!form.date) {
            setError(
                "Please select an interview date.",
            );

            return;
        }

        if (!form.time) {
            setError(
                "Please select an interview time.",
            );

            return;
        }

        setIsSaving(true);

        try {
            const data =
                await (
                    hasInterview
                        ? api.patch<InterviewResponse>(
                              `/api/jobs/${encodeURIComponent(
                                  String(jobId),
                              )}/interview`,
                              {
                                  interviewDate:
                                      form.date,

                                  interviewTime:
                                      form.time,

                                  interviewType:
                                      form.type,

                                  interviewLocation:
                                      form.location,

                                  interviewNotes:
                                      form.notes,
                              },
                          )
                        : api.post<InterviewResponse>(
                              `/api/jobs/${encodeURIComponent(
                                  String(jobId),
                              )}/interview`,
                              {
                                  interviewDate:
                                      form.date,

                                  interviewTime:
                                      form.time,

                                  interviewType:
                                      form.type,

                                  interviewLocation:
                                      form.location,

                                  interviewNotes:
                                      form.notes,
                              },
                          )
                );

            if (!data.interview) {
                throw new Error(
                    "We couldn't save the interview. Please try again.",
                );
            }

            setInterview({
                interviewDate:
                    data.interview
                        .interviewDate,

                interviewTime:
                    data.interview
                        .interviewTime,

                interviewType:
                    data.interview
                        .interviewType,

                interviewLocation:
                    data.interview
                        .interviewLocation,

                interviewNotes:
                    data.interview
                        .interviewNotes,
            });

            setIsModalOpen(false);
        } catch (requestError) {
            setError(
                getRequestErrorMessage(
                    requestError,
                    "We couldn't save the interview. Please try again.",
                ),
            );
        } finally {
            setIsSaving(false);
        }
    }

    function openDeleteConfirm() {
        if (
            isDeleting ||
            !hasInterview
        ) {
            return;
        }

        setError("");
        setIsDeleteConfirmOpen(true);
    }

    function closeDeleteConfirm() {
        if (isDeleting) {
            return;
        }

        setIsDeleteConfirmOpen(false);
    }

    async function deleteInterview() {
        if (
            isDeleting ||
            !hasInterview
        ) {
            return;
        }

        setIsDeleting(true);
        setError("");

        try {
            await api.delete(
                `/api/jobs/${encodeURIComponent(
                    String(jobId),
                )}/interview`,
            );

            setInterview(
                createEmptyInterview(),
            );

            setIsDeleteConfirmOpen(false);
        } catch (requestError) {
            setError(
                getRequestErrorMessage(
                    requestError,
                    "We couldn't delete the interview. Please try again.",
                ),
            );
        } finally {
            setIsDeleting(false);
        }
    }

    return (
        <>
            <section className="rounded-2xl border border-line bg-surface">
                {/* Header */}
                <div className="flex items-center justify-between gap-4 border-b border-line px-5 py-4">
                    <div>
                        <h2 className="text-base font-semibold text-ink">
                            Interview
                        </h2>

                        <p className="mt-1 text-sm text-muted">
                            Keep track of your
                            upcoming interview.
                        </p>
                    </div>

                    {!hasInterview && (
                        <button
                            type="button"
                            onClick={
                                openCreateModal
                            }
                            className="inline-flex items-center gap-2 rounded-lg bg-ink px-3.5 py-2 text-sm font-medium text-on-accent transition-colors hover:bg-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
                        >
                            <CalendarDays className="h-4 w-4" />

                            Schedule interview
                        </button>
                    )}
                </div>

                {/* Interview content */}
                <div className="p-5">
                    {hasInterview ? (
                        <div className="space-y-5">
                            <div className="grid gap-4 sm:grid-cols-2">
                                {/* Date */}
                                <div className="flex items-start gap-3">
                                    <div className="rounded-lg bg-accent-soft p-2 text-accent">
                                        <CalendarDays className="h-4 w-4" />
                                    </div>

                                    <div>
                                        <p className="text-xs font-medium uppercase tracking-wide text-muted">
                                            Date
                                        </p>

                                        <p className="mt-1 text-sm font-medium text-ink">
                                            {formatInterviewDate(
                                                interview.interviewDate!,
                                            )}
                                        </p>
                                    </div>
                                </div>

                                {/* Time */}
                                <div className="flex items-start gap-3">
                                    <div className="rounded-lg bg-accent-soft p-2 text-accent">
                                        <Clock3 className="h-4 w-4" />
                                    </div>

                                    <div>
                                        <p className="text-xs font-medium uppercase tracking-wide text-muted">
                                            Time
                                        </p>

                                        <p className="mt-1 text-sm font-medium text-ink">
                                            {
                                                interview.interviewTime
                                            }
                                        </p>
                                    </div>
                                </div>

                                {/* Type */}
                                {interview.interviewType && (
                                    <div className="flex items-start gap-3">
                                        <div className="rounded-lg bg-accent-soft p-2 text-accent">
                                            <Video className="h-4 w-4" />
                                        </div>

                                        <div>
                                            <p className="text-xs font-medium uppercase tracking-wide text-muted">
                                                Type
                                            </p>

                                            <p className="mt-1 text-sm font-medium text-ink">
                                                {
                                                    interview.interviewType
                                                }
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {/* Location */}
                                {interview.interviewLocation && (
                                    <div className="flex items-start gap-3">
                                        <div className="rounded-lg bg-accent-soft p-2 text-accent">
                                            <MapPin className="h-4 w-4" />
                                        </div>

                                        <div className="min-w-0">
                                            <p className="text-xs font-medium uppercase tracking-wide text-muted">
                                                Location
                                            </p>

                                            <p className="mt-1 break-words text-sm font-medium text-ink">
                                                {
                                                    interview.interviewLocation
                                                }
                                            </p>

                                            {interview.interviewLocation.startsWith(
                                                "http",
                                            ) && (
                                                <a
                                                    href={
                                                        interview.interviewLocation
                                                    }
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-accent hover:underline"
                                                >
                                                    Open link

                                                    <ExternalLink className="h-3 w-3" />
                                                </a>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Notes */}
                            {interview.interviewNotes && (
                                <div className="rounded-lg bg-canvas px-4 py-3">
                                    <p className="text-xs font-medium uppercase tracking-wide text-muted">
                                        Notes
                                    </p>

                                    <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-ink-2">
                                        {
                                            interview.interviewNotes
                                        }
                                    </p>
                                </div>
                            )}

                            {/* Error */}
                            {error && (
                                <div
                                    role="alert"
                                    className="rounded-lg border border-rejected-line bg-rejected-soft px-4 py-3 text-sm leading-5 text-rejected"
                                >
                                    {error}
                                </div>
                            )}

                            {/* Actions */}
                            <div className="flex flex-wrap items-center gap-2 border-t border-line pt-4">
                                <button
                                    type="button"
                                    onClick={
                                        openEditModal
                                    }
                                    disabled={
                                        isDeleting
                                    }
                                    className="inline-flex items-center gap-2 rounded-lg border border-line px-3.5 py-2 text-sm font-medium text-ink transition-colors hover:bg-canvas focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/30 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    <Pencil className="h-4 w-4" />

                                    Edit interview
                                </button>

                                <button
                                    type="button"
                                    onClick={
                                        openDeleteConfirm
                                    }
                                    disabled={
                                        isDeleting
                                    }
                                    className="inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium text-rejected transition-colors hover:bg-rejected-soft focus:outline-none focus-visible:ring-2 focus-visible:ring-rejected/30 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    {isDeleting ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                        <Trash2 className="h-4 w-4" />
                                    )}

                                    {isDeleting
                                        ? "Deleting..."
                                        : "Delete interview"}
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="py-6 text-center">
                            <CalendarDays className="mx-auto h-8 w-8 text-faint" />

                            <p className="mt-3 text-sm font-medium text-ink-2">
                                No interview scheduled.
                            </p>

                            <p className="mt-1 text-sm text-muted">
                                Add one when you
                                have an interview
                                coming up.
                            </p>
                        </div>
                    )}
                </div>
            </section>

            {/* Schedule / Edit Interview Modal */}
            {isModalOpen && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-ink/30 px-4 py-6 backdrop-blur-[2px]"
                    onMouseDown={(
                        event,
                    ) => {
                        if (
                            event.target ===
                                event.currentTarget &&
                            !isSaving &&
                            !isDeleting
                        ) {
                            closeModal();
                        }
                    }}
                >
                    <div
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="interview-modal-title"
                        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-line bg-surface shadow-xl"
                    >
                        {/* Modal header */}
                        <div className="flex items-start justify-between gap-4 border-b border-line px-5 py-4">
                            <div>
                                <h2
                                    id="interview-modal-title"
                                    className="text-lg font-semibold text-ink"
                                >
                                    {hasInterview
                                        ? "Edit interview"
                                        : "Schedule interview"}
                                </h2>

                                <p className="mt-1 text-sm text-muted">
                                    Add the details
                                    for this
                                    interview.
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={
                                    closeModal
                                }
                                disabled={
                                    isSaving
                                }
                                className="rounded-lg p-2 text-muted transition-colors hover:bg-canvas hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/30 disabled:cursor-not-allowed disabled:opacity-50"
                                aria-label="Close"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        {/* Form */}
                        <div className="space-y-5 px-5 py-5">
                            {/* Date + Time */}
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div>
                                    <label
                                        htmlFor="interview-date"
                                        className="mb-2 block text-sm font-medium text-ink"
                                    >
                                        Date
                                    </label>

                                    <input
                                        id="interview-date"
                                        type="date"
                                        value={
                                            form.date
                                        }
                                        onChange={(
                                            event,
                                        ) =>
                                            updateForm(
                                                "date",
                                                event
                                                    .target
                                                    .value,
                                            )
                                        }
                                        disabled={
                                            isSaving
                                        }
                                        className="w-full rounded-lg border border-line bg-surface px-3.5 py-2.5 text-sm text-ink outline-none transition-colors focus:border-accent focus:ring-2 focus:ring-accent/10 disabled:cursor-not-allowed disabled:bg-canvas"
                                    />
                                </div>

                                <div>
                                    <label
                                        htmlFor="interview-time"
                                        className="mb-2 block text-sm font-medium text-ink"
                                    >
                                        Time
                                    </label>

                                    <input
                                        id="interview-time"
                                        type="time"
                                        value={
                                            form.time
                                        }
                                        onChange={(
                                            event,
                                        ) =>
                                            updateForm(
                                                "time",
                                                event
                                                    .target
                                                    .value,
                                            )
                                        }
                                        disabled={
                                            isSaving
                                        }
                                        className="w-full rounded-lg border border-line bg-surface px-3.5 py-2.5 text-sm text-ink outline-none transition-colors focus:border-accent focus:ring-2 focus:ring-accent/10 disabled:cursor-not-allowed disabled:bg-canvas"
                                    />
                                </div>
                            </div>

                            {/* Interview type */}
                            <div>
                                <label
                                    htmlFor="interview-type"
                                    className="mb-2 block text-sm font-medium text-ink"
                                >
                                    Interview type
                                </label>

                                <select
                                    id="interview-type"
                                    value={
                                        form.type
                                    }
                                    onChange={(
                                        event,
                                    ) =>
                                        updateForm(
                                            "type",
                                            event
                                                .target
                                                .value,
                                        )
                                    }
                                    disabled={
                                        isSaving
                                    }
                                    className="w-full rounded-lg border border-line bg-surface px-3.5 py-2.5 text-sm text-ink outline-none transition-colors focus:border-accent focus:ring-2 focus:ring-accent/10 disabled:cursor-not-allowed disabled:bg-canvas"
                                >
                                    {INTERVIEW_TYPES.map(
                                        (
                                            type,
                                        ) => (
                                            <option
                                                key={
                                                    type
                                                }
                                                value={
                                                    type
                                                }
                                            >
                                                {
                                                    type
                                                }
                                            </option>
                                        ),
                                    )}
                                </select>
                            </div>

                            {/* Location */}
                            <div>
                                <label
                                    htmlFor="interview-location"
                                    className="mb-2 block text-sm font-medium text-ink"
                                >
                                    Location or meeting link
                                </label>

                                <input
                                    id="interview-location"
                                    type="text"
                                    value={
                                        form.location
                                    }
                                    onChange={(
                                        event,
                                    ) =>
                                        updateForm(
                                            "location",
                                            event
                                                .target
                                                .value,
                                        )
                                    }
                                    disabled={
                                        isSaving
                                    }
                                    maxLength={
                                        500
                                    }
                                    placeholder="Office address or https://..."
                                    className="w-full rounded-lg border border-line bg-surface px-3.5 py-2.5 text-sm text-ink outline-none transition-colors placeholder:text-faint focus:border-accent focus:ring-2 focus:ring-accent/10 disabled:cursor-not-allowed disabled:bg-canvas"
                                />
                            </div>

                            {/* Notes */}
                            <div>
                                <label
                                    htmlFor="interview-notes"
                                    className="mb-2 block text-sm font-medium text-ink"
                                >
                                    Notes
                                </label>

                                <textarea
                                    id="interview-notes"
                                    value={
                                        form.notes
                                    }
                                    onChange={(
                                        event,
                                    ) =>
                                        updateForm(
                                            "notes",
                                            event
                                                .target
                                                .value,
                                        )
                                    }
                                    disabled={
                                        isSaving
                                    }
                                    maxLength={
                                        2000
                                    }
                                    rows={4}
                                    placeholder="Anything you want to remember..."
                                    className="w-full resize-none rounded-lg border border-line bg-surface px-3.5 py-2.5 text-sm leading-6 text-ink outline-none transition-colors placeholder:text-faint focus:border-accent focus:ring-2 focus:ring-accent/10 disabled:cursor-not-allowed disabled:bg-canvas"
                                />
                            </div>

                            {/* Error */}
                            {error && (
                                <div
                                    role="alert"
                                    className="rounded-lg border border-rejected-line bg-rejected-soft px-4 py-3 text-sm leading-5 text-rejected"
                                >
                                    {error}
                                </div>
                            )}
                        </div>

                        {/* Form actions */}
                        <div className="flex justify-end gap-2 border-t border-line px-5 py-4">
                            <button
                                type="button"
                                onClick={
                                    closeModal
                                }
                                disabled={
                                    isSaving
                                }
                                className="rounded-lg border border-line px-4 py-2 text-sm font-medium text-ink transition-colors hover:bg-canvas focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/30 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                Cancel
                            </button>

                            <button
                                type="button"
                                onClick={
                                    saveInterview
                                }
                                disabled={
                                    isSaving
                                }
                                className="inline-flex min-w-[130px] items-center justify-center gap-2 rounded-lg bg-ink px-4 py-2 text-sm font-medium text-on-accent transition-colors hover:bg-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                {isSaving && (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                )}

                                {isSaving
                                    ? "Saving..."
                                    : hasInterview
                                        ? "Save changes"
                                        : "Schedule interview"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete confirmation popup */}
            {isDeleteConfirmOpen && (
                <div
                    className="fixed inset-0 z-[60] flex items-center justify-center bg-ink/35 px-4 py-6 backdrop-blur-[3px]"
                    onMouseDown={(
                        event,
                    ) => {
                        if (
                            event.target ===
                                event.currentTarget &&
                            !isDeleting
                        ) {
                            closeDeleteConfirm();
                        }
                    }}
                >
                    <div
                        role="alertdialog"
                        aria-modal="true"
                        aria-labelledby="delete-interview-title"
                        aria-describedby="delete-interview-description"
                        className="w-full max-w-md overflow-hidden rounded-2xl border border-line bg-surface shadow-[0_24px_70px_rgba(21,24,26,0.18)]"
                    >
                        <div className="p-6">
                            {/* Warning icon + text */}
                            <div className="flex items-start gap-4">
                                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-rejected-soft text-rejected">
                                    <Trash2 className="h-5 w-5" />
                                </div>

                                <div className="min-w-0">
                                    <h2
                                        id="delete-interview-title"
                                        className="text-lg font-semibold text-ink"
                                    >
                                        Delete interview?
                                    </h2>

                                    <p
                                        id="delete-interview-description"
                                        className="mt-2 text-sm leading-6 text-ink-2"
                                    >
                                        Are you sure you
                                        want to delete
                                        this interview?
                                        This action
                                        cannot be undone.
                                    </p>
                                </div>
                            </div>

                            {/* Popup actions */}
                            <div className="mt-6 flex justify-end gap-2">
                                <button
                                    type="button"
                                    onClick={
                                        closeDeleteConfirm
                                    }
                                    disabled={
                                        isDeleting
                                    }
                                    className="rounded-lg border border-line px-4 py-2.5 text-sm font-medium text-ink transition-colors hover:bg-canvas focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/30 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    Cancel
                                </button>

                                <button
                                    type="button"
                                    onClick={
                                        deleteInterview
                                    }
                                    disabled={
                                        isDeleting
                                    }
                                    className="inline-flex min-w-[120px] items-center justify-center gap-2 rounded-lg bg-rejected px-4 py-2.5 text-sm font-medium text-on-accent transition-colors hover:bg-rejected-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-rejected/30 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    {isDeleting && (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    )}

                                    {isDeleting
                                        ? "Deleting..."
                                        : "Delete"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

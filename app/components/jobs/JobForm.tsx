"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { Check, Link2, LoaderCircle, X } from "lucide-react";

import { Job } from "@/app/types/job";
import { STATUS_META, STATUS_ORDER } from "@/lib/theme";
import { ApiError, apiRequest } from "@/lib/api/client";
import { button, cx, field } from "@/lib/ui";

export type JobFormData = {
    company: string;
    position: string;
    location: string;
    status: Job["status"];
    appliedDate: string;
    jobUrl: string;
    salary: string;
    notes: string;
};

type JobFormProps = {
    editingJob: Job | null;
    /** Prefill the link and import it right away (from the empty state). */
    initialUrl?: string;
    onSave: (jobData: JobFormData) => Promise<void>;
    onCancel: () => void;
};

type FieldErrors = Partial<Record<keyof JobFormData, string>>;

type ImportResponse = {
    source: "greenhouse" | "lever" | "ashby" | "personio" | "smartrecruiters" | "structured-data" | "ai" | "page-title";
    fields: Partial<Pick<JobFormData, "position" | "company" | "location" | "salary">>;
};

type ImportState =
    | { status: "idle" }
    | { status: "loading" }
    | { status: "done"; message: string; partial: boolean }
    | { status: "error"; message: string };

const SOURCE_LABEL: Record<ImportResponse["source"], string> = {
    greenhouse: "Greenhouse",
    lever: "Lever",
    ashby: "Ashby",
    personio: "Personio",
    smartrecruiters: "SmartRecruiters",
    "structured-data": "the job page",
    ai: "the job page (read with AI)",
    "page-title": "the page title",
};

const FIELD_LABEL: Record<string, string> = {
    position: "job title",
    company: "company",
    location: "location",
    salary: "salary",
};

function listJoin(items: string[]) {
    if (items.length <= 1) return items.join("");
    return `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;
}

function looksLikeUrl(value: string) {
    return /^https?:\/\/\S+\.\S+/i.test(value.trim());
}

const NOTES_LIMIT = 2000;

/** yyyy-mm-dd in the user's local time zone (not UTC). */
function toDateInput(date: Date) {
    const offset = date.getTimezoneOffset() * 60_000;
    return new Date(date.getTime() - offset).toISOString().slice(0, 10);
}

function initialData(job: Job | null): JobFormData {
    if (!job) {
        return {
            company: "",
            position: "",
            location: "",
            status: "Wishlist",
            appliedDate: toDateInput(new Date()),
            jobUrl: "",
            salary: "",
            notes: "",
        };
    }

    return {
        company: job.company,
        position: job.position,
        location: job.location,
        status: job.status,
        appliedDate: job.appliedDate
            ? toDateInput(new Date(job.appliedDate))
            : toDateInput(new Date()),
        jobUrl: job.jobUrl ?? "",
        salary: job.salary ?? "",
        notes: job.notes ?? "",
    };
}

function validate(data: JobFormData): FieldErrors {
    const errors: FieldErrors = {};

    if (!data.position.trim()) errors.position = "Enter the job title.";
    if (!data.company.trim()) errors.company = "Enter the company name.";
    if (!data.location.trim()) errors.location = "Enter a city, country or “Remote”.";

    const url = data.jobUrl.trim();
    if (url) {
        try {
            const parsed = new URL(url);
            if (!/^https?:$/.test(parsed.protocol)) throw new Error();
        } catch {
            errors.jobUrl = "Paste the full link, starting with https://";
        }
    }

    if (data.notes.length > NOTES_LIMIT) {
        errors.notes = `Notes can be up to ${NOTES_LIMIT} characters.`;
    }

    return errors;
}

/**
 * Create / edit form, rendered inside <Sheet>. Remount it (via `key`) to
 * switch between jobs.
 */
export default function JobForm({ editingJob, initialUrl = "", onSave, onCancel }: JobFormProps) {
    const [data, setData] = useState<JobFormData>(() => ({ ...initialData(editingJob), ...(initialUrl ? { jobUrl: initialUrl } : {}) }));
    const [errors, setErrors] = useState<FieldErrors>({});
    const [submitError, setSubmitError] = useState("");
    const [saving, setSaving] = useState(false);
    const [importState, setImportState] = useState<ImportState>({ status: "idle" });

    async function importFromLink(link: string) {
        const url = link.trim();

        if (!looksLikeUrl(url)) {
            setErrors((current) => ({ ...current, jobUrl: "Paste the full link, starting with https://" }));
            return;
        }

        setImportState({ status: "loading" });

        try {
            const result = await apiRequest<ImportResponse>("/api/jobs/import", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ url }),
            });

            // Only fill fields that are still empty, so nothing typed is overwritten.
            const filled: string[] = [];

            const updates: Partial<JobFormData> = {};
            for (const key of ["position", "company", "location", "salary"] as const) {
                const value = result.fields[key];
                if (value && !data[key].trim()) {
                    updates[key] = value;
                    filled.push(FIELD_LABEL[key]);
                }
            }

            // Merge into the latest state; never overwrite something typed meanwhile.
            setData((current) => {
                const next = { ...current };
                for (const [key, value] of Object.entries(updates) as [keyof JobFormData, string][]) {
                    if (!String(current[key]).trim()) (next as Record<string, string>)[key] = value;
                }
                return next;
            });

            setErrors((current) => ({
                ...current,
                position: undefined,
                company: undefined,
                location: undefined,
                jobUrl: undefined,
            }));

            const partial = result.source === "page-title";

            setImportState({
                status: "done",
                partial,
                message: filled.length
                    ? `Filled ${listJoin(filled)} from ${SOURCE_LABEL[result.source]}.${partial ? " Add the rest by hand." : " Check them before saving."}`
                    : "The form already had those details, so nothing was changed.",
            });
        } catch (error) {
            setImportState({
                status: "error",
                message:
                    error instanceof ApiError && error.message
                        ? error.message
                        : "That link couldn't be read. Fill the form in by hand.",
            });
        }
    }

    const isEditing = Boolean(editingJob);

    // Import the link handed over from the empty state, once.
    const autoImported = useRef(false);
    useEffect(() => {
        if (initialUrl && !autoImported.current) {
            autoImported.current = true;
            importFromLink(initialUrl);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    function update<K extends keyof JobFormData>(key: K, value: JobFormData[K]) {
        setData((current) => ({ ...current, [key]: value }));
        if (errors[key]) setErrors((current) => ({ ...current, [key]: undefined }));
        if (submitError) setSubmitError("");
    }

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        const found = validate(data);
        setErrors(found);

        const firstInvalid = Object.keys(found)[0];
        if (firstInvalid) {
            document.getElementById(`job-${firstInvalid}`)?.focus();
            return;
        }

        try {
            setSaving(true);
            setSubmitError("");

            await onSave({
                ...data,
                company: data.company.trim(),
                position: data.position.trim(),
                location: data.location.trim(),
                jobUrl: data.jobUrl.trim(),
                salary: data.salary.trim(),
                notes: data.notes.trim(),
            });
        } catch (error) {
            setSubmitError(
                error instanceof Error && error.message
                    ? error.message
                    : "The application wasn't saved. Check your connection and try again.",
            );
        } finally {
            setSaving(false);
        }
    }

    function inputProps(key: keyof JobFormData) {
        return {
            id: `job-${key}`,
            name: key,
            "aria-invalid": errors[key] ? true : undefined,
            "aria-describedby": errors[key] ? `job-${key}-error` : undefined,
            className: cx(
                field.input,
                errors[key] && "border-rejected focus:border-rejected focus:ring-rejected/15",
            ),
        };
    }

    function errorText(name: keyof JobFormData) {
        if (!errors[name]) return null;
        return (
            <p id={`job-${name}-error`} className="mt-1.5 text-xs text-rejected-ink">
                {errors[name]}
            </p>
        );
    }

    return (
        <form onSubmit={handleSubmit} noValidate className="flex h-full flex-col">
            <div className="flex items-start justify-between gap-4 border-b border-line px-5 py-4">
                <div>
                    <h2 id="job-form-title" className="text-base font-semibold text-ink">
                        {isEditing ? "Edit application" : "Add application"}
                    </h2>
                    <p className="mt-0.5 text-sm text-muted">
                        {isEditing
                            ? `${editingJob?.position} at ${editingJob?.company}`
                            : "Paste a job link to fill this in, or type the details."}
                    </p>
                </div>
                <button
                    type="button"
                    onClick={onCancel}
                    disabled={saving}
                    aria-label="Close"
                    className={button.icon}
                >
                    <X className="h-4 w-4" strokeWidth={1.75} />
                </button>
            </div>

            <fieldset disabled={saving} className="flex-1 space-y-5 overflow-y-auto px-5 py-5">
                <legend className="sr-only">Application details</legend>

                {submitError && (
                    <div role="alert" className="rounded-lg border border-rejected-line bg-rejected-soft px-3.5 py-3 text-sm text-rejected-ink">
                        {submitError}
                    </div>
                )}

                <div className="rounded-lg border border-line bg-surface-2/50 p-3.5">
                    <label htmlFor="job-jobUrl" className={field.label}>
                        Job posting link <span className="font-normal text-muted">(optional)</span>
                    </label>
                    <div className="flex gap-2">
                        <input
                            {...inputProps("jobUrl")}
                            type="url"
                            inputMode="url"
                            value={data.jobUrl}
                            onChange={(e) => {
                                update("jobUrl", e.target.value);
                                if (importState.status !== "idle" && importState.status !== "loading") {
                                    setImportState({ status: "idle" });
                                }
                            }}
                            onPaste={(e) => {
                                const pasted = e.clipboardData.getData("text");
                                const formIsEmpty = !data.position.trim() && !data.company.trim();
                                if (looksLikeUrl(pasted) && formIsEmpty && !isEditing) {
                                    // Let the paste land in the field, then import.
                                    setTimeout(() => importFromLink(pasted), 0);
                                }
                            }}
                            placeholder="https://"
                        />
                        <button
                            type="button"
                            onClick={() => importFromLink(data.jobUrl)}
                            disabled={!data.jobUrl.trim() || importState.status === "loading"}
                            className={cx(button.secondary, "h-10 shrink-0")}
                        >
                            {importState.status === "loading" ? (
                                <LoaderCircle className="h-4 w-4 animate-spin" strokeWidth={2} />
                            ) : (
                                <Link2 className="h-4 w-4" strokeWidth={1.75} />
                            )}
                            {importState.status === "loading" ? "Reading…" : "Fill from link"}
                        </button>
                    </div>

                    <div aria-live="polite">
                        {errors.jobUrl ? (
                            errorText("jobUrl")
                        ) : importState.status === "done" ? (
                            <p className={cx("mt-2 flex items-start gap-1.5 text-xs", importState.partial ? "text-interview-ink" : "text-offer-ink")}>
                                <Check className="mt-px h-3.5 w-3.5 shrink-0" strokeWidth={2.25} />
                                {importState.message}
                            </p>
                        ) : importState.status === "error" ? (
                            <p className="mt-2 text-xs text-rejected-ink">{importState.message}</p>
                        ) : (
                            <p className={field.hint}>
                                Paste a link to fill the details automatically. AI insights also use it.
                            </p>
                        )}
                    </div>
                </div>

                <div>
                    <label htmlFor="job-position" className={field.label}>
                        Job title
                    </label>
                    <input
                        {...inputProps("position")}
                        value={data.position}
                        onChange={(e) => update("position", e.target.value)}
                        placeholder="Frontend Engineer"
                        autoComplete="off"
                        maxLength={200}
                    />
                    {errorText("position")}
                </div>

                <div className="grid gap-5 sm:grid-cols-2">
                    <div>
                        <label htmlFor="job-company" className={field.label}>
                            Company
                        </label>
                        <input
                            {...inputProps("company")}
                            value={data.company}
                            onChange={(e) => update("company", e.target.value)}
                            placeholder="Acme Inc."
                            autoComplete="organization"
                            maxLength={200}
                        />
                        {errorText("company")}
                    </div>

                    <div>
                        <label htmlFor="job-location" className={field.label}>
                            Location
                        </label>
                        <input
                            {...inputProps("location")}
                            value={data.location}
                            onChange={(e) => update("location", e.target.value)}
                            placeholder="Remote, Paris…"
                            maxLength={200}
                        />
                        {errorText("location")}
                    </div>
                </div>

                <div>
                    <span id="job-status-label" className={field.label}>
                        Stage
                    </span>
                    <div
                        role="radiogroup"
                        aria-labelledby="job-status-label"
                        className="grid grid-cols-2 gap-1.5 sm:grid-cols-5"
                    >
                        {STATUS_ORDER.map((status) => {
                            const meta = STATUS_META[status];
                            const checked = data.status === status;

                            return (
                                <label
                                    key={status}
                                    className={cx(
                                        "flex h-9 cursor-pointer items-center gap-2 rounded-lg border px-2.5 text-sm transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-accent",
                                        checked
                                            ? cx(meta.bg, meta.border, meta.text, "font-medium")
                                            : "border-line text-ink-2 hover:bg-surface-2",
                                    )}
                                >
                                    <input
                                        type="radio"
                                        name="status"
                                        value={status}
                                        checked={checked}
                                        onChange={() => update("status", status)}
                                        className="sr-only"
                                    />
                                    <span
                                        aria-hidden="true"
                                        className="h-2 w-2 shrink-0 rounded-full"
                                        style={{ backgroundColor: meta.dot }}
                                    />
                                    {status}
                                </label>
                            );
                        })}
                    </div>
                </div>

                <div className="grid gap-5 sm:grid-cols-2">
                    <div>
                        <label htmlFor="job-appliedDate" className={field.label}>
                            {data.status === "Wishlist" ? "Date added" : "Date applied"}
                        </label>
                        <input
                            {...inputProps("appliedDate")}
                            type="date"
                            value={data.appliedDate}
                            onChange={(e) => update("appliedDate", e.target.value)}
                        />
                    </div>

                    <div>
                        <label htmlFor="job-salary" className={field.label}>
                            Salary <span className="font-normal text-muted">(optional)</span>
                        </label>
                        <input
                            {...inputProps("salary")}
                            value={data.salary}
                            onChange={(e) => update("salary", e.target.value)}
                            placeholder="€55k–65k"
                            maxLength={100}
                        />
                    </div>
                </div>

                <div>
                    <div className="flex items-baseline justify-between">
                        <label htmlFor="job-notes" className={field.label}>
                            Notes <span className="font-normal text-muted">(optional)</span>
                        </label>
                        <span
                            className={cx(
                                "text-xs tabular-nums",
                                data.notes.length > NOTES_LIMIT ? "text-rejected-ink" : "text-faint",
                            )}
                        >
                            {data.notes.length}/{NOTES_LIMIT}
                        </span>
                    </div>
                    <textarea
                        id="job-notes"
                        name="notes"
                        rows={5}
                        value={data.notes}
                        onChange={(e) => update("notes", e.target.value)}
                        placeholder="Referral, recruiter name, what stood out…"
                        aria-invalid={errors.notes ? true : undefined}
                        className={cx(field.textarea, "resize-y")}
                    />
                    {errorText("notes")}
                </div>
            </fieldset>

            <div className="flex items-center justify-end gap-2 border-t border-line bg-surface px-5 py-3.5">
                <button type="button" onClick={onCancel} disabled={saving} className={button.ghost}>
                    Cancel
                </button>
                <button type="submit" disabled={saving} className={button.primary}>
                    {saving ? "Saving…" : isEditing ? "Save changes" : "Add application"}
                </button>
            </div>
        </form>
    );
}

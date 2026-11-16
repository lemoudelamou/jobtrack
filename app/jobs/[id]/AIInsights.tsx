"use client";

import { serif } from "@/lib/fonts";

import {
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";
import {
    AlertTriangle,
    Briefcase,
    Check,
    Copy,
    Download,
    FileText,
    HelpCircle,
    Lightbulb,
    MessageCircle,
    Sparkles,
    Target,
    TrendingUp,
    Upload,
} from "lucide-react";

import {
    parseInsights,
    parseMatchMetrics,
    stripMarkdown,
} from "@/lib/ai/insights/parser";

import {
    formatInlineText,
    parseFormattedText,
} from "@/lib/ai/insights/formatter";

import type {
    InsightSections,
    ResumeInfo,
} from "@/lib/ai/insights/types";

import {
    api,
    apiRequest,
    ApiError,
} from "@/lib/api/client";

type SavedInsight = {
    content: string;
    generatedAt: string;
    outdated: { job: boolean; cv: boolean };
};

function formatSavedDate(iso: string) {
    return new Intl.DateTimeFormat("en", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }).format(new Date(iso));
}

const MAX_RESUME_SIZE = 5 * 1024 * 1024;
const MAX_RESUME_SIZE_MB = 5;
const PDF_MIME_TYPE = "application/pdf";


type AIInsightsProps = {
    jobId: number;
};

type SectionProps = {
    title: string;
    description?: string;
    icon: React.ReactNode;
    tone?: "green" | "purple" | "blue" | "gold" | "red" | "neutral";
    children: React.ReactNode;
};

const toneStyles = {
    green: {
        icon: "bg-accent-soft text-accent",
        border: "border-accent-soft",
        glow: "hover:border-accent-line",
    },
    purple: {
        icon: "bg-applied-soft text-applied",
        border: "border-applied-line",
        glow: "hover:border-applied-line",
    },
    blue: {
        icon: "bg-applied-soft text-applied-ink",
        border: "border-applied-line",
        glow: "hover:border-applied-line",
    },
    gold: {
        icon: "bg-interview-soft text-interview-ink",
        border: "border-interview-line",
        glow: "hover:border-interview",
    },
    red: {
        icon: "bg-rejected-soft text-rejected-ink",
        border: "border-rejected-line",
        glow: "hover:border-rejected",
    },
    neutral: {
        icon: "bg-surface-2 text-ink-2",
        border: "border-line",
        glow: "hover:border-line",
    },
} as const;

function Section({
    title,
    description,
    icon,
    tone = "neutral",
    children,
}: SectionProps) {
    const styles = toneStyles[tone];

    return (
        <section
            className={`group relative overflow-hidden rounded-[22px] border bg-surface p-5 shadow-[0_10px_30px_-24px_rgba(20,24,26,0.35)] transition-all duration-300 ${styles.border} ${styles.glow} hover:-translate-y-0.5 hover:shadow-[0_18px_40px_-28px_rgba(20,24,26,0.4)] sm:p-6`}
        >
            <div
                aria-hidden="true"
                className="pointer-events-none absolute right-0 top-0 h-28 w-28 rounded-bl-full bg-canvas opacity-70 transition-transform duration-500 group-hover:scale-125"
            />

            <div className="relative">
                <div className="mb-6 flex items-center gap-3">
                    <div
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-105 ${styles.icon}`}
                    >
                        {icon}
                    </div>

                    <div>
                        <h2 className="text-sm font-semibold text-ink">
                            {title}
                        </h2>

                        {description ? (
                            <p className="mt-0.5 text-xs text-muted">
                                {description}
                            </p>
                        ) : null}
                    </div>
                </div>

                {children}
            </div>
        </section>
    );
}

function FormattedText({
    text,
}: {
    text: string;
}) {
    const blocks = useMemo(
        () => parseFormattedText(text),
        [text],
    );

    if (!text.trim()) {
        return null;
    }

    return (
        <div className="space-y-3 text-sm leading-7 text-ink-2">
            {blocks.map((block, index) => {
                if (block.type === "heading") {
                    return (
                        <h3
                            key={index}
                            className="pt-2 text-sm font-semibold text-ink"
                        >
                            {block.value}
                        </h3>
                    );
                }

                if (block.type === "bullet") {
                    return (
                        <div
                            key={index}
                            className="flex gap-3"
                        >
                            <span className="mt-[11px] h-1.5 w-1.5 shrink-0 rounded-full bg-faint" />

                            <p className="min-w-0">
                                {formatInlineText(
                                    block.value,
                                ).map(
                                    (
                                        part,
                                        partIndex,
                                    ) =>
                                        part.startsWith(
                                            "**",
                                        ) &&
                                            part.endsWith(
                                                "**",
                                            ) ? (
                                            <strong
                                                key={
                                                    partIndex
                                                }
                                                className="font-semibold text-ink"
                                            >
                                                {part.slice(
                                                    2,
                                                    -2,
                                                )}
                                            </strong>
                                        ) : (
                                            <span
                                                key={
                                                    partIndex
                                                }
                                            >
                                                {part}
                                            </span>
                                        ),
                                )}
                            </p>
                        </div>
                    );
                }

                if (block.type === "number") {
                    return (
                        <div
                            key={index}
                            className="flex gap-3"
                        >
                            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-surface-2 text-[11px] font-semibold text-ink-2">
                                {block.number}
                            </span>

                            <p className="min-w-0">
                                {formatInlineText(
                                    block.value,
                                ).map(
                                    (
                                        part,
                                        partIndex,
                                    ) =>
                                        part.startsWith(
                                            "**",
                                        ) &&
                                            part.endsWith(
                                                "**",
                                            ) ? (
                                            <strong
                                                key={
                                                    partIndex
                                                }
                                                className="font-semibold text-ink"
                                            >
                                                {part.slice(
                                                    2,
                                                    -2,
                                                )}
                                            </strong>
                                        ) : (
                                            <span
                                                key={
                                                    partIndex
                                                }
                                            >
                                                {part}
                                            </span>
                                        ),
                                )}
                            </p>
                        </div>
                    );
                }

                return (
                    <p key={index}>
                        {formatInlineText(
                            block.value,
                        ).map(
                            (
                                part,
                                partIndex,
                            ) =>
                                part.startsWith(
                                    "**",
                                ) &&
                                    part.endsWith(
                                        "**",
                                    ) ? (
                                    <strong
                                        key={
                                            partIndex
                                        }
                                        className="font-semibold text-ink"
                                    >
                                        {part.slice(
                                            2,
                                            -2,
                                        )}
                                    </strong>
                                ) : (
                                    <span
                                        key={
                                            partIndex
                                        }
                                    >
                                        {part}
                                    </span>
                                ),
                        )}
                    </p>
                );
            })}
        </div>
    );
}

function EmptyState({
    message,
}: {
    message: string;
}) {
    return (
        <div className="rounded-xl border border-dashed border-line bg-canvas p-6 text-center">
            <p className="text-sm text-muted">
                {message}
            </p>
        </div>
    );
}

function ScoreCard({
    label,
    value,
}: {
    label: string;
    value: number | null;
}) {
    const percentage = Math.min(
        Math.max(value ?? 0, 0),
        100,
    );

    return (
        <div className="group/score rounded-2xl border border-line bg-canvas p-4 transition-all duration-300 hover:-translate-y-0.5 hover:border-accent-line hover:bg-surface hover:shadow-[0_12px_25px_-22px_rgba(20,24,26,0.45)]">
            <div className="mb-3 flex items-center justify-between gap-3">
                <span className="text-xs font-medium text-muted">
                    {label}
                </span>

                <span className="text-sm font-semibold text-ink">
                    {value !== null
                        ? `${value}%`
                        : "—"}
                </span>
            </div>

            <div className="h-1.5 overflow-hidden rounded-full bg-surface-2">
                <div
                    className="h-full rounded-full bg-accent transition-all duration-700 ease-out"
                    style={{
                        width: `${percentage}%`,
                    }}
                />
            </div>
        </div>
    );
}

function MatchRing({
    value,
}: {
    value: number | null;
}) {
    const radius = 44;
    const circumference = 2 * Math.PI * radius;
    const percentage = Math.min(
        Math.max(value ?? 0, 0),
        100,
    );
    const offset =
        circumference -
        (percentage / 100) * circumference;

    return (
        <div className="relative h-32 w-32 shrink-0">
            <svg
                viewBox="0 0 104 104"
                className="h-full w-full -rotate-90"
                aria-hidden="true"
            >
                <circle
                    cx="52"
                    cy="52"
                    r={radius}
                    fill="none"
                    stroke="var(--color-surface-2)"
                    strokeWidth="8"
                />

                <circle
                    cx="52"
                    cy="52"
                    r={radius}
                    fill="none"
                    stroke="var(--color-accent)"
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    className="transition-all duration-1000 ease-out"
                />
            </svg>

            <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-semibold tracking-tight text-accent-ink">
                    {value !== null
                        ? `${value}%`
                        : "—"}
                </span>

                <span className="mt-0.5 text-[10px] font-medium uppercase tracking-[0.12em] text-muted">
                    match
                </span>
            </div>
        </div>
    );
}

export default function AIInsights({
    jobId,
}: AIInsightsProps) {
    const [insights, setInsights] = useState("");
    const [generatedAt, setGeneratedAt] = useState<string | null>(null);
    const [outdated, setOutdated] = useState<{ job: boolean; cv: boolean } | null>(null);
    const [loadingSaved, setLoadingSaved] = useState(true);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [copied, setCopied] = useState(false);

    const [resume, setResume] =
        useState<ResumeInfo | null>(null);

    const [selectedFile, setSelectedFile] =
        useState<File | null>(null);

    const [uploadingResume, setUploadingResume] =
        useState(false);

    const [downloadingPdf, setDownloadingPdf] =
        useState(false);

    const fileInputRef =
        useRef<HTMLInputElement>(null);

    const uploadControllerRef =
        useRef<AbortController | null>(null);

    const generateControllerRef =
        useRef<AbortController | null>(null);

    const copyTimeoutRef =
        useRef<ReturnType<typeof setTimeout> | null>(
            null,
        );

    const parsedInsights: InsightSections | null =
        useMemo(
            () =>
                insights
                    ? parseInsights(insights)
                    : null,
            [insights],
        );

    const matchMetrics = useMemo(
        () =>
            parseMatchMetrics(
                parsedInsights?.matchScore ?? "",
            ),
        [parsedInsights?.matchScore],
    );

   useEffect(() => {
    const controller = new AbortController();

    async function loadResume() {
        try {
            const data =
                await api.get<{
                    resume?: ResumeInfo | null;
                }>("/api/resume", {
                    signal: controller.signal,
                });

            if (data.resume) {
                setResume(data.resume);
            }
        } catch (err) {
            if (
                err instanceof DOMException &&
                err.name === "AbortError"
            ) {
                return;
            }

            if (err instanceof ApiError) {
                console.error(
                    "Failed to load resume:",
                    err.status,
                    err.message,
                );
            } else {
                console.error(
                    "Failed to load resume:",
                    err,
                );
            }
        }
    }

    // Saved insights for this job: shown right away, no AI call.
    async function loadSaved() {
        try {
            const data = await api.get<{ saved: SavedInsight | null }>(
                `/api/ai/insights?jobId=${jobId}`,
                { signal: controller.signal },
            );
            if (data.saved) applySaved(data.saved);
        } catch (err) {
            if (err instanceof DOMException && err.name === "AbortError") return;
            console.error("Failed to load saved insights:", err);
        } finally {
            if (!controller.signal.aborted) setLoadingSaved(false);
        }
    }

    loadResume();
    loadSaved();

    return () => {
        controller.abort();
    };
}, [jobId]);

    function applySaved(saved: SavedInsight) {
        setInsights(saved.content);
        setGeneratedAt(saved.generatedAt);
        setOutdated(saved.outdated);
    }

    useEffect(() => {
        return () => {
            uploadControllerRef.current?.abort();
            generateControllerRef.current?.abort();

            if (copyTimeoutRef.current) {
                clearTimeout(
                    copyTimeoutRef.current,
                );
            }
        };
    }, []);

    function handleFileChange(
        event: React.ChangeEvent<HTMLInputElement>,
    ) {
        const file =
            event.target.files?.[0];

        if (!file) {
            setSelectedFile(null);
            return;
        }

        if (file.type !== PDF_MIME_TYPE) {
            setError(
                "Please select a PDF file.",
            );
            setSelectedFile(null);
            event.target.value = "";
            return;
        }

        if (file.size > MAX_RESUME_SIZE) {
            setError(
                `Resume must be smaller than ${MAX_RESUME_SIZE_MB}MB.`,
            );
            setSelectedFile(null);
            event.target.value = "";
            return;
        }

        setError("");
        setSelectedFile(file);
    }

   async function uploadResume() {
    if (!selectedFile) {
        setError(
            "Please select a resume first.",
        );
        return;
    }

    uploadControllerRef.current?.abort();

    const controller =
        new AbortController();

    uploadControllerRef.current =
        controller;

    setUploadingResume(true);
    setError("");

    try {
        const formData =
            new FormData();

        formData.append(
            "file",
            selectedFile,
        );

        const data =
            await apiRequest<{
                resume?: ResumeInfo | null;
            }>("/api/resume", {
                method: "POST",
                body: formData,
                signal: controller.signal,
            });

        setResume(
            data.resume ?? null,
        );

        setSelectedFile(null);

        if (fileInputRef.current) {
            fileInputRef.current.value =
                "";
        }
    } catch (err) {
        if (
            err instanceof DOMException &&
            err.name === "AbortError"
        ) {
            return;
        }

        setError(
            err instanceof ApiError
                ? err.message
                : err instanceof Error
                    ? err.message
                    : "Failed to upload resume.",
        );
    } finally {
        if (
            uploadControllerRef.current ===
            controller
        ) {
            uploadControllerRef.current =
                null;

            setUploadingResume(false);
        }
    }
}

  async function generateInsights(regenerate = false) {
    generateControllerRef.current?.abort();

    const controller =
        new AbortController();

    generateControllerRef.current =
        controller;

    setLoading(true);
    setError("");

    try {
        const data =
            await api.post<{
                saved?: SavedInsight;
            }>(
                "/api/ai/insights",
                {
                    jobId,
                    regenerate,
                },
                {
                    signal:
                        controller.signal,
                },
            );

        if (data.saved) applySaved(data.saved);
    } catch (err) {
        if (
            err instanceof DOMException &&
            err.name === "AbortError"
        ) {
            return;
        }

        setError(
            err instanceof ApiError
                ? err.message
                : err instanceof Error
                    ? err.message
                    : "Failed to generate AI insights.",
        );
    } finally {
        if (
            generateControllerRef.current ===
            controller
        ) {
            generateControllerRef.current =
                null;

            setLoading(false);
        }
    }
}

    async function copyCoverLetter() {
        const coverLetter =
            parsedInsights?.coverLetter;

        if (!coverLetter) {
            return;
        }

        try {
            await navigator.clipboard.writeText(
                stripMarkdown(
                    coverLetter,
                ),
            );

            setCopied(true);

            if (copyTimeoutRef.current) {
                clearTimeout(
                    copyTimeoutRef.current,
                );
            }

            copyTimeoutRef.current =
                setTimeout(() => {
                    setCopied(false);
                }, 2000);
        } catch (err) {
            console.error(
                "Failed to copy cover letter:",
                err,
            );

            setError(
                "Could not copy the cover letter.",
            );
        }
    }

    async function downloadPDF() {
        if (!parsedInsights) {
            return;
        }

        setDownloadingPdf(true);
        setError("");

        try {
            const { default: JsPDF } =
                await import("jspdf");

            const pdf = new JsPDF();

            const margin = 20;
            const pageWidth =
                pdf.internal.pageSize.getWidth();
            const pageHeight =
                pdf.internal.pageSize.getHeight();

            const contentWidth =
                pageWidth - margin * 2;

            let y = margin;

            pdf.setFontSize(18);
            pdf.text(
                "AI Job Insights",
                margin,
                y,
            );

            y += 12;

            const addSection = (
                title: string,
                content: string,
            ) => {
                if (!content.trim()) {
                    return;
                }

                if (
                    y >
                    pageHeight - 35
                ) {
                    pdf.addPage();
                    y = margin;
                }

                pdf.setFontSize(13);
                pdf.setFont(
                    "helvetica",
                    "bold",
                );

                pdf.text(
                    title,
                    margin,
                    y,
                );

                y += 8;

                pdf.setFontSize(10);
                pdf.setFont(
                    "helvetica",
                    "normal",
                );

                const lines =
                    pdf.splitTextToSize(
                        stripMarkdown(
                            content,
                        ),
                        contentWidth,
                    );

                for (const line of lines) {
                    if (
                        y >
                        pageHeight - margin
                    ) {
                        pdf.addPage();
                        y = margin;
                    }

                    pdf.text(
                        line,
                        margin,
                        y,
                    );

                    y += 5;
                }

                y += 7;
            };

            addSection(
                "Match Score",
                parsedInsights.matchScore,
            );

            addSection(
                "Job Analysis",
                parsedInsights.jobAnalysis,
            );

            addSection(
                "Skills",
                parsedInsights.skills,
            );

            addSection(
                "Keywords",
                parsedInsights.keywords,
            );

            addSection(
                "Gaps",
                parsedInsights.gaps,
            );

            addSection(
                "Cover Letter",
                parsedInsights.coverLetter,
            );

            addSection(
                "Interview Prep",
                parsedInsights.interviewPrep,
            );

            addSection(
                "Questions to Ask",
                parsedInsights.questions,
            );

            addSection(
                "Final Advice",
                parsedInsights.finalAdvice,
            );

            pdf.save(
                `job-insights-${jobId}.pdf`,
            );
        } catch (err) {
            console.error(
                "Failed to generate PDF:",
                err,
            );

            setError(
                "Could not generate the PDF.",
            );
        } finally {
            setDownloadingPdf(false);
        }
    }

    return (
        <div className="space-y-5">
            {/* AI workspace intro */}
            <div className="relative overflow-hidden rounded-[24px] border border-line bg-canvas p-5 sm:p-6">
                <div
                    aria-hidden="true"
                    className="absolute right-0 top-0 h-36 w-36 rounded-bl-full bg-accent-soft/70"
                />

                <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex items-start gap-4">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-accent text-on-accent shadow-[0_10px_25px_-12px_rgba(var(--accent-rgb),0.7)]">
                            <Sparkles className="h-5 w-5" />
                        </div>

                        <div>
                            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
                                AI workspace
                            </p>

                            <h2 className="mt-1 text-lg font-semibold tracking-tight text-ink">
                                Understand your fit
                            </h2>

                            <p className="mt-1 max-w-xl text-sm leading-6 text-muted">
                                Compare your resume with this
                                role and turn the analysis into
                                actionable preparation.
                            </p>
                        </div>
                    </div>

                    {parsedInsights ? (
                        <button
                            type="button"
                            onClick={
                                downloadPDF
                            }
                            disabled={
                                downloadingPdf
                            }
                            className="inline-flex items-center justify-center gap-2 rounded-xl border border-line bg-surface px-4 py-2.5 text-sm font-semibold text-ink-2 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-line hover:text-accent hover:shadow-[0_10px_20px_-15px_rgba(20,24,26,0.4)] disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            <Download className="h-4 w-4" />

                            {downloadingPdf
                                ? "Creating PDF..."
                                : "Download PDF"}
                        </button>
                    ) : null}
                </div>
            </div>

            {/* Resume */}
            <section className="group relative overflow-hidden rounded-[22px] border border-line bg-surface p-5 shadow-[0_10px_30px_-24px_rgba(20,24,26,0.35)] transition-all duration-300 hover:border-line hover:shadow-[0_18px_40px_-28px_rgba(20,24,26,0.4)] sm:p-6">
                <div
                    aria-hidden="true"
                    className="absolute right-0 top-0 h-28 w-28 rounded-bl-full bg-canvas transition-transform duration-500 group-hover:scale-125"
                />

                <div className="relative">
                    <div className="mb-5 flex items-start gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-surface-2 text-ink-2 transition-transform duration-300 group-hover:scale-105">
                            <FileText className="h-5 w-5" />
                        </div>

                        <div>
                            <h2 className="text-sm font-semibold text-ink">
                                Resume
                            </h2>

                            <p className="mt-0.5 text-xs text-muted">
                                Upload your resume to personalize
                                the analysis.
                            </p>
                        </div>
                    </div>

                    {resume ? (
                        <div className="flex flex-col gap-4 rounded-2xl border border-line bg-canvas p-4 transition-all duration-300 hover:border-line sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex min-w-0 items-center gap-3">
                                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent-soft text-accent">
                                    <FileText className="h-4 w-4" />
                                </span>

                                <div className="min-w-0">
                                    <p className="truncate text-sm font-semibold text-ink">
                                        {
                                            resume.fileName
                                        }
                                    </p>

                                    {resume.textLength ? (
                                        <p className="mt-0.5 text-xs text-muted">
                                            {resume.textLength.toLocaleString()}{" "}
                                            characters
                                        </p>
                                    ) : null}
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={() =>
                                    fileInputRef.current?.click()
                                }
                                className="inline-flex items-center justify-center gap-2 rounded-xl border border-line bg-surface px-4 py-2 text-sm font-semibold text-ink-2 transition-all duration-200 hover:-translate-y-0.5 hover:border-line hover:text-accent hover:shadow-sm"
                            >
                                <Upload className="h-4 w-4" />
                                Replace
                            </button>
                        </div>
                    ) : (
                        <button
                            type="button"
                            onClick={() =>
                                fileInputRef.current?.click()
                            }
                            className="w-full rounded-2xl border border-dashed border-line bg-canvas p-7 text-center transition-all duration-300 hover:border-line-strong hover:bg-canvas"
                        >
                            <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-surface-2 text-muted transition-transform duration-300 group-hover:scale-105">
                                <Upload className="h-5 w-5" />
                            </span>

                            <p className="mt-3 text-sm font-semibold text-ink-2">
                                Upload your resume
                            </p>

                            <p className="mt-1 text-xs text-muted">
                                PDF only · Maximum{" "}
                                {MAX_RESUME_SIZE_MB}MB
                            </p>
                        </button>
                    )}

                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="application/pdf"
                        onChange={handleFileChange}
                        className="hidden"
                    />

                    {selectedFile ? (
                        <div className="mt-4 flex flex-col gap-3 rounded-2xl border border-line bg-canvas p-4 sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex min-w-0 items-center gap-3">
                                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-surface text-ink-2 shadow-sm">
                                    <FileText className="h-4 w-4" />
                                </span>

                                <p className="truncate text-sm font-medium text-ink-2">
                                    {
                                        selectedFile.name
                                    }
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={
                                    uploadResume
                                }
                                disabled={
                                    uploadingResume
                                }
                                className="inline-flex items-center justify-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-on-accent shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-accent hover:shadow-[0_12px_24px_-14px_rgba(var(--accent-rgb),0.8)] disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                <Upload className="h-4 w-4" />

                                {uploadingResume
                                    ? "Uploading..."
                                    : "Upload Resume"}
                            </button>
                        </div>
                    ) : null}
                </div>
            </section>

            {/* Generate */}
            <section className="relative overflow-hidden rounded-[22px] border border-line bg-accent p-5 text-on-accent shadow-[0_18px_45px_-28px_rgba(var(--accent-rgb),0.6)] sm:p-6">
                <div
                    aria-hidden="true"
                    className="absolute -right-10 -top-16 h-48 w-48 rounded-full border border-white/10 bg-surface/[0.03]"
                />

                <div
                    aria-hidden="true"
                    className="absolute -bottom-20 left-[45%] h-36 w-36 rounded-full bg-accent-line/10 blur-2xl"
                />

                <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-start gap-3">
                        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/10 text-on-accent ring-1 ring-white/10">
                            <Sparkles className="h-5 w-5" />
                        </span>

                        <div>
                            <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-accent">
                                Ready when you are
                            </p>

                            <h2 className="mt-1 text-base font-semibold text-on-accent">
                                {insights ? "Your insights are saved" : "Analyze this application"}
                            </h2>

                            <p className="mt-1 max-w-xl text-sm leading-6 text-on-accent">
                                {insights && generatedAt
                                    ? `Generated ${formatSavedDate(generatedAt)}. They stay here, so opening this job again doesn't use the AI.`
                                    : "Generate a personalized breakdown of your strengths, gaps, keywords, and interview preparation. It's saved with this application."}
                            </p>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={() => generateInsights(Boolean(insights))}
                        disabled={
                            loading || loadingSaved || !resume
                        }
                        aria-busy={loading}
                        className="group inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-surface px-5 py-3 text-sm font-semibold text-accent shadow-[0_12px_25px_-14px_rgba(0,0,0,0.5)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-canvas hover:shadow-[0_16px_30px_-14px_rgba(0,0,0,0.5)] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        <Sparkles className="h-4 w-4 transition-transform duration-300 group-hover:rotate-12" />

                        {loading
                            ? "Analyzing…"
                            : insights
                              ? "Regenerate"
                              : "Generate insights"}
                    </button>
                </div>

                {insights && outdated && (outdated.job || outdated.cv) ? (
                    <p role="status" className="relative mt-4 rounded-xl bg-white/10 px-3 py-2 text-xs leading-5 text-on-accent">
                        {outdated.job && outdated.cv
                            ? "You changed this job's details and uploaded a new CV since these were generated."
                            : outdated.cv
                              ? "You uploaded a new CV since these were generated."
                              : "You changed this job's details since these were generated."}{" "}
                        Regenerate to bring them up to date.
                    </p>
                ) : null}

                {!resume ? (
                    <p className="relative mt-4 text-xs text-accent">
                        Upload a resume above before generating
                        insights.
                    </p>
                ) : null}
            </section>

            {/* Loading */}
            {loading ? (
                <div
                    role="status"
                    aria-live="polite"
                    className="rounded-[22px] border border-line bg-surface p-5 shadow-[0_10px_30px_-24px_rgba(20,24,26,0.35)] sm:p-6"
                >
                    <div className="flex items-center gap-4">
                        <div className="relative flex h-10 w-10 items-center justify-center">
                            <span className="absolute inset-0 animate-ping rounded-xl bg-accent-soft" />
                            <span className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-accent-soft text-accent">
                                <Sparkles className="h-4 w-4" />
                            </span>
                        </div>

                        <div>
                            <p className="text-sm font-semibold text-ink-2">
                                Analyzing your application
                            </p>

                            <p className="mt-0.5 text-xs text-muted">
                                Comparing your resume with the job
                                requirements...
                            </p>
                        </div>
                    </div>
                </div>
            ) : null}

            {/* Error */}
            {error ? (
                <div
                    role="alert"
                    className="flex items-start gap-3 rounded-2xl border border-rejected-line bg-rejected-soft p-4"
                >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-rejected-soft text-rejected-ink">
                        <AlertTriangle className="h-4 w-4" />
                    </span>

                    <div>
                        <p className="text-sm font-semibold text-rejected-ink">
                            Something went wrong
                        </p>

                        <p className="mt-0.5 text-xs leading-5 text-rejected">
                            {error}
                        </p>
                    </div>
                </div>
            ) : null}

            {/* Insights */}
            {parsedInsights ? (
                <div className="space-y-5">
                    {/* Match Score */}
                    <section className="relative overflow-hidden rounded-[24px] border border-accent-line bg-canvas p-5 shadow-[0_18px_45px_-30px_rgba(var(--accent-rgb),0.45)] sm:p-6">
                        <div
                            aria-hidden="true"
                            className="absolute -right-20 -top-20 h-52 w-52 rounded-full bg-accent-soft/70 blur-2xl"
                        />

                        <div className="relative">
                            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                                <div className="flex items-center gap-5">
                                    <MatchRing
                                        value={
                                            matchMetrics.overall
                                        }
                                    />

                                    <div>
                                        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
                                            Overall assessment
                                        </p>

                                        <h2 className={`${serif.className} mt-1 text-3xl text-accent-ink`}>
                                            Your match
                                        </h2>

                                        {matchMetrics.rating ? (
                                            <p className="mt-2 max-w-md text-sm leading-6 text-muted">
                                                {
                                                    matchMetrics.rating
                                                }
                                            </p>
                                        ) : (
                                            <p className="mt-2 text-sm text-muted">
                                                Resume alignment with
                                                this role.
                                            </p>
                                        )}
                                    </div>
                                </div>

                                <div className="rounded-2xl border border-accent-soft bg-surface/80 p-4 lg:max-w-xs">
                                    <div className="flex items-center gap-2">
                                        <TrendingUp className="h-4 w-4 text-accent" />

                                        <span className="text-xs font-semibold text-ink-2">
                                            What drives the score
                                        </span>
                                    </div>

                                    <p className="mt-2 text-xs leading-5 text-muted">
                                        Review each category below to
                                        see where your application
                                        aligns and where it can be
                                        strengthened.
                                    </p>
                                </div>
                            </div>

                            <div className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                                <ScoreCard
                                    label="Skills"
                                    value={
                                        matchMetrics.skills
                                    }
                                />

                                <ScoreCard
                                    label="Experience"
                                    value={
                                        matchMetrics.experience
                                    }
                                />

                                <ScoreCard
                                    label="Responsibilities"
                                    value={
                                        matchMetrics.responsibilities
                                    }
                                />

                                <ScoreCard
                                    label="Qualifications"
                                    value={
                                        matchMetrics.qualifications
                                    }
                                />
                            </div>

                            {parsedInsights.matchScore ? (
                                <div className="mt-6 border-t border-accent-soft pt-6">
                                    <FormattedText
                                        text={
                                            parsedInsights.matchScore
                                        }
                                    />
                                </div>
                            ) : null}
                        </div>
                    </section>

                    {/* Job Analysis */}
                    <Section
                        title="Job Analysis"
                        description="What this role is really asking for"
                        tone="blue"
                        icon={
                            <Briefcase className="h-4 w-4" />
                        }
                    >
                        {parsedInsights.jobAnalysis ? (
                            <FormattedText
                                text={
                                    parsedInsights.jobAnalysis
                                }
                            />
                        ) : (
                            <EmptyState message="No job analysis available." />
                        )}
                    </Section>

                    {/* Skills */}
                    <Section
                        title="Skills"
                        description="Relevant strengths from your profile"
                        tone="green"
                        icon={
                            <Lightbulb className="h-4 w-4" />
                        }
                    >
                        {parsedInsights.skills ? (
                            <FormattedText
                                text={
                                    parsedInsights.skills
                                }
                            />
                        ) : (
                            <EmptyState message="No skills analysis available." />
                        )}
                    </Section>

                    {/* Keywords */}
                    <Section
                        title="Keywords"
                        description="Terms worth reflecting in your application"
                        tone="purple"
                        icon={
                            <Target className="h-4 w-4" />
                        }
                    >
                        {parsedInsights.keywords ? (
                            <FormattedText
                                text={
                                    parsedInsights.keywords
                                }
                            />
                        ) : (
                            <EmptyState message="No keyword analysis available." />
                        )}
                    </Section>

                    {/* Gaps */}
                    <Section
                        title="Gaps"
                        description="Potential areas to address before applying"
                        tone="red"
                        icon={
                            <AlertTriangle className="h-4 w-4" />
                        }
                    >
                        {parsedInsights.gaps ? (
                            <FormattedText
                                text={
                                    parsedInsights.gaps
                                }
                            />
                        ) : (
                            <EmptyState message="No gaps identified." />
                        )}
                    </Section>

                    {/* Cover Letter */}
                    <Section
                        title="Cover Letter"
                        description="AI-generated draft tailored to this role"
                        tone="purple"
                        icon={
                            <MessageCircle className="h-4 w-4" />
                        }
                    >
                        {parsedInsights.coverLetter ? (
                            <>
                                <div className="relative overflow-hidden rounded-2xl border border-applied-line bg-applied-soft p-5 sm:p-6">
                                    <div
                                        aria-hidden="true"
                                        className="absolute left-0 top-0 h-full w-1 bg-applied-line"
                                    />

                                    <FormattedText
                                        text={
                                            parsedInsights.coverLetter
                                        }
                                    />
                                </div>

                                <div className="mt-4 flex justify-end">
                                    <button
                                        type="button"
                                        onClick={
                                            copyCoverLetter
                                        }
                                        className="group inline-flex items-center gap-2 rounded-xl border border-line bg-surface px-4 py-2.5 text-sm font-semibold text-ink-2 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-applied hover:text-applied hover:shadow-md"
                                    >
                                        {copied ? (
                                            <Check className="h-4 w-4" />
                                        ) : (
                                            <Copy className="h-4 w-4 transition-transform group-hover:scale-110" />
                                        )}

                                        {copied
                                            ? "Copied"
                                            : "Copy Cover Letter"}
                                    </button>
                                </div>
                            </>
                        ) : (
                            <EmptyState message="No cover letter generated." />
                        )}
                    </Section>

                    {/* Interview */}
                    <Section
                        title="Interview Prep"
                        description="Topics and talking points to prepare"
                        tone="gold"
                        icon={
                            <MessageCircle className="h-4 w-4" />
                        }
                    >
                        {parsedInsights.interviewPrep ? (
                            <FormattedText
                                text={
                                    parsedInsights.interviewPrep
                                }
                            />
                        ) : (
                            <EmptyState message="No interview preparation available." />
                        )}
                    </Section>

                    {/* Questions */}
                    <Section
                        title="Questions to Ask"
                        description="Thoughtful questions for the interviewer"
                        tone="blue"
                        icon={
                            <HelpCircle className="h-4 w-4" />
                        }
                    >
                        {parsedInsights.questions ? (
                            <FormattedText
                                text={
                                    parsedInsights.questions
                                }
                            />
                        ) : (
                            <EmptyState message="No questions available." />
                        )}
                    </Section>

                    {/* Final Advice */}
                    <Section
                        title="Final Advice"
                        description="The most useful takeaways from the analysis"
                        tone="green"
                        icon={
                            <TrendingUp className="h-4 w-4" />
                        }
                    >
                        {parsedInsights.finalAdvice ? (
                            <FormattedText
                                text={
                                    parsedInsights.finalAdvice
                                }
                            />
                        ) : (
                            <EmptyState message="No final advice available." />
                        )}
                    </Section>

                    {/* PDF footer */}
                    <div className="flex flex-col items-center justify-between gap-3 rounded-2xl border border-line bg-canvas p-4 sm:flex-row">
                        <div className="flex items-center gap-3">
                            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-surface text-ink-2 shadow-sm">
                                <FileText className="h-4 w-4" />
                            </span>

                            <div>
                                <p className="text-xs font-semibold text-ink-2">
                                    Keep a copy
                                </p>

                                <p className="text-[11px] text-muted">
                                    Export the complete analysis as
                                    a PDF.
                                </p>
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={
                                downloadPDF
                            }
                            disabled={
                                downloadingPdf
                            }
                            className="inline-flex items-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-on-accent shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-accent hover:shadow-[0_10px_22px_-12px_rgba(var(--accent-rgb),0.7)] disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            <Download className="h-4 w-4" />

                            {downloadingPdf
                                ? "Creating PDF..."
                                : "Download PDF"}
                        </button>
                    </div>
                </div>
            ) : null}
        </div>
    );
}
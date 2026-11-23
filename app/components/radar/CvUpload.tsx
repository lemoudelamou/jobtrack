"use client";

import { useRef, useState } from "react";
import { FileText, LoaderCircle, Upload } from "lucide-react";

import { ApiError, apiRequest } from "@/lib/api/client";
import { button, cx } from "@/lib/ui";

export default function CvUpload({
    current,
    onUploaded,
}: {
    current: { fileName: string; ready: boolean } | null;
    onUploaded: () => void;
}) {
    const inputRef = useRef<HTMLInputElement>(null);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState("");

    async function upload(file: File) {
        setError("");

        if (!file.name.toLowerCase().endsWith(".pdf")) {
            setError("Upload your CV as a PDF.");
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            setError("The PDF is larger than 5 MB. Export a smaller version and try again.");
            return;
        }

        const body = new FormData();
        body.append("file", file);

        try {
            setUploading(true);
            await apiRequest("/api/resume", { method: "POST", body });
            onUploaded();
        } catch (err) {
            setError(err instanceof ApiError && err.message ? err.message : "The CV wasn't uploaded. Try again.");
        } finally {
            setUploading(false);
            if (inputRef.current) inputRef.current.value = "";
        }
    }

    return (
        <div>
            <input
                ref={inputRef}
                type="file"
                accept="application/pdf,.pdf"
                className="sr-only"
                id="radar-cv"
                onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) upload(file);
                }}
            />

            {current?.ready ? (
                <div className="flex items-center justify-between gap-3 rounded-lg border border-line bg-surface px-3 py-2.5">
                    <span className="flex min-w-0 items-center gap-2.5 text-sm text-ink">
                        <FileText className="h-4 w-4 shrink-0 text-muted" strokeWidth={1.75} />
                        <span className="truncate">{current.fileName}</span>
                    </span>
                    <label htmlFor="radar-cv" className={cx(button.ghost, "h-8 cursor-pointer px-2.5 text-sm")}>
                        {uploading ? "Uploading…" : "Replace"}
                    </label>
                </div>
            ) : (
                <label
                    htmlFor="radar-cv"
                    className={cx(
                        "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-line-strong px-4 py-7 text-center transition-colors hover:border-accent hover:bg-accent-soft/40",
                        uploading && "pointer-events-none opacity-70",
                    )}
                >
                    {uploading ? (
                        <LoaderCircle className="h-5 w-5 animate-spin text-accent" strokeWidth={2} />
                    ) : (
                        <Upload className="h-5 w-5 text-muted" strokeWidth={1.75} />
                    )}
                    <span className="text-sm font-medium text-ink">
                        {uploading ? "Reading your CV…" : "Choose your CV (PDF)"}
                    </span>
                    <span className="text-xs text-muted">
                        {uploading ? "This takes a few seconds." : "Used only to rank matches. Up to 5 MB."}
                    </span>
                </label>
            )}

            {error && <p className="mt-2 text-xs text-rejected-ink">{error}</p>}
        </div>
    );
}

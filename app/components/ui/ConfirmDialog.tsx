"use client";

import { ReactNode, useEffect, useId } from "react";
import { serif } from "@/lib/fonts";
import { IconAlert } from "@/app/components/Icons";

/* -------------------------------------------------------------------------- */
/* ConfirmDialog — generic confirmation modal                                 */
/*                                                                            */
/* Reusable anywhere you need "are you sure?" — delete, discard changes,      */
/* sign out, etc. Owns its own Escape-to-close and click-outside-to-close     */
/* behavior so callers just pass content + callbacks.                        */
/* -------------------------------------------------------------------------- */

type ConfirmDialogTone = "danger" | "neutral";

const TONE_STYLES: Record<
    ConfirmDialogTone,
    { iconBg: string; iconText: string; confirmBg: string; confirmHoverBg: string }
> = {
    danger: {
        iconBg: "bg-rejected-soft",
        iconText: "text-rejected",
        confirmBg: "bg-rejected",
        confirmHoverBg: "hover:bg-rejected-ink",
    },
    neutral: {
        iconBg: "bg-accent-soft",
        iconText: "text-accent",
        confirmBg: "bg-accent",
        confirmHoverBg: "hover:bg-accent-strong",
    },
};

export interface ConfirmDialogProps {
    /** Dialog heading, e.g. "Delete this application?" */
    title: string;
    /** Main body copy. Can include inline elements (bold names, etc). */
    description: ReactNode;
    /** Optional smaller supporting line, e.g. "This action cannot be undone." */
    note?: ReactNode;
    /** Label for the destructive/primary action button. */
    confirmLabel: string;
    /** Label shown on the confirm button while isLoading is true. Defaults to `${confirmLabel}…`. */
    confirmingLabel?: string;
    /** Label for the dismiss button. Defaults to "Cancel". */
    cancelLabel?: string;
    /** Disables both buttons and swaps the confirm label while an action is in flight. */
    isLoading?: boolean;
    /** Visual tone of the icon chip and confirm button. Defaults to "danger". */
    tone?: ConfirmDialogTone;
    /** Custom icon; defaults to a triangular alert glyph. */
    icon?: ReactNode;
    onConfirm: () => void;
    onCancel: () => void;
}

export function ConfirmDialog({
    title,
    description,
    note,
    confirmLabel,
    confirmingLabel,
    cancelLabel = "Cancel",
    isLoading = false,
    tone = "danger",
    icon,
    onConfirm,
    onCancel,
}: ConfirmDialogProps) {
    const titleId = useId();
    const descriptionId = useId();
    const styles = TONE_STYLES[tone];

    useEffect(() => {
        function handleEscape(event: KeyboardEvent) {
            if (event.key === "Escape" && !isLoading) {
                onCancel();
            }
        }

        document.addEventListener("keydown", handleEscape);
        return () => document.removeEventListener("keydown", handleEscape);
    }, [isLoading, onCancel]);

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-ink/45 px-4 backdrop-blur-sm"
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            aria-describedby={descriptionId}
            onMouseDown={(event) => {
                if (event.target === event.currentTarget && !isLoading) {
                    onCancel();
                }
            }}
        >
            <div className="dashboard-scale-in w-full max-w-md overflow-hidden rounded-3xl border border-line bg-surface shadow-[0_30px_100px_rgba(20,24,26,0.22)]">
                <div className="p-6 sm:p-7">
                    <span
                        className={`flex h-12 w-12 items-center justify-center rounded-2xl ${styles.iconBg} ${styles.iconText}`}
                    >
                        {icon ?? <IconAlert className="h-5 w-5" />}
                    </span>

                    <h2 id={titleId} className={`${serif.className} mt-5 text-2xl text-ink`}>
                        {title}
                    </h2>

                    <p id={descriptionId} className="mt-3 leading-6 text-ink-2">
                        {description}
                    </p>

                    {note && <p className="mt-2 text-sm text-muted">{note}</p>}

                    <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                        <button
                            type="button"
                            onClick={onCancel}
                            disabled={isLoading}
                            className="rounded-xl border border-line bg-surface px-5 py-2.5 text-sm font-semibold text-ink-2 transition-all hover:bg-canvas hover:text-ink disabled:opacity-50"
                        >
                            {cancelLabel}
                        </button>

                        <button
                            type="button"
                            onClick={onConfirm}
                            disabled={isLoading}
                            className={`rounded-xl px-5 py-2.5 text-sm font-semibold text-on-accent transition-all hover:-translate-y-0.5 ${styles.confirmBg} ${styles.confirmHoverBg} disabled:cursor-not-allowed disabled:opacity-60`}
                        >
                            {isLoading ? confirmingLabel ?? `${confirmLabel}…` : confirmLabel}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
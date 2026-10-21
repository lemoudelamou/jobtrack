"use client";

import { ReactNode, useEffect, useRef } from "react";

/*
 * Right-hand side panel used for create / edit flows. Escape and the
 * backdrop close it (unless `locked` while saving); focus moves into the
 * panel on open and back to the trigger on close.
 */
export default function Sheet({
    open,
    onClose,
    labelledBy,
    locked = false,
    children,
}: {
    open: boolean;
    onClose: () => void;
    labelledBy: string;
    locked?: boolean;
    children: ReactNode;
}) {
    const panelRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!open) return;

        const trigger = document.activeElement as HTMLElement | null;
        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";

        const firstField = panelRef.current?.querySelector<HTMLElement>(
            "input, select, textarea, button",
        );
        firstField?.focus();

        function onKey(event: KeyboardEvent) {
            if (event.key === "Escape" && !locked) onClose();
        }

        document.addEventListener("keydown", onKey);

        return () => {
            document.body.style.overflow = previousOverflow;
            document.removeEventListener("keydown", onKey);
            trigger?.focus?.();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open]);

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50">
            <div
                aria-hidden="true"
                onClick={() => !locked && onClose()}
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            />
            <div
                ref={panelRef}
                role="dialog"
                aria-modal="true"
                aria-labelledby={labelledBy}
                className="jt-sheet absolute inset-y-2 right-2 flex w-[calc(100%-1rem)] max-w-lg flex-col overflow-hidden rounded-3xl border border-[var(--glass-line)] bg-canvas/90 shadow-overlay backdrop-blur-2xl"
            >
                {children}
            </div>
        </div>
    );
}

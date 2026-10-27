"use client";

import { useState } from "react";
import {
    Trash2 as IconTrash,
    X as IconX,
    AlertTriangle as IconAlertTriangle,
    LoaderCircle as IconLoaderCircle,
} from "lucide-react";

import { api, ApiError } from "@/lib/api/client";

type PasskeyRemoveButtonProps = {
    passkeyId: string;
    onRemoved: (passkeyId: string) => void;
};

type RemovePasskeyResponse = {
    success?: boolean;
};

export default function PasskeyRemoveButton({
    passkeyId,
    onRemoved,
}: PasskeyRemoveButtonProps) {
    const [open, setOpen] = useState(false);
    const [pending, setPending] = useState(false);
    const [error, setError] = useState<string | null>(
        null,
    );

    async function handleRemove() {
        if (pending) {
            return;
        }

        setPending(true);
        setError(null);

        try {
            const result =
                await api.delete<RemovePasskeyResponse>(
                    `/api/passkeys/${encodeURIComponent(
                        passkeyId,
                    )}`,
                );

            /*
             * The request succeeded at the HTTP level,
             * but the API must also confirm the deletion.
             */
            if (result.success !== true) {
                throw new Error(
                    "Unable to remove passkey.",
                );
            }

            setOpen(false);
            onRemoved(passkeyId);
        } catch (error) {
            if (error instanceof ApiError) {
                setError(
                    error.message ||
                    "Unable to remove passkey.",
                );
            } else if (error instanceof Error) {
                setError(
                    error.message ||
                    "Unable to remove passkey.",
                );
            } else {
                setError(
                    "Unable to remove passkey. Please try again.",
                );
            }
        } finally {
            setPending(false);
        }
    }

    function handleOpen() {
        setError(null);
        setOpen(true);
    }

    function handleClose() {
        if (pending) {
            return;
        }

        setError(null);
        setOpen(false);
    }

    return (
        <>
            <button
                type="button"
                onClick={handleOpen}
                className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-line px-3 py-2 text-xs font-semibold text-muted transition-colors hover:border-line hover:bg-canvas hover:text-ink-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 sm:w-auto"
            >
                <IconTrash className="h-3.5 w-3.5" />
                Remove
            </button>

            {open && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-ink/35 px-4 backdrop-blur-[2px]"
                    role="presentation"
                    onMouseDown={(event) => {
                        if (
                            event.target ===
                            event.currentTarget
                        ) {
                            handleClose();
                        }
                    }}
                >
                    <div
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="remove-passkey-title"
                        aria-describedby="remove-passkey-description"
                        className="w-full max-w-md overflow-hidden rounded-2xl border border-line bg-canvas shadow-2xl"
                    >
                        <div className="p-5 sm:p-6">
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex items-start gap-3">
                                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-rejected-soft text-rejected">
                                        <IconAlertTriangle className="h-5 w-5" />
                                    </div>

                                    <div>
                                        <h2
                                            id="remove-passkey-title"
                                            className="text-base font-semibold text-ink"
                                        >
                                            Remove passkey?
                                        </h2>

                                        <p className="mt-0.5 text-xs text-muted">
                                            This action cannot be undone.
                                        </p>
                                    </div>
                                </div>

                                <button
                                    type="button"
                                    onClick={handleClose}
                                    disabled={pending}
                                    aria-label="Close dialog"
                                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted transition-colors hover:bg-surface-2 hover:text-ink-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    <IconX className="h-4 w-4" />
                                </button>
                            </div>

                            <p
                                id="remove-passkey-description"
                                className="mt-5 text-sm leading-6 text-ink-2"
                            >
                                You will no longer be able to use
                                this passkey to sign in to JobTrack.
                                Make sure you still have another
                                sign-in method available.
                            </p>

                            {error && (
                                <div
                                    role="alert"
                                    className="mt-4 rounded-xl border border-line bg-canvas px-4 py-3 text-sm leading-5 text-ink-2"
                                >
                                    {error}
                                </div>
                            )}
                        </div>

                        <div className="flex flex-col-reverse gap-2 border-t border-line bg-canvas p-4 sm:flex-row sm:justify-end">
                            <button
                                type="button"
                                onClick={handleClose}
                                disabled={pending}
                                className="rounded-lg border border-line bg-canvas px-4 py-2.5 text-sm font-medium text-ink-2 transition-colors hover:bg-surface focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                Cancel
                            </button>

                            <button
                                type="button"
                                onClick={handleRemove}
                                disabled={pending}
                                className="inline-flex items-center justify-center gap-2 rounded-lg bg-rejected px-4 py-2.5 text-sm font-semibold text-on-accent transition-colors hover:bg-rejected-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-rejected/40 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                {pending ? (
                                    <>
                                        <IconLoaderCircle className="h-4 w-4 animate-spin" />
                                        Removing...
                                    </>
                                ) : (
                                    <>
                                        <IconTrash className="h-4 w-4" />
                                        Remove passkey
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

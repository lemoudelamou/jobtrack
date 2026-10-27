"use client";

import { useState } from "react";
import {
    startRegistration,
    WebAuthnError,
} from "@simplewebauthn/browser";

import { api, ApiError } from "@/lib/api/client";

type Passkey = {
    id: string;
    deviceType: string | null;
    backedUp: boolean;
    createdAt: string;
};

type PasskeyRegistrationProps = {
    onSuccess?: (passkey: Passkey) => void;
};

type RegistrationOptions =
    Parameters<typeof startRegistration>[0];

type VerificationResponse = {
    verified?: boolean;
    passkey?: Passkey;
};

export default function PasskeyRegistration({
    onSuccess,
}: PasskeyRegistrationProps) {
    const [pending, setPending] = useState(false);
    const [error, setError] = useState<string | null>(
        null,
    );
    const [success, setSuccess] = useState(false);

    async function handleRegister() {
        if (pending) {
            return;
        }

        setPending(true);
        setError(null);
        setSuccess(false);

        try {
            /*
             * Get a fresh WebAuthn registration challenge.
             *
             * api.get() handles response parsing and
             * HTTP errors for us.
             */
            const options =
                await api.get<RegistrationOptions>(
                    "/api/passkeys/register-options",
                    {
                        cache: "no-store",
                    },
                );

            /*
             * Ask the browser/device to create the
             * passkey.
             */
            const registrationResponse =
                await startRegistration(options);

            /*
             * Send the WebAuthn registration response
             * to the server for verification.
             */
            const verification =
                await api.post<VerificationResponse>(
                    "/api/passkeys/register",
                    registrationResponse,
                );

            /*
             * The HTTP request succeeded, but the server
             * must also explicitly confirm verification.
             */
            if (verification.verified !== true) {
                throw new Error(
                    "Passkey registration failed.",
                );
            }

            /*
             * The server verified the passkey but didn't
             * return the created passkey record.
             */
            if (!verification.passkey) {
                throw new Error(
                    "Passkey was registered but could not be loaded.",
                );
            }

            setSuccess(true);

            onSuccess?.(verification.passkey);
        } catch (error) {
            /*
             * WebAuthn-specific errors.
             */
            if (error instanceof WebAuthnError) {
                switch (error.name) {
                    case "NotAllowedError":
                        setError(
                            "Passkey registration was cancelled or not allowed.",
                        );
                        break;

                    case "InvalidStateError":
                        setError(
                            "This passkey may already be registered.",
                        );
                        break;

                    default:
                        setError(
                            error.message ||
                            "Passkey registration failed.",
                        );
                }

                return;
            }

            /*
             * Expected API errors.
             *
             * Don't console.error() these because they are
             * expected HTTP failures and are displayed to
             * the user.
             */
            if (error instanceof ApiError) {
                setError(
                    error.message ||
                    "Passkey registration failed.",
                );

                return;
            }

            /*
             * Other JavaScript errors.
             */
            if (error instanceof Error) {
                setError(
                    error.message ||
                    "Passkey registration failed.",
                );

                return;
            }

            setError(
                "Passkey registration failed. Please try again.",
            );
        } finally {
            setPending(false);
        }
    }

    return (
        <div>
            {error && (
                <div
                    role="alert"
                    className="mb-4 rounded-lg border border-line bg-canvas px-4 py-3 text-sm leading-6 text-ink-2"
                >
                    {error}
                </div>
            )}

            {success && (
                <div
                    role="status"
                    className="mb-4 rounded-lg border border-accent-soft bg-accent-soft px-4 py-3 text-sm leading-6 text-accent"
                >
                    Passkey added successfully.
                </div>
            )}

            <button
                type="button"
                onClick={handleRegister}
                disabled={pending}
                className="rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-on-accent transition-colors hover:bg-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 disabled:cursor-not-allowed disabled:opacity-60"
            >
                {pending
                    ? "Adding passkey..."
                    : "Add passkey"}
            </button>
        </div>
    );
}

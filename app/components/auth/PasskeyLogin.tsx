"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import {
    startAuthentication,
    WebAuthnError,
} from "@simplewebauthn/browser";

import { KeyRound } from "lucide-react";

import { api, ApiError } from "@/lib/api/client";
import { button, cx } from "@/lib/ui";

type AuthenticationOptions =
    Parameters<typeof startAuthentication>[0];

export default function PasskeyLogin({ redirectTo = "/dashboard" }: { redirectTo?: string }) {
    const [pending, setPending] = useState(false);
    const [error, setError] = useState<string | null>(
        null,
    );

    async function handlePasskeyLogin() {
        if (pending) {
            return;
        }

        setPending(true);
        setError(null);

        try {
            /*
             * Get a fresh WebAuthn authentication
             * challenge from the server.
             *
             * api.get() handles:
             * - fetch()
             * - response parsing
             * - HTTP errors
             * - ApiError creation
             */
            const options =
                await api.get<AuthenticationOptions>(
                    "/api/passkeys/authenticate-options",
                    {
                        cache: "no-store",
                    },
                );

            /*
             * Ask the browser/device to authenticate
             * using the user's passkey.
             */
            const authenticationResponse =
                await startAuthentication(options);

            /*
             * Send the WebAuthn response to Auth.js.
             * Auth.js is responsible for creating
             * the authenticated session.
             */
            const result = await signIn("passkey", {
                response: JSON.stringify(
                    authenticationResponse,
                ),
                redirect: false,
                redirectTo,
            });

            /*
             * Auth.js may return null in some situations.
             */
            if (!result) {
                throw new Error(
                    "Unable to sign in with passkey.",
                );
            }

            /*
             * Auth.js rejected the credentials.
             */
            if (result.error) {
                throw new Error(
                    "Passkey authentication failed. Please try again.",
                );
            }

            /*
             * Auth.js successfully created the session.
             *
             * Prefer the URL returned by Auth.js.
             * Fall back to the dashboard.
             */
            window.location.href =
                result.url ?? redirectTo;
        } catch (error) {
            /*
             * WebAuthn-specific errors.
             */
            if (error instanceof WebAuthnError) {
                if (
                    error.name === "NotAllowedError"
                ) {
                    setError(
                        "Passkey sign in was cancelled or not allowed.",
                    );
                } else {
                    setError(
                        error.message ||
                        "Passkey sign in failed.",
                    );
                }

                return;
            }

            /*
             * API errors from api.get().
             *
             * We don't console.error() expected API
             * failures because they are handled and
             * displayed to the user.
             */
            if (error instanceof ApiError) {
                setError(
                    error.message ||
                    "Unable to start passkey sign in.",
                );

                return;
            }

            /*
             * Normal JavaScript errors.
             */
            if (error instanceof Error) {
                setError(
                    error.message ||
                    "Passkey sign in failed. Please try again.",
                );

                return;
            }

            /*
             * Unknown error shape.
             */
            setError(
                "Passkey sign in failed. Please try again.",
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
                    className="mb-3 rounded-lg border border-rejected-line bg-rejected-soft px-3.5 py-3 text-sm leading-6 text-rejected-ink"
                >
                    {error}
                </div>
            )}

            <button
                type="button"
                onClick={handlePasskeyLogin}
                disabled={pending}
                className={cx(button.secondary, button.large, "w-full")}
            >
                <KeyRound className="h-4 w-4 text-muted" strokeWidth={1.75} />
                {pending
                    ? "Waiting for your passkey…"
                    : "Sign in with a passkey"}
            </button>
        </div>
    );
}

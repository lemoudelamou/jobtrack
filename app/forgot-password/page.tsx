"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { ArrowLeft, LoaderCircle, MailCheck } from "lucide-react";

import AuthSplit, { Notice } from "@/app/components/auth/AuthSplit";
import { api, ApiError } from "@/lib/api/client";
import { button, cx, field } from "@/lib/ui";

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState("");
    const [sentTo, setSentTo] = useState("");
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setError("");
        setLoading(true);

        try {
            const data = await api.post<{ message?: string }>("/api/forgot-password", { email });
            setMessage(data?.message || "If an account exists for that email, we sent a reset link.");
            setSentTo(email);
        } catch (err) {
            setError(
                (err instanceof ApiError && err.message) || "Something went wrong. Please try again.",
            );
        } finally {
            setLoading(false);
        }
    }

    return (
        <AuthSplit
            title={sentTo ? "Check your inbox" : "Reset your password"}
            description={
                sentTo
                    ? undefined
                    : "Enter the email you signed up with and we'll send you a link to choose a new password."
            }
            topLink={{ prompt: "Remembered it?", label: "Sign in", href: "/login" }}
        >
            {sentTo ? (
                <div className="jt-pop">
                    <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent-soft text-accent">
                        <MailCheck className="h-6 w-6" aria-hidden="true" />
                    </span>
                    <p role="status" className="mt-4 text-sm leading-6 text-ink-2">
                        {message} The link is for <strong className="font-semibold text-ink">{sentTo}</strong> and
                        expires in 30 minutes.
                    </p>
                    <p className="mt-3 text-sm text-muted">
                        Nothing arrived? Check spam, or{" "}
                        <button
                            type="button"
                            onClick={() => {
                                setSentTo("");
                                setMessage("");
                            }}
                            className="font-semibold text-accent hover:underline hover:underline-offset-2"
                        >
                            try another email
                        </button>
                        .
                    </p>
                    <Link href="/login" className={cx(button.primary, button.large, "mt-7 w-full")}>
                        Back to sign in
                    </Link>
                </div>
            ) : (
                <>
                    {error && <Notice tone="error">{error}</Notice>}

                    <form onSubmit={handleSubmit} className="space-y-5" aria-busy={loading}>
                        <div>
                            <label htmlFor="email" className={field.label}>
                                Email
                            </label>
                            <input
                                id="email"
                                name="email"
                                type="email"
                                required
                                autoFocus
                                autoComplete="email"
                                placeholder="you@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                disabled={loading}
                                className={cx(field.input, "h-11")}
                            />
                        </div>

                        <button type="submit" disabled={loading} className={cx(button.primary, button.large, "w-full")}>
                            {loading && <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />}
                            {loading ? "Sending link…" : "Send reset link"}
                        </button>
                    </form>

                    <Link
                        href="/login"
                        className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-muted hover:text-ink"
                    >
                        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                        Back to sign in
                    </Link>
                </>
            )}
        </AuthSplit>
    );
}

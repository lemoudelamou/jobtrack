"use client";

import Link from "next/link";
import { Suspense, useState, type FormEvent } from "react";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, Circle, Eye, EyeOff, LoaderCircle } from "lucide-react";

import AuthSplit, { Notice } from "@/app/components/auth/AuthSplit";
import { api, ApiError } from "@/lib/api/client";
import { button, cx, field } from "@/lib/ui";

function PasswordInput({
    id,
    label,
    value,
    onChange,
    disabled,
    invalid,
    autoFocus,
}: {
    id: string;
    label: string;
    value: string;
    onChange: (value: string) => void;
    disabled: boolean;
    invalid?: boolean;
    autoFocus?: boolean;
}) {
    const [visible, setVisible] = useState(false);
    return (
        <div>
            <label htmlFor={id} className={field.label}>
                {label}
            </label>
            <div className="relative">
                <input
                    id={id}
                    name={id}
                    type={visible ? "text" : "password"}
                    required
                    minLength={8}
                    maxLength={128}
                    autoFocus={autoFocus}
                    autoComplete="new-password"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    disabled={disabled}
                    aria-invalid={invalid || undefined}
                    className={cx(field.input, "h-11 pr-11", invalid && "border-rejected!")}
                />
                <button
                    type="button"
                    onClick={() => setVisible((v) => !v)}
                    aria-label={visible ? "Hide password" : "Show password"}
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-full p-2 text-muted hover:text-ink"
                >
                    {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
            </div>
        </div>
    );
}

function Check({ ok, children }: { ok: boolean; children: React.ReactNode }) {
    const Icon = ok ? CheckCircle2 : Circle;
    return (
        <li className={cx("flex items-center gap-2 text-xs", ok ? "text-offer-ink" : "text-muted")}>
            <Icon className="h-3.5 w-3.5" aria-hidden="true" />
            {children}
        </li>
    );
}

function ResetPasswordForm() {
    const token = useSearchParams().get("token");

    const [password, setPassword] = useState("");
    const [confirm, setConfirm] = useState("");
    const [done, setDone] = useState(false);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const longEnough = password.length >= 8;
    const matches = confirm.length > 0 && password === confirm;
    const mismatch = confirm.length > 0 && password !== confirm;
    const canSubmit = Boolean(token) && longEnough && matches && !loading;

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setError("");
        if (!canSubmit) return;

        setLoading(true);
        try {
            await api.post("/api/reset-password", { token, password });
            setDone(true);
        } catch (err) {
            setError((err instanceof ApiError && err.message) || "Something went wrong. Please try again.");
        } finally {
            setLoading(false);
        }
    }

    if (done) {
        return (
            <AuthSplit title="Password updated" description="You're all set. Sign in with your new password.">
                <div className="jt-pop">
                    <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-offer-soft text-offer-ink">
                        <CheckCircle2 className="h-6 w-6" aria-hidden="true" />
                    </span>
                    <p className="mt-4 text-sm leading-6 text-ink-2">
                        For your security, you were signed out on every other device.
                    </p>
                    <Link href="/login?passwordChanged=true" className={cx(button.primary, button.large, "mt-7 w-full")}>
                        Sign in
                    </Link>
                </div>
            </AuthSplit>
        );
    }

    if (!token) {
        return (
            <AuthSplit title="Link not valid" description="This reset link is missing or broken.">
                <Notice tone="error">Request a new link and open it from the latest email.</Notice>
                <Link href="/forgot-password" className={cx(button.primary, button.large, "w-full")}>
                    Get a new link
                </Link>
            </AuthSplit>
        );
    }

    return (
        <AuthSplit
            title="Choose a new password"
            description="Pick something you don't use anywhere else."
            topLink={{ prompt: "Remembered it?", label: "Sign in", href: "/login" }}
        >
            {error && (
                <Notice tone="error">
                    {error}{" "}
                    <Link href="/forgot-password" className="font-semibold underline underline-offset-2">
                        Get a new link
                    </Link>
                </Notice>
            )}

            <form onSubmit={handleSubmit} className="space-y-5" aria-busy={loading}>
                <PasswordInput
                    id="password"
                    label="New password"
                    value={password}
                    onChange={setPassword}
                    disabled={loading}
                    autoFocus
                />
                <PasswordInput
                    id="confirmPassword"
                    label="Confirm password"
                    value={confirm}
                    onChange={setConfirm}
                    disabled={loading}
                    invalid={mismatch}
                />

                <ul className="space-y-1.5" aria-live="polite">
                    <Check ok={longEnough}>At least 8 characters</Check>
                    <Check ok={matches}>{mismatch ? "Passwords don't match yet" : "Both passwords match"}</Check>
                </ul>

                <button type="submit" disabled={!canSubmit} className={cx(button.primary, button.large, "w-full")}>
                    {loading && <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />}
                    {loading ? "Saving…" : "Save new password"}
                </button>
            </form>
        </AuthSplit>
    );
}

export default function ResetPasswordPage() {
    return (
        <Suspense
            fallback={
                <main className="flex min-h-screen items-center justify-center">
                    <LoaderCircle className="h-6 w-6 animate-spin text-accent" />
                </main>
            }
        >
            <ResetPasswordForm />
        </Suspense>
    );
}

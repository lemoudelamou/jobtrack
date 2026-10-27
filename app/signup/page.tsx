"use client";

import Link from "next/link";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { Check, Eye, EyeOff, MailCheck } from "lucide-react";

import AuthSplit, { GoogleLogo, Notice, OrDivider } from "@/app/components/auth/AuthSplit";
import { api, ApiError } from "@/lib/api/client";
import { button, cx, field } from "@/lib/ui";

function GitHubLogo() {
    return (
        <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden="true">
            <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.57.1.78-.25.78-.55v-2.16c-3.2.7-3.87-1.36-3.87-1.36-.52-1.32-1.28-1.67-1.28-1.67-1.04-.71.08-.7.08-.7 1.15.08 1.76 1.18 1.76 1.18 1.02 1.75 2.68 1.25 3.33.96.1-.74.4-1.25.73-1.54-2.55-.29-5.23-1.28-5.23-5.7 0-1.26.45-2.29 1.18-3.1-.12-.29-.51-1.47.11-3.06 0 0 .96-.31 3.15 1.18a10.9 10.9 0 0 1 5.74 0c2.19-1.49 3.15-1.18 3.15-1.18.62 1.59.23 2.77.11 3.06.73.81 1.18 1.84 1.18 3.1 0 4.43-2.69 5.4-5.25 5.69.41.35.78 1.05.78 2.12v3.14c0 .3.21.66.79.55A11.51 11.51 0 0 0 23.5 12C23.5 5.65 18.35.5 12 .5Z" />
        </svg>
    );
}

export default function SignupPage() {
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [oauthPending, setOauthPending] = useState<"google" | "github" | null>(null);
    const [showPassword, setShowPassword] = useState(false);
    const [password, setPassword] = useState("");
    const [verificationSent, setVerificationSent] = useState(false);
    const [registeredEmail, setRegisteredEmail] = useState("");

    const checks = [
        { label: "At least 8 characters", met: password.length >= 8 },
        { label: "A letter", met: /[A-Za-z]/.test(password) },
        { label: "A number", met: /\d/.test(password) },
    ];

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();

        setError("");
        setLoading(true);

        const formData = new FormData(event.currentTarget);
        const name = formData.get("name");
        const email = formData.get("email");

        try {
            await api.post("/api/auth/signup", { name, email, password });

            setRegisteredEmail(String(email));
            setVerificationSent(true);
        } catch (err) {
            if (err instanceof ApiError) {
                const data = err.data;

                if (typeof data === "object" && data !== null && "error" in data && typeof data.error === "string") {
                    setError(data.error);
                } else {
                    setError(err.message || "Your account wasn't created. Try again.");
                }
            } else {
                setError("Your account wasn't created. Check your connection and try again.");
            }
        } finally {
            setLoading(false);
        }
    }

    function continueWith(provider: "google" | "github") {
        setOauthPending(provider);
        signIn(provider, { callbackUrl: "/dashboard" }).catch(() => setOauthPending(null));
    }

    if (verificationSent) {
        return (
            <AuthSplit
                title="Check your email"
                description={
                    <>
                        We sent a verification link to{" "}
                        <span className="font-medium text-ink">{registeredEmail}</span>. Open it to
                        activate your account.
                    </>
                }
            >
                <div className="flex items-start gap-3 rounded-lg border border-line bg-surface-2 px-3.5 py-3 text-sm leading-6 text-ink-2">
                    <MailCheck className="mt-0.5 h-4 w-4 shrink-0 text-muted" strokeWidth={1.75} />
                    <p>
                        Nothing after a few minutes? Check spam, or sign in with this email and we&apos;ll
                        offer to send a new link.
                    </p>
                </div>

                <Link href="/login" className={cx(button.primary, button.large, "mt-6 w-full")}>
                    Go to sign in
                </Link>
            </AuthSplit>
        );
    }

    return (
        <AuthSplit
            title="Create your account"
            description="Free, and takes less than a minute."
            topLink={{ prompt: "Already have an account?", label: "Sign in", href: "/login" }}
        >
            <div className="space-y-2.5">
                <button
                    type="button"
                    onClick={() => continueWith("google")}
                    disabled={oauthPending !== null}
                    className={cx(button.secondary, button.large, "w-full")}
                >
                    <GoogleLogo />
                    {oauthPending === "google" ? "Redirecting to Google…" : "Continue with Google"}
                </button>
                <button
                    type="button"
                    onClick={() => continueWith("github")}
                    disabled={oauthPending !== null}
                    className={cx(button.secondary, button.large, "w-full")}
                >
                    <GitHubLogo />
                    {oauthPending === "github" ? "Redirecting to GitHub…" : "Continue with GitHub"}
                </button>
            </div>

            <OrDivider label="or with email" />

            {error && <Notice tone="error">{error}</Notice>}

            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label htmlFor="signup-name" className={field.label}>
                        Name <span className="font-normal text-muted">(optional)</span>
                    </label>
                    <input
                        id="signup-name"
                        name="name"
                        type="text"
                        autoComplete="name"
                        maxLength={100}
                        className={field.input}
                    />
                </div>

                <div>
                    <label htmlFor="signup-email" className={field.label}>
                        Email
                    </label>
                    <input
                        id="signup-email"
                        name="email"
                        type="email"
                        required
                        autoComplete="email"
                        placeholder="you@example.com"
                        className={field.input}
                    />
                </div>

                <div>
                    <label htmlFor="signup-password" className={field.label}>
                        Password
                    </label>
                    <div className="relative">
                        <input
                            id="signup-password"
                            name="password"
                            type={showPassword ? "text" : "password"}
                            required
                            minLength={8}
                            maxLength={128}
                            autoComplete="new-password"
                            value={password}
                            onChange={(event) => setPassword(event.target.value)}
                            aria-describedby="signup-password-rules"
                            className={cx(field.input, "pr-10")}
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword((value) => !value)}
                            aria-label={showPassword ? "Hide password" : "Show password"}
                            aria-pressed={showPassword}
                            className="absolute right-1 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md text-muted hover:text-ink"
                        >
                            {showPassword ? (
                                <EyeOff className="h-4 w-4" strokeWidth={1.75} />
                            ) : (
                                <Eye className="h-4 w-4" strokeWidth={1.75} />
                            )}
                        </button>
                    </div>

                    <ul id="signup-password-rules" className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
                        {checks.map((check) => (
                            <li
                                key={check.label}
                                className={cx(
                                    "flex items-center gap-1.5 text-xs transition-colors",
                                    check.met ? "text-offer-ink" : "text-muted",
                                )}
                            >
                                <span
                                    aria-hidden="true"
                                    className={cx(
                                        "flex h-3.5 w-3.5 items-center justify-center rounded-full",
                                        check.met ? "bg-offer text-on-accent" : "border border-line-strong",
                                    )}
                                >
                                    {check.met && <Check className="h-2.5 w-2.5" strokeWidth={3} />}
                                </span>
                                {check.label}
                                <span className="sr-only">{check.met ? "(done)" : "(missing)"}</span>
                            </li>
                        ))}
                    </ul>
                </div>

                <button type="submit" disabled={loading} className={cx(button.primary, button.large, "w-full")}>
                    {loading ? "Creating account…" : "Create account"}
                </button>
            </form>

            <p className="mt-6 text-xs leading-5 text-muted">
                We&apos;ll email you a link to confirm your address before your first sign-in.
            </p>
        </AuthSplit>
    );
}

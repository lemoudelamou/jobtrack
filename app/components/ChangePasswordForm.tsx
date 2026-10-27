"use client";

import { useEffect, useRef, useState } from "react";
import { signOut } from "next-auth/react";
import { Eye, EyeOff, Loader2, MailCheck } from "lucide-react";

import { api, ApiError } from "@/lib/api/client";
import { button, cx, field } from "@/lib/ui";

const MIN_LENGTH = 8;

/**
 * Password settings, closed by default.
 *
 * - With a password: a button opens the form, which always asks for the
 *   current password (checked and rate-limited on the server).
 * - Without one (Google / GitHub / passkey accounts): we email a one-time
 *   link instead, so someone holding the session can't add a password.
 */
export default function PasswordChange({ hasPassword }: { hasPassword: boolean }) {
    return hasPassword ? <ChangePassword /> : <SetPasswordByEmail />;
}

function ChangePassword() {
    const [open, setOpen] = useState(false);
    const [pending, setPending] = useState(false);
    const [error, setError] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirm, setConfirm] = useState("");
    const currentRef = useRef<HTMLInputElement>(null);
    const formRef = useRef<HTMLFormElement>(null);

    useEffect(() => {
        if (open) currentRef.current?.focus();
    }, [open]);

    function close() {
        formRef.current?.reset();
        setNewPassword("");
        setConfirm("");
        setError("");
        setOpen(false);
    }

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (pending) return;

        const data = new FormData(event.currentTarget);
        setError("");

        if (newPassword.length < MIN_LENGTH) return setError(`Use at least ${MIN_LENGTH} characters.`);
        if (newPassword !== confirm) return setError("The new passwords don't match.");

        setPending(true);
        try {
            await api.post("/api/auth/change-password", {
                currentPassword: String(data.get("currentPassword") ?? ""),
                newPassword,
                confirmPassword: confirm,
            });
            // Every session (this one included) is now invalid.
            await signOut({ callbackUrl: "/login?passwordChanged=true" });
        } catch (err) {
            setError((err instanceof ApiError && err.message) || "Something went wrong. Please try again.");
            setPending(false);
            currentRef.current?.select();
        }
    }

    if (!open) {
        return (
            <button type="button" onClick={() => setOpen(true)} className={button.secondary}>
                Change password
            </button>
        );
    }

    const mismatch = confirm.length > 0 && confirm !== newPassword;

    return (
        <form ref={formRef} onSubmit={handleSubmit} className="jt-pop max-w-md space-y-4" aria-busy={pending}>
            <PasswordField ref={currentRef} id="currentPassword" label="Current password" autoComplete="current-password" disabled={pending} />
            <PasswordField
                id="newPassword"
                label="New password"
                autoComplete="new-password"
                disabled={pending}
                value={newPassword}
                onChange={setNewPassword}
                hint={`At least ${MIN_LENGTH} characters.`}
            />
            <PasswordField
                id="confirmPassword"
                label="Confirm new password"
                autoComplete="new-password"
                disabled={pending}
                value={confirm}
                onChange={setConfirm}
                invalid={mismatch}
                hint={mismatch ? "Doesn't match yet." : undefined}
            />

            {error && (
                <p role="alert" className="rounded-xl border border-rejected-line bg-rejected-soft px-3 py-2 text-sm font-medium text-rejected-ink">
                    {error}
                </p>
            )}

            <p className="text-xs leading-5 text-muted">
                You&apos;ll be signed out everywhere, including here, and we&apos;ll email you a notice.
            </p>

            <div className="flex gap-2">
                <button type="submit" disabled={pending} className={button.primary}>
                    {pending && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
                    {pending ? "Saving…" : "Save new password"}
                </button>
                <button type="button" onClick={close} disabled={pending} className={button.secondary}>
                    Cancel
                </button>
            </div>
        </form>
    );
}

function SetPasswordByEmail() {
    const [state, setState] = useState<"idle" | "sending" | "sent">("idle");
    const [sentTo, setSentTo] = useState("");
    const [error, setError] = useState("");

    async function send() {
        setError("");
        setState("sending");
        try {
            const data = await api.post<{ email?: string }>("/api/auth/set-password-link", {});
            setSentTo(data?.email ?? "your email");
            setState("sent");
        } catch (err) {
            setError((err instanceof ApiError && err.message) || "Something went wrong. Please try again.");
            setState("idle");
        }
    }

    if (state === "sent") {
        return (
            <div role="status" className="jt-pop flex max-w-lg items-start gap-3 rounded-2xl border border-offer-line bg-offer-soft px-4 py-3">
                <MailCheck className="mt-0.5 h-5 w-5 shrink-0 text-offer-ink" aria-hidden="true" />
                <p className="text-sm leading-6 text-offer-ink">
                    Link sent to <strong className="font-semibold">{sentTo}</strong>. Open it within 30 minutes to choose
                    your password.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            <button type="button" onClick={send} disabled={state === "sending"} className={button.secondary}>
                {state === "sending" && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
                {state === "sending" ? "Sending…" : "Email me a link to set a password"}
            </button>
            {error && (
                <p role="alert" className="text-sm font-medium text-rejected-ink">
                    {error}
                </p>
            )}
        </div>
    );
}

function PasswordField({
    ref,
    id,
    label,
    autoComplete,
    disabled,
    value,
    onChange,
    invalid,
    hint,
}: {
    ref?: React.Ref<HTMLInputElement>;
    id: string;
    label: string;
    autoComplete: string;
    disabled: boolean;
    value?: string;
    onChange?: (value: string) => void;
    invalid?: boolean;
    hint?: string;
}) {
    const [visible, setVisible] = useState(false);

    return (
        <div>
            <label htmlFor={id} className={field.label}>
                {label}
            </label>
            <div className="relative">
                <input
                    ref={ref}
                    id={id}
                    name={id}
                    type={visible ? "text" : "password"}
                    autoComplete={autoComplete}
                    required
                    maxLength={128}
                    disabled={disabled}
                    {...(onChange ? { value, onChange: (e: React.ChangeEvent<HTMLInputElement>) => onChange(e.target.value) } : {})}
                    aria-invalid={invalid || undefined}
                    aria-describedby={hint ? `${id}-hint` : undefined}
                    className={cx(field.input, "pr-10", invalid && "border-rejected!")}
                />
                <button
                    type="button"
                    onClick={() => setVisible((v) => !v)}
                    aria-label={visible ? `Hide ${label.toLowerCase()}` : `Show ${label.toLowerCase()}`}
                    className="absolute right-1 top-1/2 -translate-y-1/2 rounded-full p-2 text-muted hover:text-ink"
                >
                    {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
            </div>
            {hint && (
                <p id={`${id}-hint`} className={cx(field.hint, invalid && "text-rejected-ink")}>
                    {hint}
                </p>
            )}
        </div>
    );
}

import { safeCallbackUrl } from "@/lib/safe-redirect";
import Link from "next/link";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { AuthError } from "next-auth";
import { auth, signIn } from "@/auth";
import { SignInButton } from "@/app/components/auth/signGithub";
import { LoginLockoutNotice } from "@/app/components/auth/LoginLockoutNotice";
import PasskeyLogin from "@/app/components/auth/PasskeyLogin";
import {
    getClientIp,
    getLoginBackoffMs,
    getLoginRateLimitRemainingMs,
    isLoginRateLimited,
} from "@/lib/auth/rate-limit";
import { LoginHistoryGuard } from "@/app/components/auth/LoginHistoryGuard";
import {
    canResendVerificationEmail,
    createEmailVerificationToken,
} from "@/lib/auth/email-verification";
import { prisma } from "@/lib/prisma";

import AuthSplit, { GoogleLogo, Notice, OrDivider } from "@/app/components/auth/AuthSplit";
import { button, cx, field } from "@/lib/ui";




export default async function LoginPage({
    searchParams,
}: {
    searchParams: Promise<{
        error?: string;
        email?: string;
        verified?: string;
        passwordChanged?: string;
        deleted?: string;
        backoffUntil?: string;
        lockoutUntil?: string;
        callbackUrl?: string;
    }>;
}) {
    const session = await auth();
    const params = await searchParams;
    const next = safeCallbackUrl(params.callbackUrl);

    if (session?.user?.id) {
        redirect(next);
    }

    const email = params.email ?? "";
    const error = params.error;
    const verified = params.verified === "true";
    const passwordChanged =
        params.passwordChanged === "true";

    const backoffUntil = params.backoffUntil
        ? Number(params.backoffUntil)
        : 0;

    const lockoutUntil = params.lockoutUntil
        ? Number(params.lockoutUntil)
        : 0;

    async function githubSignIn() {
        "use server";

        await signIn("github", {
            redirectTo: next,
        });
    }

    async function googleSignIn() {
        "use server";

        await signIn("google", {
            redirectTo: next,
        });
    }

    async function credentialsSignIn(
        formData: FormData,
    ) {
        "use server";

        const email =
            typeof formData.get("email") === "string"
                ? formData
                    .get("email")!
                    .toString()
                    .trim()
                    .toLowerCase()
                : "";

        const password =
            typeof formData.get("password") === "string"
                ? formData
                    .get("password")!
                    .toString()
                : "";

        if (email) {
            const requestHeaders =
                await headers();

            const ip =
                getClientIp(requestHeaders);

            const rateLimited =
                await isLoginRateLimited(
                    email,
                    ip,
                );

            if (rateLimited) {
                const remainingMs =
                    await getLoginRateLimitRemainingMs(
                        email,
                        ip,
                    );

                const lockoutUntil =
                    Date.now() + remainingMs;

                redirect(
                    `/login?error=rate_limited&email=${encodeURIComponent(
                        email,
                    )}&lockoutUntil=${lockoutUntil}`,
                );
            }
        }

        try {
            await signIn("credentials", {
                email,
                password,
                redirectTo: safeCallbackUrl(formData.get("callbackUrl")),
            });
        } catch (error) {
            if (error instanceof AuthError) {
                if (
                    error.type ===
                    "CredentialsSignin"
                ) {
                    const code =
                        "code" in error &&
                            typeof error.code ===
                            "string"
                            ? error.code
                            : "invalid";

                    if (
                        code ===
                        "email_not_verified"
                    ) {
                        redirect(
                            `/login?error=email_not_verified&email=${encodeURIComponent(
                                email,
                            )}`,
                        );
                    }

                    if (email) {
                        const requestHeaders =
                            await headers();

                        const ip =
                            getClientIp(
                                requestHeaders,
                            );

                        const backoffMs =
                            await getLoginBackoffMs(
                                email,
                                ip,
                            );

                        if (backoffMs > 0) {
                            const backoffUntil =
                                Date.now() +
                                backoffMs;

                            redirect(
                                `/login?error=backoff&email=${encodeURIComponent(
                                    email,
                                )}&backoffUntil=${backoffUntil}`,
                            );
                        }
                    }

                    redirect(
                        `/login?error=invalid&email=${encodeURIComponent(
                            email,
                        )}`,
                    );
                }
            }

            throw error;
        }
    }

    async function resendVerification(
        formData: FormData,
    ) {
        "use server";

        const email =
            typeof formData.get("email") === "string"
                ? formData
                    .get("email")!
                    .toString()
                    .trim()
                    .toLowerCase()
                : "";

        if (!email) {
            redirect(
                "/login?error=email_not_verified",
            );
        }

        const user =
            await prisma.user.findUnique({
                where: {
                    email,
                },
                select: {
                    id: true,
                    email: true,
                    emailVerified: true,
                },
            });

        if (
            !user ||
            user.emailVerified
        ) {
            redirect(
                `/login?error=verification_sent&email=${encodeURIComponent(
                    email,
                )}`,
            );
        }

        const allowed =
            await canResendVerificationEmail(
                user.id,
            );

        if (!allowed) {
            redirect(
                `/login?error=verification_cooldown&email=${encodeURIComponent(
                    email,
                )}`,
            );
        }

        await createEmailVerificationToken(
            user.id,
            user.email!,
        );

        redirect(
            `/login?error=verification_sent&email=${encodeURIComponent(
                email,
            )}`,
        );
    }

    return (
        <>
            <LoginHistoryGuard />

            <AuthSplit
                title="Sign in"
                description="Welcome back. Pick up where you left off."
                topLink={{ prompt: "New to JobTrack?", label: "Create an account", href: "/signup" }}
                footer="GitHub and Google sign-in use OAuth, so JobTrack never sees those passwords."
            >
                {passwordChanged && (
                    <Notice tone="success">
                        Your password was changed. Sign in with the new one.
                    </Notice>
                )}

                {params.deleted === "true" && (
                    <Notice tone="success">Your account and all its data were deleted.</Notice>
                )}

                {verified && (
                    <Notice tone="success">Your email is verified. You can sign in now.</Notice>
                )}

                {error === "backoff" && backoffUntil > 0 && <LoginLockoutNotice until={backoffUntil} />}

                {error === "rate_limited" && lockoutUntil > 0 && <LoginLockoutNotice until={lockoutUntil} />}

                {error === "OAuthAccountNotLinked" && (
                    <Notice tone="error">
                        This email already has a JobTrack account that isn&apos;t connected to that
                        provider. Sign in with your password or another connected method, then link
                        it in Settings.
                    </Notice>
                )}

                {error === "invalid" && (
                    <Notice tone="error">That email and password don&apos;t match. Check both and try again.</Notice>
                )}

                {error === "email_not_verified" && (
                    <Notice>
                        <p>Verify your email before signing in. The link is in your inbox.</p>
                        <form action={resendVerification} className="mt-2">
                            <input type="hidden" name="email" value={email} />
                            <button type="submit" className="font-medium text-accent hover:underline hover:underline-offset-2">
                                Send a new verification email
                            </button>
                        </form>
                    </Notice>
                )}

                {error === "verification_sent" && (
                    <Notice tone="success">
                        If that account still needs verifying, a new email is on its way.
                    </Notice>
                )}

                {error === "verification_cooldown" && (
                    <Notice>A verification email was just sent. Wait a minute before asking for another.</Notice>
                )}

                {error === "invalid_verification" && (
                    <Notice tone="error">That verification link is invalid or has expired. Sign in to get a new one.</Notice>
                )}

                <form action={credentialsSignIn} className="space-y-4">
                    <input type="hidden" name="redirectTo" value={next} />
                    <input type="hidden" name="callbackUrl" value={next} />

                    <div>
                        <label htmlFor="login-email" className={field.label}>
                            Email
                        </label>
                        <input
                            id="login-email"
                            type="email"
                            name="email"
                            required
                            autoComplete="email"
                            defaultValue={email}
                            placeholder="you@example.com"
                            className={field.input}
                        />
                    </div>

                    <div>
                        <div className="mb-1.5 flex items-baseline justify-between">
                            <label htmlFor="login-password" className="text-sm font-medium text-ink">
                                Password
                            </label>
                            <Link
                                href="/forgot-password"
                                className="text-sm text-muted hover:text-accent hover:underline hover:underline-offset-2"
                            >
                                Forgot password?
                            </Link>
                        </div>
                        <input
                            id="login-password"
                            type="password"
                            name="password"
                            required
                            autoComplete="current-password"
                            maxLength={128}
                            className={field.input}
                        />
                    </div>

                    <button type="submit" className={cx(button.primary, button.large, "w-full")}>
                        Sign in
                    </button>
                </form>

                <OrDivider />

                <div className="space-y-2.5">
                    <form action={googleSignIn}>
                        <button type="submit" className={cx(button.secondary, button.large, "w-full")}>
                            <GoogleLogo />
                            Continue with Google
                        </button>
                    </form>

                    <form action={githubSignIn}>
                        <SignInButton />
                    </form>

                    <PasskeyLogin redirectTo={next} />
                </div>
            </AuthSplit>
        </>
    );
}

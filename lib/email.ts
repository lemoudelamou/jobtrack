import nodemailer from "nodemailer";

/*
 * Email is sent through Gmail SMTP.
 *
 * GMAIL_USER          your Gmail address
 * GMAIL_APP_PASSWORD  a 16-character App Password (Google Account →
 *                     Security → 2-Step Verification → App passwords).
 *                     Your normal Gmail password will NOT work.
 * EMAIL_FROM          optional display sender, e.g. "JobTrack <you@gmail.com>"
 */
const GMAIL_USER = process.env.GMAIL_USER;
const GMAIL_APP_PASSWORD = process.env.GMAIL_APP_PASSWORD?.replace(/\s+/g, "");

const FROM =
    process.env.EMAIL_FROM ||
    (GMAIL_USER ? `JobTrack <${GMAIL_USER}>` : "JobTrack");

const APP_URL =
    process.env.NEXT_PUBLIC_APP_URL ||
    "http://localhost:3000";

const IS_DEV = process.env.NODE_ENV !== "production";

const transporter =
    GMAIL_USER && GMAIL_APP_PASSWORD
        ? nodemailer.createTransport({
            host: "smtp.gmail.com",
            port: 465,
            secure: true,
            auth: {
                user: GMAIL_USER,
                pass: GMAIL_APP_PASSWORD,
            },
        })
        : null;

/**
 * In development, if Gmail isn't configured or sending fails, print the
 * link to the terminal instead of failing sign-up / password reset.
 */
function devFallback(
    kind: string,
    email: string,
    url: string,
    reason: string,
) {
    if (!IS_DEV) return false;

    console.warn(
        `\n[email:dev] Could not send ${kind} email to ${email} (${reason}).\n` +
        `[email:dev] Open this link instead:\n  ${url}\n`,
    );

    return true;
}

async function sendMail(
    kind: string,
    to: string,
    subject: string,
    text: string,
    url: string,
) {
    if (!transporter) {
        if (devFallback(kind, to, url, "GMAIL_USER / GMAIL_APP_PASSWORD not set")) return;

        throw new Error(
            `Failed to send ${kind} email: Gmail SMTP is not configured.`,
        );
    }

    try {
        await transporter.sendMail({
            from: FROM,
            to,
            subject,
            text,
        });
    } catch (error) {
        const reason =
            error instanceof Error ? error.message : String(error);

        if (devFallback(kind, to, url, reason)) return;

        throw new Error(
            `Failed to send ${kind} email: ${reason}`,
        );
    }
}

export async function sendVerificationEmail(
    email: string,
    token: string,
) {
    const verificationUrl =
        `${APP_URL}/api/verify-email?token=${encodeURIComponent(token)}`;

    await sendMail(
        "verification",
        email,
        "Verify your JobTrack email",
        [
            "Welcome to JobTrack.",
            "",
            "Please verify your email address by opening this link:",
            "",
            verificationUrl,
            "",
            "This link expires in 30 minutes.",
            "",
            "If you did not create a JobTrack account, you can safely ignore this email.",
        ].join("\n"),
        verificationUrl,
    );
}

export async function sendPasswordResetEmail(
    email: string,
    token: string,
    purpose: "reset" | "set" = "reset",
) {
    const resetUrl =
        `${APP_URL}/reset-password?token=${encodeURIComponent(token)}`;

    const setting = purpose === "set";

    await sendMail(
        setting ? "set password" : "password reset",
        email,
        setting ? "Set a password for JobTrack" : "Reset your JobTrack password",
        [
            setting
                ? "You asked to add a password to your JobTrack account from Settings."
                : "We received a request to reset your JobTrack password.",
            "",
            setting ? "Choose your password by opening this link:" : "Reset your password by opening this link:",
            "",
            resetUrl,
            "",
            "This link expires in 30 minutes.",
            "",
            setting
                ? "If this wasn't you, don't open the link, and sign in to check your account. Someone may have access to it."
                : "If you did not request a password reset, you can safely ignore this email.",
        ].join("\n"),
        resetUrl,
    );
}

/**
 * Heads-up after a password change, so the real owner notices if someone
 * else changed it. Failure to send never blocks the change itself.
 */
export async function sendPasswordChangedEmail(email: string) {
    const resetUrl = `${APP_URL}/forgot-password`;

    try {
        await sendMail(
            "password changed",
            email,
            "Your JobTrack password was changed",
            [
                "The password for your JobTrack account was just changed, and every other device was signed out.",
                "",
                "If this was you, there's nothing to do.",
                "",
                "If it wasn't, reset your password right away:",
                "",
                resetUrl,
            ].join("\n"),
            resetUrl,
        );
    } catch (error) {
        console.error("[email] password-changed notice failed:", error);
    }
}

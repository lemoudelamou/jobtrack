
import { prisma } from "@/lib/prisma";

const WINDOW_MS = 15 * 60 * 1000;

const MAX_EMAIL_ATTEMPTS = 5;
const MAX_IP_ATTEMPTS = 20;

const MAX_RESET_EMAIL_ATTEMPTS = 3;
const MAX_RESET_IP_ATTEMPTS = 10;

const MAX_PASSKEY_IP_ATTEMPTS = 20;
const MAX_REAUTH_USER_ATTEMPTS = 5;

const MAX_KEY_LENGTH = 320;

const BACKOFF_DELAYS_MS = [
    0,
    0,
    1000,
    2000,
    4000,
    8000,
];

function normalizeEmail(email: string) {
    return email.trim().toLowerCase();
}

function normalizeValue(value: string) {
    return value.trim();
}

function limitKeyLength(value: string) {
    return value.slice(0, MAX_KEY_LENGTH);
}

function emailKey(email: string) {
    return limitKeyLength(
        `email:${normalizeEmail(email)}`,
    );
}

function ipKey(ip: string) {
    return limitKeyLength(
        `ip:${normalizeValue(ip)}`,
    );
}

function resetEmailKey(email: string) {
    return limitKeyLength(
        `reset-email:${normalizeEmail(email)}`,
    );
}

function resetIpKey(ip: string) {
    return limitKeyLength(
        `reset-ip:${normalizeValue(ip)}`,
    );
}

function passkeyIpKey(ip: string) {
    return limitKeyLength(
        `passkey-ip:${normalizeValue(ip)}`,
    );
}

function reauthUserKey(userId: string) {
    return limitKeyLength(
        `reauth-user:${normalizeValue(userId)}`,
    );
}

/**
 * Returns the client IP as reported by the trusted proxy.
 *
 * IMPORTANT:
 * This application should only be exposed through infrastructure
 * that sanitizes/sets these headers correctly.
 *
 * We intentionally do not trust arbitrary forwarded IP chains.
 */
export function getClientIp(headers: Headers) {
    const forwardedFor =
        headers.get("x-forwarded-for");

    if (forwardedFor) {
        const firstIp =
            forwardedFor
                .split(",")[0]
                ?.trim();

        if (firstIp) {
            return limitKeyLength(firstIp);
        }
    }

    const realIp =
        headers.get("x-real-ip")?.trim();

    if (realIp) {
        return limitKeyLength(realIp);
    }

    return "unknown";
}

function getWindowStart() {
    return new Date(
        Date.now() - WINDOW_MS,
    );
}

async function countAttempts(key: string) {
    return prisma.loginAttempt.count({
        where: {
            key,
            failedAt: {
                gte: getWindowStart(),
            },
        },
    });
}

async function getOldestAttempt(
    key: string,
) {
    return prisma.loginAttempt.findFirst({
        where: {
            key,
            failedAt: {
                gte: getWindowStart(),
            },
        },
        orderBy: {
            failedAt: "asc",
        },
        select: {
            failedAt: true,
        },
    });
}

/**
 * Removes attempts that can no longer affect any active
 * rate-limit window.
 *
 * This is intentionally best-effort. A cleanup failure should
 * never prevent authentication from working.
 */
export async function cleanupExpiredLoginAttempts() {
    try {
        return await prisma.loginAttempt.deleteMany({
            where: {
                failedAt: {
                    lt: getWindowStart(),
                },
                // Monthly API budgets (e.g. JSearch) live here too; keep them.
                NOT: { key: { startsWith: "monthly:" } },
            },
        });
    } catch (error) {
        console.error(
            "Login attempt cleanup error:",
            error,
        );

        return null;
    }
}

/* ---------------------------------- */
/* Login rate limiting */
/* ---------------------------------- */

export async function isLoginRateLimited(
    email: string,
    ip: string,
) {
    const normalizedEmail =
        normalizeEmail(email);

    const normalizedIp =
        normalizeValue(ip);

    const [
        emailAttempts,
        ipAttempts,
    ] = await Promise.all([
        countAttempts(
            emailKey(normalizedEmail),
        ),
        countAttempts(
            ipKey(normalizedIp),
        ),
    ]);

    return (
        emailAttempts >=
        MAX_EMAIL_ATTEMPTS ||
        ipAttempts >= MAX_IP_ATTEMPTS
    );
}

export async function getLoginRateLimitRemainingMs(
    email: string,
    ip: string,
) {
    const normalizedEmail =
        normalizeEmail(email);

    const normalizedIp =
        normalizeValue(ip);

    const emailKeyValue =
        emailKey(normalizedEmail);

    const ipKeyValue =
        ipKey(normalizedIp);

    const [
        emailAttempts,
        ipAttempts,
    ] = await Promise.all([
        countAttempts(emailKeyValue),
        countAttempts(ipKeyValue),
    ]);

    const expirationTimes: number[] = [];

    if (
        emailAttempts >=
        MAX_EMAIL_ATTEMPTS
    ) {
        const oldestEmailAttempt =
            await getOldestAttempt(
                emailKeyValue,
            );

        if (oldestEmailAttempt) {
            expirationTimes.push(
                oldestEmailAttempt.failedAt.getTime() +
                WINDOW_MS,
            );
        }
    }

    if (
        ipAttempts >=
        MAX_IP_ATTEMPTS
    ) {
        const oldestIpAttempt =
            await getOldestAttempt(
                ipKeyValue,
            );

        if (oldestIpAttempt) {
            expirationTimes.push(
                oldestIpAttempt.failedAt.getTime() +
                WINDOW_MS,
            );
        }
    }

    if (expirationTimes.length === 0) {
        return 0;
    }

    const unlockAt = Math.max(
        ...expirationTimes,
    );

    return Math.max(
        0,
        unlockAt - Date.now(),
    );
}

export async function getLoginBackoffMs(
    email: string,
    ip: string,
) {
    const normalizedEmail =
        normalizeEmail(email);

    const normalizedIp =
        normalizeValue(ip);

    const [
        emailAttempts,
        ipAttempts,
    ] = await Promise.all([
        countAttempts(
            emailKey(normalizedEmail),
        ),
        countAttempts(
            ipKey(normalizedIp),
        ),
    ]);

    const attempts = Math.max(
        emailAttempts,
        ipAttempts,
    );

    const index = Math.min(
        attempts,
        BACKOFF_DELAYS_MS.length - 1,
    );

    return BACKOFF_DELAYS_MS[index];
}

export async function recordFailedLogin(
    email: string,
    ip: string,
) {
    const normalizedEmail =
        normalizeEmail(email);

    const normalizedIp =
        normalizeValue(ip);

    await prisma.loginAttempt.createMany({
        data: [
            {
                key: emailKey(
                    normalizedEmail,
                ),
            },
            {
                key: ipKey(
                    normalizedIp,
                ),
            },
        ],
    });
}

export async function clearLoginAttempts(
    email: string,
    ip: string,
) {
    const normalizedEmail =
        normalizeEmail(email);

    const normalizedIp =
        normalizeValue(ip);

    await prisma.loginAttempt.deleteMany({
        where: {
            key: {
                in: [
                    emailKey(
                        normalizedEmail,
                    ),
                    ipKey(normalizedIp),
                ],
            },
        },
    });
}

/* ---------------------------------- */
/* Password reset rate limiting */
/* ---------------------------------- */

export async function isPasswordResetRateLimited(
    email: string,
    ip: string,
) {
    const normalizedEmail =
        normalizeEmail(email);

    const normalizedIp =
        normalizeValue(ip);

    const [
        emailAttempts,
        ipAttempts,
    ] = await Promise.all([
        countAttempts(
            resetEmailKey(
                normalizedEmail,
            ),
        ),
        countAttempts(
            resetIpKey(normalizedIp),
        ),
    ]);

    return (
        emailAttempts >=
        MAX_RESET_EMAIL_ATTEMPTS ||
        ipAttempts >= MAX_RESET_IP_ATTEMPTS
    );
}

export async function recordPasswordResetRequest(
    email: string,
    ip: string,
) {
    const normalizedEmail =
        normalizeEmail(email);

    const normalizedIp =
        normalizeValue(ip);

    await prisma.loginAttempt.createMany({
        data: [
            {
                key: resetEmailKey(
                    normalizedEmail,
                ),
            },
            {
                key: resetIpKey(
                    normalizedIp,
                ),
            },
        ],
    });
}

/* ---------------------------------- */
/* Passkey authentication rate limiting */
/* ---------------------------------- */

export async function isPasskeyRateLimited(
    ip: string,
) {
    const normalizedIp =
        normalizeValue(ip);

    const attempts =
        await countAttempts(
            passkeyIpKey(normalizedIp),
        );

    return (
        attempts >=
        MAX_PASSKEY_IP_ATTEMPTS
    );
}

export async function recordFailedPasskey(
    ip: string,
) {
    const normalizedIp =
        normalizeValue(ip);

    await prisma.loginAttempt.create({
        data: {
            key: passkeyIpKey(
                normalizedIp,
            ),
        },
    });
}

export async function clearPasskeyAttempts(
    ip: string,
) {
    const normalizedIp =
        normalizeValue(ip);

    await prisma.loginAttempt.deleteMany({
        where: {
            key: passkeyIpKey(
                normalizedIp,
            ),
        },
    });
}

/* ---------------------------------- */
/* Reauthentication rate limiting */
/* ---------------------------------- */

export async function isReauthRateLimited(
    userId: string,
) {
    const normalizedUserId =
        normalizeValue(userId);

    const attempts =
        await countAttempts(
            reauthUserKey(
                normalizedUserId,
            ),
        );

    return (
        attempts >=
        MAX_REAUTH_USER_ATTEMPTS
    );
}

export async function getReauthRateLimitRemainingMs(
    userId: string,
) {
    const normalizedUserId =
        normalizeValue(userId);

    const key =
        reauthUserKey(
            normalizedUserId,
        );

    const attempts =
        await countAttempts(key);

    if (
        attempts <
        MAX_REAUTH_USER_ATTEMPTS
    ) {
        return 0;
    }

    const oldestAttempt =
        await getOldestAttempt(key);

    if (!oldestAttempt) {
        return 0;
    }

    const unlockAt =
        oldestAttempt.failedAt.getTime() +
        WINDOW_MS;

    return Math.max(
        0,
        unlockAt - Date.now(),
    );
}

export async function recordFailedReauth(
    userId: string,
) {
    const normalizedUserId =
        normalizeValue(userId);

    await prisma.loginAttempt.create({
        data: {
            key: reauthUserKey(
                normalizedUserId,
            ),
        },
    });
}

export async function clearReauthAttempts(
    userId: string,
) {
    const normalizedUserId =
        normalizeValue(userId);

    await prisma.loginAttempt.deleteMany({
        where: {
            key: reauthUserKey(
                normalizedUserId,
            ),
        },
    });
}

export async function getReauthBackoffMs(
    userId: string,
) {
    const normalizedUserId =
        normalizeValue(userId);

    const attempts =
        await countAttempts(
            reauthUserKey(
                normalizedUserId,
            ),
        );

    const index = Math.min(
        attempts,
        BACKOFF_DELAYS_MS.length - 1,
    );

    return BACKOFF_DELAYS_MS[index];
}


/* ---------------------------------- */
/* Per-user quotas for paid AI calls */
/* ---------------------------------- */

const USER_QUOTAS = {
    "ai-insights": 10,
    "resume-upload": 5,
    "resume-search": 30,
    "job-import": 30,
    "job-import-ai": 5,
    "radar-refresh": 6,
    "radar-explain": 20,
    "job-capture": 60,
    "gmail-sync": 10,
    "cv-tailor": 5,
    "job-notes": 20,
    "inbox-sync": 12,
} as const;

export type UserQuotaKind = keyof typeof USER_QUOTAS;

/**
 * Records one use of `kind` for this user and returns false if the
 * user has already hit the limit for the current 15-minute window.
 */
export async function consumeUserQuota(
    kind: UserQuotaKind,
    userId: string,
) {
    const key = limitKeyLength(
        `${kind}:${normalizeValue(userId)}`,
    );

    const used = await countAttempts(key);

    if (used >= USER_QUOTAS[kind]) {
        return false;
    }

    await prisma.loginAttempt.create({
        data: { key },
    });

    return true;
}

/**
 * Gives back the last use of `kind`, e.g. when the AI provider was down and
 * the user got nothing for it.
 */
export async function refundUserQuota(
    kind: UserQuotaKind,
    userId: string,
) {
    const key = limitKeyLength(
        `${kind}:${normalizeValue(userId)}`,
    );

    const last = await prisma.loginAttempt.findFirst({
        where: { key, failedAt: { gte: getWindowStart() } },
        orderBy: { failedAt: "desc" },
        select: { id: true },
    });

    if (last) {
        await prisma.loginAttempt.delete({ where: { id: last.id } }).catch(() => {});
    }
}

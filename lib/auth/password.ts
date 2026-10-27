import argon2 from "argon2";

const ARGON2_OPTIONS: argon2.HashOptions = {
    type: argon2.argon2id,
    memoryCost: 19_456,
    timeCost: 2,
    parallelism: 1,
};

export const MIN_PASSWORD_LENGTH = 8;
export const MAX_PASSWORD_LENGTH = 128;

export function validatePassword(
    password: string,
) {
    if (
        password.length <
        MIN_PASSWORD_LENGTH
    ) {
        return `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`;
    }

    if (
        password.length >
        MAX_PASSWORD_LENGTH
    ) {
        return `Password must be at most ${MAX_PASSWORD_LENGTH} characters.`;
    }

    return null;
}

export async function hashPassword(
    password: string,
): Promise<string> {
    return argon2.hash(
        password,
        ARGON2_OPTIONS,
    );
}

export async function verifyPassword(
    password: string,
    passwordHash: string,
) {
    return argon2.verify(
        passwordHash,
        password,
    );
}

export function isArgon2Hash(
    passwordHash: string,
) {
    return passwordHash.startsWith(
        "$argon2",
    );
}
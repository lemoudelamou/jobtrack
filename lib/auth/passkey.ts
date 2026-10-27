import {
    generateAuthenticationOptions,
    generateRegistrationOptions,
    verifyAuthenticationResponse,
    verifyRegistrationResponse,
} from "@simplewebauthn/server";

import type {
    AuthenticationResponseJSON,
    AuthenticatorTransportFuture,
    RegistrationResponseJSON,
} from "@simplewebauthn/types";

import { prisma } from "@/lib/prisma";

const RP_NAME = "JobTrack";

const RP_ID =
    process.env.PASSKEY_RP_ID ||
    "localhost";

const ORIGIN =
    process.env.NEXT_PUBLIC_APP_URL ||
    "http://localhost:3000";

function validateWebAuthnConfig() {
    let origin: URL;

    try {
        origin = new URL(ORIGIN);
    } catch {
        throw new Error(
            "NEXT_PUBLIC_APP_URL must be a valid URL.",
        );
    }

    if (
        process.env.NODE_ENV ===
        "production" &&
        origin.protocol !== "https:"
    ) {
        throw new Error(
            "WebAuthn requires an HTTPS origin in production.",
        );
    }

    if (
        RP_ID.includes("://") ||
        RP_ID.includes("/") ||
        RP_ID.includes(":")
    ) {
        throw new Error(
            "PASSKEY_RP_ID must contain only the WebAuthn RP ID/hostname.",
        );
    }
}

function bufferToBase64Url(
    value: Uint8Array,
) {
    return Buffer.from(
        value,
    ).toString("base64url");
}

function base64UrlToBuffer(
    value: string,
) {
    return Buffer.from(
        value,
        "base64url",
    );
}

export async function createRegistrationOptions(
    userId: string,
    userName: string,
) {
    validateWebAuthnConfig();

    const existingPasskeys =
        await prisma.passkey.findMany({
            where: {
                userId,
            },
            select: {
                credentialId: true,
                transports: true,
            },
        });

    return generateRegistrationOptions({
        rpName: RP_NAME,

        rpID: RP_ID,

        userID: userId,

        userName,

        userDisplayName:
            userName,

        attestationType: "none",

        excludeCredentials:
            existingPasskeys.map(
                (passkey) => ({
                    id: base64UrlToBuffer(
                        passkey.credentialId,
                    ),
                    type: "public-key",
                    ...(passkey.transports
                        ? {
                            transports:
                                passkey.transports
                                    .split(",")
                                    .filter(
                                        Boolean,
                                    ) as AuthenticatorTransportFuture[],
                        }
                        : {}),
                }),
            ),

        authenticatorSelection: {
            residentKey: "preferred",
            userVerification: "required",
        },

        supportedAlgorithmIDs: [
            -7,
            -257,
        ],
    });
}

export async function verifyRegistration(
    userId: string,
    response: RegistrationResponseJSON,
    expectedChallenge: string,
) {
    validateWebAuthnConfig();

    const verification =
        await verifyRegistrationResponse({
            response,

            expectedChallenge,

            expectedOrigin: ORIGIN,

            expectedRPID: RP_ID,

            requireUserVerification:
                true,
        });

    if (
        !verification.verified ||
        !verification.registrationInfo
    ) {
        return {
            verified: false,
        };
    }

    const {
        credentialID,
        credentialPublicKey,
        counter,
        credentialDeviceType,
        credentialBackedUp,
    } =
        verification.registrationInfo;

    const credentialId =
        bufferToBase64Url(
            credentialID,
        );

    const existing =
        await prisma.passkey.findUnique({
            where: {
                credentialId,
            },
            select: {
                id: true,
            },
        });

    if (existing) {
        return {
            verified: false,
            error:
                "This passkey is already registered.",
        };
    }

    await prisma.passkey.create({
        data: {
            userId,

            credentialId,

            publicKey:
                bufferToBase64Url(
                    credentialPublicKey,
                ),

            counter,

            deviceType:
                credentialDeviceType,

            backedUp:
                credentialBackedUp,

            transports:
                response.response
                    .transports
                    ?.join(",") ||
                null,
        },
    });

    return {
        verified: true,
    };
}

export async function createAuthenticationOptions() {
    validateWebAuthnConfig();

    return generateAuthenticationOptions({
        rpID: RP_ID,

        userVerification: "required",
    });
}

export async function verifyAuthentication(
    response: AuthenticationResponseJSON,
    expectedChallenge: string,
) {
    validateWebAuthnConfig();

    const credentialId =
        response.id;

    const passkey =
        await prisma.passkey.findUnique({
            where: {
                credentialId,
            },
            select: {
                id: true,
                credentialId: true,
                publicKey: true,
                counter: true,
                transports: true,

                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        image: true,
                    },
                },
            },
        });

    if (!passkey) {
        return {
            verified: false,
        };
    }

    const verification =
        await verifyAuthenticationResponse({
            response,

            expectedChallenge,

            expectedOrigin: ORIGIN,

            expectedRPID: RP_ID,

            requireUserVerification:
                true,

            authenticator: {
                credentialID:
                    base64UrlToBuffer(
                        passkey.credentialId,
                    ),

                credentialPublicKey:
                    base64UrlToBuffer(
                        passkey.publicKey,
                    ),

                counter:
                    passkey.counter,

                transports:
                    passkey.transports
                        ? (passkey.transports
                            .split(",")
                            .filter(
                                Boolean,
                            ) as AuthenticatorTransportFuture[])
                        : undefined,
            },
        });

    if (!verification.verified) {
        return {
            verified: false,
        };
    }

    const newCounter =
        verification
            .authenticationInfo
            .newCounter;

    /*
     * For authenticators that maintain a
     * signature counter, only accept the
     * update if the stored counter is still
     * the value we verified against.
     *
     * This prevents two concurrent requests
     * from blindly overwriting each other's
     * counter state.
     */
    if (
        newCounter !==
        passkey.counter
    ) {
        const counterUpdate =
            await prisma.passkey.updateMany(
                {
                    where: {
                        id: passkey.id,
                        counter:
                            passkey.counter,
                    },
                    data: {
                        counter:
                            newCounter,
                    },
                },
            );

        if (
            counterUpdate.count !==
            1
        ) {
            return {
                verified: false,
            };
        }
    }

    return {
        verified: true,
        user: passkey.user,
    };
}
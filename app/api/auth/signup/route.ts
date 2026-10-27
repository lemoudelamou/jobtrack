import { prisma } from "@/lib/prisma";

import {
    hashPassword,
    validatePassword,
} from "@/lib/auth/password";

import {
    createEmailVerificationToken,
} from "@/lib/auth/email-verification";

import {
    badRequest,
    conflict,
    parseJson,
    withErrorHandling,
} from "@/lib/api/server";

export const POST = withErrorHandling(async (request) => {
    console.log("SIGNUP: request received");

    const body = await parseJson(request);

    if (
        typeof body !== "object" ||
        body === null
    ) {
        return badRequest("Invalid request body.");
    }

    const name =
        "name" in body &&
            typeof body.name === "string"
            ? body.name.trim()
            : "";

    const email =
        "email" in body &&
            typeof body.email === "string"
            ? body.email.trim().toLowerCase()
            : "";

    const password =
        "password" in body &&
            typeof body.password === "string"
            ? body.password
            : "";

    console.log("SIGNUP: parsed request", {
        email,
        hasPassword: Boolean(password),
    });

    if (!email || !password) {
        return badRequest(
            "Email and password are required.",
        );
    }

    const passwordError =
        validatePassword(password);

    if (passwordError) {
        return badRequest(passwordError);
    }

    const existingUser =
        await prisma.user.findUnique({
            where: {
                email,
            },
            select: {
                id: true,
            },
        });

    if (existingUser) {
        return conflict(
            "An account with this email already exists.",
        );
    }

    console.log("SIGNUP: creating password hash");

    const passwordHash =
        await hashPassword(password);

    console.log("SIGNUP: creating user");

    const user = await prisma.user.create({
        data: {
            name: name || null,
            email,
            passwordHash,
        },
        select: {
            id: true,
            email: true,
            name: true,
        },
    });

    console.log("SIGNUP: user created", {
        userId: user.id,
        email: user.email,
    });

    console.log(
        "SIGNUP: creating email verification token",
    );

    await createEmailVerificationToken(
        user.id,
        user.email!,
    );

    console.log(
        "SIGNUP: email verification process completed",
    );

    return Response.json(
        {
            user,
        },
        { status: 201 },
    );
});
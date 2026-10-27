import { NextResponse } from "next/server";
import type { ZodError } from "zod";

/**
 * Standard API error response.
 */
export function apiError(
    error: string,
    status: number,
) {
    return NextResponse.json(
        { error },
        { status },
    );
}

export const badRequest = (
    error = "Bad request.",
) => apiError(error, 400);

export const unauthorized = (
    error = "Unauthorized.",
) => apiError(error, 401);

export const forbidden = (
    error = "Forbidden.",
) => apiError(error, 403);

export const notFound = (
    error = "Not found.",
) => apiError(error, 404);

export const conflict = (
    error = "Conflict.",
) => apiError(error, 409);

export const tooManyRequests = (
    error = "Too many requests.",
) => apiError(error, 429);

export const internalServerError = (
    error = "Something went wrong. Please try again.",
) => apiError(error, 500);

/**
 * Extracts the first useful message from a Zod error.
 */
export function zodErrorMessage(
    error: ZodError,
): string {
    return (
        error.issues[0]?.message ??
        "Invalid request."
    );
}

/**
 * Safely parses a JSON request body.
 */
export async function parseJson(
    request: Request,
): Promise<unknown | null> {
    try {
        return await request.json();
    } catch {
        return null;
    }
}

/**
 * Wrap an API route so unexpected errors become
 * a consistent 500 response.
 */


type RouteHandler<TContext = unknown> = (
    request: Request,
    context: TContext,
) => Promise<Response>;

export function withErrorHandling<TContext>(
    handler: RouteHandler<TContext>,
) {
    return async (
        request: Request,
        context: TContext,
    ): Promise<Response> => {
        try {
            return await handler(request, context);
        } catch (error) {
            console.error(
                `[${new URL(request.url).pathname}] Unhandled error:`,
                error,
            );

            return internalServerError();
        }
    };
}




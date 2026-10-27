
import { signOut } from "next-auth/react";

/**
 * Custom error thrown for failed API requests.
 */
export class ApiError extends Error {
  readonly status: number;
  readonly data?: unknown;

  constructor(
    message: string,
    status: number,
    data?: unknown,
  ) {
    super(message);

    this.name = "ApiError";
    this.status = status;
    this.data = data;

    // Required for correct instanceof behavior in some transpilation targets.
    Object.setPrototypeOf(this, ApiError.prototype);
  }
}

type ApiRequestOptions = RequestInit & {
  /**
   * Automatically sign the user out when the API returns 401.
   * @default true
   */
  handleUnauthorized?: boolean;
};

/**
 * Safely parses an API response.
 *
 * Supports:
 * - JSON responses
 * - Plain text responses
 * - Empty responses
 */
async function parseResponseBody(
  response: Response,
): Promise<unknown> {
  const text = await response.text();

  if (!text.trim()) {
    return undefined;
  }

  const contentType = response.headers.get("content-type") ?? "";

  // Prefer JSON parsing when the server explicitly says it's JSON.
  if (contentType.includes("application/json")) {
    try {
      return JSON.parse(text);
    } catch {
      return text;
    }
  }

  // Some APIs return JSON without the correct Content-Type.
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

/**
 * Extracts a useful error message from common API error formats.
 */
function getErrorMessage(
  data: unknown,
  fallback: string,
): string {
  if (typeof data === "string" && data.trim()) {
    return data;
  }

  if (
    typeof data === "object" &&
    data !== null
  ) {
    if (
      "error" in data &&
      typeof data.error === "string" &&
      data.error.trim()
    ) {
      return data.error;
    }

    if (
      "message" in data &&
      typeof data.message === "string" &&
      data.message.trim()
    ) {
      return data.message;
    }
  }

  return fallback;
}

/**
 * Makes an HTTP request to the API.
 */
export async function apiRequest<T>(
  url: string,
  options: ApiRequestOptions = {},
): Promise<T> {
  const {
    handleUnauthorized = true,
    headers,
    ...init
  } = options;

  const response = await fetch(url, {
    ...init,
    headers: {
      Accept: "application/json",
      ...headers,
    },
  });

  const data = await parseResponseBody(response);

  /**
   * Handle authentication failures.
   */
  if (response.status === 401) {
    if (handleUnauthorized) {
      await signOut({
        callbackUrl: "/login",
      });
    }

    throw new ApiError(
      getErrorMessage(
        data,
        "Your session has expired. Please sign in again.",
      ),
      401,
      data,
    );
  }

  /**
   * Handle all other HTTP errors.
   */
  if (!response.ok) {
    throw new ApiError(
      getErrorMessage(
        data,
        `Request failed with status ${response.status}.`,
      ),
      response.status,
      data,
    );
  }

  return data as T;
}

/**
 * JSON request helper.
 *
 * Keeps JSON serialization and Content-Type handling
 * out of the generic apiRequest function.
 */
function jsonRequest<T>(
  url: string,
  method: "POST" | "PUT" | "PATCH",
  body?: unknown,
  options: RequestInit = {},
): Promise<T> {
  const {
    headers,
    ...init
  } = options;

  return apiRequest<T>(url, {
    ...init,
    method,
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
    body:
      body === undefined
        ? undefined
        : JSON.stringify(body),
  });
}

/**
 * Convenient API methods.
 */
export const api = {
  get: <T>(
    url: string,
    options?: RequestInit,
  ): Promise<T> =>
    apiRequest<T>(url, {
      ...options,
      method: "GET",
    }),

  post: <T>(
    url: string,
    body?: unknown,
    options?: RequestInit,
  ): Promise<T> =>
    jsonRequest<T>(
      url,
      "POST",
      body,
      options,
    ),

  put: <T>(
    url: string,
    body?: unknown,
    options?: RequestInit,
  ): Promise<T> =>
    jsonRequest<T>(
      url,
      "PUT",
      body,
      options,
    ),

  patch: <T>(
    url: string,
    body?: unknown,
    options?: RequestInit,
  ): Promise<T> =>
    jsonRequest<T>(
      url,
      "PATCH",
      body,
      options,
    ),

  delete: <T>(
    url: string,
    options?: RequestInit,
  ): Promise<T> =>
    apiRequest<T>(url, {
      ...options,
      method: "DELETE",
    }),
};

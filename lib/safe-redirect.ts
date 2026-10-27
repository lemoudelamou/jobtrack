/**
 * Where to go after signing in. Only paths inside JobTrack are allowed, so
 * a crafted ?callbackUrl= can't send people to another site.
 */
export function safeCallbackUrl(value: unknown, fallback = "/dashboard") {
    if (typeof value !== "string") return fallback;
    const path = value.trim();
    if (!path.startsWith("/") || path.startsWith("//") || path.startsWith("/\\") || /[\r\n]/.test(path)) return fallback;
    if (path.startsWith("/login") || path.startsWith("/signup") || path.startsWith("/api/")) return fallback;
    return path.slice(0, 500);
}

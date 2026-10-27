import { auth } from "@/auth";

export const proxy = auth((request) => {
    const { pathname } = request.nextUrl;

    if (!request.auth) {
        // Signed-out visitors see the landing page at "/".
        if (pathname === "/") return;

        const loginUrl = new URL("/login", request.url);

        loginUrl.searchParams.set("callbackUrl", pathname);

        return Response.redirect(loginUrl);
    }

    // Signed-in users skip the landing page.
    if (pathname === "/") {
        return Response.redirect(new URL("/dashboard", request.url));
    }

    return;
});

export const config = {
    matcher: [
        "/",
        "/dashboard/:path*",
        "/radar/:path*",
        "/calendar/:path*",
        "/settings/:path*",
        "/jobs/:path*",
    ],
};

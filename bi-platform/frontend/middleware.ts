import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ── Admin routes — require JWT cookie ────────────────────────────────────
  if (pathname.startsWith("/admin") && pathname !== "/admin/login") {
    const token = request.cookies.get("bi_access_token")?.value;
    if (!token) {
      const loginUrl = new URL("/admin/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }
    // JWT signature validation happens on each page's server-side data fetch
    // Middleware checks presence only — FastAPI validates the signature
  }

  // ── Client portal — require UUID token ───────────────────────────────────
  if (pathname.startsWith("/cliente")) {
    const queryToken = request.nextUrl.searchParams.get("token");
    const cookieToken = request.cookies.get("bi_client_token")?.value;

    if (!queryToken && !cookieToken) {
      return new NextResponse(
        "Acceso denegado. Por favor usa el enlace de tu dashboard.",
        { status: 401 }
      );
    }

    // Token came via query param → set as httpOnly cookie and redirect to clean URL
    if (queryToken) {
      const cleanUrl = new URL(pathname, request.url);
      // Preserve other query params (date_from, date_to) but remove 'token'
      request.nextUrl.searchParams.forEach((value, key) => {
        if (key !== "token") cleanUrl.searchParams.set(key, value);
      });

      const response = NextResponse.redirect(cleanUrl);
      response.cookies.set("bi_client_token", queryToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 30, // 30 days
        path: "/cliente",
      });
      return response;
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/cliente/:path*"],
};

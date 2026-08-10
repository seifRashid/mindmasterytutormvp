import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  const sessionCookie = request.cookies.get("mindmastery_session")?.value;

  const url = request.nextUrl.clone();
  const path = url.pathname;

  let session: any = null;
  if (sessionCookie) {
    try {
      session = JSON.parse(decodeURIComponent(sessionCookie));
    } catch (err) {
      // Invalid session cookie
    }
  }

  // 1. /admin protection
  if (path.startsWith("/admin")) {
    if (!session) {
      url.pathname = "/login";
      return NextResponse.redirect(url);
    }
    if (session.role !== "admin") {
      url.pathname = "/login";
      return NextResponse.redirect(url);
    }
  }

  // 2. /teacher protection
  if (path.startsWith("/teacher")) {
    if (!session) {
      url.pathname = "/login";
      return NextResponse.redirect(url);
    }
    if (session.role !== "teacher") {
      url.pathname = "/login";
      return NextResponse.redirect(url);
    }
  }

  // 3. /dashboard protection
  if (path.startsWith("/dashboard")) {
    if (!session) {
      url.pathname = "/login";
      return NextResponse.redirect(url);
    }
    if (session.role !== "student") {
      url.pathname = "/login";
      return NextResponse.redirect(url);
    }
  }

  // 4. /pending-approval protection
  if (path === "/pending-approval") {
    if (!session) {
      url.pathname = "/login";
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/teacher/:path*",
    "/dashboard/:path*",
    "/pending-approval",
  ],
};

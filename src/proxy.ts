import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Edge guard for the authenticated sections of the app.
//
// Tokens live in localStorage (invisible to the server), so this guard reads a
// lightweight, non-sensitive role cookie (`kimates.session`) set by the client
// on login. It is a UX/defense-in-depth gate, NOT the security boundary — the
// backend enforces auth on every API request via Bearer tokens. Here we only
// avoid serving a guarded page shell to an unauthenticated or wrong-role user.
const SESSION_COOKIE = "kimates.session";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const role = request.cookies.get(SESSION_COOKIE)?.value; // "super_admin" | "company" | undefined

  const isAdminRoute = pathname.startsWith("/admin");
  const isCompanyRoute = pathname.startsWith("/company");

  // Not signed in → send to login.
  if (!role) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // Signed in but wrong role → route to the correct dashboard.
  if (isAdminRoute && role !== "super_admin") {
    const url = request.nextUrl.clone();
    url.pathname = "/company/dashboard";
    return NextResponse.redirect(url);
  }
  if (isCompanyRoute && role !== "company") {
    const url = request.nextUrl.clone();
    url.pathname = "/admin/dashboard";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  // Only the authenticated sections — public routes (QR form, login, etc.) are untouched.
  matcher: ["/admin/:path*", "/company/:path*"],
};

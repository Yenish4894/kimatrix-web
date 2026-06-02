import { NextResponse } from "next/server";

// Demo mode — all routes accessible without auth
// Re-enable auth checks when connecting to real backend
export function proxy() {
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|icons/).*)",
  ],
};

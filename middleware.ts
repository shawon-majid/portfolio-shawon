import { NextRequest, NextResponse } from "next/server";
import { verifyBasicAuth } from "./lib/auth";

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};

export function middleware(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (verifyBasicAuth(auth)) return NextResponse.next();
  return new NextResponse("Authentication required", {
    status: 401,
    headers: {
      "WWW-Authenticate": 'Basic realm="portfolio-admin", charset="UTF-8"',
      "Cache-Control": "no-store",
    },
  });
}

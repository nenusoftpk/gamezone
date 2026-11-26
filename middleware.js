import { NextResponse } from "next/server";
import { COOKIE_NAME, verifySuperadminToken } from "@/lib/superadmin-token";

export async function middleware(request) {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 32) {
    return new NextResponse("Superadmin authentication is not configured.", { status: 503 });
  }
  const token = request.cookies.get(COOKIE_NAME)?.value;
  const session = await verifySuperadminToken(token, secret);
  if (session?.role === "superadmin") return NextResponse.next();

  const destination = request.nextUrl.clone();
  destination.pathname = "/login";
  destination.search = "";
  return NextResponse.redirect(destination);
}

export const config = {
  matcher: ["/platform/:path*", "/tenants/:path*", "/plans/:path*", "/subscriptions/:path*", "/resources/:path*", "/platform-audit/:path*"],
};

import { NextResponse } from "next/server";
import { clearSuperadminCookie } from "@/lib/superadmin-token";

export async function POST() {
  const response = NextResponse.json({ ok: true });
  clearSuperadminCookie(response);
  return response;
}

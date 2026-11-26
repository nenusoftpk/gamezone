import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const username = process.env.DEMO_EMPLOYEE_USERNAME?.trim();
  const password = process.env.DEMO_EMPLOYEE_PASSWORD;
  if (!username || !password) {
    return NextResponse.json(
      { error: "Employee demo credentials are not configured." },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
  return NextResponse.json(
    { username, password },
    { headers: { "Cache-Control": "no-store" } },
  );
}

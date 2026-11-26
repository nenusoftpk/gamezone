import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const credentials = {};
  const employeeUsername = process.env.DEMO_EMPLOYEE_USERNAME?.trim();
  const employeePassword = process.env.DEMO_EMPLOYEE_PASSWORD;
  const adminUsername = process.env.DEMO_ADMIN_USERNAME?.trim();
  const adminPassword = process.env.DEMO_ADMIN_PASSWORD;
  if (employeeUsername && employeePassword) {
    credentials.employee = { username: employeeUsername, password: employeePassword };
  }
  if (adminUsername && adminPassword) {
    credentials.admin = { username: adminUsername, password: adminPassword };
  }
  if (!Object.keys(credentials).length) {
    return NextResponse.json(
      { error: "Demo credentials are not configured." },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
  return NextResponse.json(
    credentials,
    { headers: { "Cache-Control": "no-store" } },
  );
}

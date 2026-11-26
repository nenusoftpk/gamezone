import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import PlatformData from "@/lib/models/PlatformData";
import { connectToDatabase } from "@/lib/mongodb";

export const runtime = "nodejs";

export async function POST(request) {
  let credentials;
  try {
    credentials = await request.json();
  } catch {
    return NextResponse.json({ error: "Enter a valid username and password." }, { status: 400 });
  }
  if (typeof credentials?.username !== "string" || typeof credentials?.password !== "string") {
    return NextResponse.json({ error: "Enter a valid username and password." }, { status: 400 });
  }

  try {
    await connectToDatabase();
    const platform = await PlatformData.findOne({ key: "primary" });
    if (!platform) return NextResponse.json({ error: "Branch accounts are not initialized yet." }, { status: 404 });
    const username = credentials.username.trim().toLowerCase();
    const account = platform.data.branchAdmins.find((entry) => entry.username === username);
    if (!account || !await bcrypt.compare(credentials.password, account.passwordHash)) {
      return NextResponse.json({ error: "Username or password is incorrect." }, { status: 401 });
    }
    const tenant = platform.data.tenants.find((entry) => entry.id === account.tenantId && entry.on);
    if (!tenant || !account.active) return NextResponse.json({ error: "This branch account is inactive." }, { status: 403 });
    return NextResponse.json({
      account: {
        id: account.id,
        username: account.username,
        role: "admin",
        name: account.name,
        tenantId: account.tenantId,
        active: true,
      },
    });
  } catch (error) {
    console.error("Branch admin login failed:", error?.name || "UnknownError");
    return NextResponse.json({ error: "Branch sign-in is unavailable. Check MongoDB and try again." }, { status: 503 });
  }
}

import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import Superadmin from "@/lib/models/Superadmin";
import { connectToDatabase } from "@/lib/mongodb";
import { COOKIE_NAME, getSuperadminAuthSecret, verifySuperadminToken } from "@/lib/superadmin-token";

export const runtime = "nodejs";

export async function PATCH(request) {
  let secret;
  try {
    secret = getSuperadminAuthSecret();
  } catch {
    return NextResponse.json({ error: "Superadmin authentication is not configured." }, { status: 503 });
  }

  const token = request.cookies.get(COOKIE_NAME)?.value;
  const session = await verifySuperadminToken(token, secret);
  if (!session) return NextResponse.json({ error: "Sign in again before changing this password." }, { status: 401 });

  let passwords;
  try {
    passwords = await request.json();
  } catch {
    return NextResponse.json({ error: "Enter valid password details." }, { status: 400 });
  }
  if (typeof passwords?.current !== "string" || typeof passwords?.next !== "string" || passwords.next.length < 12) {
    return NextResponse.json({ error: "New password must be at least 12 characters." }, { status: 400 });
  }

  try {
    await connectToDatabase();
    const account = await Superadmin.findById(session.sub);
    if (!account) return NextResponse.json({ error: "Superadmin account no longer exists." }, { status: 401 });
    if (!await bcrypt.compare(passwords.current, account.passwordHash)) {
      return NextResponse.json({ error: "Current password is incorrect." }, { status: 400 });
    }
    account.passwordHash = await bcrypt.hash(passwords.next, 12);
    await account.save();
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Superadmin password update failed:", error?.name || "UnknownError");
    return NextResponse.json(
      { error: "Could not update the superadmin password. Check the MongoDB connection and try again." },
      { status: 503 },
    );
  }
}

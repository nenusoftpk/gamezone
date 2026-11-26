import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import Superadmin from "@/lib/models/Superadmin";
import { connectToDatabase } from "@/lib/mongodb";
import { createSuperadminToken, getSuperadminAuthSecret, setSuperadminCookie } from "@/lib/superadmin-token";

export const runtime = "nodejs";

const unavailable = () => NextResponse.json(
  { error: "Superadmin authentication is unavailable. Check MongoDB and server configuration." },
  { status: 503 },
);

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
    const secret = getSuperadminAuthSecret();
    await connectToDatabase();
    let account = await Superadmin.findOne({ role: "superadmin" });

    if (!account) {
      const bootstrapPassword = process.env.SUPERADMIN_PASSWORD;
      if (!bootstrapPassword || bootstrapPassword.length < 12) {
        return NextResponse.json(
          { error: "Set SUPERADMIN_PASSWORD to at least 12 characters in .env.local, then restart the app." },
          { status: 503 },
        );
      }

      try {
        account = await Superadmin.create({
          username: "superadmin",
          passwordHash: await bcrypt.hash(bootstrapPassword, 12),
          name: "Platform Team",
          role: "superadmin",
        });
      } catch (error) {
        if (error?.code !== 11000) throw error;
        account = await Superadmin.findOne({ role: "superadmin" });
        if (!account) throw error;
      }
    }

    const usernameMatches = account.username === credentials.username.trim().toLowerCase();
    const passwordMatches = await bcrypt.compare(credentials.password, account.passwordHash);
    if (!usernameMatches || !passwordMatches) {
      return NextResponse.json({ error: "Username or password is incorrect." }, { status: 401 });
    }

    const token = await createSuperadminToken(account._id.toString(), secret);
    const response = NextResponse.json({
      account: { id: account._id.toString(), role: "superadmin", name: account.name, active: true },
    });
    setSuperadminCookie(response, token);
    return response;
  } catch (error) {
    console.error("Superadmin login failed:", error?.name || "UnknownError");
    return unavailable();
  }
}

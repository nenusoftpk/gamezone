import { COOKIE_NAME, getSuperadminAuthSecret, verifySuperadminToken } from "@/lib/superadmin-token";

export async function requireSuperadmin(request) {
  let secret;
  try {
    secret = getSuperadminAuthSecret();
  } catch {
    return { error: "Superadmin authentication is not configured.", status: 503 };
  }
  const token = request.cookies.get(COOKIE_NAME)?.value;
  const session = await verifySuperadminToken(token, secret);
  if (!session) return { error: "Sign in as superadmin to continue.", status: 401 };
  return { session };
}

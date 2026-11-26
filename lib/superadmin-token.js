const COOKIE_NAME = "gz-superadmin-session";
const SESSION_SECONDS = 12 * 60 * 60;
const encoder = new TextEncoder();

export function getSuperadminAuthSecret() {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 32) throw new Error("AUTH_SECRET must contain at least 32 characters.");
  return secret;
}

function encodeBase64Url(bytes) {
  let binary = "";
  bytes.forEach((byte) => { binary += String.fromCharCode(byte); });
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function decodeBase64Url(value) {
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/");
  const binary = atob(base64 + "=".repeat((4 - base64.length % 4) % 4));
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

async function importKey(secret, usages) {
  return crypto.subtle.importKey("raw", encoder.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, usages);
}

export async function createSuperadminToken(subject, secret) {
  const header = encodeBase64Url(encoder.encode(JSON.stringify({ alg: "HS256", typ: "JWT" })));
  const payload = encodeBase64Url(encoder.encode(JSON.stringify({
    sub: subject,
    role: "superadmin",
    iss: "gaming-zone",
    aud: "superadmin",
    exp: Math.floor(Date.now() / 1000) + SESSION_SECONDS,
  })));
  const signingInput = `${header}.${payload}`;
  const signature = await crypto.subtle.sign("HMAC", await importKey(secret, ["sign"]), encoder.encode(signingInput));
  return `${signingInput}.${encodeBase64Url(new Uint8Array(signature))}`;
}

export async function verifySuperadminToken(token, secret) {
  if (!token || !secret) return null;
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const signingInput = `${parts[0]}.${parts[1]}`;
    const valid = await crypto.subtle.verify(
      "HMAC",
      await importKey(secret, ["verify"]),
      decodeBase64Url(parts[2]),
      encoder.encode(signingInput),
    );
    if (!valid) return null;
    const payload = JSON.parse(new TextDecoder().decode(decodeBase64Url(parts[1])));
    if (payload.role !== "superadmin" || payload.iss !== "gaming-zone" || payload.aud !== "superadmin"
      || typeof payload.sub !== "string" || !Number.isFinite(payload.exp) || payload.exp <= Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}

export function setSuperadminCookie(response, token) {
  response.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_SECONDS,
  });
}

export function clearSuperadminCookie(response) {
  response.cookies.set(COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}

export { COOKIE_NAME };

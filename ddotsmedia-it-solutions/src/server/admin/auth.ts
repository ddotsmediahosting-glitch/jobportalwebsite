import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

const sessionCookieName = "ddotsmedia_admin_session";

function getSecret() {
  return process.env.ADMIN_SESSION_SECRET ?? "ddotsmedia-local-session-secret";
}

function sign(value: string) {
  return createHmac("sha256", getSecret()).update(value).digest("hex");
}

function getExpectedCredentials() {
  return {
    username: process.env.ADMIN_USERNAME ?? "admin",
    password: process.env.ADMIN_PASSWORD ?? "Admin#12345",
  };
}

export function validateAdminCredentials(username: string, password: string) {
  const expected = getExpectedCredentials();
  return username === expected.username && password === expected.password;
}

export async function createAdminSession() {
  const store = await cookies();
  const payload = "authenticated";
  const token = `${payload}.${sign(payload)}`;

  store.set(sessionCookieName, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: false,
    path: "/",
    maxAge: 60 * 60 * 12,
  });
}

export async function clearAdminSession() {
  const store = await cookies();
  store.delete(sessionCookieName);
}

export async function isAdminAuthenticated() {
  const store = await cookies();
  const cookie = store.get(sessionCookieName)?.value;

  if (!cookie) {
    return false;
  }

  const [payload, signature] = cookie.split(".");
  if (!payload || !signature) {
    return false;
  }

  const expected = sign(payload);
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);

  if (a.length !== b.length) {
    return false;
  }

  return timingSafeEqual(a, b);
}

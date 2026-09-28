import { createHmac, timingSafeEqual } from "node:crypto";
import { isCurrentAdmin } from "@/lib/server/admin-cms-store";

export const ADMIN_COOKIE = "suraj_admin_session";
const SESSION_SECONDS = 60 * 60 * 24 * 7;

export type AdminSession = {
  email: string;
  role: "owner" | "admin";
  exp: number;
};

function sessionSecret() {
  const value =
    process.env.ADMIN_SESSION_SECRET?.trim() ||
    process.env.NVIDIA_API_KEY?.trim();
  if (!value) throw new Error("ADMIN_SESSION_SECRET_MISSING");
  return createHmac("sha256", value)
    .update("SURAJ.WEB::ADMIN::SESSION::V1")
    .digest();
}

function sign(payload: string) {
  return createHmac("sha256", sessionSecret()).update(payload).digest("base64url");
}

function safeEqual(a: string, b: string) {
  try {
    const left = Buffer.from(a);
    const right = Buffer.from(b);
    return left.length === right.length && timingSafeEqual(left, right);
  } catch {
    return false;
  }
}

export function createAdminSession(email: string, role: "owner" | "admin") {
  const session: AdminSession = {
    email: email.toLowerCase(),
    role,
    exp: Math.floor(Date.now() / 1000) + SESSION_SECONDS,
  };
  const payload = Buffer.from(JSON.stringify(session)).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

export function verifyAdminSessionToken(token: string | undefined | null): AdminSession | null {
  if (!token) return null;
  const [payload, signature, extra] = token.split(".");
  if (!payload || !signature || extra) return null;
  if (!safeEqual(sign(payload), signature)) return null;

  try {
    const session = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as AdminSession;
    if (!session?.email || !["owner", "admin"].includes(session.role)) return null;
    if (!Number.isFinite(session.exp) || session.exp <= Math.floor(Date.now() / 1000)) return null;
    return {
      email: String(session.email).toLowerCase(),
      role: session.role,
      exp: session.exp,
    };
  } catch {
    return null;
  }
}

function cookieValue(request: Request, name: string) {
  const header = request.headers.get("cookie") || "";
  for (const part of header.split(";")) {
    const [key, ...rest] = part.trim().split("=");
    if (key === name) return decodeURIComponent(rest.join("="));
  }
  return null;
}

export async function requireAdmin(request: Request) {
  const token = cookieValue(request, ADMIN_COOKIE);
  const session = verifyAdminSessionToken(token);
  if (!session) return null;

  const current = await isCurrentAdmin(session.email);
  if (!current) return null;

  return {
    email: current.email,
    role: current.role,
    exp: session.exp,
  } satisfies AdminSession;
}

export function isSameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return true;
  try {
    return new URL(origin).host === new URL(request.url).host;
  } catch {
    return false;
  }
}

export function sessionCookie(token: string) {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return `${ADMIN_COOKIE}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${SESSION_SECONDS}${secure}`;
}

export function clearSessionCookie() {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return `${ADMIN_COOKIE}=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0${secure}`;
}

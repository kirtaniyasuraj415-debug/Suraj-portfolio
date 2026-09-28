import {
  clearSessionCookie,
  createAdminSession,
  isSameOrigin,
  requireAdmin,
  sessionCookie,
} from "@/lib/server/admin-auth";
import { verifyAdminCredentials } from "@/lib/server/admin-cms-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const attempts = new Map<string, { count: number; resetAt: number }>();
const MAX_ATTEMPTS = 7;
const WINDOW_MS = 10 * 60 * 1000;

function clientKey(request: Request) {
  return (
    request.headers.get("x-real-ip") ||
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "unknown"
  );
}

function rateState(key: string) {
  const now = Date.now();
  const current = attempts.get(key);
  if (!current || current.resetAt <= now) {
    const next = { count: 0, resetAt: now + WINDOW_MS };
    attempts.set(key, next);
    return next;
  }
  return current;
}

async function slowFailure() {
  await new Promise((resolve) => setTimeout(resolve, 650));
}

export async function GET(request: Request) {
  try {
    const session = await requireAdmin(request);
    if (!session) return Response.json({ authenticated: false }, { status: 401 });
    return Response.json(
      { authenticated: true, user: { email: session.email, role: session.role } },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch {
    return Response.json({ authenticated: false }, { status: 401 });
  }
}

export async function POST(request: Request) {
  if (!isSameOrigin(request)) {
    return Response.json({ success: false, error: "Invalid request." }, { status: 403 });
  }

  const key = clientKey(request);
  const state = rateState(key);
  if (state.count >= MAX_ATTEMPTS) {
    return Response.json(
      { success: false, error: "Too many login attempts. Try again in a few minutes." },
      { status: 429 }
    );
  }

  let body: { email?: string; password?: string };
  try {
    body = await request.json();
  } catch {
    return Response.json({ success: false, error: "Invalid request." }, { status: 400 });
  }

  const email = String(body.email || "").trim().toLowerCase().slice(0, 160);
  const password = String(body.password || "").slice(0, 200);

  try {
    const user = await verifyAdminCredentials(email, password);
    if (!user) {
      state.count += 1;
      attempts.set(key, state);
      await slowFailure();
      return Response.json(
        { success: false, error: "Email or password is incorrect." },
        { status: 401 }
      );
    }

    attempts.delete(key);
    const token = createAdminSession(user.email, user.role);
    return Response.json(
      { success: true, user },
      {
        headers: {
          "Set-Cookie": sessionCookie(token),
          "Cache-Control": "no-store",
        },
      }
    );
  } catch {
    return Response.json(
      { success: false, error: "Admin login is temporarily unavailable." },
      { status: 503 }
    );
  }
}

export async function DELETE(request: Request) {
  if (!isSameOrigin(request)) {
    return Response.json({ success: false }, { status: 403 });
  }
  return Response.json(
    { success: true },
    {
      headers: {
        "Set-Cookie": clearSessionCookie(),
        "Cache-Control": "no-store",
      },
    }
  );
}

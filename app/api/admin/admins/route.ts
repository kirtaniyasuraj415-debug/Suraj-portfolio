import { randomBytes } from "node:crypto";
import { isSameOrigin, requireAdmin } from "@/lib/server/admin-auth";
import {
  OWNER_EMAIL,
  addCmsAdmin,
  changeOwnerPassword,
  listCmsAdmins,
  removeCmsAdmin,
} from "@/lib/server/admin-cms-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function generatedPassword() {
  const raw = randomBytes(15).toString("base64url");
  return `SW-${raw.slice(0, 18)}!7`;
}

async function ownerOnly(request: Request) {
  const session = await requireAdmin(request);
  return session?.role === "owner" && session.email === OWNER_EMAIL ? session : null;
}

export async function GET(request: Request) {
  const session = await ownerOnly(request);
  if (!session) return Response.json({ error: "Owner access required." }, { status: 403 });
  const admins = await listCmsAdmins();
  return Response.json(
    { owner: OWNER_EMAIL, admins },
    { headers: { "Cache-Control": "no-store" } }
  );
}

export async function POST(request: Request) {
  if (!isSameOrigin(request)) return Response.json({ error: "Invalid request." }, { status: 403 });
  const session = await ownerOnly(request);
  if (!session) return Response.json({ error: "Owner access required." }, { status: 403 });

  let body: { email?: string; action?: string; currentPassword?: string; nextPassword?: string };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request." }, { status: 400 });
  }

  try {
    if (body.action === "changeOwnerPassword") {
      await changeOwnerPassword(
        String(body.currentPassword || ""),
        String(body.nextPassword || "")
      );
      return Response.json({ success: true });
    }

    const email = String(body.email || "").trim().toLowerCase();
    const password = generatedPassword();
    await addCmsAdmin(email, password);
    return Response.json({
      success: true,
      email,
      temporaryPassword: password,
    });
  } catch (error) {
    return Response.json(
      { success: false, error: error instanceof Error ? error.message : "Unable to update admins." },
      { status: 400 }
    );
  }
}

export async function PATCH(request: Request) {
  if (!isSameOrigin(request)) return Response.json({ error: "Invalid request." }, { status: 403 });
  const session = await ownerOnly(request);
  if (!session) return Response.json({ error: "Owner access required." }, { status: 403 });

  let body: { email?: string };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request." }, { status: 400 });
  }

  const email = String(body.email || "").trim().toLowerCase();
  const password = generatedPassword();
  try {
    await addCmsAdmin(email, password);
    return Response.json({ success: true, email, temporaryPassword: password });
  } catch (error) {
    return Response.json(
      { success: false, error: error instanceof Error ? error.message : "Unable to reset password." },
      { status: 400 }
    );
  }
}

export async function DELETE(request: Request) {
  if (!isSameOrigin(request)) return Response.json({ error: "Invalid request." }, { status: 403 });
  const session = await ownerOnly(request);
  if (!session) return Response.json({ error: "Owner access required." }, { status: 403 });

  let body: { email?: string };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request." }, { status: 400 });
  }

  try {
    await removeCmsAdmin(String(body.email || ""));
    return Response.json({ success: true });
  } catch (error) {
    return Response.json(
      { success: false, error: error instanceof Error ? error.message : "Unable to remove admin." },
      { status: 400 }
    );
  }
}

import { isSameOrigin, requireAdmin } from "@/lib/server/admin-auth";
import { listRatings, moderateRating } from "@/lib/server/telegram-rating-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const session = await requireAdmin(request);
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const [pending, approved] = await Promise.all([
    listRatings("pending"),
    listRatings("approved"),
  ]);

  return Response.json(
    { pending, approved },
    { headers: { "Cache-Control": "no-store" } }
  );
}

export async function POST(request: Request) {
  if (!isSameOrigin(request)) return Response.json({ error: "Invalid request." }, { status: 403 });
  const session = await requireAdmin(request);
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  let body: { id?: number; action?: "approve" | "reject" | "delete" };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request." }, { status: 400 });
  }

  const id = Number(body.id);
  const action = body.action;
  if (!Number.isInteger(id) || !action || !["approve", "reject", "delete"].includes(action)) {
    return Response.json({ error: "Invalid moderation request." }, { status: 400 });
  }

  try {
    await moderateRating(id, action);
    const [pending, approved] = await Promise.all([
      listRatings("pending"),
      listRatings("approved"),
    ]);
    return Response.json({ success: true, pending, approved });
  } catch {
    return Response.json({ success: false, error: "Rating not found." }, { status: 404 });
  }
}

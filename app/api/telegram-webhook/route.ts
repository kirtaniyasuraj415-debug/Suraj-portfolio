import { handleTelegramProjectUpdate, verifyTelegramWebhookSecret } from "@/lib/server/telegram-project-store";
import { handleTelegramRatingUpdate } from "@/lib/server/telegram-rating-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!verifyTelegramWebhookSecret(request.headers.get("x-telegram-bot-api-secret-token"))) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    const update = await request.json();
    const handledRating = await handleTelegramRatingUpdate(update);
    if (!handledRating) {
      await handleTelegramProjectUpdate(update);
    }
    return Response.json({ ok: true });
  } catch {
    return Response.json({ ok: false }, { status: 500 });
  }
}

export async function GET() {
  return Response.json({ service: "telegram-project-webhook", accepts: "POST" });
}

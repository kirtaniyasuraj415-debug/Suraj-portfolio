import { setupTelegramProjectWebhook } from "@/lib/server/telegram-project-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SETUP_KEY = "suraj-rating-callbacks-2026";

export async function GET(request: Request) {
  const url = new URL(request.url);
  if (url.searchParams.get("key") !== SETUP_KEY) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    const result = await setupTelegramProjectWebhook(url.origin);
    return Response.json({ ok: true, result });
  } catch (error) {
    return Response.json(
      { ok: false, error: error instanceof Error ? error.message : "Setup failed" },
      { status: 500 },
    );
  }
}

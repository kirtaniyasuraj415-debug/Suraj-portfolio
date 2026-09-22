import { setupTelegramProjectWebhook } from "@/lib/server/telegram-project-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const origin = new URL(request.url).origin;
    const result = await setupTelegramProjectWebhook(origin);
    return Response.json({ success: true, webhook: `${origin}/api/telegram-webhook`, telegram: result });
  } catch {
    return Response.json({ success: false, error: "Telegram webhook setup failed." }, { status: 500 });
  }
}

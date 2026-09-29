export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const KEY = "suraj-env-check-20260929";

export async function GET(request: Request) {
  const url = new URL(request.url);
  if (url.searchParams.get("key") !== KEY) return new Response("Unauthorized", { status: 401 });
  return Response.json({
    telegramBotToken: Boolean(process.env.TELEGRAM_BOT_TOKEN?.trim()),
    telegramChatId: Boolean(process.env.TELEGRAM_CHAT_ID?.trim()),
    adminSessionSecret: Boolean(process.env.ADMIN_SESSION_SECRET?.trim()),
    nvidiaApiKey: Boolean(process.env.NVIDIA_API_KEY?.trim()),
  }, { headers: { "Cache-Control": "no-store" } });
}

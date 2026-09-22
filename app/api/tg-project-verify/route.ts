import { handleTelegramProjectUpdate } from "@/lib/server/telegram-project-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  await handleTelegramProjectUpdate({
    message: {
      chat: { id: 8116838619 },
      text: "/project 1",
    },
  });
  return Response.json({ success: true, verified: "project-command-handler" });
}

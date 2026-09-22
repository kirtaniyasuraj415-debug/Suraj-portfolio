import { firebaseConfig } from "@/lib/firebase-config";
import { getFirestoreAuthorization } from "@/lib/server/firebase-auth";
import { handleEnquiryRequest } from "@/lib/server/project-enquiry";
import { TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID } from "@/lib/server/telegram-credentials";

export const runtime = "nodejs";
export const maxDuration = 20;

export async function POST(request: Request) {
  return handleEnquiryRequest(request, {
    telegram: {
      botToken: TELEGRAM_BOT_TOKEN,
      chatId: TELEGRAM_CHAT_ID,
    },
    firestore: { ...firebaseConfig, authorization: getFirestoreAuthorization },
  });
}

export async function GET() {
  return Response.json(
    {
      service: "project-enquiry",
      version: "telegram-hardcoded-v1",
      accepts: "POST",
      telegramConfigured: Boolean(TELEGRAM_BOT_TOKEN && TELEGRAM_CHAT_ID),
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}

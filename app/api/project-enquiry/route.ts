import { firebaseConfig } from "@/lib/firebase-config";
import { getFirestoreAuthorization } from "@/lib/server/firebase-auth";
import { handleEnquiryRequest } from "@/lib/server/project-enquiry";

export const runtime = "nodejs";
export const maxDuration = 20;

// Telegram credentials stay server-only. Never expose the values to the browser.
export async function POST(request: Request) {
  return handleEnquiryRequest(request, {
    telegram: {
      botToken: process.env.TELEGRAM_BOT_TOKEN?.trim() || "",
      chatId:
        process.env.TELEGRAM_CHAT_ID?.trim() ||
        process.env.TELEGRAM_OWNER_CHAT_ID?.trim() ||
        "",
    },
    firestore: { ...firebaseConfig, authorization: getFirestoreAuthorization },
  });
}

export async function GET() {
  const telegramConfigured = Boolean(
    process.env.TELEGRAM_BOT_TOKEN?.trim() &&
      (process.env.TELEGRAM_CHAT_ID?.trim() || process.env.TELEGRAM_OWNER_CHAT_ID?.trim()),
  );

  return Response.json(
    {
      service: "project-enquiry",
      version: "next-route-fallback-v2",
      accepts: "POST",
      telegramConfigured,
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}

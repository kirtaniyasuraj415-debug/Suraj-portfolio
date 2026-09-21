import { firebaseConfig } from "@/lib/firebase-config";
import { getFirestoreAuthorization } from "@/lib/server/firebase-auth";
import { handleEnquiryRequest } from "@/lib/server/project-enquiry";

export const runtime = "nodejs";
export const maxDuration = 20;

// Fallback route when the app is run with Next directly instead of the unified Node server.
// Telegram credentials are server-only environment variables. Never hardcode them here.
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
  return Response.json(
    { service: "project-enquiry", version: "next-route-fallback-v1", accepts: "POST" },
    { headers: { "Cache-Control": "no-store" } }
  );
}

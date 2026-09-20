import { firebaseConfig } from "@/lib/firebase-config";
import { getFirestoreAuthorization } from "@/lib/server/firebase-auth";
import { handleEnquiryRequest } from "@/lib/server/project-enquiry";

export const runtime = "nodejs";
export const maxDuration = 20;

// Existing server-only configuration retained for this private deployment.
// Deployment environment variables take precedence; never use NEXT_PUBLIC_ for these.
const DEFAULT_TELEGRAM_BOT_TOKEN = "8687357491:AAHe1miNa2PFuGQHPEmFrlPhvh0dVBAZius";
const DEFAULT_TELEGRAM_CHAT_ID = "8116838619";

export async function POST(request: Request) {
  return handleEnquiryRequest(request, {
    telegram: {
      botToken: process.env.TELEGRAM_BOT_TOKEN?.trim() || DEFAULT_TELEGRAM_BOT_TOKEN,
      chatId: process.env.TELEGRAM_CHAT_ID?.trim() || DEFAULT_TELEGRAM_CHAT_ID,
    },
    firestore: { ...firebaseConfig, authorization: getFirestoreAuthorization },
  });
}

// A read-only deployment check: it contains no credentials or customer data.
export async function GET() {
  return Response.json({ service: "project-enquiry", version: "enquiry-delivery-v2", accepts: "POST" }, { headers: { "Cache-Control": "no-store" } });
}

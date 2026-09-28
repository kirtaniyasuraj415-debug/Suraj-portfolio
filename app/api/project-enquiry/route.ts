import { after } from "next/server";
import { firebaseConfig } from "@/lib/firebase-config";
import { getFirestoreAuthorization } from "@/lib/server/firebase-auth";
import { handleEnquiryRequest } from "@/lib/server/project-enquiry";
import { appendCmsEnquiry } from "@/lib/server/admin-cms-store";
import { TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID } from "@/lib/server/telegram-credentials";

export const runtime = "nodejs";
export const maxDuration = 20;

export async function POST(request: Request) {
  const raw = await request.text();
  const replayHeaders = new Headers(request.headers);
  replayHeaders.delete("content-length");

  const replay = new Request(request.url, {
    method: "POST",
    headers: replayHeaders,
    body: raw,
  });

  const response = await handleEnquiryRequest(replay, {
    telegram: {
      botToken: TELEGRAM_BOT_TOKEN,
      chatId: TELEGRAM_CHAT_ID,
    },
    firestore: { ...firebaseConfig, authorization: getFirestoreAuthorization },
  });

  try {
    const result = await response.clone().json() as { success?: boolean; requestId?: string };
    const form = JSON.parse(raw) as Record<string, unknown>;
    if (result.success && result.requestId) {
      after(async () => {
        await appendCmsEnquiry({
          id: result.requestId!,
          name: String(form.name || ""),
          businessName: String(form.businessName || ""),
          phone: String(form.phone || ""),
          projectType: String(form.projectType || ""),
          budget: String(form.budget || ""),
          timeline: String(form.timeline || ""),
          projectGoal: String(form.projectGoal || ""),
        }).catch(() => {});
      });
    }
  } catch {
    // Delivery response remains authoritative even if the admin archive cannot be updated.
  }

  return response;
}

export async function GET() {
  return Response.json(
    {
      service: "project-enquiry",
      version: "telegram-cms-v2",
      accepts: "POST",
      telegramConfigured: Boolean(TELEGRAM_BOT_TOKEN && TELEGRAM_CHAT_ID),
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}

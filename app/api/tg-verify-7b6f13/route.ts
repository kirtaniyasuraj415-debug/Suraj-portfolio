import { firebaseConfig } from "@/lib/firebase-config";
import { getFirestoreAuthorization } from "@/lib/server/firebase-auth";
import { handleEnquiryRequest } from "@/lib/server/project-enquiry";
import { TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID } from "@/lib/server/telegram-credentials";

export const runtime = "nodejs";
export const maxDuration = 20;
export const dynamic = "force-dynamic";

export async function GET() {
  const payload = {
    name: "SURAJ.WEB Deployment Test",
    businessName: "SURAJ.WEB",
    phone: "+91 7810963278",
    preferredContactMethod: "whatsapp",
    businessType: "Personal Brand",
    projectType: "New Website",
    currentWebsite: "",
    budget: "Flexible / To Discuss",
    timeline: "Flexible / Not Sure",
    projectGoal: "Production Telegram delivery verification after Vercel deployment.",
    reference: "",
    preferredContactTime: "anytime",
  };

  const request = new Request("https://internal.local/api/project-enquiry", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  return handleEnquiryRequest(request, {
    telegram: {
      botToken: TELEGRAM_BOT_TOKEN,
      chatId: TELEGRAM_CHAT_ID,
    },
    firestore: { ...firebaseConfig, authorization: getFirestoreAuthorization },
  });
}

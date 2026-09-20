import { NextRequest, NextResponse } from "next/server";
import { firebaseConfig } from "@/lib/firebase";

// Direct fallback credentials for @Surajportfolio_bot and Suraj Kirtaniya
const DEFAULT_TELEGRAM_BOT_TOKEN = "8687357491:AAHe1miNa2PFuGQHPEmFrlPhvh0dVBAZius";
const DEFAULT_TELEGRAM_CHAT_ID = "8116838619";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const {
      name,
      businessName,
      phone,
      projectType,
      budget,
      projectGoal,
    } = body ?? {};

    // 1. Clean & Normalize Inputs
    const cleanName = typeof name === "string" ? name.trim() : "";
    const cleanBusinessName = typeof businessName === "string" ? businessName.trim() : "";
    const cleanPhone = typeof phone === "string" ? phone.trim() : "";
    const cleanProjectType = typeof projectType === "string" ? projectType.trim() : "";
    const cleanBudget = typeof budget === "string" ? budget.trim() : "";
    const cleanProjectGoal = typeof projectGoal === "string" ? projectGoal.trim() : "";

    // 2. Validate Core Required Fields
    if (!cleanName || cleanName.length < 2 || cleanName.length > 100) {
      return NextResponse.json(
        { error: "Please enter your name (at least 2 characters)." },
        { status: 400 }
      );
    }

    const digitsOnly = cleanPhone.replace(/\D/g, "");
    if (!cleanPhone || digitsOnly.length < 6) {
      return NextResponse.json(
        { error: "Please provide a valid WhatsApp or phone number." },
        { status: 400 }
      );
    }

    const finalProjectType = cleanProjectType || "New Website / To Discuss";
    const finalBudget = cleanBudget || "Flexible / To Discuss";

    // 3. Format WhatsApp Quick Link for Suraj to tap and chat directly
    let waDigits = digitsOnly;
    if (waDigits.startsWith("0")) waDigits = waDigits.slice(1);
    if (waDigits.length === 10) waDigits = `91${waDigits}`;
    const waLink = `https://wa.me/${waDigits}`;

    // 4. Construct high-visibility Telegram Message
    const telegramMessage = [
      "🔥 NEW PROJECT ENQUIRY RECEIVED!",
      "",
      "👤 Client Name:",
      cleanName,
      "",
      "📱 WhatsApp / Phone:",
      cleanPhone,
      "",
      "💬 Direct WhatsApp Chat:",
      waLink,
      "",
      "🏢 Business / Brand:",
      cleanBusinessName || "Not specified",
      "",
      "💻 Project Type:",
      finalProjectType,
      "",
      "💰 Budget Range:",
      finalBudget,
      "",
      "🎯 Requirements / Message:",
      cleanProjectGoal || "No additional notes provided",
      "",
      "📍 Source: SURAJ.WEB Portfolio",
      `⏰ Received at: ${new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}`,
    ].join("\n");

    const botToken = (process.env.TELEGRAM_BOT_TOKEN || DEFAULT_TELEGRAM_BOT_TOKEN).trim();
    const chatId = (process.env.TELEGRAM_CHAT_ID || DEFAULT_TELEGRAM_CHAT_ID).trim();

    // 5. Run Telegram Notification and Firestore concurrently for lightning speed
    const telegramPromise = (async () => {
      try {
        const telegramEndpoint = `https://api.telegram.org/bot${botToken}/sendMessage`;
        const res = await fetch(telegramEndpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: chatId,
            text: telegramMessage,
          }),
        });
        const data = (await res.json()) as { ok?: boolean; result?: { message_id?: number } };
        return {
          delivered: Boolean(res.ok && data.ok),
          messageId: data.result?.message_id || null,
        };
      } catch (err) {
        console.error("[Telegram] Error delivering message:", err);
        return { delivered: false, messageId: null };
      }
    })();

    const firestorePromise = (async () => {
      try {
        const firestoreUrl = `https://firestore.googleapis.com/v1/projects/${firebaseConfig.projectId}/databases/(default)/documents/projectEnquiries?key=${firebaseConfig.apiKey}`;
        const firestorePayload = {
          fields: {
            name: { stringValue: cleanName },
            businessName: cleanBusinessName ? { stringValue: cleanBusinessName } : { nullValue: null },
            phone: { stringValue: cleanPhone },
            whatsappNumber: { stringValue: waDigits },
            whatsappLink: { stringValue: waLink },
            projectType: { stringValue: finalProjectType },
            budget: { stringValue: finalBudget },
            projectGoal: cleanProjectGoal ? { stringValue: cleanProjectGoal } : { nullValue: null },
            source: { stringValue: "SURAJ.WEB Portfolio" },
            status: { stringValue: "new" },
            createdAt: { timestampValue: new Date().toISOString() },
          },
        };

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2000);

        const fbRes = await fetch(firestoreUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(firestorePayload),
          signal: controller.signal,
        });
        clearTimeout(timeoutId);

        const fbData = await fbRes.json();
        if (fbRes.ok && fbData.name) {
          const docId = fbData.name.split("/").pop() || null;
          return { stored: true, docId };
        }
        return { stored: false, docId: null };
      } catch {
        return { stored: false, docId: null };
      }
    })();

    // Wait for both concurrently
    const [telegramResult, firestoreResult] = await Promise.all([telegramPromise, firestorePromise]);

    if (telegramResult.delivered || firestoreResult.stored) {
      return NextResponse.json({
        success: true,
        telegramDelivered: telegramResult.delivered,
        telegramMessageId: telegramResult.messageId,
        firestoreStored: firestoreResult.stored,
        firestoreDocId: firestoreResult.docId,
        lead: {
          name: cleanName,
          phone: cleanPhone,
          projectType: finalProjectType,
          budget: finalBudget,
        },
      });
    }

    // If both failed, return a friendly error so the user can use the WhatsApp link
    return NextResponse.json(
      {
        error:
          "Unable to send enquiry automatically. Please chat directly with Suraj on WhatsApp at +91 7810963278.",
      },
      { status: 502 }
    );
  } catch (error) {
    console.error("[Enquiry] Unexpected error:", error);
    return NextResponse.json(
      {
        error:
          "Something went wrong while processing your enquiry. Please contact Suraj directly on WhatsApp at +91 7810963278.",
      },
      { status: 500 }
    );
  }
}

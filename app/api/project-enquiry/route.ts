import { NextRequest, NextResponse } from "next/server";
import { firebaseConfig } from "@/lib/firebase";

// Direct fallback credentials for @Surajportfolio_bot and Suraj Kirtaniya
const DEFAULT_TELEGRAM_BOT_TOKEN = "8687357491:AAHe1miNa2PFuGQHPEmFrlPhvh0dVBAZius";
const DEFAULT_TELEGRAM_CHAT_ID = "8116838619";

// Valid options for validation and defaults
const VALID_BUSINESS_TYPES = [
  "Restaurant / Cafe",
  "Hotel / Hospitality",
  "Real Estate",
  "Photography / Studio",
  "Clinic / Healthcare",
  "Salon / Beauty",
  "E-commerce",
  "Personal Brand",
  "Agency / Company",
  "Local Business",
  "Other",
];

const VALID_PROJECT_TYPES = [
  "New Business Website",
  "Website Redesign",
  "Landing Page",
  "Portfolio Website",
  "E-commerce Website",
  "AI / Automation",
  "Website + Automation",
  "Not Sure Yet",
  "Other",
];

const VALID_BUDGET_RANGES = [
  "Under ₹10,000",
  "₹10,000 – ₹25,000",
  "₹25,000 – ₹50,000",
  "₹50,000 – ₹1,00,000",
  "₹1,00,000+",
  "Not Sure Yet",
];

const VALID_TIMELINES = [
  "As soon as possible",
  "Within 1–2 weeks",
  "Within 1 month",
  "Within 1–3 months",
  "Flexible / Not Sure",
];

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const {
      name,
      businessName,
      phone,
      preferredContactMethod,
      businessType,
      projectType,
      currentWebsite,
      budget,
      timeline,
      projectGoal,
      reference,
      preferredContactTime,
    } = body ?? {};

    // 1. Clean & Normalize Inputs
    const cleanName = typeof name === "string" ? name.trim() : "";
    const cleanBusinessName = typeof businessName === "string" ? businessName.trim() : "";
    const cleanPhone = typeof phone === "string" ? phone.trim() : "";
    
    // Controlled Preferred Contact Method: "whatsapp" | "phone" (default "whatsapp")
    const cleanPreferredContactMethod: "whatsapp" | "phone" =
      typeof preferredContactMethod === "string" && preferredContactMethod.toLowerCase().includes("phone")
        ? "phone"
        : "whatsapp";

    const cleanBusinessType = typeof businessType === "string" ? businessType.trim() : "";
    const cleanProjectType = typeof projectType === "string" ? projectType.trim() : "";
    const cleanCurrentWebsite = typeof currentWebsite === "string" ? currentWebsite.trim() : "";
    const cleanBudget = typeof budget === "string" ? budget.trim() : "";
    const cleanTimeline = typeof timeline === "string" ? timeline.trim() : "";
    const cleanProjectGoal = typeof projectGoal === "string" ? projectGoal.trim() : "";
    const cleanReference = typeof reference === "string" ? reference.trim() : "";

    // Controlled Best Time: "morning" | "afternoon" | "evening" | "anytime" | null
    const validContactTimes = ["morning", "afternoon", "evening", "anytime"];
    const cleanPreferredContactTime: string | null =
      typeof preferredContactTime === "string" && validContactTimes.includes(preferredContactTime.toLowerCase())
        ? preferredContactTime.toLowerCase()
        : null;

    // 2. Validate Core Required Fields
    if (!cleanName || cleanName.length < 2 || cleanName.length > 100) {
      return NextResponse.json(
        { error: "Please provide your name (at least 2 characters)." },
        { status: 400 }
      );
    }

    const digitsOnly = cleanPhone.replace(/\D/g, "");
    if (!cleanPhone || digitsOnly.length < 5) {
      return NextResponse.json(
        { error: "Please provide a valid WhatsApp or phone number." },
        { status: 400 }
      );
    }

    // 3. Fallbacks for optional category fields so submission is reliable
    const finalBusinessType =
      cleanBusinessType && VALID_BUSINESS_TYPES.includes(cleanBusinessType)
        ? cleanBusinessType
        : cleanBusinessType || "General / To Discuss";

    const finalProjectType =
      cleanProjectType && VALID_PROJECT_TYPES.includes(cleanProjectType)
        ? cleanProjectType
        : cleanProjectType || "Website Design & Development";

    const finalBudget =
      cleanBudget && VALID_BUDGET_RANGES.includes(cleanBudget)
        ? cleanBudget
        : cleanBudget || "Flexible / Not Sure";

    const finalTimeline =
      cleanTimeline && VALID_TIMELINES.includes(cleanTimeline)
        ? cleanTimeline
        : cleanTimeline || "Flexible / Not Sure";

    // 4. Format Indian / International WhatsApp Quick Link
    let waDigits = digitsOnly;
    if (waDigits.startsWith("0")) waDigits = waDigits.slice(1);
    if (waDigits.length === 10) waDigits = `91${waDigits}`;
    const waLink = `https://wa.me/${waDigits}`;

    // Readable labels for human notifications
    const contactMethodLabel = cleanPreferredContactMethod === "phone" ? "Phone Call" : "WhatsApp";
    const contactTimeMap: Record<string, string> = {
      morning: "Morning (9 AM – 12 PM)",
      afternoon: "Afternoon (12 PM – 5 PM)",
      evening: "Evening (5 PM – 9 PM)",
      anytime: "Anytime",
    };
    const contactTimeLabel = cleanPreferredContactTime
      ? contactTimeMap[cleanPreferredContactTime] || cleanPreferredContactTime
      : "Not provided";

    // 5. STEP 4: Store in Firebase Firestore (collection: projectEnquiries)
    let firestoreStored = false;
    let firestoreDocId: string | null = null;

    try {
      const firestoreUrl = `https://firestore.googleapis.com/v1/projects/${firebaseConfig.projectId}/databases/(default)/documents/projectEnquiries?key=${firebaseConfig.apiKey}`;
      const firestorePayload = {
        fields: {
          name: { stringValue: cleanName },
          businessName: cleanBusinessName ? { stringValue: cleanBusinessName } : { nullValue: null },
          phone: { stringValue: cleanPhone },
          whatsappNumber: { stringValue: waDigits },
          whatsappLink: { stringValue: waLink },
          businessType: { stringValue: finalBusinessType },
          projectType: { stringValue: finalProjectType },
          currentWebsite: cleanCurrentWebsite ? { stringValue: cleanCurrentWebsite } : { nullValue: null },
          budget: { stringValue: finalBudget },
          timeline: { stringValue: finalTimeline },
          projectGoal: cleanProjectGoal ? { stringValue: cleanProjectGoal } : { nullValue: null },
          reference: cleanReference ? { stringValue: cleanReference } : { nullValue: null },
          preferredContactMethod: { stringValue: cleanPreferredContactMethod },
          preferredContactTime: cleanPreferredContactTime ? { stringValue: cleanPreferredContactTime } : { nullValue: null },
          source: { stringValue: "SURAJ.WEB Portfolio" },
          status: { stringValue: "new" },
          createdAt: { timestampValue: new Date().toISOString() },
          telegramNotificationStatus: { stringValue: "pending" },
        },
      };

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500);

      const fbRes = await fetch(firestoreUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(firestorePayload),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      const fbData = await fbRes.json();
      if (fbRes.ok && fbData.name) {
        firestoreStored = true;
        firestoreDocId = fbData.name.split("/").pop() || null;
        console.log(`[Firebase] Document recorded in Firestore! Doc ID: ${firestoreDocId}`);
      } else {
        console.warn(
          "[Firebase] Note: Cloud Firestore write returned status",
          fbRes.status,
          fbData?.error?.message || ""
        );
      }
    } catch (fbErr) {
      console.warn("[Firebase] Firestore logging notice:", fbErr);
    }

    // 6. STEP 5: Telegram Notification Attempt
    const botToken = (process.env.TELEGRAM_BOT_TOKEN || DEFAULT_TELEGRAM_BOT_TOKEN).trim();
    const chatId = (process.env.TELEGRAM_CHAT_ID || DEFAULT_TELEGRAM_CHAT_ID).trim();

    const telegramMessage = [
      "🔥 NEW PORTFOLIO LEAD",
      "",
      "👤 Name:",
      cleanName,
      "",
      "🏢 Business:",
      cleanBusinessName || "Not provided",
      "",
      "📱 WhatsApp / Phone:",
      cleanPhone,
      "",
      "💬 Direct WhatsApp Chat:",
      waLink,
      "",
      "📞 Preferred Contact:",
      contactMethodLabel,
      "",
      "🕐 Best Time:",
      contactTimeLabel,
      "",
      "🏷 Business Type:",
      finalBusinessType,
      "",
      "💻 Project:",
      finalProjectType,
      "",
      "🌐 Current Website:",
      cleanCurrentWebsite || "Not provided",
      "",
      "💰 Budget:",
      finalBudget,
      "",
      "⏱ Timeline:",
      finalTimeline,
      "",
      "🎯 Project Details:",
      cleanProjectGoal || "Not provided",
      "",
      "🔗 Reference:",
      cleanReference || "Not provided",
      "",
      "📍 Source:",
      "SURAJ.WEB Portfolio",
      ...(firestoreDocId ? ["", `🗄️ Firestore Lead ID: ${firestoreDocId}`] : []),
    ].join("\n");

    let telegramDelivered = false;
    let telegramMessageId: number | null = null;

    try {
      const telegramEndpoint = `https://api.telegram.org/bot${botToken}/sendMessage`;
      const telegramResponse = await fetch(telegramEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text: telegramMessage,
        }),
      });

      const telegramData = (await telegramResponse.json()) as {
        ok?: boolean;
        result?: { message_id?: number };
        description?: string;
      };

      if (telegramResponse.ok && telegramData.ok) {
        telegramDelivered = true;
        telegramMessageId = telegramData.result?.message_id ?? null;
        console.log(`[Telegram] Lead delivered! Message ID: ${telegramMessageId}`);
      } else {
        console.error(
          "[Telegram] Delivery notice:",
          telegramData.description || `Status ${telegramResponse.status}`
        );
      }
    } catch (telegramErr) {
      console.error("[Telegram] Network exception:", telegramErr);
    }

    // 7. STEP 6: Update Firestore document with telegramNotificationStatus if practical
    if (firestoreStored && firestoreDocId) {
      try {
        const patchUrl = `https://firestore.googleapis.com/v1/projects/${firebaseConfig.projectId}/databases/(default)/documents/projectEnquiries/${firestoreDocId}?updateMask.fieldPaths=telegramNotificationStatus&key=${firebaseConfig.apiKey}`;
        await fetch(patchUrl, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fields: {
              telegramNotificationStatus: { stringValue: telegramDelivered ? "sent" : "failed" },
            },
          }),
        });
      } catch (patchErr) {
        console.warn("[Firebase] Could not update telegramNotificationStatus:", patchErr);
      }
    }

    // 8. Success handling
    // If Firestore stored the lead, the lead is safely persisted (Source of Truth).
    // If Telegram delivered, notification is received.
    if (firestoreStored || telegramDelivered) {
      return NextResponse.json({
        success: true,
        firestoreStored,
        firestoreDocId,
        telegramDelivered,
        telegramMessageId,
      });
    }

    // Both failed
    return NextResponse.json(
      {
        error:
          "Unable to process your enquiry. Please click 'Chat on WhatsApp' or contact Suraj directly at +91 7810963278.",
      },
      { status: 502 }
    );
  } catch (error) {
    console.error("[Enquiry] Unexpected error processing request:", error);
    return NextResponse.json(
      {
        error:
          "Unable to send enquiry. Please contact Suraj directly on WhatsApp at +91 7810963278.",
      },
      { status: 500 }
    );
  }
}

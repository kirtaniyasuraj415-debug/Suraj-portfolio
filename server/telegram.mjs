import https from "node:https";

function cleanLine(value, fallback = "Not provided") {
  if (typeof value !== "string") return fallback;
  const cleaned = value.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "").trim();
  return cleaned || fallback;
}

function whatsappDigits(phone) {
  let digits = String(phone || "").replace(/\D/g, "");
  if (digits.startsWith("00")) digits = digits.slice(2);
  else if (digits.length === 11 && digits.startsWith("0")) digits = digits.slice(1);
  if (digits.length === 10 && !String(phone || "").trim().startsWith("+")) digits = `91${digits}`;
  return digits;
}

export function formatTelegramEnquiryMessage(lead, requestId) {
  const timeLabels = {
    morning: "Morning (9 AM–12 PM IST)",
    afternoon: "Afternoon (12 PM–5 PM IST)",
    evening: "Evening (5 PM–9 PM IST)",
    anytime: "Anytime",
    "": "Not specified",
  };

  const contactLabel = lead.preferredContactMethod === "phone" ? "Phone Call" : "WhatsApp";
  const digits = whatsappDigits(lead.phone);

  return [
    "🔥 NEW PORTFOLIO LEAD",
    `Reference: ${requestId}`,
    "",
    `👤 Name: ${cleanLine(lead.name)}`,
    `🏢 Business: ${cleanLine(lead.businessName)}`,
    `📱 WhatsApp / Phone: ${cleanLine(lead.phone)}`,
    digits ? `🔗 WhatsApp: https://wa.me/${digits}` : "🔗 WhatsApp: Not available",
    `📞 Preferred Contact: ${contactLabel}`,
    `🕐 Best Time: ${timeLabels[lead.preferredContactTime] || "Not specified"}`,
    "",
    `🏷 Business Type: ${cleanLine(lead.businessType, "Not specified")}`,
    `💻 Project: ${cleanLine(lead.projectType)}`,
    `🌐 Current Website: ${cleanLine(lead.currentWebsite)}`,
    `💰 Budget: ${cleanLine(lead.budget)}`,
    `⏱ Timeline: ${cleanLine(lead.timeline, "Not specified")}`,
    "",
    "🎯 Project Details:",
    cleanLine(lead.projectGoal),
    "",
    `🔗 Reference / Inspiration: ${cleanLine(lead.reference)}`,
    "📍 Source: SURAJ.WEB Portfolio",
  ].join("\n");
}

export async function sendTelegramNotification(botToken, chatId, messageText, timeoutMs = 10000) {
  return new Promise((resolve) => {
    const token = String(botToken || "").trim();
    const destination = String(chatId || "").trim();

    if (!token || !destination) {
      resolve({ success: false, code: "NOT_CONFIGURED" });
      return;
    }

    const payload = JSON.stringify({
      chat_id: destination,
      text: messageText,
      disable_web_page_preview: true,
    });

    const req = https.request(
      {
        hostname: "api.telegram.org",
        port: 443,
        path: `/bot${token}/sendMessage`,
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(payload),
        },
        timeout: timeoutMs,
      },
      (res) => {
        let body = "";
        res.setEncoding("utf8");
        res.on("data", (chunk) => {
          if (body.length < 65536) body += chunk;
        });
        res.on("end", () => {
          try {
            const parsed = JSON.parse(body);
            if (res.statusCode >= 200 && res.statusCode < 300 && parsed?.ok === true) {
              resolve({ success: true, messageId: parsed.result?.message_id, statusCode: res.statusCode });
              return;
            }
            resolve({ success: false, code: `HTTP_${res.statusCode || 0}`, statusCode: res.statusCode });
          } catch {
            resolve({ success: false, code: `INVALID_RESPONSE_${res.statusCode || 0}`, statusCode: res.statusCode });
          }
        });
      }
    );

    req.on("timeout", () => req.destroy(new Error("TELEGRAM_TIMEOUT")));
    req.on("error", (error) => {
      resolve({ success: false, code: error instanceof Error && error.message === "TELEGRAM_TIMEOUT" ? "TIMEOUT" : "NETWORK_ERROR" });
    });
    req.write(payload);
    req.end();
  });
}

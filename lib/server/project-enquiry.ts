import { randomUUID } from "node:crypto";
import { enquirySchema, type EnquiryFormData } from "../project-enquiry.ts";

type Fetch = typeof fetch;
type Settings = {
  telegram: { botToken: string; chatId: string };
  firestore: { projectId: string; apiKey: string; databaseId?: string; authorization?: () => Promise<string | undefined> };
  fetch?: Fetch;
  timeoutMs?: number;
  log?: (provider: string, code: string, requestId: string) => void;
};
type JsonResult = { status: number; ok: boolean; data: Record<string, unknown> };

// The deadline includes credential loading, response headers AND response bodies.
async function withDeadline<T>(milliseconds: number, action: (signal: AbortSignal) => Promise<T>): Promise<T> {
  const controller = new AbortController();
  let timer: ReturnType<typeof setTimeout>;
  const deadline = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      controller.abort();
      reject(new Error("TIMEOUT"));
    }, milliseconds);
  });
  try {
    return await Promise.race([action(controller.signal), deadline]);
  } finally {
    clearTimeout(timer!);
  }
}

async function requestJson(fetcher: Fetch, url: string, body: unknown, signal: AbortSignal, method = "POST", authorization?: string): Promise<JsonResult> {
  signal.throwIfAborted();
  const response = await fetcher(url, {
    method, signal, cache: "no-store",
    headers: { "Content-Type": "application/json", ...(authorization ? { Authorization: authorization } : {}) },
    body: JSON.stringify(body),
  });
  const data: unknown = await response.json();
  if (!data || typeof data !== "object" || Array.isArray(data)) throw new Error("INVALID_RESPONSE");
  return { status: response.status, ok: response.ok, data: data as Record<string, unknown> };
}

function failureCode(error: unknown) {
  // Never log fetch errors or URLs: Telegram URLs contain the bot's credential.
  return error instanceof Error && error.message === "TIMEOUT" ? "TIMEOUT" : "NETWORK_OR_RESPONSE_ERROR";
}

function whatsappDigits(phone: string) {
  let digits = phone.replace(/\D/g, "");
  if (digits.startsWith("00")) digits = digits.slice(2);
  else if (digits.length === 11 && digits.startsWith("0")) digits = digits.slice(1);
  if (digits.length === 10 && !phone.startsWith("+")) digits = `91${digits}`;
  return digits;
}

export function formatTelegramMessage(lead: EnquiryFormData, requestId: string) {
  const times = { morning: "Morning (9 AM–12 PM IST)", afternoon: "Afternoon (12 PM–5 PM IST)", evening: "Evening (5 PM–9 PM IST)", anytime: "Anytime", "": "Not specified" };
  const digits = whatsappDigits(lead.phone);
  return [
    "NEW PORTFOLIO ENQUIRY", `Reference: ${requestId}`, "",
    `Name: ${lead.name}`, `Business: ${lead.businessName || "Not provided"}`,
    `Phone: ${lead.phone}`, `WhatsApp: https://wa.me/${digits}`,
    `Preferred contact: ${lead.preferredContactMethod === "phone" ? "Phone Call" : "WhatsApp"}`,
    `Best time: ${times[lead.preferredContactTime]}`, "",
    `Business type: ${lead.businessType || "Not specified"}`, `Project: ${lead.projectType}`,
    `Website: ${lead.currentWebsite || "Not provided"}`, `Budget: ${lead.budget}`, `Timeline: ${lead.timeline || "Not specified"}`, "",
    `Project details:\n${lead.projectGoal || "Not provided"}`, "",
    `Reference / inspiration: ${lead.reference || "Not provided"}`, "Source: SURAJ.WEB Portfolio",
  ].join("\n");
}

export async function handleEnquiryRequest(request: Request, settings: Settings): Promise<Response> {
  const requestId = randomUUID();
  const json = (body: Record<string, unknown>, status = 200) => Response.json({ ...body, requestId }, { status, headers: { "Cache-Control": "no-store" } });
  let body: unknown;
  try {
    if (Number(request.headers.get("content-length")) > 24000) return json({ success: false, error: "Your enquiry is too long. Please shorten the project details." }, 413);
    const raw = await request.text();
    if (new TextEncoder().encode(raw).byteLength > 24000) return json({ success: false, error: "Your enquiry is too long. Please shorten the project details." }, 413);
    body = JSON.parse(raw);
  } catch {
    return json({ success: false, error: "The form could not be read. Please refresh and try again." }, 400);
  }
  const parsed = enquirySchema.safeParse(body);
  if (!parsed.success) {
    const fieldErrors = Object.fromEntries(parsed.error.issues.map(issue => [issue.path[0], issue.message]));
    return json({ success: false, error: "Please check the highlighted form details.", fieldErrors }, 400);
  }
  const lead = parsed.data;
  const fetcher = settings.fetch ?? fetch;
  const timeout = settings.timeoutMs ?? 8000;
  const log = settings.log ?? ((provider, code, id) => console.warn(`[Enquiry ${id}] ${provider}: ${code}`));
  const report = (provider: string, code: string) => log(provider, code, requestId);
  const databaseId = settings.firestore.databaseId || "(default)";
  const firestoreUrl = `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(settings.firestore.projectId)}/databases/${encodeURIComponent(databaseId)}/documents/projectEnquiries`;
  const fields = Object.fromEntries(Object.entries(lead).map(([key, value]) => [key, value ? { stringValue: value } : { nullValue: null }]));
  let authorization: string | undefined;

  // Start both providers immediately. A broken/disabled database cannot delay the bot request.
  const telegramTask = (async () => {
    if (!settings.telegram.botToken || !settings.telegram.chatId) { report("telegram", "NOT_CONFIGURED"); return false; }
    try {
      const text = formatTelegramMessage(lead, requestId);
      if (text.length > 4096) { report("telegram", "MESSAGE_TOO_LONG"); return false; }
      const result = await withDeadline(timeout, signal => requestJson(fetcher,
        `https://api.telegram.org/bot${settings.telegram.botToken}/sendMessage`,
        { chat_id: settings.telegram.chatId, text, link_preview_options: { is_disabled: true } }, signal));
      if (result.ok && result.data.ok === true) return true;
      report("telegram", `HTTP_${result.status}`);
    } catch (error) { report("telegram", failureCode(error)); }
    return false;
  })();

  const firestoreTask = (async () => {
    try {
      const result = await withDeadline(Math.min(timeout, 5000), async signal => {
        authorization = await settings.firestore.authorization?.();
        return requestJson(fetcher, `${firestoreUrl}?documentId=${requestId}&key=${encodeURIComponent(settings.firestore.apiKey)}`, {
          fields: { ...fields, whatsappNumber: { stringValue: whatsappDigits(lead.phone) }, whatsappLink: { stringValue: `https://wa.me/${whatsappDigits(lead.phone)}` }, source: { stringValue: "SURAJ.WEB Portfolio" }, status: { stringValue: "new" },
            createdAt: { timestampValue: new Date().toISOString() }, telegramNotificationStatus: { stringValue: "pending" } },
        }, signal, "POST", authorization);
      });
      if (result.ok && typeof result.data.name === "string") return true;
      report("firestore", `HTTP_${result.status}`);
    } catch (error) { report("firestore", failureCode(error)); }
    return false;
  })();

  const [telegramDelivered, firestoreStored] = await Promise.all([telegramTask, firestoreTask]);
  if (firestoreStored) {
    try {
      const result = await withDeadline(Math.min(timeout, 2000), signal => requestJson(fetcher,
        `${firestoreUrl}/${requestId}?updateMask.fieldPaths=telegramNotificationStatus&key=${encodeURIComponent(settings.firestore.apiKey)}`,
        { fields: { telegramNotificationStatus: { stringValue: telegramDelivered ? "sent" : "unconfirmed" } } }, signal, "PATCH", authorization));
      if (!result.ok) report("firestore-status", `HTTP_${result.status}`);
    } catch (error) { report("firestore-status", failureCode(error)); }
  }
  if (telegramDelivered) return json({ success: true, delivery: "sent", telegramDelivered, firestoreStored });
  if (firestoreStored) return json({ success: true, delivery: "saved", telegramDelivered, firestoreStored }, 202);
  return json({ success: false, delivery: "failed", telegramDelivered, firestoreStored,
    error: "We couldn’t confirm delivery. Your details are still here. Please contact Suraj on WhatsApp, or try again." }, 502);
}

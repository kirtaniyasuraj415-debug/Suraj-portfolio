import { randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import { formatTelegramEnquiryMessage, sendTelegramNotification } from "./telegram.mjs";

const PROJECT_TYPES = new Set([
  "New Website",
  "Website Redesign",
  "E-commerce Store",
  "Landing Page",
  "Portfolio / Brand",
  "AI & Automation",
  "Other",
  "New Business Website",
  "Portfolio Website",
  "E-commerce Website",
  "AI / Automation",
  "Website + Automation",
  "Not Sure Yet",
]);

const BUDGET_RANGES = new Set([
  "Under ₹15,000",
  "₹15,000 – ₹30,000",
  "₹30,000 – ₹60,000",
  "₹60,000 – ₹1,00,000",
  "₹1,00,000+",
  "Flexible / To Discuss",
  "Under ₹10,000",
  "₹10,000 – ₹25,000",
  "₹25,000 – ₹50,000",
  "₹50,000 – ₹1,00,000",
  "Not Sure Yet",
]);

const CONTACT_METHODS = new Set(["whatsapp", "phone"]);
const CONTACT_TIMES = new Set(["", "morning", "afternoon", "evening", "anytime"]);
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const MAX_REQUESTS_PER_WINDOW = 5;
const rateLimitMap = new Map();

function sanitizeString(input, maxLength) {
  if (typeof input !== "string") return "";
  return input
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
    .trim()
    .slice(0, maxLength);
}

function isValidPhoneNumber(phone) {
  const cleaned = phone.replace(/[\s\-().]/g, "");
  return /^\+?[0-9]{7,15}$/.test(cleaned);
}

function rateLimit(ip) {
  const key = ip || "unknown";
  const now = Date.now();
  const current = rateLimitMap.get(key);
  if (!current || now - current.firstRequestTime >= RATE_LIMIT_WINDOW_MS) {
    rateLimitMap.set(key, { count: 1, firstRequestTime: now });
    return false;
  }
  if (current.count >= MAX_REQUESTS_PER_WINDOW) return true;
  current.count += 1;
  return false;
}

export function validateProjectEnquiry(input) {
  const payload = input && typeof input === "object" && !Array.isArray(input) ? input : {};
  const lead = {
    name: sanitizeString(payload.name, 100),
    businessName: sanitizeString(payload.businessName, 120),
    phone: sanitizeString(payload.phone, 32),
    preferredContactMethod: sanitizeString(payload.preferredContactMethod, 20) || "whatsapp",
    businessType: sanitizeString(payload.businessType, 100),
    projectType: sanitizeString(payload.projectType, 100),
    currentWebsite: sanitizeString(payload.currentWebsite, 240),
    budget: sanitizeString(payload.budget, 100),
    timeline: sanitizeString(payload.timeline, 100),
    projectGoal: sanitizeString(payload.projectGoal, 2500),
    reference: sanitizeString(payload.reference, 240),
    preferredContactTime: sanitizeString(payload.preferredContactTime, 20),
  };

  const fieldErrors = {};
  if (lead.name.length < 2) fieldErrors.name = "Please enter your name (at least 2 characters).";
  if (!isValidPhoneNumber(lead.phone)) fieldErrors.phone = "Enter a valid phone number with 7–15 digits, including your country code.";
  if (!CONTACT_METHODS.has(lead.preferredContactMethod)) fieldErrors.preferredContactMethod = "Choose WhatsApp or Phone Call.";
  if (!PROJECT_TYPES.has(lead.projectType)) fieldErrors.projectType = "Please select a valid project type.";
  if (!BUDGET_RANGES.has(lead.budget)) fieldErrors.budget = "Please select a valid budget range.";
  if (!CONTACT_TIMES.has(lead.preferredContactTime)) fieldErrors.preferredContactTime = "Please select a valid contact time.";

  return { lead, fieldErrors, valid: Object.keys(fieldErrors).length === 0 };
}

function whatsappDigits(phone) {
  let digits = String(phone || "").replace(/\D/g, "");
  if (digits.startsWith("00")) digits = digits.slice(2);
  else if (digits.length === 11 && digits.startsWith("0")) digits = digits.slice(1);
  if (digits.length === 10 && !String(phone || "").trim().startsWith("+")) digits = `91${digits}`;
  return digits;
}

function loadFirebaseConfig() {
  try {
    return JSON.parse(readFileSync(new URL("../firebase-applet-config.json", import.meta.url), "utf8"));
  } catch {
    return null;
  }
}

function firestoreFields(lead, telegramDelivered) {
  const fields = {
    name: { stringValue: lead.name },
    phone: { stringValue: lead.phone },
    preferredContactMethod: { stringValue: lead.preferredContactMethod },
    projectType: { stringValue: lead.projectType },
    budget: { stringValue: lead.budget },
    source: { stringValue: "SURAJ.WEB Portfolio" },
    status: { stringValue: "new" },
    createdAt: { stringValue: new Date().toISOString() },
    telegramNotificationStatus: { stringValue: telegramDelivered ? "sent" : "unconfirmed" },
  };

  for (const key of ["businessName", "businessType", "currentWebsite", "timeline", "projectGoal", "reference", "preferredContactTime"]) {
    if (lead[key]) fields[key] = { stringValue: lead[key] };
  }

  const digits = whatsappDigits(lead.phone);
  if (digits) {
    fields.whatsappNumber = { stringValue: digits };
    fields.whatsappLink = { stringValue: `https://wa.me/${digits}` };
  }
  return fields;
}

export async function saveEnquiryToFirestore(lead, requestId, telegramDelivered, timeoutMs = 4000) {
  const config = loadFirebaseConfig();
  if (!config?.projectId || !config?.apiKey) return { success: false, code: "NOT_CONFIGURED" };

  const databaseId = config.firestoreDatabaseId || config.databaseId || "(default)";
  const url = `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(config.projectId)}/databases/${encodeURIComponent(databaseId)}/documents/projectEnquiries?documentId=${encodeURIComponent(requestId)}&key=${encodeURIComponent(config.apiKey)}`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      method: "POST",
      cache: "no-store",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fields: firestoreFields(lead, telegramDelivered) }),
      signal: controller.signal,
    });
    if (!response.ok) return { success: false, code: `HTTP_${response.status}` };
    const data = await response.json().catch(() => null);
    return { success: Boolean(data && typeof data.name === "string") };
  } catch (error) {
    return { success: false, code: error?.name === "AbortError" ? "TIMEOUT" : "NETWORK_ERROR" };
  } finally {
    clearTimeout(timer);
  }
}

export async function handleProjectEnquiry(input, options = {}) {
  const requestId = randomUUID();
  const log = options.log || ((provider, code) => console.warn(`[Enquiry ${requestId}] ${provider}: ${code}`));
  if (!options.skipRateLimit && rateLimit(options.ip)) {
    return {
      status: 429,
      body: { success: false, requestId, error: "Too many enquiries from this device. Please wait a few minutes and try again." },
    };
  }

  const { lead, fieldErrors, valid } = validateProjectEnquiry(input);
  if (!valid) {
    return {
      status: 400,
      body: { success: false, requestId, error: "Please check the highlighted form details.", fieldErrors },
    };
  }

  const botToken = (options.botToken ?? process.env.TELEGRAM_BOT_TOKEN ?? "").trim();
  const chatId = (options.chatId ?? process.env.TELEGRAM_CHAT_ID ?? process.env.TELEGRAM_OWNER_CHAT_ID ?? "").trim();
  const telegramSender = options.telegramSender || sendTelegramNotification;
  const firestoreWriter = options.firestoreWriter || saveEnquiryToFirestore;
  const message = formatTelegramEnquiryMessage(lead, requestId);

  const telegramResult = await telegramSender(botToken, chatId, message, 10000);
  const telegramDelivered = telegramResult?.success === true;
  if (!telegramDelivered) log("telegram", telegramResult?.code || "DELIVERY_FAILED");

  const firestoreResult = await firestoreWriter(lead, requestId, telegramDelivered);
  const firestoreStored = firestoreResult?.success === true;
  if (!firestoreStored) log("firestore", firestoreResult?.code || "STORE_FAILED");

  if (telegramDelivered) {
    return { status: 200, body: { success: true, delivery: "sent", telegramDelivered: true, firestoreStored, requestId } };
  }
  if (firestoreStored) {
    return { status: 202, body: { success: true, delivery: "saved", telegramDelivered: false, firestoreStored: true, requestId } };
  }
  return {
    status: 502,
    body: {
      success: false,
      delivery: "failed",
      telegramDelivered: false,
      firestoreStored: false,
      requestId,
      error: "We couldn’t confirm delivery. Your details are still here. Please contact Suraj on WhatsApp, or try again.",
    },
  };
}

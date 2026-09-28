import { TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID } from "@/lib/server/telegram-credentials";

const ADMIN_CHAT_ID = String(TELEGRAM_CHAT_ID);
const STORAGE_LANGUAGE = "zu";

export type PortfolioRating = {
  id: number;
  name: string;
  business: string;
  rating: number;
  message: string;
  createdAt: string;
  status: "pending" | "approved";
};

type TelegramCommand = { command: string; description: string };

async function telegramApi<T>(method: string, payload?: Record<string, unknown>): Promise<T> {
  const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/${method}`, {
    method: payload ? "POST" : "GET",
    headers: payload ? { "Content-Type": "application/json" } : undefined,
    body: payload ? JSON.stringify(payload) : undefined,
    cache: "no-store",
  });
  const data = await response.json().catch(() => null) as { ok?: boolean; result?: T; description?: string } | null;
  if (!response.ok || !data?.ok) throw new Error(data?.description || `Telegram ${method} failed`);
  return data.result as T;
}

function clean(value: unknown, max: number) {
  return String(value ?? "")
    .replace(/[\u0000-\u001f\u007f]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);
}

async function getStorageCommands(): Promise<TelegramCommand[]> {
  return telegramApi<TelegramCommand[]>("getMyCommands?language_code=" + STORAGE_LANGUAGE);
}

async function setStorageCommands(commands: TelegramCommand[]) {
  const normalized = commands
    .filter((item) => /^[a-z0-9_]{1,32}$/.test(item.command))
    .map((item) => ({ command: item.command, description: clean(item.description, 256) || "-" }))
    .slice(0, 100);
  await telegramApi<boolean>("setMyCommands", { commands: normalized, language_code: STORAGE_LANGUAGE });
}

function reviewKey(id: number) {
  return `r${String(id).padStart(3, "0")}`;
}

function encodeReview(review: PortfolioRating) {
  return JSON.stringify({
    n: clean(review.name, 30),
    b: clean(review.business, 30),
    r: review.rating,
    m: clean(review.message, 100),
    t: review.createdAt,
    s: review.status === "approved" ? "a" : "p",
  });
}

function decodeReview(command: TelegramCommand): PortfolioRating | null {
  if (!/^r\d{3}$/.test(command.command)) return null;
  try {
    const raw = JSON.parse(command.description) as Record<string, unknown>;
    const rating = Number(raw.r);
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) return null;
    return {
      id: Number(command.command.slice(1)),
      name: clean(raw.n, 30),
      business: clean(raw.b, 30),
      rating,
      message: clean(raw.m, 100),
      createdAt: clean(raw.t, 20),
      status: raw.s === "a" ? "approved" : "pending",
    };
  } catch {
    return null;
  }
}

export async function listRatings(status?: "pending" | "approved") {
  const commands = await getStorageCommands().catch(() => []);
  return commands
    .map(decodeReview)
    .filter((item): item is PortfolioRating => Boolean(item))
    .filter((item) => !status || item.status === status)
    .sort((a, b) => b.id - a.id);
}

export async function submitRating(input: unknown) {
  const data = (input && typeof input === "object" ? input : {}) as Record<string, unknown>;
  const honeypot = clean(data.website, 100);
  if (honeypot) throw new Error("SPAM");

  const name = clean(data.name, 30);
  const business = clean(data.business, 30);
  const message = clean(data.message, 100);
  const rating = Number(data.rating);

  if (name.length < 2) throw new Error("Please enter your name.");
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) throw new Error("Choose a rating from 1 to 5.");
  if (message.length < 8) throw new Error("Please write a short review.");

  const commands = await getStorageCommands();
  const reviews = commands.map(decodeReview).filter((item): item is PortfolioRating => Boolean(item));
  const nextId = Math.max(0, ...reviews.map((item) => item.id)) + 1;
  if (nextId > 75) throw new Error("Review storage is full. Please try again later.");

  const review: PortfolioRating = {
    id: nextId,
    name,
    business,
    rating,
    message,
    createdAt: Date.now().toString(36),
    status: "pending",
  };

  const map = new Map(commands.map((item) => [item.command, item.description]));
  map.set(reviewKey(nextId), encodeReview(review));
  await setStorageCommands([...map.entries()].map(([command, description]) => ({ command, description })));

  await telegramApi("sendMessage", {
    chat_id: ADMIN_CHAT_ID,
    text: [
      "⭐ NEW PORTFOLIO RATING",
      `ID: ${nextId}`,
      `Name: ${name}`,
      `Business: ${business || "Not provided"}`,
      `Rating: ${rating}/5`,
      `Review: ${message}`,
      "",
      "Use the buttons below, or type:",
      `/rating_approve ${nextId}`,
      `/rating_reject ${nextId}`,
    ].join("\n"),
    reply_markup: {
      inline_keyboard: [[
        { text: "✅ Approve", callback_data: `rating:approve:${nextId}` },
        { text: "❌ Reject", callback_data: `rating:reject:${nextId}` },
      ]],
    },
  }).catch(() => {});

  return review;
}

async function updateStatus(id: number, status: "pending" | "approved" | "delete") {
  const commands = await getStorageCommands();
  const map = new Map(commands.map((item) => [item.command, item.description]));
  const key = reviewKey(id);
  const existing = commands.find((item) => item.command === key);
  const review = existing ? decodeReview(existing) : null;
  if (!review) throw new Error("RATING_NOT_FOUND");

  if (status === "delete") {
    map.delete(key);
  } else {
    review.status = status;
    map.set(key, encodeReview(review));
  }
  await setStorageCommands([...map.entries()].map(([command, description]) => ({ command, description })));
  return review;
}

export async function moderateRating(
  id: number,
  action: "approve" | "reject" | "delete"
) {
  if (!Number.isInteger(id) || id < 1) throw new Error("INVALID_RATING_ID");
  if (action === "approve") return updateStatus(id, "approved");
  return updateStatus(id, "delete");
}

async function adminReply(text: string) {
  await telegramApi("sendMessage", { chat_id: ADMIN_CHAT_ID, text, disable_web_page_preview: true });
}

async function answerCallback(callbackQueryId: string, text: string) {
  await telegramApi("answerCallbackQuery", {
    callback_query_id: callbackQueryId,
    text,
    show_alert: false,
  }).catch(() => {});
}

async function clearRatingButtons(chatId: string | number, messageId: number) {
  await telegramApi("editMessageReplyMarkup", {
    chat_id: chatId,
    message_id: messageId,
    reply_markup: { inline_keyboard: [] },
  }).catch(() => {});
}

function normalizeRatingCommand(command: string) {
  const aliases: Record<string, string> = {
    reting_approve: "rating_approve",
    reting_reject: "rating_reject",
    reting_delete: "rating_delete",
    approve_rating: "rating_approve",
    reject_rating: "rating_reject",
    delete_rating: "rating_delete",
    approve: "rating_approve",
    reject: "rating_reject",
  };
  return aliases[command] || command;
}

export async function handleTelegramRatingUpdate(update: any) {
  const callback = update?.callback_query;
  if (callback?.message?.chat?.id && String(callback.message.chat.id) === ADMIN_CHAT_ID) {
    const data = String(callback.data || "");
    const match = data.match(/^rating:(approve|reject|delete):(\d+)$/);
    if (!match) return false;

    const action = match[1];
    const id = Number(match[2]);
    try {
      if (action === "approve") {
        const review = await updateStatus(id, "approved");
        await answerCallback(String(callback.id), `Rating #${id} approved`);
        await clearRatingButtons(callback.message.chat.id, callback.message.message_id);
        await adminReply(`✅ Rating #${id} from ${review.name} is now published.`);
      } else {
        await updateStatus(id, "delete");
        await answerCallback(String(callback.id), `Rating #${id} removed`);
        await clearRatingButtons(callback.message.chat.id, callback.message.message_id);
        await adminReply(`✅ Rating #${id} rejected and removed.`);
      }
    } catch {
      await answerCallback(String(callback.id), `Rating #${id} was not found`);
    }
    return true;
  }

  const message = update?.message;
  if (!message?.chat?.id || String(message.chat.id) !== ADMIN_CHAT_ID) return false;
  const text = String(message.text || "").trim();
  if (!text.startsWith("/")) return false;

  const firstLine = text.split("\n")[0];
  const parts = firstLine.split(/\s+/);
  const rawCommand = (parts[0] || "").replace(/^\//, "").replace(/@.+$/, "").replace(/-/g, "_").toLowerCase();
  const command = normalizeRatingCommand(rawCommand);
  const id = Number(parts[1]);

  if (command === "ratings_pending") {
    const ratings = await listRatings("pending");
    await adminReply(ratings.length
      ? ratings.map((item) => `#${item.id} · ${item.rating}/5 · ${item.name}\n${item.message}\nApprove: /rating_approve ${item.id} · Reject: /rating_reject ${item.id}`).join("\n\n")
      : "No pending portfolio ratings.");
    return true;
  }

  if (command === "ratings") {
    const ratings = await listRatings("approved");
    await adminReply(ratings.length
      ? ratings.map((item) => `#${item.id} · ${item.rating}/5 · ${item.name} · ${item.business || "Visitor"}\n${item.message}`).join("\n\n")
      : "No published portfolio ratings yet.");
    return true;
  }

  if (command === "rating_help") {
    await adminReply([
      "SURAJ.WEB rating commands:",
      "/ratings_pending",
      "/ratings",
      "/rating_approve 1",
      "/rating_reject 1",
      "/rating_delete 1",
      "",
      "Easy shortcuts also work:",
      "/approve 1",
      "/reject 1",
      "",
      "For new ratings, simply tap the ✅ Approve or ❌ Reject button.",
    ].join("\n"));
    return true;
  }

  if (!["rating_approve", "rating_reject", "rating_delete"].includes(command)) return false;
  if (!Number.isInteger(id) || id < 1) {
    await adminReply("❌ Invalid rating ID.");
    return true;
  }

  try {
    if (command === "rating_approve") {
      const review = await updateStatus(id, "approved");
      await adminReply(`✅ Rating #${id} from ${review.name} is now published.`);
    } else if (command === "rating_reject") {
      await updateStatus(id, "pending");
      await updateStatus(id, "delete");
      await adminReply(`✅ Rating #${id} rejected and removed.`);
    } else {
      await updateStatus(id, "delete");
      await adminReply(`✅ Rating #${id} deleted.`);
    }
  } catch {
    await adminReply(`❌ Rating #${id} was not found.`);
  }
  return true;
}

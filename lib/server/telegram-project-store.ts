import { deflateRawSync, inflateRawSync } from "node:zlib";
import { DEFAULT_PORTFOLIO_PROJECTS, type PortfolioProject } from "@/lib/portfolio-projects";
import { TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID } from "@/lib/server/telegram-credentials";

const ADMIN_CHAT_ID = String(TELEGRAM_CHAT_ID);
const STORAGE_LANGUAGE = "zu";
const WEBHOOK_SECRET = "suraj_portfolio_projects_8116838619";
const CHUNK_COUNT = 5;
const CHUNK_SIZE = 240;

type StoredProject = {
  title?: string;
  brand?: string;
  description?: string;
  label?: string;
  detail?: string;
  imageFileId?: string;
  imageUrl?: string;
  color?: string;
  scope?: string[];
  liveUrl?: string;
};

type TelegramCommand = { command: string; description: string };

type ReplyMarkup = Record<string, unknown>;

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

function cleanMultiline(value: unknown, max: number) {
  return String(value ?? "")
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, " ")
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

function legacyStorageKey(slot: number, field: "t" | "d" | "l" | "f" | "u") {
  return `p${slot}${field}`;
}

function chunkStorageKey(slot: number, index: number) {
  return `p${slot}z${index}`;
}

function compactProject(value: StoredProject) {
  const compact: Record<string, unknown> = {};
  if (value.title) compact.t = clean(value.title, 90);
  if (value.brand) compact.b = clean(value.brand, 70);
  if (value.description) compact.d = clean(value.description, 280);
  if (value.label) compact.l = clean(value.label, 70);
  if (value.detail) compact.x = clean(value.detail, 520);
  if (value.imageFileId) compact.f = clean(value.imageFileId, 300);
  if (value.imageUrl) compact.i = clean(value.imageUrl, 320);
  if (value.color) compact.c = clean(value.color, 20);
  if (value.liveUrl) compact.v = clean(value.liveUrl, 320);
  if (value.scope?.length) compact.s = value.scope.slice(0, 5).map((item) => clean(item, 120)).filter(Boolean);
  return compact;
}

function expandProject(raw: Record<string, unknown>): StoredProject {
  return {
    title: clean(raw.t, 90) || undefined,
    brand: clean(raw.b, 70) || undefined,
    description: clean(raw.d, 280) || undefined,
    label: clean(raw.l, 70) || undefined,
    detail: clean(raw.x, 520) || undefined,
    imageFileId: clean(raw.f, 300) || undefined,
    imageUrl: clean(raw.i, 320) || undefined,
    color: clean(raw.c, 20) || undefined,
    liveUrl: clean(raw.v, 320) || undefined,
    scope: Array.isArray(raw.s)
      ? raw.s.slice(0, 5).map((item) => clean(item, 120)).filter(Boolean)
      : undefined,
  };
}

function encodeProject(value: StoredProject) {
  const json = JSON.stringify(compactProject(value));
  const encoded = deflateRawSync(Buffer.from(json, "utf8"), { level: 9 }).toString("base64url");
  if (encoded.length > CHUNK_COUNT * CHUNK_SIZE) throw new Error("PROJECT_DATA_TOO_LARGE");
  return Array.from({ length: CHUNK_COUNT }, (_, index) =>
    encoded.slice(index * CHUNK_SIZE, (index + 1) * CHUNK_SIZE)
  );
}

function decodeProject(commands: TelegramCommand[], slot: number): StoredProject | null {
  const map = new Map(commands.map((item) => [item.command, item.description]));
  const encoded = Array.from({ length: CHUNK_COUNT }, (_, index) => {
    const value = map.get(chunkStorageKey(slot, index));
    return value && value !== "-" ? value : "";
  }).join("");

  if (encoded) {
    try {
      const json = inflateRawSync(Buffer.from(encoded, "base64url")).toString("utf8");
      return expandProject(JSON.parse(json) as Record<string, unknown>);
    } catch {
      // Fall through to legacy storage so old data is not lost.
    }
  }

  const readLegacy = (field: "t" | "d" | "l" | "f" | "u") => {
    const value = map.get(legacyStorageKey(slot, field));
    return value && value !== "-" ? value : undefined;
  };
  const legacy: StoredProject = {
    title: readLegacy("t"),
    description: readLegacy("d"),
    label: readLegacy("l"),
    imageFileId: readLegacy("f"),
    imageUrl: readLegacy("u"),
  };
  return Object.values(legacy).some(Boolean) ? legacy : null;
}

async function writeStoredProject(slot: number, value: StoredProject) {
  if (![1, 2, 3, 4].includes(slot)) throw new Error("INVALID_PROJECT_ID");
  const commands = await getStorageCommands().catch(() => []);
  const map = new Map(commands.map((item) => [item.command, item.description]));

  for (let index = 0; index < CHUNK_COUNT; index += 1) {
    map.delete(chunkStorageKey(slot, index));
  }
  for (const field of ["t", "d", "l", "f", "u"] as const) {
    map.delete(legacyStorageKey(slot, field));
  }

  const chunks = encodeProject(value);
  chunks.forEach((chunk, index) => {
    if (chunk) map.set(chunkStorageKey(slot, index), chunk);
  });

  await setStorageCommands([...map.entries()].map(([command, description]) => ({ command, description })));
}

export async function getStoredProject(slot: number): Promise<StoredProject> {
  if (![1, 2, 3, 4].includes(slot)) return {};
  const commands = await getStorageCommands().catch(() => []);
  return decodeProject(commands, slot) || {};
}

export async function updateStoredProject(slot: number, patch: StoredProject) {
  const current = await getStoredProject(slot);
  const next: StoredProject = { ...current };

  const assign = (key: keyof StoredProject, value: StoredProject[keyof StoredProject]) => {
    if (value === undefined) return;
    if (Array.isArray(value)) {
      if (value.length) next.scope = value;
      else delete next.scope;
      return;
    }
    const text = String(value).trim();
    if (text) (next as Record<string, unknown>)[key] = text;
    else delete (next as Record<string, unknown>)[key];
  };

  (Object.keys(patch) as Array<keyof StoredProject>).forEach((key) => assign(key, patch[key]));
  await writeStoredProject(slot, next);
}

export async function seedProjectStore() {
  // Defaults live in source. Overrides are stored only when the owner edits a project.
  // This keeps Telegram hidden storage small and leaves room for moderated ratings.
  return;
}

export async function getPortfolioProjects(): Promise<PortfolioProject[]> {
  const commands = await getStorageCommands().catch(() => []);
  return DEFAULT_PORTFOLIO_PROJECTS.map((project) => {
    const stored = decodeProject(commands, project.slot) || {};
    return {
      ...project,
      brand: stored.brand || project.brand,
      title: stored.title || project.title,
      line: stored.description || project.line,
      tag: stored.label || project.tag,
      detail: stored.detail || project.detail,
      image: stored.imageFileId
        ? `/api/portfolio-project-image/${project.slot}`
        : stored.imageUrl || project.image,
      color: stored.color || project.color,
      scope: stored.scope?.length ? stored.scope : project.scope,
      liveUrl: stored.liveUrl || project.liveUrl,
    };
  });
}

export async function getTelegramFileUrl(fileId: string) {
  const result = await telegramApi<{ file_path?: string }>("getFile", { file_id: fileId });
  if (!result.file_path) throw new Error("TELEGRAM_FILE_NOT_FOUND");
  return `https://api.telegram.org/file/bot${TELEGRAM_BOT_TOKEN}/${result.file_path}`;
}

export function verifyTelegramWebhookSecret(value: string | null) {
  return value === WEBHOOK_SECRET;
}

export async function sendTelegramAdminMessage(text: string, replyMarkup?: ReplyMarkup) {
  await telegramApi("sendMessage", {
    chat_id: ADMIN_CHAT_ID,
    text,
    disable_web_page_preview: true,
    ...(replyMarkup ? { reply_markup: replyMarkup } : {}),
  });
}

async function answerCallback(callbackQueryId: string, text?: string) {
  await telegramApi("answerCallbackQuery", {
    callback_query_id: callbackQueryId,
    ...(text ? { text } : {}),
  }).catch(() => {});
}

function parseSlot(value: string | undefined) {
  const slot = Number(value);
  return [1, 2, 3, 4].includes(slot) ? slot : null;
}

function projectText(project: PortfolioProject) {
  return [
    `#${project.slot} — ${project.title}`,
    `Brand: ${project.brand}`,
    `Category: ${project.tag}`,
    `Card text: ${project.line}`,
    `Detail: ${project.detail}`,
    `Live: ${project.liveUrl}`,
    `Color: ${project.color}`,
    `Image: ${project.image}`,
    "Scope:",
    ...project.scope.map((item) => `• ${item}`),
  ].join("\n");
}

function projectMenu(slot: number): ReplyMarkup {
  return {
    inline_keyboard: [
      [
        { text: "✏️ Title", callback_data: `pedit:${slot}:title` },
        { text: "🏷 Category", callback_data: `pedit:${slot}:label` },
      ],
      [
        { text: "📝 Card text", callback_data: `pedit:${slot}:description` },
        { text: "🔎 Detail", callback_data: `pedit:${slot}:detail` },
      ],
      [
        { text: "🔗 Live link", callback_data: `pedit:${slot}:live` },
        { text: "🖼 Image", callback_data: `pedit:${slot}:image` },
      ],
      [
        { text: "🏢 Brand", callback_data: `pedit:${slot}:brand` },
        { text: "🎨 Card color", callback_data: `pedit:${slot}:color` },
      ],
      [
        { text: "✅ Scope", callback_data: `pedit:${slot}:scope` },
        { text: "♻️ Reset project", callback_data: `preset:${slot}` },
      ],
    ],
  };
}

function projectListMenu(): ReplyMarkup {
  return {
    inline_keyboard: [
      [
        { text: "Edit #1", callback_data: "pmenu:1" },
        { text: "Edit #2", callback_data: "pmenu:2" },
      ],
      [
        { text: "Edit #3", callback_data: "pmenu:3" },
        { text: "Edit #4", callback_data: "pmenu:4" },
      ],
    ],
  };
}

const fieldLabels: Record<string, string> = {
  title: "title",
  label: "category / label",
  description: "card description",
  detail: "long project detail",
  live: "live preview URL",
  image: "project image",
  brand: "brand name",
  color: "card color",
  scope: "project scope",
};

async function sendEditMenu(slot: number) {
  const projects = await getPortfolioProjects();
  const project = projects.find((item) => item.slot === slot);
  if (!project) return sendTelegramAdminMessage("❌ Project not found.");
  return sendTelegramAdminMessage(projectText(project), projectMenu(slot));
}

async function sendFieldPrompt(slot: number, field: string) {
  const label = fieldLabels[field];
  if (!label) return sendTelegramAdminMessage("❌ Unknown field.");

  let instruction = `Reply to this message with the new ${label}.`;
  if (field === "image") instruction = "Reply to this message with the new screenshot as a PHOTO, or paste a direct https:// image URL.";
  if (field === "live") instruction = "Reply with the full https:// live preview URL.";
  if (field === "color") instruction = "Reply with a hex color, for example #1a0c07.";
  if (field === "scope") instruction = "Reply with 1 to 5 scope items, one per line.";

  await sendTelegramAdminMessage(
    `✏️ Project ${slot} — ${label}\n${instruction}\n\n#project_edit:${slot}:${field}`,
    { force_reply: true, selective: true },
  );
}

function parseReplyMarker(text: string) {
  const match = text.match(/#project_edit:([1-4]):([a-z_]+)/i);
  if (!match) return null;
  return { slot: Number(match[1]), field: match[2].toLowerCase() };
}

function normalizeField(field: string) {
  const aliases: Record<string, string> = {
    desc: "description",
    description: "description",
    card: "description",
    category: "label",
    tag: "label",
    label: "label",
    link: "live",
    url: "live",
    liveurl: "live",
    live: "live",
    photo: "image",
    imageurl: "image",
    image: "image",
    name: "title",
    title: "title",
    brand: "brand",
    detail: "detail",
    color: "color",
    colour: "color",
    scope: "scope",
  };
  return aliases[field.toLowerCase()] || field.toLowerCase();
}

async function applyFieldEdit(slot: number, field: string, text: string, photoFileId?: string) {
  const normalized = normalizeField(field);
  const value = cleanMultiline(text, 1200);

  if (normalized === "title") {
    if (!clean(value, 90)) throw new Error("Add a title.");
    await updateStoredProject(slot, { title: clean(value, 90) });
  } else if (normalized === "brand") {
    if (!clean(value, 70)) throw new Error("Add a brand name.");
    await updateStoredProject(slot, { brand: clean(value, 70) });
  } else if (normalized === "description") {
    if (!clean(value, 280)) throw new Error("Add the card description.");
    await updateStoredProject(slot, { description: clean(value, 280) });
  } else if (normalized === "label") {
    if (!clean(value, 70)) throw new Error("Add the category / label.");
    await updateStoredProject(slot, { label: clean(value, 70) });
  } else if (normalized === "detail") {
    if (!clean(value, 520)) throw new Error("Add the project detail.");
    await updateStoredProject(slot, { detail: clean(value, 520) });
  } else if (normalized === "live") {
    if (!/^https:\/\//i.test(value)) throw new Error("Send a valid https:// live preview URL.");
    await updateStoredProject(slot, { liveUrl: clean(value, 320) });
  } else if (normalized === "image") {
    if (photoFileId) {
      await updateStoredProject(slot, { imageFileId: photoFileId, imageUrl: "" });
    } else {
      if (!/^https:\/\//i.test(value)) throw new Error("Reply with a photo or a valid https:// image URL.");
      await updateStoredProject(slot, { imageUrl: clean(value, 320), imageFileId: "" });
    }
  } else if (normalized === "color") {
    const color = clean(value, 20);
    if (!/^#[0-9a-f]{6}$/i.test(color)) throw new Error("Use a 6-digit hex color, for example #1a0c07.");
    await updateStoredProject(slot, { color });
  } else if (normalized === "scope") {
    const scope = value
      .split(/\n|\|/)
      .map((item) => clean(item.replace(/^[-•]\s*/, ""), 120))
      .filter(Boolean)
      .slice(0, 5);
    if (!scope.length) throw new Error("Send at least one scope item.");
    await updateStoredProject(slot, { scope });
  } else {
    throw new Error("Unknown field.");
  }
}

async function resetProject(slot: number) {
  await writeStoredProject(slot, {});
}

export async function handleTelegramProjectUpdate(update: any) {
  const callback = update?.callback_query;
  if (callback?.message?.chat?.id && String(callback.message.chat.id) === ADMIN_CHAT_ID) {
    const data = String(callback.data || "");

    const menuMatch = data.match(/^pmenu:([1-4])$/);
    if (menuMatch) {
      await answerCallback(String(callback.id));
      await sendEditMenu(Number(menuMatch[1]));
      return;
    }

    const fieldMatch = data.match(/^pedit:([1-4]):([a-z_]+)$/);
    if (fieldMatch) {
      await answerCallback(String(callback.id));
      await sendFieldPrompt(Number(fieldMatch[1]), fieldMatch[2]);
      return;
    }

    const resetMatch = data.match(/^preset:([1-4])$/);
    if (resetMatch) {
      const slot = Number(resetMatch[1]);
      await resetProject(slot);
      await answerCallback(String(callback.id), `Project #${slot} reset`);
      await sendTelegramAdminMessage(`✅ Project #${slot} reset to the website defaults.`);
      await sendEditMenu(slot);
      return;
    }
    return;
  }

  const message = update?.message;
  if (!message?.chat?.id || String(message.chat.id) !== ADMIN_CHAT_ID) return;

  const text = String(message.text || message.caption || "").trim();
  const replyText = String(message.reply_to_message?.text || message.reply_to_message?.caption || "").trim();
  const marker = parseReplyMarker(replyText);

  if (marker) {
    const fileId = Array.isArray(message.photo) && message.photo.length
      ? message.photo[message.photo.length - 1]?.file_id
      : undefined;
    try {
      await applyFieldEdit(marker.slot, marker.field, text, fileId);
      await sendTelegramAdminMessage(`✅ Project #${marker.slot} ${fieldLabels[marker.field] || marker.field} updated.`);
      await sendEditMenu(marker.slot);
    } catch (error) {
      await sendTelegramAdminMessage(`❌ ${error instanceof Error ? error.message : "Update failed."}\nReply to the same edit prompt and try again.`);
    }
    return;
  }

  const photoCommand = [text, replyText].find((value) => /^\/(?:project_?image|image|photo)(?:@\w+)?\s+[1-4]\b/i.test(value));
  if (Array.isArray(message.photo) && message.photo.length && photoCommand) {
    const slot = parseSlot(photoCommand.match(/^\/(?:project_?image|image|photo)(?:@\w+)?\s+([1-4])/i)?.[1]);
    if (!slot) return;
    const fileId = message.photo[message.photo.length - 1]?.file_id;
    if (!fileId) return;
    await updateStoredProject(slot, { imageFileId: fileId, imageUrl: "" });
    await sendTelegramAdminMessage(`✅ Project #${slot} image updated.`);
    await sendEditMenu(slot);
    return;
  }

  if (!text.startsWith("/")) return;

  const firstLine = text.split("\n")[0];
  const parts = firstLine.split(/\s+/);
  const command = (parts[0] || "").replace(/^\//, "").replace(/@.+$/, "").replace(/-/g, "_").toLowerCase();
  const slot = parseSlot(parts[1]);

  if (command === "projects" || command === "p") {
    const projects = await getPortfolioProjects();
    await sendTelegramAdminMessage(
      projects.map((project) => `#${project.slot} — ${project.title}\n${project.liveUrl}`).join("\n\n"),
      projectListMenu(),
    );
    return;
  }

  if (command === "edit" || command === "project") {
    if (!slot) return sendTelegramAdminMessage("Use /edit 1, /edit 2, /edit 3, or /edit 4.");
    await sendEditMenu(slot);
    return;
  }

  if (command === "image" || command === "photo" || command === "project_image") {
    if (!slot) return sendTelegramAdminMessage("Use /image 1, /image 2, /image 3, or /image 4.");
    await sendFieldPrompt(slot, "image");
    return;
  }

  if (command === "reset") {
    if (!slot) return sendTelegramAdminMessage("Use /reset 1, /reset 2, /reset 3, or /reset 4.");
    await resetProject(slot);
    await sendTelegramAdminMessage(`✅ Project #${slot} reset to defaults.`);
    await sendEditMenu(slot);
    return;
  }

  if (command === "set") {
    if (!slot) return sendTelegramAdminMessage("Example: /set 1 title New project title");
    const field = normalizeField(parts[2] || "");
    const value = firstLine.split(/\s+/).slice(3).join(" ").trim();
    try {
      await applyFieldEdit(slot, field, value);
      await sendTelegramAdminMessage(`✅ Project #${slot} updated.`);
      await sendEditMenu(slot);
    } catch (error) {
      await sendTelegramAdminMessage(`❌ ${error instanceof Error ? error.message : "Update failed."}`);
    }
    return;
  }

  // Legacy commands stay supported so old saved instructions never break.
  const legacyMap: Record<string, string> = {
    project_title: "title",
    project_label: "label",
    project_description: "description",
    project_image_url: "image",
  };
  if (legacyMap[command]) {
    if (!slot) return sendTelegramAdminMessage("❌ Invalid project ID. Use 1 to 4.");
    const value = firstLine.split(/\s+/).slice(2).join(" ").trim();
    try {
      await applyFieldEdit(slot, legacyMap[command], value);
      await sendTelegramAdminMessage(`✅ Project #${slot} updated.`);
      await sendEditMenu(slot);
    } catch (error) {
      await sendTelegramAdminMessage(`❌ ${error instanceof Error ? error.message : "Update failed."}`);
    }
    return;
  }

  if (command === "help" || command === "project_help") {
    await sendTelegramAdminMessage([
      "SURAJ.WEB bot — easy controls",
      "",
      "1) /projects — see all 4 projects + edit buttons",
      "2) /edit 1 — open project #1 editor",
      "3) /image 1 — change project #1 screenshot",
      "4) /ratings_pending — ratings waiting for approval",
      "5) /ratings — published ratings",
      "",
      "Fast text edit (optional):",
      "/set 1 title New title",
      "/set 1 link https://...",
      "/set 1 category Interior Design",
      "",
      "For easiest editing, use /projects and tap the buttons.",
    ].join("\n"));
    return;
  }

  await sendTelegramAdminMessage("Unknown command. Use /help or simply /projects.");
}

export async function setupTelegramProjectWebhook(origin: string) {
  await seedProjectStore();
  await telegramApi("setMyCommands", {
    commands: [
      { command: "projects", description: "View projects and tap to edit" },
      { command: "edit", description: "Edit a project: /edit 1" },
      { command: "image", description: "Change screenshot: /image 1" },
      { command: "ratings_pending", description: "Ratings waiting for approval" },
      { command: "ratings", description: "Published portfolio ratings" },
      { command: "help", description: "Show the simple bot controls" },
    ],
  });
  return telegramApi("setWebhook", {
    url: `${origin}/api/telegram-webhook`,
    secret_token: WEBHOOK_SECRET,
    allowed_updates: ["message", "callback_query"],
    drop_pending_updates: false,
  });
}

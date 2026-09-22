import { DEFAULT_PORTFOLIO_PROJECTS, type PortfolioProject } from "@/lib/portfolio-projects";
import { TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID } from "@/lib/server/telegram-credentials";

const ADMIN_CHAT_ID = String(TELEGRAM_CHAT_ID);
const STORAGE_LANGUAGE = "zu";
const WEBHOOK_SECRET = "suraj_portfolio_projects_8116838619";

type StoredProject = {
  title?: string;
  description?: string;
  label?: string;
  imageFileId?: string;
  imageUrl?: string;
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

function storageKey(slot: number, field: "t" | "d" | "l" | "f" | "u") {
  return `p${slot}${field}`;
}

function clean(value: string | undefined, max: number) {
  const text = (value || "").replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim();
  return text.slice(0, max);
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

function commandsToStored(commands: TelegramCommand[], slot: number): StoredProject {
  const map = new Map(commands.map((item) => [item.command, item.description]));
  const read = (field: "t" | "d" | "l" | "f" | "u") => {
    const value = map.get(storageKey(slot, field));
    return value && value !== "-" ? value : undefined;
  };
  return {
    title: read("t"),
    description: read("d"),
    label: read("l"),
    imageFileId: read("f"),
    imageUrl: read("u"),
  };
}

export async function getStoredProject(slot: number): Promise<StoredProject> {
  if (![1, 2, 3, 4].includes(slot)) return {};
  const commands = await getStorageCommands().catch(() => []);
  return commandsToStored(commands, slot);
}

export async function updateStoredProject(slot: number, patch: StoredProject) {
  if (![1, 2, 3, 4].includes(slot)) throw new Error("INVALID_PROJECT_ID");
  const commands = await getStorageCommands().catch(() => []);
  const map = new Map(commands.map((item) => [item.command, item.description]));

  const put = (field: "t" | "d" | "l" | "f" | "u", value: string | undefined, max: number) => {
    if (value === undefined) return;
    map.set(storageKey(slot, field), clean(value, max) || "-");
  };

  put("t", patch.title, 90);
  put("d", patch.description, 250);
  put("l", patch.label, 60);
  put("f", patch.imageFileId, 250);
  put("u", patch.imageUrl, 250);

  await setStorageCommands([...map.entries()].map(([command, description]) => ({ command, description })));
}

export async function seedProjectStore() {
  const commands = await getStorageCommands().catch(() => []);
  const map = new Map(commands.map((item) => [item.command, item.description]));
  let changed = false;
  for (const project of DEFAULT_PORTFOLIO_PROJECTS) {
    const values: Array<[string, string]> = [
      [storageKey(project.slot, "t"), project.title],
      [storageKey(project.slot, "d"), project.line],
      [storageKey(project.slot, "l"), project.tag],
      [storageKey(project.slot, "f"), "-"],
      [storageKey(project.slot, "u"), "-"],
    ];
    for (const [key, value] of values) {
      if (!map.has(key)) {
        map.set(key, clean(value, 256) || "-");
        changed = true;
      }
    }
  }
  if (changed) await setStorageCommands([...map.entries()].map(([command, description]) => ({ command, description })));
}

export async function getPortfolioProjects(): Promise<PortfolioProject[]> {
  const commands = await getStorageCommands().catch(() => []);
  return DEFAULT_PORTFOLIO_PROJECTS.map((project) => {
    const stored = commandsToStored(commands, project.slot);
    return {
      ...project,
      title: stored.title || project.title,
      line: stored.description || project.line,
      tag: stored.label || project.tag,
      image: stored.imageFileId
        ? `/api/portfolio-project-image/${project.slot}`
        : stored.imageUrl || project.image,
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

export async function sendTelegramAdminMessage(text: string) {
  await telegramApi("sendMessage", { chat_id: ADMIN_CHAT_ID, text, disable_web_page_preview: true });
}

function parseSlot(value: string | undefined) {
  const slot = Number(value);
  return [1, 2, 3, 4].includes(slot) ? slot : null;
}

function projectText(project: PortfolioProject) {
  return [
    `#${project.slot} — ${project.title}`,
    `Label: ${project.tag}`,
    `Description: ${project.line}`,
    `Image: ${project.image}`,
  ].join("\n");
}

function parseSetBody(text: string) {
  const patch: StoredProject = {};
  for (const line of text.split("\n").slice(1)) {
    const match = line.match(/^\s*(title|label|description|image)\s*:\s*(.+)\s*$/i);
    if (!match) continue;
    const key = match[1].toLowerCase();
    const value = match[2].trim();
    if (key === "title") patch.title = value;
    if (key === "label") patch.label = value;
    if (key === "description") patch.description = value;
    if (key === "image" && /^https:\/\//i.test(value)) {
      patch.imageUrl = value;
      patch.imageFileId = "";
    }
  }
  return patch;
}

export async function handleTelegramProjectUpdate(update: any) {
  const message = update?.message;
  if (!message?.chat?.id) return;
  const chatId = String(message.chat.id);
  if (chatId !== ADMIN_CHAT_ID) return;

  const text = String(message.text || message.caption || "").trim();
  const replyText = String(message.reply_to_message?.text || message.reply_to_message?.caption || "").trim();
  const photoCommand = [text, replyText].find((value) => /^\/project[-_]image(?:@\w+)?\s+[1-4]\b/i.test(value));

  if (Array.isArray(message.photo) && message.photo.length && photoCommand) {
    const slot = parseSlot(photoCommand.match(/^\/project[-_]image(?:@\w+)?\s+([1-4])/i)?.[1]);
    if (!slot) return;
    const fileId = message.photo[message.photo.length - 1]?.file_id;
    if (!fileId) return;
    await updateStoredProject(slot, { imageFileId: fileId, imageUrl: "" });
    await sendTelegramAdminMessage(`✅ Project ${slot} image updated successfully. The portfolio will use this Telegram photo now.`);
    return;
  }

  if (!text.startsWith("/")) return;
  const firstLine = text.split("\n")[0];
  const parts = firstLine.split(/\s+/);
  const command = (parts[0] || "").replace(/^\//, "").replace(/@.+$/, "").replace(/-/g, "_").toLowerCase();
  const slot = parseSlot(parts[1]);

  if (command === "projects") {
    const projects = await getPortfolioProjects();
    await sendTelegramAdminMessage(projects.map(projectText).join("\n\n"));
    return;
  }

  if (command === "project_help") {
    await sendTelegramAdminMessage([
      "SURAJ.WEB project commands:",
      "/projects",
      "/project 1",
      "/project_title 1 New title",
      "/project_label 1 New label",
      "/project_description 1 New description",
      "/project_set 1 (then title:, label:, description:, image:)",
      "/project_image 1 — then reply to the bot message with a photo",
      "/project_image_url 1 https://...",
    ].join("\n"));
    return;
  }

  if (command === "project") {
    if (!slot) return sendTelegramAdminMessage("❌ Invalid project ID. Use 1 to 4.");
    const projects = await getPortfolioProjects();
    const project = projects.find((item) => item.slot === slot);
    if (project) await sendTelegramAdminMessage(projectText(project));
    return;
  }

  if (command === "project_image") {
    if (!slot) return sendTelegramAdminMessage("❌ Invalid project ID. Use 1 to 4.");
    await sendTelegramAdminMessage(`/project_image ${slot}\nReply to this message with the new project screenshot as a photo.`);
    return;
  }

  if (!slot) return sendTelegramAdminMessage("❌ Invalid project ID. Use 1 to 4.");

  const rest = firstLine.split(/\s+/).slice(2).join(" ").trim();
  if (command === "project_title") {
    if (!rest) return sendTelegramAdminMessage("❌ Add the new title after the project ID.");
    await updateStoredProject(slot, { title: rest });
    return sendTelegramAdminMessage(`✅ Project ${slot} title updated successfully.`);
  }
  if (command === "project_label") {
    if (!rest) return sendTelegramAdminMessage("❌ Add the new label after the project ID.");
    await updateStoredProject(slot, { label: rest });
    return sendTelegramAdminMessage(`✅ Project ${slot} label updated successfully.`);
  }
  if (command === "project_description") {
    if (!rest) return sendTelegramAdminMessage("❌ Add the new description after the project ID.");
    await updateStoredProject(slot, { description: rest });
    return sendTelegramAdminMessage(`✅ Project ${slot} description updated successfully.`);
  }
  if (command === "project_image_url") {
    if (!/^https:\/\//i.test(rest)) return sendTelegramAdminMessage("❌ Send a valid https:// image URL.");
    await updateStoredProject(slot, { imageUrl: rest, imageFileId: "" });
    return sendTelegramAdminMessage(`✅ Project ${slot} image URL updated successfully.`);
  }
  if (command === "project_set") {
    const patch = parseSetBody(text);
    if (!Object.keys(patch).length) return sendTelegramAdminMessage("❌ No valid fields found. Use title:, label:, description:, or image:.");
    await updateStoredProject(slot, patch);
    return sendTelegramAdminMessage(`✅ Project ${slot} details updated successfully.`);
  }

  await sendTelegramAdminMessage("Unknown command. Use /project_help.");
}

export async function setupTelegramProjectWebhook(origin: string) {
  await seedProjectStore();
  await telegramApi("setMyCommands", {
    commands: [
      { command: "projects", description: "List all four portfolio projects" },
      { command: "project", description: "Show one project: /project 1" },
      { command: "project_title", description: "Change a project title" },
      { command: "project_label", description: "Change a project label" },
      { command: "project_description", description: "Change a project description" },
      { command: "project_image", description: "Change a project screenshot" },
      { command: "project_set", description: "Update multiple project fields" },
      { command: "project_help", description: "Show project editing commands" },
    ],
  });
  return telegramApi("setWebhook", {
    url: `${origin}/api/telegram-webhook`,
    secret_token: WEBHOOK_SECRET,
    allowed_updates: ["message"],
    drop_pending_updates: false,
  });
}

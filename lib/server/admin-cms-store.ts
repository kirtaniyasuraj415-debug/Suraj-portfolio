import { createHash, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { deflateRawSync, inflateRawSync } from "node:zlib";
import { DEFAULT_PORTFOLIO_PROJECTS, type PortfolioProject } from "@/lib/portfolio-projects";
import {
  DEFAULT_SERVICES,
  DEFAULT_SITE_SETTINGS,
  type CmsProject,
  type CmsService,
  type PublicSiteSettings,
} from "@/lib/cms";
import { TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID } from "@/lib/server/telegram-credentials";

const ADMIN_CHAT_ID = String(TELEGRAM_CHAT_ID);
const STORAGE_LANGUAGES = ["eo", "cy", "ga", "gd", "eu", "gl", "is", "mt", "lv", "lt", "et", "sl"];
const CHUNK_SIZE = 238;
const CHUNKS_PER_LANGUAGE = 96;
const META_COMMAND = "cmsmeta";
const STORAGE_SCOPE = { type: "chat", chat_id: ADMIN_CHAT_ID };

export const OWNER_EMAIL = "surajkirtaniya5@gmail.com";
export const INITIAL_OWNER_PASSWORD = {
  salt: "5168f9be3fbf3e69adea21d0e510c232",
  hash: "dd5603f29905acb1ae21a852467970e63d04e8818012a6bd2bf63ffc04c1157f",
};

export type PasswordRecord = {
  salt: string;
  hash: string;
};

export type CmsAdminRecord = {
  email: string;
  password: PasswordRecord;
  createdAt: string;
};

export type CmsEnquiry = {
  id: string;
  name: string;
  businessName: string;
  phone: string;
  projectType: string;
  budget: string;
  timeline: string;
  projectGoal: string;
  status: "new" | "contacted" | "qualified" | "in-progress" | "closed";
  createdAt: string;
};

export type AdminCmsState = {
  version: 1;
  projects: CmsProject[];
  services: CmsService[];
  settings: PublicSiteSettings;
  admins: CmsAdminRecord[];
  enquiries: CmsEnquiry[];
  ownerPassword?: PasswordRecord;
  updatedAt: string;
};

type TelegramCommand = { command: string; description: string };

let cache: { value: AdminCmsState | null; expiresAt: number } | null = null;
let mutationQueue: Promise<unknown> = Promise.resolve();

function clean(value: unknown, max: number) {
  return String(value ?? "")
    .replace(/[\u0000-\u001f\u007f]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);
}

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

async function getCommands(language: string) {
  return telegramApi<TelegramCommand[]>("getMyCommands", {
    scope: STORAGE_SCOPE,
    language_code: language,
  }).catch(() => [] as TelegramCommand[]);
}

async function setCommands(language: string, commands: TelegramCommand[]) {
  if (!commands.length) {
    await telegramApi<boolean>("deleteMyCommands", {
      scope: STORAGE_SCOPE,
      language_code: language,
    }).catch(() => {});
    return;
  }
  await telegramApi<boolean>("setMyCommands", {
    scope: STORAGE_SCOPE,
    language_code: language,
    commands: commands.map((item) => ({
      command: item.command,
      description: item.description.slice(0, 256) || "-",
    })),
  });
}

function legacyProjects(): CmsProject[] {
  return DEFAULT_PORTFOLIO_PROJECTS.map((project, index) => ({
    docId: `legacy-${project.id}`,
    slug: project.id,
    brand: project.brand,
    title: project.title,
    description: project.line,
    category: project.tag,
    detail: project.detail,
    imageUrl: project.image,
    color: project.color,
    backword: project.backword,
    scope: project.scope,
    liveUrl: project.liveUrl,
    order: index + 1,
    visible: true,
    featured: index < 4,
  }));
}

function initialState(): AdminCmsState {
  return {
    version: 1,
    projects: legacyProjects(),
    services: DEFAULT_SERVICES.map((service, index) => ({
      ...service,
      docId: `service-${index + 1}`,
    })),
    settings: { ...DEFAULT_SITE_SETTINGS },
    admins: [],
    enquiries: [],
    updatedAt: new Date().toISOString(),
  };
}

function normalizeProject(input: Partial<CmsProject>, index = 0): CmsProject {
  const id = clean(input.docId, 80) || `project-${Date.now().toString(36)}-${randomBytes(3).toString("hex")}`;
  const title = clean(input.title, 100) || "Untitled Project";
  const slug = clean(input.slug, 80)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || id;
  return {
    docId: id,
    slug,
    brand: clean(input.brand, 80),
    title,
    description: clean(input.description, 350),
    category: clean(input.category, 80),
    detail: clean(input.detail, 900),
    imageUrl: clean(input.imageUrl, 1200),
    imageFileId: clean(input.imageFileId, 300) || undefined,
    color: /^#[0-9a-f]{6}$/i.test(String(input.color || "")) ? String(input.color) : "#21110a",
    backword: clean(input.backword, 80),
    scope: Array.isArray(input.scope)
      ? input.scope.map((item) => clean(item, 140)).filter(Boolean).slice(0, 10)
      : [],
    liveUrl: clean(input.liveUrl, 500),
    order: Math.max(1, Number(input.order) || index + 1),
    visible: input.visible !== false,
    featured: Boolean(input.featured),
  };
}

function normalizeService(input: Partial<CmsService>, index = 0): CmsService {
  return {
    docId: clean(input.docId, 80) || `service-${Date.now().toString(36)}-${randomBytes(3).toString("hex")}`,
    title: clean(input.title, 100) || "Untitled Service",
    description: clean(input.description, 400),
    order: Math.max(1, Number(input.order) || index + 1),
    visible: input.visible !== false,
  };
}

function normalizeState(raw: Partial<AdminCmsState>): AdminCmsState {
  return {
    version: 1,
    projects: Array.isArray(raw.projects)
      ? raw.projects.map((project, index) => normalizeProject(project, index))
      : legacyProjects(),
    services: Array.isArray(raw.services)
      ? raw.services.map((service, index) => normalizeService(service, index))
      : DEFAULT_SERVICES,
    settings: {
      ...DEFAULT_SITE_SETTINGS,
      ...(raw.settings || {}),
      whatsappNumber: clean(raw.settings?.whatsappNumber || DEFAULT_SITE_SETTINGS.whatsappNumber, 30),
      projectSectionLabel: clean(raw.settings?.projectSectionLabel || DEFAULT_SITE_SETTINGS.projectSectionLabel, 80),
      projectSectionHeading: clean(raw.settings?.projectSectionHeading || DEFAULT_SITE_SETTINGS.projectSectionHeading, 180),
      servicesSectionLabel: clean(raw.settings?.servicesSectionLabel || DEFAULT_SITE_SETTINGS.servicesSectionLabel, 80),
      servicesSectionHeading: clean(raw.settings?.servicesSectionHeading || DEFAULT_SITE_SETTINGS.servicesSectionHeading, 180),
    },
    admins: Array.isArray(raw.admins)
      ? raw.admins
          .map((item) => ({
            email: clean(item.email, 160).toLowerCase(),
            password: item.password,
            createdAt: clean(item.createdAt, 40) || new Date().toISOString(),
          }))
          .filter((item) => item.email && item.password?.salt && item.password?.hash)
          .slice(0, 25)
      : [],
    enquiries: Array.isArray(raw.enquiries)
      ? raw.enquiries
          .map((item) => ({
            id: clean(item.id, 100),
            name: clean(item.name, 100),
            businessName: clean(item.businessName, 120),
            phone: clean(item.phone, 40),
            projectType: clean(item.projectType, 100),
            budget: clean(item.budget, 100),
            timeline: clean(item.timeline, 100),
            projectGoal: clean(item.projectGoal, 1200),
            status: ["new", "contacted", "qualified", "in-progress", "closed"].includes(item.status)
              ? item.status
              : "new",
            createdAt: clean(item.createdAt, 50) || new Date().toISOString(),
          }))
          .filter((item) => item.id)
          .slice(0, 150)
      : [],
    ownerPassword: raw.ownerPassword?.salt && raw.ownerPassword?.hash ? raw.ownerPassword : undefined,
    updatedAt: clean(raw.updatedAt, 50) || new Date().toISOString(),
  };
}

function encodeState(state: AdminCmsState) {
  const json = JSON.stringify(state);
  const compressed = deflateRawSync(Buffer.from(json, "utf8"), { level: 9 });
  const encoded = compressed.toString("base64url");
  const chunks: string[] = [];
  for (let i = 0; i < encoded.length; i += CHUNK_SIZE) {
    chunks.push(encoded.slice(i, i + CHUNK_SIZE));
  }
  const checksum = createHash("sha256").update(encoded).digest("hex").slice(0, 20);
  return { chunks, checksum };
}

function decodeState(encoded: string): AdminCmsState {
  const json = inflateRawSync(Buffer.from(encoded, "base64url")).toString("utf8");
  return normalizeState(JSON.parse(json) as Partial<AdminCmsState>);
}

async function readStoredState(): Promise<AdminCmsState | null> {
  if (cache && cache.expiresAt > Date.now()) return cache.value;

  const first = await getCommands(STORAGE_LANGUAGES[0]);
  const meta = first.find((item) => item.command === META_COMMAND)?.description || "";
  const match = meta.match(/^v1:(\d+):([a-f0-9]{20})$/);
  if (!match) {
    cache = { value: null, expiresAt: Date.now() + 5000 };
    return null;
  }

  const total = Number(match[1]);
  const checksum = match[2];
  if (!Number.isInteger(total) || total < 1 || total > STORAGE_LANGUAGES.length * CHUNKS_PER_LANGUAGE) {
    throw new Error("CMS_STORAGE_CORRUPT");
  }

  const languageCount = Math.ceil(total / CHUNKS_PER_LANGUAGE);
  const commandSets = await Promise.all(
    STORAGE_LANGUAGES.slice(0, languageCount).map((language, index) =>
      index === 0 ? Promise.resolve(first) : getCommands(language)
    )
  );

  const all = commandSets.flat();
  const parts = new Map<string, string>();
  for (const item of all) {
    if (/^c\d{4}$/.test(item.command)) parts.set(item.command, item.description);
  }

  const chunks: string[] = [];
  for (let index = 0; index < total; index += 1) {
    const value = parts.get(`c${String(index).padStart(4, "0")}`);
    if (!value) throw new Error("CMS_STORAGE_INCOMPLETE");
    chunks.push(value);
  }

  const encoded = chunks.join("");
  const actual = createHash("sha256").update(encoded).digest("hex").slice(0, 20);
  if (actual !== checksum) throw new Error("CMS_STORAGE_CHECKSUM_FAILED");

  const state = decodeState(encoded);
  cache = { value: state, expiresAt: Date.now() + 10000 };
  return state;
}

async function writeStoredState(state: AdminCmsState) {
  const normalized = normalizeState({ ...state, updatedAt: new Date().toISOString() });
  const { chunks, checksum } = encodeState(normalized);
  if (chunks.length > STORAGE_LANGUAGES.length * CHUNKS_PER_LANGUAGE) {
    throw new Error("CMS_STORAGE_FULL");
  }

  const usedLanguages = Math.ceil(chunks.length / CHUNKS_PER_LANGUAGE);
  const writes: Promise<void>[] = [];

  for (let languageIndex = 0; languageIndex < STORAGE_LANGUAGES.length; languageIndex += 1) {
    const language = STORAGE_LANGUAGES[languageIndex];
    if (languageIndex >= usedLanguages) {
      writes.push(setCommands(language, []));
      continue;
    }

    const start = languageIndex * CHUNKS_PER_LANGUAGE;
    const slice = chunks.slice(start, start + CHUNKS_PER_LANGUAGE);
    const commands: TelegramCommand[] = slice.map((chunk, localIndex) => {
      const globalIndex = start + localIndex;
      return {
        command: `c${String(globalIndex).padStart(4, "0")}`,
        description: chunk,
      };
    });

    if (languageIndex === 0) {
      commands.unshift({
        command: META_COMMAND,
        description: `v1:${chunks.length}:${checksum}`,
      });
    }

    writes.push(setCommands(language, commands));
  }

  await Promise.all(writes);
  cache = { value: normalized, expiresAt: Date.now() + 10000 };
  return normalized;
}

export async function getAdminCmsState() {
  return (await readStoredState()) || initialState();
}

export async function mutateAdminCmsState<T>(mutator: (state: AdminCmsState) => T | Promise<T>) {
  const run = mutationQueue.then(async () => {
    const current = (await readStoredState()) || initialState();
    const draft = normalizeState(JSON.parse(JSON.stringify(current)) as AdminCmsState);
    const result = await mutator(draft);
    await writeStoredState(draft);
    return result;
  });
  mutationQueue = run.catch(() => {});
  return run;
}

export function createPasswordRecord(password: string): PasswordRecord {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, Buffer.from(salt, "hex"), 32, {
    N: 16384,
    r: 8,
    p: 1,
  }).toString("hex");
  return { salt, hash };
}

export function verifyPassword(password: string, record: PasswordRecord) {
  try {
    const actual = scryptSync(password, Buffer.from(record.salt, "hex"), 32, {
      N: 16384,
      r: 8,
      p: 1,
    });
    const expected = Buffer.from(record.hash, "hex");
    return actual.length === expected.length && timingSafeEqual(actual, expected);
  } catch {
    return false;
  }
}

export async function verifyAdminCredentials(emailInput: string, password: string) {
  const email = clean(emailInput, 160).toLowerCase();
  const state = await getAdminCmsState();

  if (email === OWNER_EMAIL) {
    const record = state.ownerPassword || INITIAL_OWNER_PASSWORD;
    return verifyPassword(password, record) ? { email, role: "owner" as const } : null;
  }

  const admin = state.admins.find((item) => item.email === email);
  if (!admin) return null;
  return verifyPassword(password, admin.password)
    ? { email, role: "admin" as const }
    : null;
}

export async function isCurrentAdmin(emailInput: string) {
  const email = clean(emailInput, 160).toLowerCase();
  if (email === OWNER_EMAIL) return { email, role: "owner" as const };
  const state = await getAdminCmsState();
  return state.admins.some((item) => item.email === email)
    ? { email, role: "admin" as const }
    : null;
}

export async function listCmsAdmins() {
  const state = await getAdminCmsState();
  return state.admins.map(({ email, createdAt }) => ({ email, createdAt }));
}

export async function addCmsAdmin(emailInput: string, password: string) {
  const email = clean(emailInput, 160).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error("INVALID_EMAIL");
  if (email === OWNER_EMAIL) throw new Error("OWNER_ALREADY_EXISTS");
  if (password.length < 12) throw new Error("PASSWORD_TOO_SHORT");

  await mutateAdminCmsState((state) => {
    const next: CmsAdminRecord = {
      email,
      password: createPasswordRecord(password),
      createdAt: new Date().toISOString(),
    };
    state.admins = [...state.admins.filter((item) => item.email !== email), next].slice(0, 25);
  });
}

export async function removeCmsAdmin(emailInput: string) {
  const email = clean(emailInput, 160).toLowerCase();
  if (email === OWNER_EMAIL) throw new Error("CANNOT_REMOVE_OWNER");
  await mutateAdminCmsState((state) => {
    state.admins = state.admins.filter((item) => item.email !== email);
  });
}

export async function changeOwnerPassword(currentPassword: string, nextPassword: string) {
  if (nextPassword.length < 14) throw new Error("PASSWORD_TOO_SHORT");
  const state = await getAdminCmsState();
  const current = state.ownerPassword || INITIAL_OWNER_PASSWORD;
  if (!verifyPassword(currentPassword, current)) throw new Error("INVALID_PASSWORD");

  await mutateAdminCmsState((draft) => {
    draft.ownerPassword = createPasswordRecord(nextPassword);
  });
}

export async function appendCmsEnquiry(input: {
  id: string;
  name?: string;
  businessName?: string;
  phone?: string;
  projectType?: string;
  budget?: string;
  timeline?: string;
  projectGoal?: string;
}) {
  await mutateAdminCmsState((state) => {
    const enquiry: CmsEnquiry = {
      id: clean(input.id, 100),
      name: clean(input.name, 100),
      businessName: clean(input.businessName, 120),
      phone: clean(input.phone, 40),
      projectType: clean(input.projectType, 100),
      budget: clean(input.budget, 100),
      timeline: clean(input.timeline, 100),
      projectGoal: clean(input.projectGoal, 1200),
      status: "new",
      createdAt: new Date().toISOString(),
    };
    state.enquiries = [enquiry, ...state.enquiries.filter((item) => item.id !== enquiry.id)].slice(0, 150);
  });
}

export async function uploadCmsImage(file: File) {
  if (!file.type.startsWith("image/")) throw new Error("INVALID_IMAGE");
  if (file.size > 8 * 1024 * 1024) throw new Error("IMAGE_TOO_LARGE");

  const form = new FormData();
  form.set("chat_id", ADMIN_CHAT_ID);
  form.set("document", file, file.name || "project-image.webp");
  form.set("disable_notification", "true");
  form.set("caption", "SURAJ.WEB CMS image asset");

  const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendDocument`, {
    method: "POST",
    body: form,
    cache: "no-store",
  });
  const data = await response.json().catch(() => null) as any;
  if (!response.ok || !data?.ok) throw new Error(data?.description || "TELEGRAM_UPLOAD_FAILED");

  const fileId = String(data.result?.document?.file_id || "");
  const messageId = Number(data.result?.message_id);
  if (!fileId) throw new Error("TELEGRAM_FILE_ID_MISSING");

  if (Number.isInteger(messageId)) {
    telegramApi("deleteMessage", { chat_id: ADMIN_CHAT_ID, message_id: messageId }).catch(() => {});
  }

  return fileId;
}

export async function getCmsTelegramFileUrl(fileId: string) {
  const result = await telegramApi<{ file_path?: string }>("getFile", { file_id: fileId });
  if (!result.file_path) throw new Error("TELEGRAM_FILE_NOT_FOUND");
  return `https://api.telegram.org/file/bot${TELEGRAM_BOT_TOKEN}/${result.file_path}`;
}

export function projectForPublic(project: CmsProject, index: number): PortfolioProject {
  return {
    slot: index + 1,
    id: project.slug || String(project.docId || `project-${index + 1}`),
    brand: project.brand,
    title: project.title,
    line: project.description,
    tag: project.category,
    detail: project.detail,
    image: project.imageFileId
      ? `/api/cms-image/${encodeURIComponent(String(project.docId || project.slug))}`
      : project.imageUrl,
    color: project.color,
    backword: project.backword,
    scope: project.scope,
    liveUrl: project.liveUrl,
  };
}

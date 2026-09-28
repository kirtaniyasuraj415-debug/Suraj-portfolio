import { randomBytes } from "node:crypto";
import { requireAdmin, isSameOrigin } from "@/lib/server/admin-auth";
import { getAdminCmsState, mutateAdminCmsState } from "@/lib/server/admin-cms-store";
import type { CmsProject, CmsService, PublicSiteSettings } from "@/lib/cms";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function publicState(state: Awaited<ReturnType<typeof getAdminCmsState>>) {
  return {
    projects: [...state.projects].sort((a, b) => (Number(a.order) || 0) - (Number(b.order) || 0)),
    services: [...state.services].sort((a, b) => (Number(a.order) || 0) - (Number(b.order) || 0)),
    settings: state.settings,
    enquiries: [...state.enquiries].sort((a, b) =>
      String(b.createdAt || "").localeCompare(String(a.createdAt || ""))
    ),
    updatedAt: state.updatedAt,
  };
}

async function authorized(request: Request) {
  const session = await requireAdmin(request);
  if (!session) return null;
  return session;
}

export async function GET(request: Request) {
  const session = await authorized(request);
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const state = await getAdminCmsState();
  return Response.json(
    { ...publicState(state), user: { email: session.email, role: session.role } },
    { headers: { "Cache-Control": "no-store" } }
  );
}

export async function POST(request: Request) {
  if (!isSameOrigin(request)) return Response.json({ error: "Invalid request." }, { status: 403 });
  const session = await authorized(request);
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  let body: Record<string, any>;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request." }, { status: 400 });
  }

  const action = String(body.action || "");

  try {
    await mutateAdminCmsState((state) => {
      if (action === "saveProject") {
        const incoming = (body.project || {}) as Partial<CmsProject>;
        const id = String(incoming.docId || "").trim() ||
          `project-${Date.now().toString(36)}-${randomBytes(3).toString("hex")}`;
        const existingIndex = state.projects.findIndex((item) => item.docId === id);
        const project = {
          ...(existingIndex >= 0 ? state.projects[existingIndex] : {}),
          ...incoming,
          docId: id,
        } as CmsProject;
        if (existingIndex >= 0) state.projects[existingIndex] = project;
        else state.projects.push(project);
      } else if (action === "deleteProject") {
        const id = String(body.id || "");
        state.projects = state.projects.filter((item) => item.docId !== id);
      } else if (action === "duplicateProject") {
        const id = String(body.id || "");
        const source = state.projects.find((item) => item.docId === id);
        if (!source) throw new Error("PROJECT_NOT_FOUND");
        state.projects.push({
          ...source,
          docId: `project-${Date.now().toString(36)}-${randomBytes(3).toString("hex")}`,
          slug: `${source.slug}-copy-${Date.now().toString(36)}`,
          title: `${source.title} Copy`,
          order: state.projects.length + 1,
        });
      } else if (action === "saveService") {
        const incoming = (body.service || {}) as Partial<CmsService>;
        const id = String(incoming.docId || "").trim() ||
          `service-${Date.now().toString(36)}-${randomBytes(3).toString("hex")}`;
        const existingIndex = state.services.findIndex((item) => item.docId === id);
        const service = {
          ...(existingIndex >= 0 ? state.services[existingIndex] : {}),
          ...incoming,
          docId: id,
        } as CmsService;
        if (existingIndex >= 0) state.services[existingIndex] = service;
        else state.services.push(service);
      } else if (action === "deleteService") {
        const id = String(body.id || "");
        state.services = state.services.filter((item) => item.docId !== id);
      } else if (action === "saveSettings") {
        state.settings = {
          ...state.settings,
          ...(body.settings as Partial<PublicSiteSettings> || {}),
        };
      } else if (action === "updateEnquiryStatus") {
        const id = String(body.id || "");
        const status = String(body.status || "");
        if (!["new", "contacted", "qualified", "in-progress", "closed"].includes(status)) {
          throw new Error("INVALID_STATUS");
        }
        const enquiry = state.enquiries.find((item) => item.id === id);
        if (!enquiry) throw new Error("ENQUIRY_NOT_FOUND");
        enquiry.status = status as typeof enquiry.status;
      } else if (action === "deleteEnquiry") {
        const id = String(body.id || "");
        state.enquiries = state.enquiries.filter((item) => item.id !== id);
      } else {
        throw new Error("UNKNOWN_ACTION");
      }
    });

    const state = await getAdminCmsState();
    return Response.json(
      { success: true, ...publicState(state) },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    return Response.json(
      { success: false, error: error instanceof Error ? error.message : "Update failed." },
      { status: 400 }
    );
  }
}

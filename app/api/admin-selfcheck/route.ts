import {
  getAdminCmsState,
  INITIAL_OWNER_PASSWORD,
} from "@/lib/server/admin-cms-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const KEY = "suraj-admin-v2-selfcheck-20260929";

export async function GET(request: Request) {
  const url = new URL(request.url);
  if (url.searchParams.get("key") !== KEY) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    const state = await getAdminCmsState();
    const activeOwner = state.ownerPassword || INITIAL_OWNER_PASSWORD;
    return Response.json({
      ok: true,
      encryptedCmsReadable: true,
      projects: state.projects.length,
      services: state.services.length,
      admins: state.admins.length,
      enquiries: state.enquiries.length,
      ownerPasswordUsesCurrentRecord:
        activeOwner.salt === INITIAL_OWNER_PASSWORD.salt &&
        activeOwner.hash === INITIAL_OWNER_PASSWORD.hash,
    });
  } catch (error) {
    return Response.json({
      ok: false,
      error: error instanceof Error ? error.message : "Self-check failed",
    }, { status: 500 });
  }
}

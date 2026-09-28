import {
  getAdminCmsState,
  mutateAdminCmsState,
} from "@/lib/server/admin-cms-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const KEY = "suraj-admin-cms-bootstrap-20260929";

export async function GET(request: Request) {
  const url = new URL(request.url);
  if (url.searchParams.get("key") !== KEY) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    const before = await getAdminCmsState();
    await mutateAdminCmsState(() => {});
    const after = await getAdminCmsState();

    return Response.json({
      ok: true,
      projects: after.projects.length,
      services: after.services.length,
      stateStable:
        before.projects.length === after.projects.length &&
        before.services.length === after.services.length,
    });
  } catch (error) {
    return Response.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "CMS bootstrap failed",
      },
      { status: 500 }
    );
  }
}

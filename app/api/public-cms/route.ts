import {
  getAdminCmsState,
  projectForPublic,
} from "@/lib/server/admin-cms-store";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const state = await getAdminCmsState();

  const projects = state.projects
    .filter((project) => project.visible !== false)
    .sort((a, b) => (Number(a.order) || 0) - (Number(b.order) || 0))
    .map(projectForPublic);

  const services = state.services
    .filter((service) => service.visible !== false)
    .sort((a, b) => (Number(a.order) || 0) - (Number(b.order) || 0));

  return Response.json(
    {
      projects,
      services,
      settings: state.settings,
    },
    {
      headers: {
        "Cache-Control": "public, s-maxage=20, stale-while-revalidate=60",
      },
    }
  );
}

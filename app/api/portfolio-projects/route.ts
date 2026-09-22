import { getPortfolioProjects } from "@/lib/server/telegram-project-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const projects = await getPortfolioProjects();
  return Response.json({ projects }, { headers: { "Cache-Control": "no-store" } });
}

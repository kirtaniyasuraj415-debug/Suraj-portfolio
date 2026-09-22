import { getDefaultProject } from "@/lib/portfolio-projects";
import { getStoredProject, getTelegramFileUrl } from "@/lib/server/telegram-project-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const slot = Number(id);
  const fallback = getDefaultProject(slot);
  if (!fallback) return new Response("Not found", { status: 404 });

  const stored = await getStoredProject(slot);
  if (!stored.imageFileId) {
    return Response.redirect(new URL(stored.imageUrl || fallback.image, request.url), 307);
  }

  try {
    const fileUrl = await getTelegramFileUrl(stored.imageFileId);
    const file = await fetch(fileUrl, { cache: "no-store" });
    if (!file.ok) throw new Error("TELEGRAM_IMAGE_FETCH_FAILED");
    return new Response(file.body, {
      status: 200,
      headers: {
        "Content-Type": file.headers.get("content-type") || "image/jpeg",
        "Cache-Control": "public, max-age=300, stale-while-revalidate=600",
      },
    });
  } catch {
    return Response.redirect(new URL(fallback.image, request.url), 307);
  }
}

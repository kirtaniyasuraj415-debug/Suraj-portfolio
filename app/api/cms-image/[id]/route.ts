import {
  getAdminCmsState,
  getCmsTelegramFileUrl,
} from "@/lib/server/admin-cms-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function dataImageResponse(value: string) {
  const match = value.match(/^data:(image\/[a-z0-9.+-]+);base64,(.+)$/i);
  if (!match) return null;
  try {
    const body = Buffer.from(match[2], "base64");
    return new Response(body, {
      headers: {
        "Content-Type": match[1],
        "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
      },
    });
  } catch {
    return null;
  }
}

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const state = await getAdminCmsState();
  const project = state.projects.find(
    (item) => item.docId === id || item.slug === id
  );
  if (!project || project.visible === false) return new Response("Not found", { status: 404 });

  if (project.imageFileId) {
    try {
      const fileUrl = await getCmsTelegramFileUrl(project.imageFileId);
      const file = await fetch(fileUrl, { cache: "no-store" });
      if (!file.ok) throw new Error("IMAGE_FETCH_FAILED");
      return new Response(file.body, {
        headers: {
          "Content-Type": file.headers.get("content-type") || "image/webp",
          "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
        },
      });
    } catch {
      return new Response("Image unavailable", { status: 502 });
    }
  }

  if (project.imageUrl?.startsWith("data:image/")) {
    return dataImageResponse(project.imageUrl) || new Response("Invalid image", { status: 400 });
  }

  if (project.imageUrl) {
    return Response.redirect(new URL(project.imageUrl, request.url), 307);
  }

  return new Response("Image unavailable", { status: 404 });
}

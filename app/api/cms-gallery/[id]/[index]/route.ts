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

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string; index: string }> }
) {
  const { id, index } = await context.params;
  const galleryIndex = Number(index);

  if (!Number.isInteger(galleryIndex) || galleryIndex < 0 || galleryIndex > 11) {
    return new Response("Not found", { status: 404 });
  }

  const state = await getAdminCmsState();
  const project = state.projects.find(
    (item) => item.docId === id || item.slug === id
  );

  if (!project || project.visible === false) {
    return new Response("Not found", { status: 404 });
  }

  const image = project.gallery?.[galleryIndex];
  if (!image) return new Response("Image unavailable", { status: 404 });

  if (image.imageFileId) {
    try {
      const fileUrl = await getCmsTelegramFileUrl(image.imageFileId);
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

  if (image.imageUrl?.startsWith("data:image/")) {
    return dataImageResponse(image.imageUrl) || new Response("Invalid image", { status: 400 });
  }

  if (image.imageUrl) {
    return Response.redirect(new URL(image.imageUrl, request.url), 307);
  }

  return new Response("Image unavailable", { status: 404 });
}

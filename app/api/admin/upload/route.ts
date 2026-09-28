import { isSameOrigin, requireAdmin } from "@/lib/server/admin-auth";
import { uploadCmsImage } from "@/lib/server/admin-cms-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!isSameOrigin(request)) return Response.json({ error: "Invalid request." }, { status: 403 });
  const session = await requireAdmin(request);
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const form = await request.formData();
    const file = form.get("image");
    if (!(file instanceof File)) {
      return Response.json({ error: "Choose an image." }, { status: 400 });
    }
    const imageFileId = await uploadCmsImage(file);
    return Response.json({ success: true, imageFileId });
  } catch (error) {
    return Response.json(
      { success: false, error: error instanceof Error ? error.message : "Image upload failed." },
      { status: 400 }
    );
  }
}

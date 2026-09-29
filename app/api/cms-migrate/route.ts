import { mutateAdminCmsState } from "@/lib/server/admin-cms-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const KEY = "suraj-cms-encryption-migrate-20260929";

export async function GET(request: Request) {
  const url = new URL(request.url);
  if (url.searchParams.get("key") !== KEY) return new Response("Unauthorized", { status: 401 });

  try {
    await mutateAdminCmsState(() => {});
    return Response.json({ ok: true, encrypted: true }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return Response.json(
      { ok: false, error: error instanceof Error ? error.message : "Migration failed" },
      { status: 500, headers: { "Cache-Control": "no-store" } }
    );
  }
}

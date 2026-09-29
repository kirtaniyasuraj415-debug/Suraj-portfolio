import { mutateAdminCmsState } from "@/lib/server/admin-cms-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const KEY = "suraj-owner-reset-20260929-0421";

export async function GET(request: Request) {
  const url = new URL(request.url);
  if (url.searchParams.get("key") !== KEY) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    await mutateAdminCmsState((state) => {
      state.ownerPassword = {
        salt: "1341b8bddf76991d08508501a1e29799",
        hash: "2fce013b6825c8866be7910e638333ff3b2b244ea70a8fc3b8de9f576249ea89",
      };
    });
    return Response.json({ ok: true });
  } catch (error) {
    return Response.json({
      ok: false,
      error: error instanceof Error ? error.message : "Reset failed",
    }, { status: 500 });
  }
}

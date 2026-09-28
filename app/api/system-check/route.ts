import { getFirestoreAuthorization } from "@/lib/server/firebase-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const token = await getFirestoreAuthorization();
    return Response.json(
      { serverFirestoreAuth: Boolean(token) },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return Response.json(
      { serverFirestoreAuth: false },
      { headers: { "Cache-Control": "no-store" } },
    );
  }
}

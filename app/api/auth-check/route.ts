import { firebaseConfig } from "@/lib/firebase-config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const response = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:createAuthUri?key=${encodeURIComponent(firebaseConfig.apiKey)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        body: JSON.stringify({
          identifier: "surajkirtaniya5@gmail.com",
          continueUri: "https://suraj-portfolio-phi-six.vercel.app/admin",
        }),
      }
    );
    const data = await response.json().catch(() => null) as Record<string, unknown> | null;
    const providers = Array.isArray(data?.allProviders) ? data?.allProviders : [];
    return Response.json(
      {
        reachable: response.ok,
        googleEnabled: providers.includes("google.com"),
      },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch {
    return Response.json(
      { reachable: false, googleEnabled: false },
      { headers: { "Cache-Control": "no-store" } }
    );
  }
}

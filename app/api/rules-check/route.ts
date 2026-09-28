import { firebaseConfig } from "@/lib/firebase-config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const databaseId = firebaseConfig.firestoreDatabaseId || "(default)";
  const url =
    `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(firebaseConfig.projectId)}/databases/${encodeURIComponent(databaseId)}/documents/portfolioSettings/public?key=${encodeURIComponent(firebaseConfig.apiKey)}`;
  try {
    const response = await fetch(url, { cache: "no-store" });
    return Response.json(
      {
        status: response.status,
        publicReadRuleActive: response.status === 404 || response.status === 200,
      },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch {
    return Response.json({ status: 0, publicReadRuleActive: false });
  }
}

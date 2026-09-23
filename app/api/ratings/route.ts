import { listRatings, submitRating } from "@/lib/server/telegram-rating-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const hits = new Map<string, number>();

function clientIp(request: Request) {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
}

export async function GET() {
  const ratings = await listRatings("approved");
  return Response.json(
    { ratings: ratings.slice(0, 12) },
    { headers: { "Cache-Control": "no-store" } },
  );
}

export async function POST(request: Request) {
  const ip = clientIp(request);
  const now = Date.now();
  const previous = hits.get(ip) || 0;
  if (now - previous < 60_000) {
    return Response.json({ success: false, error: "Please wait a minute before submitting another rating." }, { status: 429 });
  }

  try {
    const body = await request.json();
    const review = await submitRating(body);
    hits.set(ip, now);
    return Response.json({
      success: true,
      id: review.id,
      message: "Thanks — your rating was received and will appear after a quick review.",
    }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to submit rating.";
    const safe = message === "SPAM" ? "Unable to submit rating." : message;
    return Response.json({ success: false, error: safe }, { status: 400 });
  }
}

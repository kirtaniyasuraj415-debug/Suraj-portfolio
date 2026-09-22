export const dynamic = "force-static";

export function GET(request: Request) {
  return Response.redirect(new URL("/demo.html", request.url), 307);
}

export const dynamic = "force-static";

export function GET(request) {
  return Response.redirect(new URL("/demo.html", request.url), 307);
}

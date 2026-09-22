export const dynamic = "force-dynamic";

export function GET(request) {
  const url = new URL(request.url);
  url.pathname = "/demo.html";
  url.search = "";
  return Response.redirect(url, 307);
}

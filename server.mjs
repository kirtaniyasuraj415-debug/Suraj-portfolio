import { createServer } from "node:http";
import { parse } from "node:url";
import next from "next";
import { handleProjectEnquiry } from "./server/project-enquiry.mjs";

const port = Number(process.env.PORT || 3000);
const hostname = process.env.HOSTNAME || "0.0.0.0";
const dev = process.env.NODE_ENV !== "production" && process.env.npm_lifecycle_event !== "start";

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

function sendJson(res, status, body) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.end(JSON.stringify(body));
}

function clientIp(req) {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string" && forwarded) return forwarded.split(",")[0].trim();
  if (Array.isArray(forwarded) && forwarded[0]) return forwarded[0].split(",")[0].trim();
  return req.socket.remoteAddress || "unknown";
}

async function readJsonBody(req, limit = 24000) {
  const contentLength = Number(req.headers["content-length"] || 0);
  if (contentLength > limit) throw Object.assign(new Error("PAYLOAD_TOO_LARGE"), { status: 413 });
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > limit) throw Object.assign(new Error("PAYLOAD_TOO_LARGE"), { status: 413 });
    chunks.push(chunk);
  }
  const raw = Buffer.concat(chunks).toString("utf8");
  try {
    return JSON.parse(raw || "{}");
  } catch {
    throw Object.assign(new Error("INVALID_JSON"), { status: 400 });
  }
}

await app.prepare();

const server = createServer(async (req, res) => {
  const parsedUrl = parse(req.url || "/", true);

  if (parsedUrl.pathname === "/api/project-enquiry") {
    if (req.method === "GET") {
      sendJson(res, 200, {
        service: "project-enquiry",
        version: "unified-node-telegram-v1",
        accepts: "POST",
        telegramConfigured: Boolean(process.env.TELEGRAM_BOT_TOKEN && (process.env.TELEGRAM_CHAT_ID || process.env.TELEGRAM_OWNER_CHAT_ID)),
      });
      return;
    }

    if (req.method !== "POST") {
      res.setHeader("Allow", "GET, POST");
      sendJson(res, 405, { success: false, error: "Method not allowed." });
      return;
    }

    try {
      const payload = await readJsonBody(req);
      const result = await handleProjectEnquiry(payload, { ip: clientIp(req) });
      sendJson(res, result.status, result.body);
    } catch (error) {
      if (error?.status === 413) {
        sendJson(res, 413, { success: false, error: "Your enquiry is too long. Please shorten the project details." });
        return;
      }
      if (error?.status === 400) {
        sendJson(res, 400, { success: false, error: "The form could not be read. Please refresh and try again." });
        return;
      }
      console.error("[Enquiry server] request_failed");
      sendJson(res, 500, { success: false, error: "We couldn’t send your enquiry. Please try again or contact Suraj on WhatsApp." });
    }
    return;
  }

  try {
    await handle(req, res, parsedUrl);
  } catch {
    console.error("[Next server] request_failed");
    if (!res.headersSent) res.statusCode = 500;
    res.end("Internal Server Error");
  }
});

server.listen(port, hostname, () => {
  console.log(`SURAJ.WEB server ready on http://${hostname}:${port}`);
});

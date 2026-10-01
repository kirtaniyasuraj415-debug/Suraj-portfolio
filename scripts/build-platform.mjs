import { spawnSync } from "node:child_process";

const isCloudflareWorkersBuild = process.env.WORKERS_CI === "1";

const command = process.platform === "win32" ? "npx.cmd" : "npx";
const args = isCloudflareWorkersBuild
  ? ["opennextjs-cloudflare", "build"]
  : ["next", "build"];

console.log(
  isCloudflareWorkersBuild
    ? "[build] Cloudflare Workers detected -> building with OpenNext."
    : "[build] Standard/Vercel build detected -> building with Next.js."
);

const result = spawnSync(command, args, {
  stdio: "inherit",
  env: process.env,
});

if (result.error) {
  console.error(result.error);
  process.exit(1);
}

process.exit(result.status ?? 1);

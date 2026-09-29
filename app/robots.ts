import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  const privatePaths = [
    "/admin",
    "/admin/",
    "/api/admin/",
    "/api/project-enquiry",
    "/api/telegram-webhook",
  ];

  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: privatePaths },
      {
        userAgent: ["OAI-SearchBot", "ChatGPT-User", "PerplexityBot", "ClaudeBot", "GPTBot"],
        allow: "/",
        disallow: privatePaths,
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}

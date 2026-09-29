import type { MetadataRoute } from "next";
import { DEFAULT_PORTFOLIO_PROJECTS } from "@/lib/portfolio-projects";
import { SERVICE_PAGES } from "@/lib/service-pages";
import { absoluteUrl } from "@/lib/seo";
import { getAdminCmsState } from "@/lib/server/admin-cms-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const staticPages: MetadataRoute.Sitemap = [
    { url: absoluteUrl("/"), lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: absoluteUrl("/services"), lastModified: now, changeFrequency: "monthly", priority: 0.9 },
    { url: absoluteUrl("/work"), lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: absoluteUrl("/about"), lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: absoluteUrl("/start-project"), lastModified: now, changeFrequency: "monthly", priority: 0.8 },
  ];

  const servicePages: MetadataRoute.Sitemap = SERVICE_PAGES.map((service) => ({
    url: absoluteUrl(`/services/${service.slug}`),
    lastModified: now,
    changeFrequency: "monthly",
    priority: 0.85,
  }));

  let projectSlugs = DEFAULT_PORTFOLIO_PROJECTS.map((project) => project.id);
  let projectUpdatedAt = now;

  try {
    const state = await getAdminCmsState();
    const liveSlugs = state.projects
      .filter((project) => project.visible !== false && project.slug)
      .sort((a, b) => (Number(a.order) || 0) - (Number(b.order) || 0))
      .map((project) => project.slug);

    if (liveSlugs.length) projectSlugs = liveSlugs;
    if (state.updatedAt) projectUpdatedAt = new Date(state.updatedAt);
  } catch {
    // Search engines still receive a complete fallback sitemap if the CMS store is temporarily unavailable.
  }

  const projectPages: MetadataRoute.Sitemap = projectSlugs.map((slug) => ({
    url: absoluteUrl(`/work/${slug}`),
    lastModified: projectUpdatedAt,
    changeFrequency: "monthly",
    priority: 0.75,
  }));

  return [...staticPages, ...servicePages, ...projectPages];
}

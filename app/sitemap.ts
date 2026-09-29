import type { MetadataRoute } from "next";
import { DEFAULT_PORTFOLIO_PROJECTS } from "@/lib/portfolio-projects";
import { SERVICE_PAGES } from "@/lib/service-pages";
import { absoluteUrl } from "@/lib/seo";

export default function sitemap(): MetadataRoute.Sitemap {
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
  const projectPages: MetadataRoute.Sitemap = DEFAULT_PORTFOLIO_PROJECTS.map((project) => ({
    url: absoluteUrl(`/work/${project.id}`),
    lastModified: now,
    changeFrequency: "monthly",
    priority: 0.75,
  }));
  return [...staticPages, ...servicePages, ...projectPages];
}

"use client";

import { useEffect, useState } from "react";
import { DEFAULT_PORTFOLIO_PROJECTS } from "@/lib/portfolio-projects";
import { DEFAULT_SERVICES, type CmsProject, type CmsService } from "@/lib/cms";

const fallbackProjects: CmsProject[] = DEFAULT_PORTFOLIO_PROJECTS.map((project, index) => ({
  slug: project.id,
  brand: project.brand,
  title: project.title,
  description: project.line,
  category: project.tag,
  detail: project.detail,
  imageUrl: project.image,
  gallery: (project.galleryImages || []).map((imageUrl) => ({ imageUrl })),
  color: project.color,
  backword: project.backword,
  scope: project.scope,
  liveUrl: project.liveUrl,
  order: index + 1,
  visible: true,
  featured: index < 4,
}));

export function usePublicProjects() {
  const [projects, setProjects] = useState<CmsProject[]>(fallbackProjects);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/public-cms", { cache: "no-store" })
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => {
        if (!cancelled && Array.isArray(data?.projects) && data.projects.length) {
          setProjects(
            data.projects.map((project: any, index: number) => ({
              slug: project.id || `project-${index + 1}`,
              brand: project.brand || "",
              title: project.title || "",
              description: project.line || "",
              category: project.tag || "",
              detail: project.detail || "",
              imageUrl: project.image || "",
              gallery: Array.isArray(project.galleryImages) ? project.galleryImages.map((imageUrl: unknown) => ({ imageUrl: String(imageUrl || "") })).filter((item: { imageUrl: string }) => item.imageUrl) : [],
              color: project.color || "#21110a",
              backword: project.backword || "",
              scope: Array.isArray(project.scope) ? project.scope : [],
              liveUrl: project.liveUrl || "",
              order: index + 1,
              visible: true,
              featured: index < 4,
            }))
          );
        }
      })
      .catch(() => {})
      .finally(() => !cancelled && setLoaded(true));
    return () => { cancelled = true; };
  }, []);

  return { projects, loaded };
}

export function usePublicServices() {
  const [services, setServices] = useState<CmsService[]>(DEFAULT_SERVICES);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/public-cms", { cache: "no-store" })
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => {
        if (!cancelled && Array.isArray(data?.services) && data.services.length) {
          setServices(data.services);
        }
      })
      .catch(() => {})
      .finally(() => !cancelled && setLoaded(true));
    return () => { cancelled = true; };
  }, []);

  return { services, loaded };
}

"use client";

import { useEffect, useState } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
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
    getDocs(query(collection(db, "portfolioProjects"), where("visible", "==", true)))
      .then((snapshot) => {
        if (cancelled) return;
        if (snapshot.size > 0) {
          setProjects(
            snapshot.docs
              .map((item) => ({ docId: item.id, ...(item.data() as Omit<CmsProject, "docId">) }))
              .sort((a, b) => (Number(a.order) || 0) - (Number(b.order) || 0))
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
    getDocs(query(collection(db, "portfolioServices"), where("visible", "==", true)))
      .then((snapshot) => {
        if (cancelled) return;
        if (snapshot.size > 0) {
          setServices(
            snapshot.docs
              .map((item) => ({ docId: item.id, ...(item.data() as Omit<CmsService, "docId">) }))
              .sort((a, b) => (Number(a.order) || 0) - (Number(b.order) || 0))
          );
        }
      })
      .catch(() => {})
      .finally(() => !cancelled && setLoaded(true));
    return () => { cancelled = true; };
  }, []);

  return { services, loaded };
}

import type { PortfolioProject } from "@/lib/portfolio-projects";

export type CmsProject = {
  docId?: string;
  slug: string;
  brand: string;
  title: string;
  description: string;
  category: string;
  detail: string;
  imageUrl: string;
  imagePath?: string;
  color: string;
  backword: string;
  scope: string[];
  liveUrl: string;
  order: number;
  visible: boolean;
  featured?: boolean;
  createdAt?: unknown;
  updatedAt?: unknown;
};

export type CmsService = {
  docId?: string;
  title: string;
  description: string;
  order: number;
  visible: boolean;
  createdAt?: unknown;
  updatedAt?: unknown;
};

export type PublicSiteSettings = {
  whatsappNumber: string;
  projectSectionLabel: string;
  projectSectionHeading: string;
  servicesSectionLabel: string;
  servicesSectionHeading: string;
};

export const DEFAULT_SERVICES: CmsService[] = [
  {
    title: "Website Design",
    description: "Distinctive layouts, considered typography, and a visual identity that feels like your business.",
    order: 1,
    visible: true,
  },
  {
    title: "Web Development",
    description: "Responsive websites and landing pages, built to look right and work well on every screen.",
    order: 2,
    visible: true,
  },
  {
    title: "AI & Automation",
    description: "Practical enquiry flows and connected tools that take repetitive work off your hands.",
    order: 3,
    visible: true,
  },
];

export const DEFAULT_SITE_SETTINGS: PublicSiteSettings = {
  whatsappNumber: "917810963278",
  projectSectionLabel: "Selected Concepts",
  projectSectionHeading: "Thoughtful design.\nPurposeful websites.",
  servicesSectionLabel: "What I Do",
  servicesSectionHeading: "Good design.\nReal-world function.",
};

export function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 72);
}

export function cmsProjectToPortfolio(project: CmsProject, index: number): PortfolioProject {
  return {
    slot: index + 1,
    id: project.slug || `project-${index + 1}`,
    brand: project.brand,
    title: project.title,
    line: project.description,
    tag: project.category,
    detail: project.detail,
    image: project.imageUrl,
    color: project.color || "#21110a",
    backword: project.backword || project.title.split(" ")[0] || "Project",
    scope: project.scope || [],
    liveUrl: project.liveUrl,
  };
}

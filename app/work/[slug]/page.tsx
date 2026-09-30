import type { Metadata } from "next";
import CaseStudy from "@/components/public/case-study";
import JsonLd from "@/components/seo/json-ld";
import { DEFAULT_PORTFOLIO_PROJECTS, type PortfolioProject } from "@/lib/portfolio-projects";
import { getAdminCmsState, projectForPublic } from "@/lib/server/admin-cms-store";
import { absoluteUrl, pageMetadata } from "@/lib/seo";

async function getProject(slug: string): Promise<PortfolioProject | undefined> {
  try {
    const state = await getAdminCmsState();
    const visible = state.projects
      .filter((project) => project.visible !== false)
      .sort((a, b) => (Number(a.order) || 0) - (Number(b.order) || 0));
    const index = visible.findIndex((project) => project.slug === slug);
    if (index >= 0) return projectForPublic(visible[index], index);
  } catch {
    // Fall back to the bundled project data if the CMS store is temporarily unavailable.
  }

  return DEFAULT_PORTFOLIO_PROJECTS.find((project) => project.id === slug);
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const project = await getProject(slug);

  if (!project) {
    return pageMetadata({
      title: "Project Case Study | SURAJ.WEB",
      description: "Website design and development case study by Suraj Kirtaniya.",
      path: `/work/${slug}`,
      noIndex: true,
    });
  }

  return pageMetadata({
    title: `${project.title} — Website Case Study | SURAJ.WEB`,
    description: project.line || project.detail,
    path: `/work/${project.id}`,
  });
}

export default async function ProjectCaseStudyPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const project = await getProject(slug);

  return (
    <>
      {project && (
        <JsonLd
          data={[
            {
              "@type": "CreativeWork",
              "@id": absoluteUrl(`/work/${project.id}#case-study`),
              url: absoluteUrl(`/work/${project.id}`),
              name: project.title,
              headline: project.title,
              description: project.line || project.detail,
              genre: project.tag,
              creator: { "@id": absoluteUrl("/#suraj-kirtaniya") },
              image: [absoluteUrl(project.image), ...(project.galleryImages || []).map((image) => absoluteUrl(image))],
            },
            {
              "@type": "BreadcrumbList",
              "@id": absoluteUrl(`/work/${project.id}#breadcrumbs`),
              itemListElement: [
                { "@type": "ListItem", position: 1, name: "Home", item: absoluteUrl("/") },
                { "@type": "ListItem", position: 2, name: "Work", item: absoluteUrl("/work") },
                { "@type": "ListItem", position: 3, name: project.title, item: absoluteUrl(`/work/${project.id}`) },
              ],
            },
          ]}
        />
      )}
      <CaseStudy slug={slug} />
    </>
  );
}

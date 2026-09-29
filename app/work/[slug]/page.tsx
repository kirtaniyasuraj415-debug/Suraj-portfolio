import type { Metadata } from "next";
import CaseStudy from "@/components/public/case-study";
import JsonLd from "@/components/seo/json-ld";
import { DEFAULT_PORTFOLIO_PROJECTS } from "@/lib/portfolio-projects";
import { absoluteUrl, pageMetadata } from "@/lib/seo";

function getProject(slug: string) {
  return DEFAULT_PORTFOLIO_PROJECTS.find((project) => project.id === slug);
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const project = getProject(slug);
  if (!project) {
    return pageMetadata({
      title: "Project Case Study | SURAJ.WEB",
      description: "Website design and development case study by Suraj Kirtaniya.",
      path: `/work/${slug}`,
    });
  }

  return pageMetadata({
    title: `${project.title} — Website Case Study | SURAJ.WEB`,
    description: project.line,
    path: `/work/${project.id}`,
  });
}

export default async function ProjectCaseStudyPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const project = getProject(slug);

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
              description: project.line,
              genre: project.tag,
              creator: { "@id": absoluteUrl("/#suraj-kirtaniya") },
              image: absoluteUrl(project.image),
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

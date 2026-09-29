import type { Metadata } from "next";
import WorkIndex from "@/components/public/work-index";
import JsonLd from "@/components/seo/json-ld";
import { DEFAULT_PORTFOLIO_PROJECTS } from "@/lib/portfolio-projects";
import { absoluteUrl, pageMetadata } from "@/lib/seo";

const title = "Website Design & Development Case Studies | SURAJ.WEB";
const description = "Explore selected website design and web development case studies, project concepts, responsive builds, and live previews by Suraj Kirtaniya.";

export const metadata: Metadata = pageMetadata({ title, description, path: "/work" });

export default function WorkPage(){
  return (
    <>
      <JsonLd
        data={{
          "@type": "CollectionPage",
          "@id": absoluteUrl("/work#collection"),
          url: absoluteUrl("/work"),
          name: title,
          description,
          mainEntity: {
            "@type": "ItemList",
            itemListElement: DEFAULT_PORTFOLIO_PROJECTS.map((project, index) => ({
              "@type": "ListItem",
              position: index + 1,
              name: project.title,
              url: absoluteUrl(`/work/${project.id}`),
            })),
          },
        }}
      />
      <WorkIndex/>
    </>
  );
}

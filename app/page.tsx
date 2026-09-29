import type { Metadata } from "next";
import Portfolio from "./portfolio";
import JsonLd from "@/components/seo/json-ld";
import { absoluteUrl, DEFAULT_DESCRIPTION, DEFAULT_TITLE, pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: DEFAULT_TITLE,
  description: DEFAULT_DESCRIPTION,
  path: "/",
});

export default function Home() {
  return (
    <>
      <JsonLd
        data={{
          "@type": "WebPage",
          "@id": absoluteUrl("/#webpage"),
          url: absoluteUrl("/"),
          name: DEFAULT_TITLE,
          description: DEFAULT_DESCRIPTION,
          isPartOf: { "@id": absoluteUrl("/#website") },
          about: { "@id": absoluteUrl("/#suraj-kirtaniya") },
          mainEntity: {
            "@type": "ItemList",
            name: "Web development services",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: "Website Design", url: absoluteUrl("/services/website-design") },
              { "@type": "ListItem", position: 2, name: "Web Development", url: absoluteUrl("/services/web-development") },
              { "@type": "ListItem", position: 3, name: "AI & Automation", url: absoluteUrl("/services/ai-automation") },
            ],
          },
        }}
      />
      <Portfolio />
    </>
  );
}

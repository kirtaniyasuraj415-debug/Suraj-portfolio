import type { Metadata } from "next";
import Portfolio from "./portfolio";
import JsonLd from "@/components/seo/json-ld";
import {
  absoluteUrl,
  BRAND_KEYWORDS,
  DEFAULT_DESCRIPTION,
  DEFAULT_TITLE,
  pageMetadata,
} from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: DEFAULT_TITLE,
  description: DEFAULT_DESCRIPTION,
  path: "/",
});

const FAQ_JSON_LD = {
  "@type": "FAQPage",
  "@id": absoluteUrl("/#faq"),
  mainEntity: [
    {
      "@type": "Question",
      name: "What kind of websites does Suraj Kirtaniya build?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Suraj Kirtaniya builds business websites, landing pages, portfolios, redesigns, e-commerce experiences, and selected AI or automation workflows.",
      },
    },
    {
      "@type": "Question",
      name: "Does Suraj Kirtaniya build responsive mobile websites?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. Responsive behaviour is considered throughout the build so the experience works across common phone, tablet, and desktop sizes.",
      },
    },
    {
      "@type": "Question",
      name: "Can Suraj Kirtaniya handle website deployment and automation?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. Suraj can prepare and deploy finished web projects and can connect enquiry forms, Telegram or WhatsApp follow-ups, and practical automation flows where useful.",
      },
    },
  ],
};

export default function Home() {
  return (
    <>
      <JsonLd
        data={[
          {
            "@type": "WebPage",
            "@id": absoluteUrl("/#webpage"),
            url: absoluteUrl("/"),
            name: DEFAULT_TITLE,
            headline: "Suraj Kirtaniya — Freelance Web Developer & Website Designer",
            description: DEFAULT_DESCRIPTION,
            keywords: BRAND_KEYWORDS.join(", "),
            isPartOf: { "@id": absoluteUrl("/#website") },
            about: { "@id": absoluteUrl("/#suraj-kirtaniya") },
            author: { "@id": absoluteUrl("/#suraj-kirtaniya") },
            primaryImageOfPage: {
              "@type": "ImageObject",
              url: absoluteUrl("/images/suraj-portrait.png"),
              caption: "Suraj Kirtaniya, freelance web developer and website designer",
            },
            mainEntity: {
              "@type": "ItemList",
              name: "Web development services by Suraj Kirtaniya",
              itemListElement: [
                { "@type": "ListItem", position: 1, name: "Website Design", url: absoluteUrl("/services/website-design") },
                { "@type": "ListItem", position: 2, name: "Web Development", url: absoluteUrl("/services/web-development") },
                { "@type": "ListItem", position: 3, name: "AI & Automation", url: absoluteUrl("/services/ai-automation") },
              ],
            },
          },
          FAQ_JSON_LD,
        ]}
      />
      <Portfolio />
    </>
  );
}

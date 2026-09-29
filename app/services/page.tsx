import type { Metadata } from "next";
import ServicesIndex from "@/components/public/services-index";
import JsonLd from "@/components/seo/json-ld";
import { SERVICE_PAGES } from "@/lib/service-pages";
import { absoluteUrl, pageMetadata } from "@/lib/seo";

const title = "Website Design, Web Development & AI Automation Services | SURAJ.WEB";
const description = "Explore custom website design, responsive web development, production deployment, and practical AI or enquiry automation services by Suraj Kirtaniya.";

export const metadata: Metadata = pageMetadata({ title, description, path: "/services" });

export default function ServicesPage(){
  return (
    <>
      <JsonLd
        data={{
          "@type": "CollectionPage",
          "@id": absoluteUrl("/services#services"),
          url: absoluteUrl("/services"),
          name: title,
          description,
          hasPart: SERVICE_PAGES.map((service) => ({
            "@type": "Service",
            name: service.name,
            url: absoluteUrl(`/services/${service.slug}`),
            description: service.description,
            provider: { "@id": absoluteUrl("/#suraj-kirtaniya") },
          })),
        }}
      />
      <ServicesIndex/>
    </>
  );
}

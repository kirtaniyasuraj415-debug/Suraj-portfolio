import type { Metadata } from "next";
import ProjectEnquiryPage from "@/components/project-enquiry-page";
import JsonLd from "@/components/seo/json-ld";
import { absoluteUrl, pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Start a Website Project with Suraj Kirtaniya | SURAJ.WEB",
  description: "Start a website design, web development, landing page, or automation project with Suraj Kirtaniya. Share your requirements through the project enquiry form.",
  path: "/start-project",
});

export default function StartProjectPage() {
  return (
    <>
      <JsonLd
        data={{
          "@type": "ContactPage",
          "@id": absoluteUrl("/start-project#contact"),
          url: absoluteUrl("/start-project"),
          name: "Start a Project with Suraj Kirtaniya",
          description: "Project enquiry page for website design, web development, and practical automation work.",
          about: { "@id": absoluteUrl("/#suraj-kirtaniya") },
        }}
      />
      <ProjectEnquiryPage />
    </>
  );
}

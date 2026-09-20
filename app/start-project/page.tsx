import type { Metadata } from "next";
import ProjectEnquiryPage from "@/components/project-enquiry-page";

export const metadata: Metadata = {
  title: "Start a Project — Suraj Kirtaniya",
  description:
    "Tell me about your business and website requirements. Start a project enquiry with Suraj Kirtaniya.",
};

export default function StartProjectPage() {
  return <ProjectEnquiryPage />;
}

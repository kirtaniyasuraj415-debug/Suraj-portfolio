import type { Metadata } from "next";
import ProjectEnquiryPage from "@/components/project-enquiry-page";

export const metadata: Metadata = {
  title: "Start a Project — Suraj Kirtaniya",
  description:
    "Tell me a little about your business and what you want to build. Start a project enquiry with Suraj Kirtaniya.",
};

export default function StartProjectPage() {
  return <ProjectEnquiryPage />;
}

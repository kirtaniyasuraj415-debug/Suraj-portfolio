import type { Metadata } from "next";
import WorkIndex from "@/components/public/work-index";

export const metadata: Metadata = {
  title: "Work — SURAJ.WEB",
  description: "Selected website concepts and case studies by Suraj Kirtaniya.",
};

export default function WorkPage(){ return <WorkIndex/>; }

import type { Metadata } from "next";
import ServicesIndex from "@/components/public/services-index";

export const metadata: Metadata = {
  title: "Services — SURAJ.WEB",
  description: "Website design, development and practical AI automation services by Suraj Kirtaniya.",
};

export default function ServicesPage(){ return <ServicesIndex/>; }

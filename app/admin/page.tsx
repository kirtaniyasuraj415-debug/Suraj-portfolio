import type { Metadata } from "next";
import AdminApp from "@/components/admin/admin-app-v2";

export const metadata: Metadata = {
  title: "Admin — SURAJ.WEB",
  description: "SURAJ.WEB portfolio administration.",
  robots: { index: false, follow: false },
};

export default function AdminPage() {
  return <AdminApp />;
}

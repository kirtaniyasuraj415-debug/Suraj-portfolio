import type { Metadata, Viewport } from "next";
import "./globals.css";
export const metadata: Metadata = {
 title: "Suraj Kirtaniya — Web Developer & Designer",
 description: "Distinctive websites, thoughtful design, and practical development by Suraj Kirtaniya. Explore selected website concepts and start a project.",
 icons: { icon: "/favicon.svg", shortcut: "/favicon.svg" },
};
export const viewport: Viewport = { width: "device-width", initialScale: 1, viewportFit: "cover", themeColor: "#000000" };
export default function RootLayout({children}: Readonly<{children: React.ReactNode}>) {
 return <html lang="en"><head><link rel="preload" href="/fonts/antonio-light.ttf" as="font" type="font/ttf" crossOrigin="anonymous"/><link rel="preload" href="/fonts/dm-sans-regular.ttf" as="font" type="font/ttf" crossOrigin="anonymous"/></head><body>{children}</body></html>;
}

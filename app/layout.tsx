import type { Metadata, Viewport } from "next";
import "./globals.css";
import JsonLd from "@/components/seo/json-ld";
import {
  DEFAULT_DESCRIPTION,
  DEFAULT_TITLE,
  PERSON_JSON_LD,
  SITE_NAME,
  SITE_URL,
  WEBSITE_JSON_LD,
} from "@/lib/seo";

const googleVerification = process.env.GOOGLE_SITE_VERIFICATION?.trim();
const bingVerification = process.env.BING_SITE_VERIFICATION?.trim();

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: DEFAULT_TITLE, template: "%s | SURAJ.WEB" },
  description: DEFAULT_DESCRIPTION,
  applicationName: SITE_NAME,
  authors: [{ name: "Suraj Kirtaniya", url: "/about" }],
  creator: "Suraj Kirtaniya",
  publisher: SITE_NAME,
  category: "technology",
  icons: { icon: "/favicon.svg", shortcut: "/favicon.svg" },
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    locale: "en_IN",
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
  },
  twitter: {
    card: "summary_large_image",
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  verification: {
    ...(googleVerification ? { google: googleVerification } : {}),
    ...(bingVerification ? { other: { "msvalidate.01": bingVerification } } : {}),
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#000000",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <head>
        <link rel="preload" href="/fonts/antonio-light.ttf" as="font" type="font/ttf" crossOrigin="anonymous"/>
        <link rel="preload" href="/fonts/dm-sans-regular.ttf" as="font" type="font/ttf" crossOrigin="anonymous"/>
      </head>
      <body>
        <JsonLd data={[WEBSITE_JSON_LD, PERSON_JSON_LD]} />
        {children}
      </body>
    </html>
  );
}

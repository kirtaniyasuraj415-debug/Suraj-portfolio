import type { Metadata } from "next";

export const SITE_NAME = "SURAJ.WEB";
export const PERSON_NAME = "Suraj Kirtaniya";
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://surajkirtaniya.qd.je").replace(/\/$/, "");
export const DEFAULT_TITLE = "Freelance Web Developer & Website Designer | Suraj Kirtaniya";
export const DEFAULT_DESCRIPTION =
  "Freelance web developer and website designer Suraj Kirtaniya builds distinctive, responsive business websites, landing pages, web applications, and practical AI automation experiences.";

export function absoluteUrl(path = "/") {
  if (/^https?:\/\//i.test(path)) return path;
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

export function pageMetadata({
  title,
  description,
  path,
  noIndex = false,
}: {
  title: string;
  description: string;
  path: string;
  noIndex?: boolean;
}): Metadata {
  return {
    title: { absolute: title },
    description,
    alternates: { canonical: path },
    openGraph: {
      type: "website",
      url: path,
      siteName: SITE_NAME,
      locale: "en_IN",
      title,
      description,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
    robots: noIndex
      ? { index: false, follow: false }
      : {
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
  };
}

export const PERSON_JSON_LD = {
  "@type": "Person",
  "@id": absoluteUrl("/#suraj-kirtaniya"),
  name: PERSON_NAME,
  url: absoluteUrl("/about"),
  jobTitle: "Freelance Web Developer & Website Designer",
  description:
    "Independent web developer and website designer focused on responsive business websites, landing pages, web applications, and practical AI automation.",
  knowsAbout: [
    "Website Design",
    "Web Development",
    "Responsive Web Design",
    "Next.js",
    "React",
    "Landing Pages",
    "Business Websites",
    "AI Automation",
    "Website Enquiry Automation",
  ],
};

export const WEBSITE_JSON_LD = {
  "@type": "WebSite",
  "@id": absoluteUrl("/#website"),
  url: SITE_URL,
  name: SITE_NAME,
  alternateName: PERSON_NAME,
  description: DEFAULT_DESCRIPTION,
  inLanguage: "en",
  publisher: { "@id": absoluteUrl("/#suraj-kirtaniya") },
};

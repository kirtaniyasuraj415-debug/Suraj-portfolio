import type { Metadata } from "next";

export const SITE_NAME = "SURAJ.WEB";
export const PERSON_NAME = "Suraj Kirtaniya";

// Keep canonical/indexing signals on the hostname that is actually live on Vercel.
// Switch this to the custom domain only after surajkirtaniya.qd.je has a valid
// certificate and is attached to the production deployment.
export const SITE_URL = "https://suraj-portfolio-phi-six.vercel.app";

export const DEFAULT_TITLE = "Suraj Kirtaniya Portfolio | Freelance Web Developer & Website Designer";
export const DEFAULT_DESCRIPTION =
  "Official portfolio of Suraj Kirtaniya (SURAJ.WEB), a freelance web developer and website designer building responsive business websites, landing pages, web apps, and practical AI automation.";

export const BRAND_KEYWORDS = [
  "Suraj Kirtaniya",
  "Suraj Kirtaniya portfolio",
  "Suraj portfolio",
  "SURAJ.WEB",
  "freelance web developer",
  "website designer",
  "web developer portfolio",
  "business website developer",
  "responsive web development",
  "Next.js developer",
  "AI automation",
];

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
    keywords: BRAND_KEYWORDS,
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
  alternateName: ["SURAJ.WEB", "Suraj Web"],
  url: absoluteUrl("/about"),
  image: absoluteUrl("/images/suraj-portrait.png"),
  jobTitle: "Freelance Web Developer & Website Designer",
  description:
    "Suraj Kirtaniya is an independent freelance web developer and website designer focused on responsive business websites, landing pages, web applications, conversion-focused interfaces, and practical AI automation.",
  sameAs: ["https://github.com/kirtaniyasuraj415-debug"],
  mainEntityOfPage: { "@id": absoluteUrl("/about#profile") },
  knowsAbout: [
    "Website Design",
    "Web Development",
    "Responsive Web Design",
    "Next.js",
    "React",
    "Landing Pages",
    "Business Websites",
    "Web Applications",
    "Conversion-focused Web Design",
    "AI Automation",
    "Website Enquiry Automation",
  ],
};

export const WEBSITE_JSON_LD = {
  "@type": "WebSite",
  "@id": absoluteUrl("/#website"),
  url: SITE_URL,
  name: SITE_NAME,
  alternateName: ["Suraj Kirtaniya Portfolio", "Suraj Kirtaniya", "Suraj Web"],
  description: DEFAULT_DESCRIPTION,
  keywords: BRAND_KEYWORDS.join(", "),
  inLanguage: "en",
  publisher: { "@id": absoluteUrl("/#suraj-kirtaniya") },
};

import { SITE_URL } from "@/lib/seo";

export const dynamic = "force-static";

export function GET() {
  const body = `# SURAJ.WEB — Full Site Summary

Canonical website: ${SITE_URL}

## Identity
SURAJ.WEB is the portfolio and service website of Suraj Kirtaniya, an independent freelance web developer and website designer.

## Core services

### Website Design
Custom visual direction, responsive page layouts, typography, information hierarchy, landing pages, business websites, portfolio sites, redesigns, and enquiry-focused user journeys.
Service page: ${SITE_URL}/services/website-design

### Web Development
Responsive website development, Next.js and React builds, production-ready route architecture, forms, integrations, deployment, and practical performance work.
Service page: ${SITE_URL}/services/web-development

### AI & Automation
Website enquiry automation, Telegram and WhatsApp handoffs, API-connected workflows, server-side automation, and focused AI-assisted workflows for repetitive business tasks.
Service page: ${SITE_URL}/services/ai-automation

## Selected work
Cee Bee Interiors: ${SITE_URL}/work/architecture
Home lane interior designer: ${SITE_URL}/work/designer
Parmanand Sweets: ${SITE_URL}/work/coffee
RC Weddings Films: ${SITE_URL}/work/skincare

## Useful pages
Home: ${SITE_URL}/
About: ${SITE_URL}/about
Services: ${SITE_URL}/services
Work: ${SITE_URL}/work
Start a Project: ${SITE_URL}/start-project
Sitemap: ${SITE_URL}/sitemap.xml
Robots: ${SITE_URL}/robots.txt
`;

  return new Response(body, {
    headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "public, max-age=3600" },
  });
}

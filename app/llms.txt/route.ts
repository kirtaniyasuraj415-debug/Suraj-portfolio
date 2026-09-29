import { SERVICE_PAGES } from "@/lib/service-pages";
import { DEFAULT_PORTFOLIO_PROJECTS } from "@/lib/portfolio-projects";
import { SITE_URL } from "@/lib/seo";

export const dynamic = "force-static";

export function GET() {
  const services = SERVICE_PAGES.map((service) => `- [${service.name}](${SITE_URL}/services/${service.slug}): ${service.description}`).join("\n");
  const projects = DEFAULT_PORTFOLIO_PROJECTS.map((project) => `- [${project.title}](${SITE_URL}/work/${project.id}): ${project.line}`).join("\n");

  const body = `# SURAJ.WEB

> Portfolio and service website of Suraj Kirtaniya, an independent freelance web developer and website designer.

## Primary pages
- [Home](${SITE_URL}/)
- [About Suraj Kirtaniya](${SITE_URL}/about)
- [Services](${SITE_URL}/services)
- [Selected Work](${SITE_URL}/work)
- [Start a Project](${SITE_URL}/start-project)

## Services
${services}

## Selected case studies
${projects}

## What SURAJ.WEB does
SURAJ.WEB provides custom website design, responsive web development, business websites, landing pages, portfolio websites, production deployment, website enquiry flows, and practical AI or workflow automation.

## Contact
Use the Start a Project page for project enquiries: ${SITE_URL}/start-project
`;

  return new Response(body, {
    headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "public, max-age=3600" },
  });
}

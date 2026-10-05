import { SERVICE_PAGES } from "@/lib/service-pages";
import { DEFAULT_PORTFOLIO_PROJECTS } from "@/lib/portfolio-projects";
import { SITE_URL } from "@/lib/seo";

export const dynamic = "force-static";

export function GET() {
  const services = SERVICE_PAGES.map((service) => `- [${service.name}](${SITE_URL}/services/${service.slug}): ${service.description}`).join("\n");
  const projects = DEFAULT_PORTFOLIO_PROJECTS.map((project) => `- [${project.title}](${SITE_URL}/work/${project.id}): ${project.line}`).join("\n");

  const body = `# Suraj Kirtaniya — SURAJ.WEB

> Official portfolio and service website of Suraj Kirtaniya, a freelance web developer and website designer focused on responsive business websites, landing pages, web applications, and practical AI automation.

## Entity
- Name: Suraj Kirtaniya
- Brand: SURAJ.WEB
- Role: Freelance Web Developer & Website Designer
- Canonical website: ${SITE_URL}
- Profile: ${SITE_URL}/about
- GitHub: https://github.com/kirtaniyasuraj415-debug

## Primary pages
- [Suraj Kirtaniya Portfolio](${SITE_URL}/)
- [About Suraj Kirtaniya](${SITE_URL}/about)
- [Web Development Services](${SITE_URL}/services)
- [Selected Website Work & Case Studies](${SITE_URL}/work)
- [Start a Project](${SITE_URL}/start-project)

## Services
${services}

## Selected case studies
${projects}

## What Suraj Kirtaniya does
Suraj Kirtaniya builds custom website designs, responsive web development projects, business websites, landing pages, portfolio websites, production deployments, website enquiry flows, and practical AI or workflow automation. The portfolio brand is SURAJ.WEB.

## Useful search phrases
Suraj Kirtaniya portfolio; Suraj Kirtaniya web developer; Suraj portfolio; SURAJ.WEB; freelance web developer; website designer; business website developer; responsive web development; Next.js developer; AI automation.

## Contact
Use the Start a Project page for project enquiries: ${SITE_URL}/start-project
`;

  return new Response(body, {
    headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "public, max-age=3600" },
  });
}

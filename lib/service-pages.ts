export type ServicePage = {
  slug: string;
  name: string;
  seoTitle: string;
  description: string;
  headline: string;
  intro: string;
  covers: string[];
  process: { title: string; copy: string }[];
  fit: string[];
};

export const SERVICE_PAGES: ServicePage[] = [
  {
    slug: "website-design",
    name: "Website Design",
    seoTitle: "Website Design Services for Businesses | SURAJ.WEB",
    description:
      "Custom website design services focused on distinctive visual direction, responsive layouts, clear hierarchy, and conversion-focused business websites.",
    headline: "Website design built around your business, not a template.",
    intro:
      "A strong website should make the business easier to understand and easier to trust. I shape the visual direction, information hierarchy, typography, page structure, and responsive behaviour around the specific brand and its audience.",
    covers: [
      "Custom visual direction and page hierarchy",
      "Responsive layouts for mobile, tablet, and desktop",
      "Landing pages, business websites, portfolios, and redesigns",
      "Clear calls to action and enquiry-focused user journeys",
    ],
    process: [
      { title: "Understand the business", copy: "Clarify the audience, offer, content, competitors, and the action the website should drive." },
      { title: "Shape the system", copy: "Develop the layout, typography, visual rhythm, and responsive direction as one coherent system." },
      { title: "Refine for real use", copy: "Check readability, mobile behaviour, hierarchy, and action clarity before the design moves into development." },
    ],
    fit: [
      "You need a business website that looks more distinctive than a generic template.",
      "Your current website feels dated, confusing, or weak on mobile.",
      "You want design decisions tied to real business goals instead of decoration.",
    ],
  },
  {
    slug: "web-development",
    name: "Web Development",
    seoTitle: "Web Development Services & Responsive Websites | SURAJ.WEB",
    description:
      "Responsive web development services for business websites, landing pages, portfolio sites, and modern web experiences built with practical production-ready architecture.",
    headline: "Responsive web development that is built to work in production.",
    intro:
      "Development is where the visual system becomes a real product. I build responsive websites and web experiences with a focus on clean interaction, practical performance, maintainable structure, and deployment that works outside a demo environment.",
    covers: [
      "Responsive front-end development",
      "Next.js and React website builds",
      "Business websites, landing pages, and portfolio experiences",
      "Production deployment, forms, integrations, and route architecture",
    ],
    process: [
      { title: "Build the responsive structure", copy: "Translate the approved direction into reusable layouts that hold up across real screen sizes." },
      { title: "Connect the important flows", copy: "Implement forms, enquiry paths, live previews, integrations, and the interactions the project actually needs." },
      { title: "Check and launch", copy: "Test routes, responsive behaviour, production builds, and deployment before the site is treated as finished." },
    ],
    fit: [
      "You already have a direction or design and need it built properly.",
      "Your current project works as a preview but needs production-ready architecture.",
      "You need a modern responsive website with deployment and real form flows included.",
    ],
  },
  {
    slug: "ai-automation",
    name: "AI & Automation",
    seoTitle: "Website AI Automation & Enquiry Automation | SURAJ.WEB",
    description:
      "Practical AI and website automation for enquiry flows, lead notifications, Telegram or WhatsApp handoffs, and connected workflows that reduce repetitive work.",
    headline: "Practical website automation that removes repetitive work.",
    intro:
      "Automation is useful when it shortens a real workflow. I connect website enquiries and business processes to tools such as Telegram, WhatsApp, forms, APIs, and structured follow-up flows instead of adding AI features that have no operational value.",
    covers: [
      "Website enquiry and lead notification flows",
      "Telegram and WhatsApp handoff workflows",
      "API-connected forms and server-side automation",
      "Practical AI-assisted workflows for repetitive tasks",
    ],
    process: [
      { title: "Map the workflow", copy: "Identify what happens today, where time is wasted, and which trigger or handoff is actually worth automating." },
      { title: "Build the reliable path", copy: "Connect the website, server logic, API, notification, and fallback behaviour required for the workflow." },
      { title: "Test the real outcome", copy: "Verify success and failure states so the automation is useful in production, not only during a demo." },
    ],
    fit: [
      "Website enquiries currently require too much manual follow-up.",
      "You want leads or form submissions routed instantly to the right channel.",
      "You need a focused automation tied to a real business process.",
    ],
  },
];

export function servicePathForTitle(title: string) {
  const normalized = title.toLowerCase().replace(/&/g, "and");
  if (normalized.includes("website design")) return "/services/website-design";
  if (normalized.includes("web development")) return "/services/web-development";
  if (normalized.includes("ai") || normalized.includes("automation")) return "/services/ai-automation";
  return "/services";
}

export function getServicePage(slug: string) {
  return SERVICE_PAGES.find((item) => item.slug === slug);
}

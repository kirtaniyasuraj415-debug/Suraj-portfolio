"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowDown, ArrowRight, ArrowUpRight, ChevronDown, Code2, Gauge, Menu, MessageCircle, Monitor, Rocket, Smartphone, Sparkles, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetDescription, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import EnquiryForm from "@/components/enquiry-form";
import PortfolioChatbot from "@/components/portfolio-chatbot";
import ScrollMotion from "@/components/scroll-motion";
import CinematicIntro from "@/components/cinematic-intro";
import { DEFAULT_PORTFOLIO_PROJECTS, type PortfolioProject } from "@/lib/portfolio-projects";
import { DEFAULT_SERVICES, DEFAULT_SITE_SETTINGS, type CmsService } from "@/lib/cms";
import { servicePathForTitle } from "@/lib/service-pages";

const navigation = [
  { label: "About", href: "/about" },
  { label: "Projects", href: "/work" },
  { label: "Services", href: "/services" },
  { label: "Process", href: "#process", id: "process" },
  { label: "Contact", href: "#contact", id: "contact" },
];

const WHATSAPP_MESSAGE = "Hi Suraj, I came across your portfolio and would like to discuss a website/project.";

type PortfolioRating = {
  id: number;
  name: string;
  business: string;
  rating: number;
  message: string;
  createdAt: string;
};

function GetStartedButton({
  children = "Get Started",
  className = "",
  onClick,
}: {
  children?: React.ReactNode;
  className?: string;
  onClick: () => void;
}) {
  return (
    <Button type="button" className={`orange-button ${className}`} onClick={onClick}>
      {children}
      <span className="button-arrow">
        <ArrowUpRight size={16} />
      </span>
    </Button>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <div className="section-label"><span aria-hidden="true">✦</span>{children}</div>;
}

function ProjectVisual({ project }: { project: PortfolioProject }) {
  return (
    <div className={`project-visual visual-${project.id}`}>
      <div className="project-image-stage">
        {/* The supplied project screenshot is shown cleanly: no labels, buttons or blur over it. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={project.image}
          alt={`${project.title} website preview`}
          loading="lazy"
          decoding="async"
          width="1200"
          height="750"
          className="project-image"
        />
      </div>
    </div>
  );
}

export default function Portfolio() {
  const [menuOpen, setMenuOpen] = useState(false);
  const mobileDestination = useRef<string | null>(null);
  const [active, setActive] = useState("");
  const [projects, setProjects] = useState<PortfolioProject[]>(DEFAULT_PORTFOLIO_PROJECTS);
  const [services, setServices] = useState<CmsService[]>(DEFAULT_SERVICES);
  const [siteSettings, setSiteSettings] = useState(DEFAULT_SITE_SETTINGS);
  const [enquiryOpen, setEnquiryOpen] = useState(false);
  const [ratings, setRatings] = useState<PortfolioRating[]>([]);
  const [ratingValue, setRatingValue] = useState(5);
  const [ratingName, setRatingName] = useState("");
  const [ratingBusiness, setRatingBusiness] = useState("");
  const [ratingMessage, setRatingMessage] = useState("");
  const [ratingSubmitting, setRatingSubmitting] = useState(false);
  const [ratingStatus, setRatingStatus] = useState<string | null>(null);

  useEffect(() => {
    const trackedIds = navigation.flatMap((item) => item.id ? [item.id] : []);

    const updateActiveSection = () => {
      const activationLine = Math.min(180, Math.max(96, window.innerHeight * 0.2));
      let nextActive = "";

      for (const id of trackedIds) {
        const section = document.getElementById(id);
        if (!section) continue;
        const rect = section.getBoundingClientRect();
        if (rect.top <= activationLine && rect.bottom > activationLine) {
          nextActive = id;
          break;
        }
      }

      setActive((current) => current === nextActive ? current : nextActive);
    };

    updateActiveSection();
    window.addEventListener("scroll", updateActiveSection, { passive: true });
    window.addEventListener("resize", updateActiveSection);

    return () => {
      window.removeEventListener("scroll", updateActiveSection);
      window.removeEventListener("resize", updateActiveSection);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    fetch("/api/public-cms", { cache: "no-store" })
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => {
        if (cancelled || !data) return;
        if (Array.isArray(data.projects) && data.projects.length) setProjects(data.projects);
        if (Array.isArray(data.services) && data.services.length) setServices(data.services);
        if (data.settings && typeof data.settings === "object") {
          setSiteSettings((current) => ({ ...current, ...data.settings }));
        }
      })
      .catch(() => {});

    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/ratings", { cache: "no-store" })
      .then((response) => response.ok ? response.json() : null)
      .then((data) => {
        if (!cancelled && Array.isArray(data?.ratings)) setRatings(data.ratings);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  const submitRating = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (ratingSubmitting) return;
    setRatingStatus(null);
    setRatingSubmitting(true);
    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/ratings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: ratingName,
          business: ratingBusiness,
          rating: ratingValue,
          message: ratingMessage,
          website: form.get("website") || "",
        }),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok || !data?.success) {
        setRatingStatus(data?.error || "Unable to submit your rating right now.");
        return;
      }
      setRatingStatus("Thanks — your rating was received and will appear after a quick review.");
      setRatingName("");
      setRatingBusiness("");
      setRatingMessage("");
      setRatingValue(5);
    } catch {
      setRatingStatus("Unable to submit your rating right now.");
    } finally {
      setRatingSubmitting(false);
    }
  };

  const whatsappUrl = `https://wa.me/${siteSettings.whatsappNumber}?text=${encodeURIComponent(WHATSAPP_MESSAGE)}`;
  const leftProjects = projects.filter((_, index) => index % 2 === 0);
  const rightProjects = projects.filter((_, index) => index % 2 === 1);

  const card = (project: PortfolioProject) => (
    <article className="project-card" key={project.id}>
      <a
        className="project-case-link"
        href={`/work/${encodeURIComponent(project.id)}`}
        aria-label={`Open ${project.title} case study`}
      >
        <ProjectVisual project={project} />
      </a>

      <details className="project-details">
        <summary className="project-details-toggle" aria-label={`Show details for ${project.title}`}>
          <span className="project-details-copy">
            <strong>{project.title}</strong>
            <small>{project.tag}</small>
          </span>
          <span className="project-details-action" aria-hidden="true">
            <span className="project-details-action-label">Details</span>
            <span className="project-details-chevron">
              <ChevronDown size={18} />
            </span>
          </span>
        </summary>

        <div className="project-details-panel">
          <div className="project-details-kicker">
            <span>{String(project.slot).padStart(2, "0")}</span>
            <span>{project.tag}</span>
          </div>
          <div className="project-caption">
            <div>
              <span className="project-overview-label">Project Overview</span>
              <h3>{project.title}</h3>
            </div>
            <a href={`/work/${encodeURIComponent(project.id)}`} aria-label={`Open ${project.title} case study`}>
              <ArrowUpRight size={20} />
            </a>
          </div>
          <p className="project-card-summary">{project.line}</p>
          <p className="project-card-detail">{project.detail}</p>
          <div className="project-tags">
            <span>{project.tag}</span>
            <span>Concept Project</span>
          </div>
          <div className="project-detail-actions">
            <a className="project-case-study-link" href={`/work/${encodeURIComponent(project.id)}`}>
              View Case Study <ArrowUpRight size={15} />
            </a>
            <a className="project-live-link" href={project.liveUrl} target="_blank" rel="noopener noreferrer">
              Live Preview <ArrowUpRight size={15} />
            </a>
          </div>
        </div>
      </details>
    </article>
  );

  return <main id="top">
    <CinematicIntro />
    <section className="hero" aria-labelledby="hero-title">
      <div className="hero-atmosphere" aria-hidden="true" />
      <header className="site-header">
        <a href="#top" className="wordmark" aria-label="Suraj Web, back to top">SURAJ.WEB</a>
        <nav className="desktop-nav" aria-label="Main navigation">{navigation.map((item) => <a key={item.label} href={item.href} className={item.id && active === item.id ? "active" : ""}>{item.label}</a>)}</nav>
        <div className="header-actions">
          <GetStartedButton onClick={() => setEnquiryOpen(true)}>Get Started</GetStartedButton>
          <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
            <SheetTrigger asChild><Button variant="ghost" size="icon" className="menu-trigger" aria-label="Open menu"><Menu /></Button></SheetTrigger>
            <SheetContent className="mobile-menu" onCloseAutoFocus={(event) => {
              const id = mobileDestination.current;
              if (!id) return;
              event.preventDefault();
              mobileDestination.current = null;
              requestAnimationFrame(() => {
                document.getElementById(id)?.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth" });
                window.history.replaceState(null, "", `#${id}`);
              });
            }}><SheetTitle className="wordmark">SURAJ.WEB</SheetTitle><SheetDescription>Design. Develop. Make an impression.</SheetDescription><nav aria-label="Mobile navigation">{navigation.map((item) => <a key={item.label} href={item.href} onClick={(event) => { if (!item.id) { setMenuOpen(false); return; } event.preventDefault(); mobileDestination.current = item.id; setMenuOpen(false); }}>{item.label}<ArrowUpRight size={22}/></a>)}</nav><a className="mobile-email" href={whatsappUrl} target="_blank" rel="noopener noreferrer">Chat on WhatsApp</a></SheetContent>
          </Sheet>
        </div>
      </header>

      <div className="hero-name"><p>Hi, I am</p><h1 id="hero-title"><span>Suraj</span><span>Kirtaniya</span></h1></div>
      <div className="hero-portrait">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/images/suraj-portrait.png" alt="Suraj Kirtaniya, web developer" width="1024" height="1536" fetchPriority="high" />
      </div>
      <div className="hero-bottom-shade" aria-hidden="true" />
      <div className="hero-intro">
        <p className="hero-eyebrow"><span>✦</span> Independent web developer</p>
        <h2>Websites that turn<br/>visitors into clients.</h2>
        <div className="hero-links">
          <GetStartedButton onClick={() => setEnquiryOpen(true)}>Get Started</GetStartedButton>
          <a className="text-link" href="/work">View My Work <ArrowUpRight size={15}/></a>
        </div>
      </div>
      <aside className="hero-promise premium-glow-card" aria-label="Design, development and launch">
        <div className="promise-icons"><span><Monitor size={18}/></span><span><Code2 size={19}/></span><span><Rocket size={18}/></span><b>↗</b></div>
        <p>From your first idea<br/>to your next big launch.</p>
        <div className="promise-tags"><span>Custom Design</span><span>Built to Perform</span></div>
      </aside>
    </section>

    <div className="skills-marquee" aria-label="Web development, responsive design, creative solutions, AI automation"><div>{[0,1].map((n) => <span className="marquee-group" key={n} aria-hidden={n===1}>WEB DEVELOPMENT <b>✦</b> RESPONSIVE DESIGN <b>✦</b> CREATIVE SOLUTIONS <b>✦</b> AI AUTOMATION <b>✦</b></span>)}</div></div>

    <section id="about" className="about-section content-width">
      <div className="about-label"><SectionLabel>About Me</SectionLabel><span/></div>
      <div className="about-copy">
        <h2>Hey there, I’m Suraj Kirtaniya — a web developer with an eye for design and a focus on what works. I turn ideas into distinctive websites that feel effortless to use and help your business take its next step.</h2>
        <div className="section-actions">
          <GetStartedButton onClick={() => setEnquiryOpen(true)}>Get Started</GetStartedButton>
          <a href="/about" className="text-link">About Me <ArrowUpRight size={15}/></a>
          <a href="/work" className="text-link">View My Work <ArrowUpRight size={15}/></a>
        </div>
      </div>
    </section>
    <div className="technology-row content-width" aria-label="Technologies I work with"><span className="tech-react">◉ React</span><span className="tech-next">NEXT.js</span><span className="tech-firebase">ϟ Firebase</span><span className="tech-tailwind">≋ tailwindcss</span><span className="tech-vercel">▲ Vercel</span></div>

    <section id="projects" className="projects-section content-width" aria-labelledby="projects-heading">
      <div className="project-column">
        {leftProjects.map(card)}
        <p className="project-statement">I believe the smallest details<br/>make the biggest difference<span>.</span></p>
      </div>
      <div className="project-column offset-column">
        <div className="projects-heading">
          <SectionLabel>{siteSettings.projectSectionLabel}</SectionLabel>
          <a href="/work" className="section-page-link"><h2 id="projects-heading" style={{ whiteSpace: "pre-line" }}>{siteSettings.projectSectionHeading}</h2><ArrowUpRight size={20}/></a>
          <p>A selection of independent website concepts.</p>
        </div>
        {rightProjects.map(card)}
      </div>
    </section>

    <section className="content-width pt-28 sm:pt-36" aria-labelledby="why-heading">
      <div className="section-heading">
        <SectionLabel>Why Work With Me</SectionLabel>
        <h2 id="why-heading">Built around your business,<br/>not a template.</h2>
      </div>
      <div className="why-grid">
        {[
          { icon: Sparkles, title: "Custom Direction", copy: "Layouts and visual decisions shaped around your brand instead of a one-size-fits-all template." },
          { icon: Smartphone, title: "Mobile First", copy: "Every page is considered for the phone experience, not treated as a desktop afterthought." },
          { icon: Gauge, title: "Performance Minded", copy: "Lean interfaces, responsive assets, and practical implementation choices that keep the experience focused." },
          { icon: MessageCircle, title: "Direct Collaboration", copy: "You work directly with me from the first idea through design, development, and launch." },
        ].map(({ icon: Icon, title, copy }, index) => (
          <article
            key={title}
            className={`why-card ${index === 0 || index === 3 ? "why-card-large" : "why-card-small"}`}
            onClick={(event) => {
              const card = event.currentTarget;
              card.classList.remove("why-card-pulse");
              void card.offsetWidth;
              card.classList.add("why-card-pulse");
              window.setTimeout(() => card.classList.remove("why-card-pulse"), 1400);
            }}
          >
            <span className="why-card-live-bg" aria-hidden="true" />
            <div className="why-card-topline">
              <span className="why-card-index">0{index + 1}</span>
              <span className="why-card-icon"><Icon size={18}/></span>
            </div>
            <div className="why-card-body">
              <h3 className="why-card-title">{title}</h3>
              <p className="why-card-copy">{copy}</p>
            </div>
          </article>
        ))}
      </div>
    </section>

    <section id="services" className="services-section services-section-v9 content-width">
      <div className="section-heading">
        <SectionLabel>{siteSettings.servicesSectionLabel}</SectionLabel>
        <a href="/services" className="section-page-link"><h2 style={{ whiteSpace: "pre-line" }}>{siteSettings.servicesSectionHeading}</h2><ArrowUpRight size={20}/></a>
      </div>
      <div className="service-list service-list-v9">
        {services.map((service, index)=><div className="service-row" key={service.docId || `${service.title}-${index}`}><span>{String(index + 1).padStart(2, "0")}</span><h3><a href={servicePathForTitle(service.title)}>{service.title}</a></h3><p>{service.description}</p><a href={servicePathForTitle(service.title)} aria-label={`Learn more about ${service.title}`}><ArrowUpRight/></a></div>)}
      </div>
    </section>

    <section id="process" className="process-section content-width">
      <SectionLabel>How We Work Together</SectionLabel>
      <h2>A clear path from<br/>idea to launch.</h2>
      <div className="process-grid">
        {[{n:"01",title:"Understand",text:"We start with your business, your audience, and what your website needs to achieve."},{n:"02",title:"Design",text:"I shape the layout and visual direction. We refine the details together."},{n:"03",title:"Build & Launch",text:"I build, check the experience across screens, and bring your website online."}].map(p=><article key={p.n}><span>{p.n} <ArrowRight size={18}/></span><h3>{p.title}</h3><p>{p.text}</p></article>)}
      </div>
      <div className="process-cta-row mt-12 flex items-center justify-between flex-wrap gap-4 pt-8 border-t border-white/[0.08]">
        <div>
          <h3 className="text-xl font-medium text-[#f6f0e9]">Have an idea ready to build?</h3>
          <p className="text-xs text-[#a99585] mt-1">Get an estimate and project plan directly from Suraj.</p>
        </div>
        <GetStartedButton onClick={() => setEnquiryOpen(true)}>Get Started</GetStartedButton>
      </div>
    </section>

    <section id="feedback" className="feedback-section-v9 content-width pb-28 sm:pb-36" aria-labelledby="feedback-heading">
      <div className="grid grid-cols-1 lg:grid-cols-[0.9fr_1.1fr] gap-10 lg:gap-16 items-start">
        <div>
          <SectionLabel>Portfolio Feedback</SectionLabel>
          <h2 id="feedback-heading" className="font-['Antonio',sans-serif] text-5xl sm:text-6xl font-thin tracking-[-2px] leading-[1.05] mt-5">
            Seen the work?<br/>Rate the experience.
          </h2>
          <p className="text-[#a99585] text-sm leading-6 mt-5 max-w-md">
            Reviews shown here come from real portfolio visitors and are published only after moderation. No fabricated testimonials.
          </p>

          {ratings.length > 0 && (() => {
            const average = ratings.reduce((sum, item) => sum + item.rating, 0) / ratings.length;
            return (
              <div className="flex items-center gap-3 mt-7">
                <div className="flex text-[#f87b38]" aria-label={`${average.toFixed(1)} out of 5 average rating`}>
                  {[1,2,3,4,5].map((star) => (
                    <Star key={star} size={17} fill={star <= Math.round(average) ? "currentColor" : "none"} className={star <= Math.round(average) ? "" : "text-[#5f493d]"} />
                  ))}
                </div>
                <span className="text-sm text-[#d8c9bd]">
                  {average.toFixed(1)} average · {ratings.length} published {ratings.length === 1 ? "review" : "reviews"}
                </span>
              </div>
            );
          })()}
        </div>

        <div className="portfolio-review-grid grid grid-cols-2 gap-3 sm:gap-4">
          {ratings.length ? ratings.slice(0, 4).map((review) => (
            <article key={review.id} className="portfolio-review-card rounded-2xl border border-white/[0.1] bg-[#160d07] p-5 sm:p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="font-medium text-[#f6f0e9]">{review.name}</h3>
                  <p className="text-xs text-[#8d7c71] mt-1">{review.business || "Portfolio visitor"}</p>
                </div>
                <div className="flex text-[#f87b38]" aria-label={`${review.rating} out of 5 stars`}>
                  {[1,2,3,4,5].map((star) => <Star key={star} size={15} fill={star <= review.rating ? "currentColor" : "none"} className={star <= review.rating ? "" : "text-[#5f493d]"} />)}
                </div>
              </div>
              <p className="text-sm leading-6 text-[#c8bcb0] mt-4">“{review.message}”</p>
            </article>
          )) : (
            <div className="portfolio-review-empty rounded-2xl border border-dashed border-[#f87b38]/35 bg-[#f87b38]/[0.04] p-6 sm:p-8">
              <div className="flex text-[#f87b38] gap-1">{[1,2,3,4,5].map((star) => <Star key={star} size={18} />)}</div>
              <h3 className="font-['Antonio',sans-serif] text-2xl mt-5">Be the first published review.</h3>
              <p className="text-sm text-[#a99585] mt-2 leading-6">I’m keeping this section genuine. Visitor ratings appear here only after they are actually submitted and approved.</p>
            </div>
          )}
        </div>
      </div>

      <form onSubmit={submitRating} className="portfolio-rating-form mt-8 rounded-2xl sm:rounded-3xl border border-[#68462e] bg-[#160d07] p-5 sm:p-7">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-5 pb-5 border-b border-white/[0.08]">
          <div>
            <h3 className="font-['Antonio',sans-serif] text-3xl font-thin">Rate my portfolio work</h3>
            <p className="text-xs text-[#8d7c71] mt-1">Your review is moderated before it becomes public.</p>
          </div>
          <div className="flex gap-1" role="radiogroup" aria-label="Rating out of 5">
            {[1,2,3,4,5].map((star) => (
              <button key={star} type="button" onClick={() => setRatingValue(star)} aria-label={`${star} star rating`}
                className="p-1.5 rounded-lg hover:bg-white/[0.06] transition-colors">
                <Star size={25} fill={star <= ratingValue ? "currentColor" : "none"} className={star <= ratingValue ? "text-[#f87b38]" : "text-[#6a5549]"} />
              </button>
            ))}
          </div>
        </div>
        <input name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-5">
          <label className="text-xs text-[#d8c9bd]">Your Name
            <input required maxLength={30} value={ratingName} onChange={(e) => setRatingName(e.target.value)}
              className="mt-2 w-full h-11 rounded-xl border border-white/[0.14] bg-[#0e0501] px-3 text-sm text-[#f6f0e9] outline-none focus:border-[#f87b38]" placeholder="Your name" />
          </label>
          <label className="text-xs text-[#d8c9bd]">Business / Brand <span className="text-[#8d7c71]">(optional)</span>
            <input maxLength={30} value={ratingBusiness} onChange={(e) => setRatingBusiness(e.target.value)}
              className="mt-2 w-full h-11 rounded-xl border border-white/[0.14] bg-[#0e0501] px-3 text-sm text-[#f6f0e9] outline-none focus:border-[#f87b38]" placeholder="Business or brand" />
          </label>
        </div>
        <label className="block text-xs text-[#d8c9bd] mt-4">Your Review
          <textarea required minLength={8} maxLength={100} rows={3} value={ratingMessage} onChange={(e) => setRatingMessage(e.target.value)}
            className="mt-2 w-full rounded-xl border border-white/[0.14] bg-[#0e0501] p-3 text-sm text-[#f6f0e9] outline-none focus:border-[#f87b38] resize-none" placeholder="What stood out to you about the work?" />
        </label>
        <div className="mt-5 flex flex-wrap items-center gap-4">
          <button type="submit" disabled={ratingSubmitting} className="orange-button inline-flex items-center disabled:opacity-60">
            {ratingSubmitting ? "Submitting..." : "Submit Rating"}
            <span className="button-arrow"><ArrowUpRight size={16}/></span>
          </button>
          {ratingStatus && <p className="text-xs text-[#c8bcb0]" role="status">{ratingStatus}</p>}
        </div>
      </form>
    </section>

    <section className="faq-section-v9 content-width pb-28 sm:pb-36" aria-labelledby="faq-heading">
      <div className="section-heading">
        <SectionLabel>FAQ</SectionLabel>
        <h2 id="faq-heading">A few things clients<br/>usually ask.</h2>
      </div>
      <div className="faq-list-v9 mt-10 border-t border-white/[0.12]">
        {[
          ["What kind of websites do you build?", "Business websites, landing pages, portfolios, redesigns, e-commerce experiences, and selected AI or automation workflows."],
          ["Will the website work properly on mobile?", "Yes. Responsive behaviour is considered throughout the build so the experience works across common phone, tablet, and desktop sizes."],
          ["How long will my project take?", "The timeline depends on scope, content, revisions, and integrations. I confirm the expected schedule after understanding the project rather than promising a generic deadline."],
          ["Can you handle deployment too?", "Yes. I can prepare and deploy the finished web project and help connect the final hosting setup where it fits the project."],
          ["Can you add enquiry or automation flows?", "Yes. Where useful, I can connect forms, Telegram or WhatsApp follow-ups, and practical automation flows instead of adding automation just for the sake of it."],
        ].map(([question, answer]) => (
          <details key={question} className="group border-b border-white/[0.12] py-5">
            <summary className="list-none cursor-pointer flex items-center justify-between gap-6 font-['Antonio',sans-serif] text-2xl font-thin">
              {question}<span className="text-[#f87b38] text-2xl transition-transform group-open:rotate-45">+</span>
            </summary>
            <p className="text-sm leading-7 text-[#a99585] max-w-2xl pt-3 pr-8">{answer}</p>
          </details>
        ))}
      </div>
    </section>

    <section id="contact" className="contact-section">
      <div className="content-width contact-card-shell contact-reference-card">
        <div className="contact-reference-grid" aria-hidden="true" />
        <div className="contact-reference-wash" aria-hidden="true" />
        <div className="contact-reference-glow" aria-hidden="true" />

        <div className="contact-reference-content">
          <SectionLabel>Let’s Make It Happen</SectionLabel>
          <h2 className="contact-reference-heading">
            <span>Have a project</span>
            <span>in <em>mind?</em></span>
          </h2>
          <p className="contact-reference-copy">
            Tell me what you’re thinking. Let’s build something that feels like you.
          </p>
          <div className="contact-reference-actions">
            <GetStartedButton onClick={() => setEnquiryOpen(true)}>Get Started</GetStartedButton>
            <a className="contact-email" href={whatsappUrl} target="_blank" rel="noopener noreferrer">
              Chat on WhatsApp <ArrowUpRight size={18}/>
            </a>
          </div>
        </div>
      </div>
    </section>
    <footer className="site-footer portfolio-footer">
      <div className="portfolio-footer-inner content-width">
        <div className="portfolio-footer-head">
          <a href="#top" className="wordmark">SURAJ.WEB</a>
          <p>Independent web developer crafting focused, high-converting digital experiences.</p>
        </div>
        <nav className="footer-pages" aria-label="Portfolio pages">
          <a href="/work">Work</a>
          <a href="/services">Services</a>
          <a href="/about">About</a>
          <a href="/start-project">Start Project</a>
        </nav>
        <div className="portfolio-footer-bottom">
          <p>© 2026 Suraj Kirtaniya</p>
          <a href="#top">Back to top <ArrowDown size={15} className="rotate-180"/></a>
        </div>
        <div className="portfolio-footer-giant" aria-hidden="true">SURAJ.WEB</div>
      </div>
    </footer>

    <Dialog open={enquiryOpen} onOpenChange={setEnquiryOpen}>
      <DialogContent className="enquiry-dialog-shell w-[calc(100vw-20px)] max-w-[760px]! max-h-[92svh] overflow-y-auto gap-0 rounded-2xl p-0 text-[#f6f0e9] sm:rounded-3xl">
        <DialogHeader className="px-5 pt-6 pb-4 text-left sm:px-8 sm:pt-8">
          <SectionLabel>Start a Project</SectionLabel>
          <DialogTitle className="font-['Antonio',sans-serif] text-3xl font-thin tracking-[-1px] text-[#f6f0e9] sm:text-4xl">
            Let’s build something that works.
          </DialogTitle>
          <DialogDescription className="text-sm leading-relaxed text-[#b5a597]">
            Share your project details. The enquiry is sent directly to Suraj and you can continue the conversation on WhatsApp.
          </DialogDescription>
        </DialogHeader>
        <div className="px-3 pb-4 sm:px-6 sm:pb-6">
          <EnquiryForm embedded />
        </div>
      </DialogContent>
    </Dialog>

    <ScrollMotion />
    <PortfolioChatbot />
  </main>;
}

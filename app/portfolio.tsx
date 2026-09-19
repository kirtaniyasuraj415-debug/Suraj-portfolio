"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowDown, ArrowRight, ArrowUpRight, Code2, Menu, Monitor, Rocket, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetDescription, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

const navigation = [
  ["About", "about"], ["Projects", "projects"], ["Services", "services"], ["Process", "process"], ["Contact", "contact"],
];
const email = "kirtaniyasuraj415@gmail.com";
const projects = [
  { id: "architecture", brand: "FORMA", title: "Forma — Architecture & Interiors", line: "A considered home for extraordinary spaces.", tag: "Web Design", headline: "Spaces that\nfeel like you.", detail: "An architecture studio concept with immersive project photography, a curated portfolio, and a clear route to an enquiry.", image: "/images/architecture.jpg", color: "#ddd1b8", scope: ["Editorial art direction", "Responsive project gallery", "Consultation enquiry flow"] },
  { id: "wedding", brand: "VOW", title: "Vow — Wedding Films", line: "A cinematic website for stories worth remembering.", tag: "Web Development", headline: "For the moments\nthat stay.", detail: "A wedding film studio concept built around emotional imagery, selected films, and an easy way for couples to begin a conversation.", image: "/images/wedding.jpg", color: "#e5e0d9", scope: ["Cinematic visual direction", "Film portfolio layout", "Wedding enquiry experience"] },
  { id: "coffee", brand: "DAYBREAK", title: "Daybreak — Coffee & Bakehouse", line: "A warm first impression, before the first sip.", tag: "Web Design", headline: "A little slower.\nA little better.", detail: "A local café concept with an inviting menu, a strong sense of place, and practical information customers can find quickly on their phone.", image: "/images/coffee.jpg", color: "#d3d899", scope: ["Distinctive café identity", "Mobile-friendly menu", "Location and contact details"] },
  { id: "skincare", brand: "AURA", title: "Aura — Skin & Aesthetics", line: "A calm, confident experience for a modern clinic.", tag: "Web Development", headline: "Care, beautifully\nconsidered.", detail: "A skincare studio concept with clear treatment information, a calm visual language, and a focused consultation journey.", image: "/images/skincare.jpg", color: "#dae6e1", scope: ["Refined visual identity", "Treatment information", "Consultation booking layout"] },
];
type Project = typeof projects[number];

function ProjectButton({ children = "Start a Project", className = "" }: { children?: React.ReactNode; className?: string }) {
  return <Button asChild className={`orange-button ${className}`}><a href="#contact">{children}<span className="button-arrow"><ArrowUpRight size={16} /></span></a></Button>;
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <div className="section-label"><span aria-hidden="true">✦</span>{children}</div>;
}

function ProjectVisual({ project }: { project: Project }) {
  return <div className={`project-visual visual-${project.id}`} style={{ backgroundColor: project.color }}>
    <span className="project-backword" aria-hidden="true">{project.id === "architecture" ? "Spaces." : project.id === "wedding" ? "Forever." : project.id === "coffee" ? "Daybreak." : "Naturally."}</span>
    <div className="website-mockup" aria-hidden="true">
      <div className="mockup-bar"><b>{project.brand}<span>®</span></b><span>About &nbsp; Work &nbsp; Contact</span><i>LET’S TALK ↗</i></div>
      <div className="mockup-hero">
        {/* Native images are intentional for art-directed concept previews. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={project.image} alt="" loading="lazy" width="1200" height="900" />
        <div className="mockup-copy"><small>{project.id === "architecture" ? "ARCHITECTURE WITH INTENTION" : project.id === "wedding" ? "WEDDING FILMS & PHOTOGRAPHY" : project.id === "coffee" ? "COFFEE. CONVERSATION. COMMUNITY." : "YOUR SKIN, YOUR STORY."}</small><strong>{project.headline}</strong><span>{project.id === "coffee" ? "EXPLORE THE MENU" : "DISCOVER MORE"} <ArrowUpRight size={11} /></span></div>
        <div className="mockup-bottom"><span>THOUGHTFULLY MADE.</span><span>SCROLL TO EXPLORE ↓</span></div>
      </div>
    </div>
    <span className="project-open"><ArrowUpRight size={23} /></span>
  </div>;
}

export default function Portfolio() {
  const [menuOpen, setMenuOpen] = useState(false);
  const mobileDestination = useRef<string | null>(null);
  const [active, setActive] = useState("about");
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) if (entry.isIntersecting) setActive(entry.target.id);
    }, { rootMargin: "-15% 0px -65% 0px" });
    navigation.forEach(([, id]) => { const section = document.getElementById(id); if (section) observer.observe(section); });
    return () => observer.disconnect();
  }, []);

  const card = (project: Project) => <article className="project-card" key={project.id}>
    <Button variant="ghost" className="project-trigger" aria-label={`View ${project.title} concept`} onClick={() => setSelectedProject(project)}><ProjectVisual project={project} /></Button>
    <div className="project-caption"><h3>{project.title}</h3><ArrowUpRight size={20} /></div>
    <p>{project.line}</p>
    <div className="project-tags"><span>{project.tag}</span><span>Concept Project</span></div>
  </article>;

  return <main id="top">
    <section className="hero" aria-labelledby="hero-title">
      <div className="hero-atmosphere" aria-hidden="true" />
      <header className="site-header">
        <a href="#top" className="wordmark" aria-label="Suraj Web, back to top">SURAJ.WEB</a>
        <nav className="desktop-nav" aria-label="Main navigation">{navigation.map(([label, id]) => <a key={id} href={`#${id}`} className={active === id ? "active" : ""}>{label}</a>)}</nav>
        <div className="header-actions"><ProjectButton />
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
            }}><SheetTitle className="wordmark">SURAJ.WEB</SheetTitle><SheetDescription>Design. Develop. Make an impression.</SheetDescription><nav aria-label="Mobile navigation">{navigation.map(([label,id]) => <a key={id} href={`#${id}`} onClick={(event) => { event.preventDefault(); mobileDestination.current = id; setMenuOpen(false); }}>{label}<ArrowUpRight size={22}/></a>)}</nav><a className="mobile-email" href={`mailto:${email}`}>Let’s make something great.</a></SheetContent>
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
        <div className="hero-links"><ProjectButton /><a className="text-link" href="#projects">View My Work <ArrowUpRight size={15}/></a></div>
      </div>
      <aside className="hero-promise" aria-label="Design, development and launch">
        <div className="promise-icons"><span><Monitor size={18}/></span><span><Code2 size={19}/></span><span><Rocket size={18}/></span><b>↗</b></div>
        <p>From your first idea<br/>to your next big launch.</p>
        <div className="promise-tags"><span>Custom Design</span><span>Built to Perform</span></div>
      </aside>
    </section>

    <div className="skills-marquee" aria-label="Web development, responsive design, creative solutions, AI automation"><div>{[0,1].map((n) => <span className="marquee-group" key={n} aria-hidden={n===1}>WEB DEVELOPMENT <b>✦</b> RESPONSIVE DESIGN <b>✦</b> CREATIVE SOLUTIONS <b>✦</b> AI AUTOMATION <b>✦</b></span>)}</div></div>

    <section id="about" className="about-section content-width">
      <div className="about-label"><SectionLabel>About Me</SectionLabel><span/></div>
      <div className="about-copy"><h2>Hey there, I’m Suraj Kirtaniya — a web developer with an eye for design and a focus on what works. I turn ideas into distinctive websites that feel effortless to use and help your business take its next step.</h2><div className="section-actions"><ProjectButton /><a href="#projects" className="text-link">View My Work <ArrowUpRight size={15}/></a></div></div>
    </section>
    <div className="technology-row content-width" aria-label="Technologies I work with"><span className="tech-react">◉ React</span><span className="tech-next">NEXT.js</span><span className="tech-firebase">ϟ Firebase</span><span className="tech-tailwind">≋ tailwindcss</span><span className="tech-vercel">▲ Vercel</span></div>

    <section id="projects" className="projects-section content-width" aria-labelledby="projects-heading">
      <div className="project-column">{card(projects[0])}{card(projects[2])}<p className="project-statement">I believe the smallest details<br/>make the biggest difference<span>.</span></p></div>
      <div className="project-column offset-column"><div className="projects-heading"><SectionLabel>Selected Concepts</SectionLabel><h2 id="projects-heading">Thoughtful design.<br/>Purposeful websites.</h2><p>A selection of independent website concepts.</p></div>{card(projects[1])}{card(projects[3])}</div>
    </section>

    <section id="services" className="services-section content-width">
      <div className="section-heading"><SectionLabel>What I Do</SectionLabel><h2>Good design.<br/>Real-world function.</h2></div>
      <div className="service-list">
        {[{n:"01",name:"Website Design",copy:"Distinctive layouts, considered typography, and a visual identity that feels like your business."},{n:"02",name:"Web Development",copy:"Responsive websites and landing pages, built to look right and work well on every screen."},{n:"03",name:"AI & Automation",copy:"Practical enquiry flows and connected tools that take repetitive work off your hands."}].map(s=><div className="service-row" key={s.n}><span>{s.n}</span><h3>{s.name}</h3><p>{s.copy}</p><ArrowUpRight/></div>)}
      </div>
    </section>

    <section id="process" className="process-section content-width"><SectionLabel>How We Work Together</SectionLabel><h2>A clear path from<br/>idea to launch.</h2><div className="process-grid">{[{n:"01",title:"Understand",text:"We start with your business, your audience, and what your website needs to achieve."},{n:"02",title:"Design",text:"I shape the layout and visual direction. We refine the details together."},{n:"03",title:"Build & Launch",text:"I build, check the experience across screens, and bring your website online."}].map(p=><article key={p.n}><span>{p.n} <ArrowRight size={18}/></span><h3>{p.title}</h3><p>{p.text}</p></article>)}</div></section>

    <section id="contact" className="contact-section"><div className="content-width"><SectionLabel>Let’s Make It Happen</SectionLabel><div className="contact-main"><h2>Have a project<br/>in <em>mind?</em></h2><a className="contact-arrow" href={`mailto:${email}?subject=Let's%20build%20a%20website`} aria-label="Email Suraj about your project"><ArrowUpRight/></a></div><div className="contact-bottom"><p>Tell me what you’re thinking.<br/>Let’s build something that feels like you.</p><a className="contact-email" href={`mailto:${email}`}>{email}<ArrowUpRight size={20}/></a></div></div></section>
    <footer className="site-footer content-width"><a href="#top" className="wordmark">SURAJ.WEB</a><p>© 2026 Suraj Kirtaniya</p><a href="#top">Back to top <ArrowDown size={15} className="rotate-180"/></a></footer>

    <Dialog open={!!selectedProject} onOpenChange={(open)=>{if(!open)setSelectedProject(null);}}>
      <DialogContent className="project-dialog">{selectedProject&&<><DialogHeader><SectionLabel>Independent Concept</SectionLabel><DialogTitle>{selectedProject.title}</DialogTitle><DialogDescription>{selectedProject.detail}</DialogDescription></DialogHeader><ProjectVisual project={selectedProject}/><ul>{selectedProject.scope.map(item=><li key={item}><Sparkles size={14}/>{item}</li>)}</ul><Button asChild className="orange-button"><a href={`mailto:${email}?subject=${encodeURIComponent(`A website like ${selectedProject.brand}`)}`}>Let’s discuss your website <span className="button-arrow"><ArrowUpRight size={16}/></span></a></Button></>}</DialogContent>
    </Dialog>
  </main>;
}

import type { Metadata } from "next";
import JsonLd from "@/components/seo/json-ld";
import { absoluteUrl, pageMetadata, PERSON_NAME } from "@/lib/seo";
import { ArrowLeft, ArrowUpRight, Gauge, MessageCircle, Smartphone, Sparkles } from "lucide-react";

export const metadata: Metadata = pageMetadata({
  title: "About Suraj Kirtaniya — Freelance Web Developer | SURAJ.WEB",
  description: "Learn about Suraj Kirtaniya, the independent web developer behind SURAJ.WEB, and his approach to website design, responsive development, and practical automation.",
  path: "/about",
});

const focus = [
  {
    icon: Sparkles,
    title: "Distinctive direction",
    copy: "The layout, typography, hierarchy and interaction are shaped around the business instead of copied from a generic template.",
  },
  {
    icon: Smartphone,
    title: "Mobile-first execution",
    copy: "The phone experience is treated as a primary surface, with responsive spacing, readable type and clear actions from the start.",
  },
  {
    icon: Gauge,
    title: "Practical performance",
    copy: "I keep the experience focused, avoid unnecessary visual weight and make implementation choices that are easier to maintain.",
  },
];

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-black text-[#f4e9e1]">
      <JsonLd
        data={{
          "@type": "ProfilePage",
          "@id": absoluteUrl("/about#profile"),
          url: absoluteUrl("/about"),
          name: "About Suraj Kirtaniya",
          mainEntity: {
            "@type": "Person",
            "@id": absoluteUrl("/#suraj-kirtaniya"),
            name: PERSON_NAME,
            jobTitle: "Freelance Web Developer & Website Designer",
            url: absoluteUrl("/about"),
          },
        }}
      />
      <header className="mx-auto max-w-7xl px-5 sm:px-8 py-6 flex items-center justify-between">
        <a href="/" className="font-['Antonio',sans-serif] text-3xl">SURAJ.WEB</a>
        <a href="/" className="inline-flex items-center gap-2 text-xs text-[#aa978b] hover:text-[#f47b38] transition-colors">
          <ArrowLeft size={14}/> Portfolio
        </a>
      </header>

      <section className="mx-auto max-w-7xl px-5 sm:px-8 pt-14 sm:pt-20 pb-20 sm:pb-28">
        <p className="text-xs uppercase tracking-[.2em] text-[#f47b38]">About</p>
        <div className="grid lg:grid-cols-[1.2fr_.8fr] gap-10 lg:gap-16 mt-5">
          <h1 className="font-['Antonio',sans-serif] text-[19vw] sm:text-8xl lg:text-9xl font-thin leading-[.9] tracking-[-.04em]">
            Independent developer. Design-first thinking.
          </h1>
          <div className="self-end">
            <p className="text-base leading-8 text-[#b09d91]">
              I’m Suraj Kirtaniya, the developer behind SURAJ.WEB. I build distinctive websites with strong visual direction, responsive execution and practical conversion paths for businesses.
            </p>
            <p className="text-sm leading-7 text-[#88766c] mt-5">
              The goal is not to add features for the sake of it. The goal is to make the website feel considered, work smoothly on real devices and make the next step obvious for the right visitor.
            </p>
            <a href="/start-project" className="mt-7 inline-flex items-center gap-2 rounded-full bg-gradient-to-br from-[#f89952] to-[#ec7131] px-6 py-3 text-sm text-white shadow-[0_8px_28px_rgba(236,113,49,.18)]">
              Start a Project <ArrowUpRight size={15}/>
            </a>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 sm:px-8 pb-20 sm:pb-28">
        <div className="grid lg:grid-cols-[.72fr_1.28fr] gap-9 lg:gap-16 items-start">
          <div>
            <p className="text-xs uppercase tracking-[.2em] text-[#f47b38]">What I focus on</p>
            <h2 className="font-['Antonio',sans-serif] text-5xl sm:text-6xl font-thin leading-[.95] mt-4">
              Design choices that have a job to do.
            </h2>
          </div>
          <div className="grid sm:grid-cols-3 gap-4">
            {focus.map(({icon: Icon,title,copy}) => (
              <article key={title} className="rounded-[28px] bg-[radial-gradient(circle_at_90%_100%,rgba(244,123,56,.24),transparent_48%),linear-gradient(145deg,#0d0d0d,#030303_70%,#000)] p-5 sm:p-6">
                <Icon size={19} className="text-[#f47b38]"/>
                <h3 className="font-['Antonio',sans-serif] text-3xl font-thin mt-8">{title}</h3>
                <p className="text-sm leading-7 text-[#9f8d82] mt-3">{copy}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 sm:px-8 pb-24 sm:pb-32">
        <div className="rounded-[34px] bg-[radial-gradient(circle_at_88%_78%,rgba(244,123,56,.30),transparent_46%),linear-gradient(145deg,#0b0b0b,#020202_62%,#000)] px-6 py-8 sm:px-10 sm:py-11">
          <p className="text-xs uppercase tracking-[.18em] text-[#f47b38]">How I work</p>
          <div className="grid md:grid-cols-3 gap-8 mt-8">
            {[
              ["01", "Understand", "The business, audience, content, constraints and the action the site needs to drive."],
              ["02", "Shape the direction", "A clear visual system and responsive layout before unnecessary complexity is introduced."],
              ["03", "Build & launch", "Implementation, responsive checks, deployment and a practical handoff for the finished website."],
            ].map(([n,title,copy]) => (
              <div key={n}>
                <span className="text-xs text-[#f47b38]">{n}</span>
                <h3 className="font-['Antonio',sans-serif] text-3xl font-thin mt-3">{title}</h3>
                <p className="text-sm leading-7 text-[#9f8d82] mt-3">{copy}</p>
              </div>
            ))}
          </div>
          <div className="mt-10 flex flex-wrap items-center justify-between gap-5">
            <div className="flex items-center gap-2 text-sm text-[#c7b7ad]"><MessageCircle size={17} className="text-[#f47b38]"/> Direct collaboration from first idea to launch.</div>
            <a href="/work" className="inline-flex items-center gap-2 text-sm text-[#f6eee8] hover:text-[#f47b38] transition-colors">See selected work <ArrowUpRight size={15}/></a>
          </div>
        </div>
      </section>
    </main>
  );
}

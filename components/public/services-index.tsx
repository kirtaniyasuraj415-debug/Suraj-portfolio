"use client";

import { ArrowLeft, ArrowUpRight, Check, Gauge, MessageCircle, Smartphone, Sparkles } from "lucide-react";
import { usePublicServices } from "@/lib/use-public-cms";

const included = [
  { icon: Smartphone, title: "Responsive by default", copy: "Phone, tablet and desktop are considered throughout the build." },
  { icon: Sparkles, title: "Custom visual direction", copy: "Typography, hierarchy and layout are shaped around the project." },
  { icon: Gauge, title: "Launch-minded build", copy: "The finished experience is prepared for real hosting and practical use." },
  { icon: MessageCircle, title: "Direct communication", copy: "You work with the developer doing the actual design and implementation." },
];

export default function ServicesIndex() {
  const { services } = usePublicServices();
  return (
    <main className="min-h-screen bg-black text-[#f4e9e1]">
      <header className="mx-auto max-w-7xl px-5 sm:px-8 py-6 flex items-center justify-between">
        <a href="/" className="font-['Antonio',sans-serif] text-3xl">SURAJ.WEB</a>
        <a href="/" className="inline-flex items-center gap-2 text-xs text-[#aa978b] hover:text-[#f47b38] transition-colors"><ArrowLeft size={14}/> Portfolio</a>
      </header>

      <section className="mx-auto max-w-7xl px-5 sm:px-8 pt-14 sm:pt-20 pb-20">
        <p className="text-xs uppercase tracking-[.2em] text-[#f47b38]">Services</p>
        <h1 className="font-['Antonio',sans-serif] text-[19vw] sm:text-8xl lg:text-9xl font-thin leading-[.9] tracking-[-.04em] mt-5 max-w-4xl">
          Design, development, and practical automation.
        </h1>
        <p className="mt-6 max-w-xl text-sm sm:text-base leading-7 text-[#9f8d82]">
          The service mix stays focused: a strong visual direction, a responsive build and useful integrations where they genuinely improve the project.
        </p>

        <div className="mt-14">
          {services.map((service,index)=>(
            <article key={service.docId || service.title} className="grid sm:grid-cols-[70px_1fr_1.3fr_auto] gap-4 sm:gap-6 items-center py-8">
              <span className="text-[10px] text-[#74635a]">{String(index+1).padStart(2,"0")}</span>
              <h2 className="font-['Antonio',sans-serif] text-3xl sm:text-4xl">{service.title}</h2>
              <p className="text-sm leading-6 text-[#a28f84]">{service.description}</p>
              <ArrowUpRight size={18} className="text-[#f47b38]"/>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 sm:px-8 pb-20 sm:pb-28">
        <div className="grid lg:grid-cols-[.75fr_1.25fr] gap-9 lg:gap-16">
          <div>
            <p className="text-xs uppercase tracking-[.2em] text-[#f47b38]">Included in the work</p>
            <h2 className="font-['Antonio',sans-serif] text-5xl sm:text-6xl font-thin leading-[.95] mt-4">The essentials are not add-ons.</h2>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            {included.map(({icon:Icon,title,copy}) => (
              <article key={title} className="rounded-[28px] bg-[radial-gradient(circle_at_92%_100%,rgba(244,123,56,.22),transparent_50%),linear-gradient(145deg,#0d0d0d,#030303_70%,#000)] p-6">
                <Icon size={18} className="text-[#f47b38]"/>
                <h3 className="font-['Antonio',sans-serif] text-3xl font-thin mt-7">{title}</h3>
                <p className="text-sm leading-7 text-[#99877c] mt-3">{copy}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 sm:px-8 pb-24 sm:pb-32">
        <div className="rounded-[34px] bg-[radial-gradient(circle_at_88%_68%,rgba(244,123,56,.32),transparent_48%),linear-gradient(145deg,#0b0b0b,#020202_64%,#000)] px-6 py-8 sm:px-10 sm:py-11">
          <p className="text-xs uppercase tracking-[.18em] text-[#f47b38]">A simple engagement</p>
          <div className="grid md:grid-cols-3 gap-7 mt-8">
            {[
              ["Share the brief", "Tell me what the business needs and what the current situation looks like."],
              ["Agree the direction", "We align on scope, visual direction, content and the practical delivery plan."],
              ["Build & launch", "The site is built, checked across screens and prepared for the final deployment."],
            ].map(([title,copy]) => (
              <div key={title}>
                <Check size={18} className="text-[#f47b38]"/>
                <h3 className="font-['Antonio',sans-serif] text-3xl font-thin mt-4">{title}</h3>
                <p className="text-sm leading-7 text-[#99877c] mt-3">{copy}</p>
              </div>
            ))}
          </div>
          <div className="mt-10">
            <a href="/start-project" className="inline-flex items-center gap-2 rounded-full bg-gradient-to-br from-[#f89952] to-[#ec7131] px-6 py-3 text-sm text-white shadow-[0_8px_28px_rgba(236,113,49,.18)]">
              Start a Project <ArrowUpRight size={15}/>
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}

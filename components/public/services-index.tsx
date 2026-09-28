"use client";

import { ArrowLeft, ArrowUpRight } from "lucide-react";
import { usePublicServices } from "@/lib/use-public-cms";

export default function ServicesIndex() {
  const { services } = usePublicServices();
  return (
    <main className="min-h-screen bg-[#090402] text-[#f4e9e1]">
      <header className="mx-auto max-w-7xl px-5 sm:px-8 py-6 flex items-center justify-between border-b border-white/10">
        <a href="/" className="font-['Antonio',sans-serif] text-3xl">SURAJ.WEB</a>
        <a href="/" className="inline-flex items-center gap-2 text-xs text-[#aa978b]"><ArrowLeft size={14}/> Portfolio</a>
      </header>
      <section className="mx-auto max-w-7xl px-5 sm:px-8 pt-14 sm:pt-20 pb-24">
        <p className="text-xs uppercase tracking-[.2em] text-[#f47b38]">Services</p>
        <h1 className="font-['Antonio',sans-serif] text-[19vw] sm:text-8xl lg:text-9xl font-thin leading-[.9] tracking-[-.04em] mt-5 max-w-4xl">Design, development, and practical automation.</h1>
        <div className="mt-14 border-t border-white/10">
          {services.map((service,index)=>(
            <article key={service.docId || service.title} className="grid sm:grid-cols-[70px_1fr_1.3fr_auto] gap-4 sm:gap-6 items-center py-7 border-b border-white/10">
              <span className="text-[10px] text-[#74635a]">{String(index+1).padStart(2,"0")}</span>
              <h2 className="font-['Antonio',sans-serif] text-3xl sm:text-4xl">{service.title}</h2>
              <p className="text-sm leading-6 text-[#a28f84]">{service.description}</p>
              <ArrowUpRight size={18} className="text-[#f47b38]"/>
            </article>
          ))}
        </div>
        <div className="mt-14">
          <a href="/start-project" className="inline-flex items-center gap-2 rounded-full bg-[#f47b38] px-6 py-3 text-sm text-white">Start a Project <ArrowUpRight size={15}/></a>
        </div>
      </section>
    </main>
  );
}

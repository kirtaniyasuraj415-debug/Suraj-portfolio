import type { Metadata } from "next";
import { ArrowLeft, ArrowUpRight } from "lucide-react";

export const metadata: Metadata = {
  title: "About — Suraj Kirtaniya",
  description: "About Suraj Kirtaniya and the approach behind SURAJ.WEB.",
};

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-[#090402] text-[#f4e9e1]">
      <header className="mx-auto max-w-7xl px-5 sm:px-8 py-6 flex items-center justify-between border-b border-white/10">
        <a href="/" className="font-['Antonio',sans-serif] text-3xl">SURAJ.WEB</a>
        <a href="/" className="inline-flex items-center gap-2 text-xs text-[#aa978b]"><ArrowLeft size={14}/> Portfolio</a>
      </header>
      <section className="mx-auto max-w-7xl px-5 sm:px-8 pt-14 sm:pt-20 pb-24">
        <p className="text-xs uppercase tracking-[.2em] text-[#f47b38]">About</p>
        <div className="grid lg:grid-cols-[1.2fr_.8fr] gap-10 lg:gap-16 mt-5">
          <h1 className="font-['Antonio',sans-serif] text-[19vw] sm:text-8xl lg:text-9xl font-thin leading-[.9] tracking-[-.04em]">Independent developer. Design-first thinking.</h1>
          <div className="self-end">
            <p className="text-base leading-8 text-[#b09d91]">I’m Suraj Kirtaniya, the developer behind SURAJ.WEB. I build distinctive websites with a strong visual direction, responsive execution, and practical conversion paths for businesses.</p>
            <p className="text-sm leading-7 text-[#88766c] mt-5">The goal is not to add features for the sake of it. The goal is to make the website feel considered, work smoothly on real devices, and make it easy for the right visitor to take the next step.</p>
            <a href="/start-project" className="mt-7 inline-flex items-center gap-2 rounded-full bg-[#f47b38] px-6 py-3 text-sm text-white">Start a Project <ArrowUpRight size={15}/></a>
          </div>
        </div>
      </section>
    </main>
  );
}

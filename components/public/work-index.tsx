"use client";

import { ArrowLeft, ArrowUpRight } from "lucide-react";
import { usePublicProjects } from "@/lib/use-public-cms";

export default function WorkIndex() {
  const { projects } = usePublicProjects();

  return (
    <main className="work-index-page min-h-screen bg-[#000000] text-[#f4e9e1]">
      <header className="work-index-header mx-auto max-w-7xl px-5 sm:px-8 py-6 flex items-center justify-between border-b border-white/10">
        <a href="/" className="font-['Antonio',sans-serif] text-3xl">SURAJ.WEB</a>
        <a href="/" className="inline-flex items-center gap-2 text-xs text-[#aa978b]"><ArrowLeft size={14}/> Portfolio</a>
      </header>
      <section className="mx-auto max-w-7xl px-5 sm:px-8 pt-14 sm:pt-20 pb-24">
        <p className="text-xs uppercase tracking-[.2em] text-[#f47b38]">Selected Work</p>
        <h1 className="font-['Antonio',sans-serif] text-[18vw] sm:text-8xl lg:text-9xl font-thin leading-[.9] tracking-[-.04em] mt-5 max-w-5xl" style={{ transform: "translateY(-24px)" }}>
          Case studies & website concepts.
        </h1>
        <p className="mt-10 sm:mt-12 max-w-xl text-sm sm:text-base leading-7 text-[#a59286]">
          Explore the thinking, visual direction, features and live previews behind each project.
        </p>

        <div className="grid md:grid-cols-2 gap-5 sm:gap-7 mt-14">
          {projects.map((project, index) => (
            <article key={project.docId || project.slug} className="work-index-card suraj-master-card overflow-hidden rounded-[24px] border border-white/10 bg-[#120805]">
              <a href={`/work/${project.slug}`} className="group block">
                <div className="work-index-image aspect-[16/10] overflow-hidden bg-[#160b07]">
                  <img src={project.imageUrl} alt={project.title} className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.035]" />
                </div>
                <div className="work-index-card-copy p-5 sm:p-6">
                  <div className="flex justify-between gap-4">
                    <div>
                      <span className="text-[10px] uppercase tracking-[.14em] text-[#7f6c61]">{String(index + 1).padStart(2,"0")} · {project.category}</span>
                      <h2 className="font-['Antonio',sans-serif] text-3xl sm:text-4xl mt-2">{project.title}</h2>
                    </div>
                    <ArrowUpRight className="text-[#f47b38] shrink-0"/>
                  </div>
                  <p className="text-sm leading-6 text-[#a39186] mt-3">{project.description}</p>
                </div>
              </a>
              <div className="work-index-actions px-5 sm:px-6 pb-5 sm:pb-6 flex gap-3">
                <a href={`/work/${project.slug}`} className="work-index-primary rounded-full bg-[#f47b38] px-4 py-2 text-xs text-white">View Case Study</a>
                {project.liveUrl && <a href={project.liveUrl} target="_blank" rel="noopener noreferrer" className="work-index-secondary rounded-full border border-white/10 px-4 py-2 text-xs text-[#d6c6bb]">Live Preview ↗</a>}
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}

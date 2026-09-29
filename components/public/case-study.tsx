"use client";

import { ArrowLeft, ArrowUpRight } from "lucide-react";
import { usePublicProjects } from "@/lib/use-public-cms";

export default function CaseStudy({ slug }: { slug: string }) {
  const { projects, loaded } = usePublicProjects();
  const project = projects.find((item) => item.slug === slug);

  if (!project && loaded) {
    return (
      <main className="min-h-screen bg-[#090402] text-[#f4e9e1] grid place-items-center px-5">
        <div className="text-center">
          <p className="text-xs uppercase tracking-[.2em] text-[#f47b38]">Project not found</p>
          <a href="/work" className="mt-5 inline-flex items-center gap-2 text-sm"><ArrowLeft size={15}/> Back to work</a>
        </div>
      </main>
    );
  }

  if (!project) {
    return (
      <main className="case-study-page min-h-screen bg-[#000000] text-[#f4e9e1]">
        <header className="case-study-header mx-auto max-w-7xl px-5 sm:px-8 py-6 flex items-center justify-between">
          <a href="/" className="font-['Antonio',sans-serif] text-3xl">SURAJ.WEB</a>
          <a href="/work" className="inline-flex items-center gap-2 text-xs text-[#aa978b]"><ArrowLeft size={14}/> All work</a>
        </header>
        <section className="mx-auto max-w-7xl px-5 sm:px-8 pt-16 pb-24">
          <p className="text-xs uppercase tracking-[.2em] text-[#f47b38]">Loading project</p>
          <div className="mt-6 h-20 sm:h-28 max-w-2xl rounded-[24px] bg-[linear-gradient(110deg,#080808_8%,#121212_18%,#080808_33%)] bg-[length:200%_100%] animate-pulse" />
          <div className="mt-10 aspect-[16/9] rounded-[28px] bg-[linear-gradient(110deg,#050505_8%,#101010_18%,#050505_33%)] bg-[length:200%_100%] animate-pulse" />
        </section>
      </main>
    );
  }

  return (
    <main className="case-study-page min-h-screen bg-[#000000] text-[#f4e9e1]">
      <header className="case-study-header mx-auto max-w-7xl px-5 sm:px-8 py-6 flex items-center justify-between border-b border-white/10">
        <a href="/" className="font-['Antonio',sans-serif] text-3xl">SURAJ.WEB</a>
        <a href="/work" className="inline-flex items-center gap-2 text-xs text-[#aa978b]"><ArrowLeft size={14}/> All work</a>
      </header>

      <article className="mx-auto max-w-7xl px-5 sm:px-8 pt-12 sm:pt-20 pb-24">
        <div className="grid lg:grid-cols-[1fr_.7fr] gap-8 lg:gap-16 items-end">
          <div>
            <p className="text-xs uppercase tracking-[.2em] text-[#f47b38]">{project.category}</p>
            <h1 className="font-['Antonio',sans-serif] text-[20vw] sm:text-8xl lg:text-9xl font-thin leading-[.88] tracking-[-.04em] mt-4">{project.title}</h1>
          </div>
          <div>
            <p className="text-sm sm:text-base leading-7 text-[#a9968a]">{project.detail || project.description}</p>
            {project.liveUrl && <a href={project.liveUrl} target="_blank" rel="noopener noreferrer" className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#f47b38] px-5 py-3 text-sm text-white">Open live preview <ArrowUpRight size={16}/></a>}
          </div>
        </div>

        <div className="case-study-preview mt-12 sm:mt-16 overflow-hidden rounded-[24px] border border-white/10 bg-[#130905]">
          <img src={project.imageUrl} alt={project.title} className="w-full h-auto block"/>
        </div>

        <div className="grid lg:grid-cols-[.65fr_1.35fr] gap-8 lg:gap-16 mt-14 sm:mt-20 pt-10">
          <div>
            <p className="text-xs uppercase tracking-[.16em] text-[#76665d]">Project scope</p>
            <p className="font-['Antonio',sans-serif] text-4xl font-thin mt-3">{project.brand || project.title}</p>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            {(project.scope || []).map((item, index) => (
              <div key={item} className="case-study-scope-card suraj-master-card rounded-2xl bg-[#120805] p-5">
                <span className="text-[10px] text-[#f47b38]">{String(index + 1).padStart(2,"0")}</span>
                <p className="mt-6 text-sm text-[#c8b8ad]">{item}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-5 mt-16">
          <section className="rounded-[28px] bg-[radial-gradient(circle_at_90%_100%,rgba(244,123,56,.22),transparent_48%),linear-gradient(145deg,#0c0c0c,#020202_70%,#000)] p-6 sm:p-8">
            <p className="text-xs uppercase tracking-[.16em] text-[#f47b38]">Direction</p>
            <h2 className="font-['Antonio',sans-serif] text-4xl sm:text-5xl font-thin mt-4">Built around the work, not decoration.</h2>
            <p className="text-sm leading-7 text-[#a9968a] mt-5">{project.detail || project.description}</p>
          </section>
          <section className="rounded-[28px] bg-[radial-gradient(circle_at_92%_100%,rgba(244,123,56,.16),transparent_50%),linear-gradient(145deg,#090909,#010101_72%,#000)] p-6 sm:p-8">
            <p className="text-xs uppercase tracking-[.16em] text-[#f47b38]">What the experience prioritises</p>
            <div className="mt-6 grid gap-5">
              {(project.scope || []).slice(0,3).map((item,index)=>(
                <div key={item} className="grid grid-cols-[28px_1fr] gap-3 items-start">
                  <span className="text-xs text-[#f47b38]">{String(index+1).padStart(2,"0")}</span>
                  <p className="text-sm leading-7 text-[#c8b8ad]">{item}</p>
                </div>
              ))}
            </div>
          </section>
        </div>

        <div className="case-study-cta suraj-master-card mt-16 rounded-[26px] border border-[#f47b38]/20 bg-[radial-gradient(circle_at_90%_10%,rgba(244,123,56,.12),transparent_38%),#120805] p-6 sm:p-10 flex flex-wrap items-center justify-between gap-5">
          <div>
            <p className="text-xs uppercase tracking-[.16em] text-[#f47b38]">Have something similar in mind?</p>
            <h2 className="font-['Antonio',sans-serif] text-4xl sm:text-5xl mt-2">Let’s build it properly.</h2>
          </div>
          <a href="/start-project" className="rounded-full bg-[#f47b38] px-6 py-3 text-sm text-white">Start a Project ↗</a>
        </div>
      </article>
    </main>
  );
}

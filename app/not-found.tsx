import { ArrowLeft, ArrowUpRight } from "lucide-react";

export default function NotFound() {
  return (
    <main className="min-h-screen bg-black text-[#f4e9e1] grid place-items-center px-5">
      <section className="w-full max-w-3xl rounded-[34px] bg-[radial-gradient(circle_at_88%_78%,rgba(244,123,56,.28),transparent_48%),linear-gradient(145deg,#0b0b0b,#020202_64%,#000)] px-6 py-10 sm:px-10 sm:py-14">
        <p className="text-xs uppercase tracking-[.2em] text-[#f47b38]">404 · Page not found</p>
        <h1 className="font-['Antonio',sans-serif] text-6xl sm:text-8xl font-thin leading-[.9] mt-5">That page is not here.</h1>
        <p className="text-sm sm:text-base leading-7 text-[#a99585] mt-6 max-w-xl">
          The URL may have changed or the page may no longer exist. Use the portfolio or selected work pages to continue.
        </p>
        <div className="mt-8 flex flex-wrap gap-5">
          <a href="/" className="inline-flex items-center gap-2 text-sm text-[#f6eee8]"><ArrowLeft size={15}/> Portfolio</a>
          <a href="/work" className="inline-flex items-center gap-2 rounded-full bg-gradient-to-br from-[#f89952] to-[#ec7131] px-6 py-3 text-sm text-white">
            View Work <ArrowUpRight size={15}/>
          </a>
        </div>
      </section>
    </main>
  );
}

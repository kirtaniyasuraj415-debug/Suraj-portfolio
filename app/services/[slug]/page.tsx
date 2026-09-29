import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowUpRight, Check } from "lucide-react";
import JsonLd from "@/components/seo/json-ld";
import { SERVICE_PAGES, getServicePage } from "@/lib/service-pages";
import { absoluteUrl, pageMetadata, PERSON_NAME } from "@/lib/seo";

export function generateStaticParams() {
  return SERVICE_PAGES.map((service) => ({ slug: service.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const service = getServicePage(slug);

  if (!service) {
    return pageMetadata({
      title: "Service Not Found | SURAJ.WEB",
      description: "The requested service page could not be found.",
      path: `/services/${slug}`,
      noIndex: true,
    });
  }

  return pageMetadata({
    title: service.seoTitle,
    description: service.description,
    path: `/services/${service.slug}`,
  });
}

export default async function ServiceDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const service = getServicePage(slug);
  if (!service) notFound();

  const url = absoluteUrl(`/services/${service.slug}`);
  const structuredData = [
    {
      "@type": "Service",
      "@id": `${url}#service`,
      name: service.name,
      serviceType: service.name,
      url,
      description: service.description,
      provider: {
        "@type": "Person",
        "@id": absoluteUrl("/#suraj-kirtaniya"),
        name: PERSON_NAME,
        url: absoluteUrl("/about"),
      },
    },
    {
      "@type": "BreadcrumbList",
      "@id": `${url}#breadcrumbs`,
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: absoluteUrl("/") },
        { "@type": "ListItem", position: 2, name: "Services", item: absoluteUrl("/services") },
        { "@type": "ListItem", position: 3, name: service.name, item: url },
      ],
    },
  ];

  return (
    <main className="min-h-screen bg-black text-[#f4e9e1]">
      <JsonLd data={structuredData} />
      <header className="mx-auto max-w-7xl px-5 sm:px-8 py-6 flex items-center justify-between">
        <a href="/" className="font-['Antonio',sans-serif] text-3xl">SURAJ.WEB</a>
        <a href="/services" className="inline-flex items-center gap-2 text-xs text-[#aa978b] hover:text-[#f47b38] transition-colors">
          <ArrowLeft size={14}/> All services
        </a>
      </header>

      <section className="mx-auto max-w-7xl px-5 sm:px-8 pt-14 sm:pt-20 pb-20 sm:pb-28">
        <p className="text-xs uppercase tracking-[.2em] text-[#f47b38]">{service.name}</p>
        <div className="grid lg:grid-cols-[1.15fr_.85fr] gap-10 lg:gap-16 items-end mt-5">
          <h1 className="font-['Antonio',sans-serif] text-[17vw] sm:text-8xl lg:text-9xl font-thin leading-[.9] tracking-[-.045em]">
            {service.headline}
          </h1>
          <div>
            <p className="text-base leading-8 text-[#b09d91]">{service.intro}</p>
            <a href="/start-project" className="mt-7 inline-flex items-center gap-2 rounded-full bg-gradient-to-br from-[#f89952] to-[#ec7131] px-6 py-3 text-sm text-white shadow-[0_8px_28px_rgba(236,113,49,.18)]">
              Discuss this service <ArrowUpRight size={15}/>
            </a>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 sm:px-8 pb-20 sm:pb-28">
        <div className="grid lg:grid-cols-[.72fr_1.28fr] gap-9 lg:gap-16">
          <div>
            <p className="text-xs uppercase tracking-[.2em] text-[#f47b38]">What it covers</p>
            <h2 className="font-['Antonio',sans-serif] text-5xl sm:text-6xl font-thin leading-[.95] mt-4">
              The useful parts, without filler.
            </h2>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            {service.covers.map((item) => (
              <article key={item} className="rounded-[28px] bg-[radial-gradient(circle_at_92%_100%,rgba(244,123,56,.22),transparent_50%),linear-gradient(145deg,#0d0d0d,#030303_70%,#000)] p-6">
                <Check size={17} className="text-[#f47b38]"/>
                <p className="text-sm leading-7 text-[#c4b5ac] mt-7">{item}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 sm:px-8 pb-20 sm:pb-28">
        <p className="text-xs uppercase tracking-[.2em] text-[#f47b38]">How I approach it</p>
        <div className="grid md:grid-cols-3 gap-7 mt-8">
          {service.process.map((step, index) => (
            <article key={step.title}>
              <span className="text-xs text-[#f47b38]">{String(index + 1).padStart(2, "0")}</span>
              <h2 className="font-['Antonio',sans-serif] text-4xl font-thin mt-4">{step.title}</h2>
              <p className="text-sm leading-7 text-[#99877c] mt-4">{step.copy}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 sm:px-8 pb-24 sm:pb-32">
        <div className="rounded-[34px] bg-[radial-gradient(circle_at_88%_68%,rgba(244,123,56,.32),transparent_48%),linear-gradient(145deg,#0b0b0b,#020202_64%,#000)] px-6 py-8 sm:px-10 sm:py-11">
          <p className="text-xs uppercase tracking-[.18em] text-[#f47b38]">Good fit if</p>
          <div className="grid md:grid-cols-3 gap-7 mt-8">
            {service.fit.map((item) => (
              <div key={item}>
                <Check size={17} className="text-[#f47b38]"/>
                <p className="text-sm leading-7 text-[#c4b5ac] mt-4">{item}</p>
              </div>
            ))}
          </div>
          <div className="mt-10 flex flex-wrap items-center gap-6">
            <a href="/work" className="inline-flex items-center gap-2 text-sm text-[#f6eee8] hover:text-[#f47b38] transition-colors">
              See relevant work <ArrowUpRight size={15}/>
            </a>
            <a href="/start-project" className="inline-flex items-center gap-2 rounded-full bg-gradient-to-br from-[#f89952] to-[#ec7131] px-6 py-3 text-sm text-white">
              Start a Project <ArrowUpRight size={15}/>
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}

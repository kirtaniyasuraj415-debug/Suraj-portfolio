"use client";

import Link from "next/link";
import {
  ArrowLeft,
  ArrowUpRight,
  Clock,
  MessageSquare,
  Sparkles,
} from "lucide-react";
import EnquiryForm from "@/components/enquiry-form";

const WHATSAPP_DIRECT_URL = `https://wa.me/917810963278?text=${encodeURIComponent(
  "Hi Suraj, I am looking to start a new website/project and would like to discuss details."
)}`;

export default function ProjectEnquiryPage() {
  return (
    <div className="min-h-screen bg-[#100702] text-[#f6f0e9] selection:bg-[#ffab74] selection:text-[#140a04] flex flex-col">
      {/* Header */}
      <header className="site-header border-b border-white/[0.08]">
        <Link href="/" className="wordmark" aria-label="Suraj Web homepage">
          SURAJ.WEB
        </Link>
        <Link
          href="/"
          className="text-link inline-flex items-center gap-2 text-sm text-[#e4d5cb] hover:text-[#ff985c] transition-colors"
        >
          <ArrowLeft size={16} />
          <span>Back to Portfolio</span>
        </Link>
      </header>

      {/* Main Content */}
      <main className="flex-1 content-width py-10 md:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-start max-w-6xl mx-auto">
          {/* LEFT COLUMN: Brief Context & WhatsApp CTA */}
          <div className="lg:col-span-5 lg:sticky lg:top-8 space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/[0.05] border border-white/[0.1] text-xs text-[#d8c9bd]">
              <Clock size={13} className="text-[#f87b38]" />
              <span>Project Enquiry • Quick 1-minute form</span>
            </div>

            <div>
              <div className="section-label mb-2">
                <span aria-hidden="true">✦</span> START A PROJECT
              </div>
              <h1 className="font-['Antonio',sans-serif] text-4xl sm:text-5xl lg:text-[56px] font-thin leading-[1.08] tracking-[-1.5px] text-[#f6f0e9]">
                Let’s build something extraordinary.
              </h1>
            </div>

            <p className="text-base text-[#b5a597] leading-relaxed">
              Tell me about your business and website requirements. I review every enquiry personally
              and reply via WhatsApp within 2–4 hours.
            </p>

            {/* Benefit Points */}
            <div className="space-y-4 pt-4 border-t border-white/[0.08]">
              <div className="flex items-start gap-3.5">
                <div className="w-8 h-8 rounded-full bg-[#2c1c14] text-[#f87b38] flex items-center justify-center shrink-0 border border-white/[0.08]">
                  <Sparkles size={16} />
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-[#f6f0e9]">Direct Developer Collaboration</h2>
                  <p className="text-xs text-[#a99585] mt-0.5">
                    No middlemen or sales reps. You work directly with me from concept to launch.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3.5">
                <div className="w-8 h-8 rounded-full bg-[#2c1c14] text-[#f87b38] flex items-center justify-center shrink-0 border border-white/[0.08]">
                  <MessageSquare size={16} />
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-[#f6f0e9]">Instant Telegram Notification</h2>
                  <p className="text-xs text-[#a99585] mt-0.5">
                    Your enquiry arrives directly on my personal Telegram bot the second you hit send.
                  </p>
                </div>
              </div>
            </div>

            {/* Direct WhatsApp Box */}
            <div className="p-4 rounded-2xl bg-[#180e08] border border-white/[0.1] space-y-2">
              <p className="text-xs text-[#d8c9bd] font-medium">Prefer a fast direct chat?</p>
              <a
                href={WHATSAPP_DIRECT_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#f87b38] hover:text-[#ff985c] transition-colors"
              >
                Chat on WhatsApp (+91 7810963278) <ArrowUpRight size={13} />
              </a>
            </div>
          </div>

          {/* RIGHT COLUMN: Streamlined, Clean Form */}
          <div className="lg:col-span-7">
            <EnquiryForm />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="site-footer content-width border-t border-white/[0.08] mt-16">
        <Link href="/" className="wordmark">
          SURAJ.WEB
        </Link>
        <p>© 2026 Suraj Kirtaniya</p>
        <Link href="/" className="text-xs text-[#a99585] hover:text-[#ff985c] transition-colors">
          Back to Portfolio
        </Link>
      </footer>
    </div>
  );
}

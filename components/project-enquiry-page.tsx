"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getClientAnalytics } from "@/lib/firebase";
import {
  ArrowLeft,
  ArrowUpRight,
  CheckCircle2,
  AlertCircle,
  MessageSquare,
  Clock,
  Sparkles,
  ShieldCheck,
  PhoneCall,
  RefreshCw,
  Check,
} from "lucide-react";

const BUSINESS_TYPES = [
  "Restaurant / Cafe",
  "Hotel / Hospitality",
  "Real Estate",
  "Photography / Studio",
  "Clinic / Healthcare",
  "Salon / Beauty",
  "E-commerce",
  "Personal Brand",
  "Agency / Company",
  "Local Business",
  "Other",
];

const PROJECT_TYPES = [
  "New Business Website",
  "Website Redesign",
  "Landing Page",
  "Portfolio Website",
  "E-commerce Website",
  "AI / Automation",
  "Website + Automation",
  "Not Sure Yet",
  "Other",
];

const BUDGET_RANGES = [
  "Under ₹10,000",
  "₹10,000 – ₹25,000",
  "₹25,000 – ₹50,000",
  "₹50,000 – ₹1,00,000",
  "₹1,00,000+",
  "Not Sure Yet",
];

const TIMELINES = [
  "As soon as possible",
  "Within 1–2 weeks",
  "Within 1 month",
  "Within 1–3 months",
  "Flexible / Not Sure",
];

const CONTACT_TIMES: {
  id: "morning" | "afternoon" | "evening" | "anytime";
  label: string;
  sublabel: string;
}[] = [
  { id: "morning", label: "Morning", sublabel: "9 AM – 12 PM" },
  { id: "afternoon", label: "Afternoon", sublabel: "12 PM – 5 PM" },
  { id: "evening", label: "Evening", sublabel: "5 PM – 9 PM" },
  { id: "anytime", label: "Anytime", sublabel: "Flexible hours" },
];

const CONTACT_METHODS: {
  id: "whatsapp" | "phone";
  label: string;
  icon: typeof MessageSquare;
}[] = [
  { id: "whatsapp", label: "WhatsApp", icon: MessageSquare },
  { id: "phone", label: "Phone Call", icon: PhoneCall },
];

interface FormData {
  name: string;
  businessName: string;
  phone: string;
  preferredContactMethod: "whatsapp" | "phone";
  businessType: string;
  projectType: string;
  currentWebsite: string;
  budget: string;
  timeline: string;
  projectGoal: string;
  reference: string;
  preferredContactTime: "morning" | "afternoon" | "evening" | "anytime" | "";
}

const initialFormData: FormData = {
  name: "",
  businessName: "",
  phone: "",
  preferredContactMethod: "whatsapp",
  businessType: "Local Business",
  projectType: "New Business Website",
  currentWebsite: "",
  budget: "₹25,000 – ₹50,000",
  timeline: "Within 1–2 weeks",
  projectGoal: "",
  reference: "",
  preferredContactTime: "",
};

const WHATSAPP_DIRECT_URL = `https://wa.me/917810963278?text=${encodeURIComponent(
  "Hi Suraj, I came across your portfolio and would like to discuss a website/project."
)}`;

const WHATSAPP_POST_SUBMIT_URL = `https://wa.me/917810963278?text=${encodeURIComponent(
  "Hi Suraj, I just submitted a project enquiry through your portfolio."
)}`;

export default function ProjectEnquiryPage() {
  const router = useRouter();
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [submitting, setSubmitting] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [countdown, setCountdown] = useState(4);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const formRef = useRef<HTMLFormElement | null>(null);

  // Auto redirect countdown when success modal is shown
  useEffect(() => {
    if (!showSuccessModal) return;

    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          router.push("/");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [showSuccessModal, router]);

  // Log start_project_view lightweight non-PII conversion event on page mount
  useEffect(() => {
    getClientAnalytics().then((analytics) => {
      if (analytics) {
        import("firebase/analytics").then(({ logEvent }) => {
          logEvent(analytics, "start_project_view", {
            page_path: "/start-project",
            page_title: "Start Project | SURAJ.WEB",
          });
        }).catch(() => {});
      }
    }).catch(() => {});
  }, []);

  const handleWhatsAppClick = () => {
    getClientAnalytics().then((analytics) => {
      if (analytics) {
        import("firebase/analytics").then(({ logEvent }) => {
          logEvent(analytics, "whatsapp_contact_click", {
            source: "start_project_page",
          });
        }).catch(() => {});
      }
    }).catch(() => {});
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (fieldErrors[name]) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};

    if (!formData.name.trim() || formData.name.trim().length < 2) {
      errors.name = "Please enter your name.";
    }

    const cleanPhone = formData.phone.trim();
    const digitsOnly = cleanPhone.replace(/\D/g, "");
    if (!cleanPhone || digitsOnly.length < 5) {
      errors.phone = "Enter a valid WhatsApp or phone number.";
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (submitting) return; // Prevent duplicate submissions
    setErrorMessage(null);

    if (!validateForm()) {
      setErrorMessage("Please complete your name and WhatsApp/phone number below.");
      const firstInvalid = document.querySelector("[aria-invalid='true']") as HTMLElement | null;
      if (firstInvalid) {
        firstInvalid.scrollIntoView({ behavior: "smooth", block: "center" });
        firstInvalid.focus();
      }
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch("/api/project-enquiry", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = (await response.json()) as { success?: boolean; error?: string };

      if (!response.ok || !data.success) {
        // KEEP ALL ENTERED VALUES, DO NOT RESET, DO NOT REDIRECT
        setErrorMessage(
          data.error ||
            "Something went wrong while sending your enquiry. Your details have not been lost. Please try again."
        );
        setSubmitting(false);
        return;
      }

      // Track lead in Firebase Analytics (Client-side, non-PII only)
      getClientAnalytics().then((analytics) => {
        if (analytics) {
          import("firebase/analytics").then(({ logEvent }) => {
            logEvent(analytics, "project_enquiry_submitted", {
              preferred_contact_method: formData.preferredContactMethod,
              preferred_contact_time: formData.preferredContactTime || "not_specified",
              project_type: formData.projectType,
              business_type: formData.businessType,
              budget: formData.budget,
              timeline: formData.timeline,
            });
          }).catch(() => {});
        }
      }).catch(() => {});

      // SUCCESS CONFIRMED BY SERVER
      setSubmitting(false);
      setCountdown(4);
      setShowSuccessModal(true);
    } catch {
      // Network or unexpected failure: preserve data
      setErrorMessage(
        "Something went wrong while sending your enquiry. Your details have not been lost. Please try again."
      );
      setSubmitting(false);
    }
  };

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
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-start">
          {/* LEFT COLUMN: Context & Direct WhatsApp */}
          <div className="lg:col-span-5 lg:sticky lg:top-8 space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/[0.05] border border-white/[0.1] text-xs text-[#d8c9bd]">
              <Clock size={13} className="text-[#f87b38]" />
              <span>Project Enquiry • Takes about 2 minutes</span>
            </div>

            <div>
              <div className="section-label mb-2">
                <span aria-hidden="true">✦</span> START A PROJECT
              </div>
              <h1 className="font-['Antonio',sans-serif] text-4xl sm:text-5xl lg:text-[58px] font-thin leading-[1.08] tracking-[-1.5px] text-[#f6f0e9]">
                Let’s build something that works.
              </h1>
            </div>

            <p className="text-base text-[#b5a597] leading-relaxed">
              Tell me a little about your business and what you want to build. I’ll review the details
              and get back to you personally.
            </p>

            {/* Information Cards */}
            <div className="space-y-4 pt-4 border-t border-white/[0.08]">
              <div className="flex items-start gap-3.5">
                <div className="w-8 h-8 rounded-full bg-[#2c1c14] text-[#f87b38] flex items-center justify-center shrink-0 border border-white/[0.08]">
                  <Sparkles size={16} />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-[#f6f0e9]">Direct Collaboration</h3>
                  <p className="text-xs text-[#a59587] leading-relaxed mt-0.5">
                    No automated sales reps. You will talk and work directly with me from concept to
                    delivery.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3.5">
                <div className="w-8 h-8 rounded-full bg-[#2c1c14] text-[#f87b38] flex items-center justify-center shrink-0 border border-white/[0.08]">
                  <ShieldCheck size={16} />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-[#f6f0e9]">Tailored Recommendations</h3>
                  <p className="text-xs text-[#a59587] leading-relaxed mt-0.5">
                    I will evaluate your goals and suggest the practical layout, technology, and
                    realistic timeline.
                  </p>
                </div>
              </div>

              {/* Direct WhatsApp Block */}
              <div className="flex items-start gap-3.5 p-4 rounded-xl bg-[#180e08] border border-[#52331f]">
                <div className="w-8 h-8 rounded-full bg-[#2c1c14] text-[#f87b38] flex items-center justify-center shrink-0 border border-[#f87b38]/30">
                  <MessageSquare size={16} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-medium text-[#f6f0e9]">Direct WhatsApp</h3>
                  <p className="text-xs text-[#a59587] leading-relaxed mt-0.5 mb-2">
                    Prefer a quick conversation? Message me directly on WhatsApp.
                  </p>
                  <a
                    href={WHATSAPP_DIRECT_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={handleWhatsAppClick}
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-[#f87b38] hover:text-[#ff985c] underline"
                  >
                    Chat on WhatsApp (+91 7810963278) <ArrowUpRight size={13} />
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: The Refined Enquiry Form */}
          <div className="lg:col-span-7">
            <form
              ref={formRef}
              onSubmit={handleSubmit}
              noValidate
              className="bg-[#160d07] border border-[#4a2e1c] rounded-2xl sm:rounded-3xl p-6 sm:p-8 md:p-10 shadow-2xl space-y-8"
              aria-label="Project enquiry form"
            >
              {/* SECTION 01: About You */}
              <div className="space-y-5">
                <div className="border-b border-white/[0.08] pb-3">
                  <div className="flex items-center gap-2">
                    <span className="font-['Antonio',sans-serif] text-sm tracking-wider text-[#f87b38]">
                      01
                    </span>
                    <h2 className="text-xs uppercase tracking-wider font-semibold text-[#f6f0e9]">
                      About You
                    </h2>
                  </div>
                  <p className="text-xs text-[#8d7c71] mt-0.5">
                    Basic details so I know who I am speaking with.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                  <div>
                    <label
                      htmlFor="name"
                      className="block text-xs uppercase tracking-wider font-medium text-[#d8c9bd] mb-2"
                    >
                      Your Name <span className="text-[#f87b38]">*</span>
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="e.g. Alex Morgan"
                      required
                      aria-required="true"
                      aria-invalid={!!fieldErrors.name}
                      aria-describedby={fieldErrors.name ? "name-error" : undefined}
                      className={`w-full h-12 px-4 bg-[#0e0501] border rounded-xl text-sm text-[#f6f0e9] placeholder:text-[#6b5a4d] transition-all outline-none focus:border-[#f87b38] focus:ring-1 focus:ring-[#f87b38]/50 focus:bg-[#120803] ${
                        fieldErrors.name ? "border-red-500" : "border-white/[0.12]"
                      }`}
                    />
                    {fieldErrors.name && (
                      <p id="name-error" className="text-xs text-[#ff7d5c] mt-1.5 flex items-center gap-1">
                        <AlertCircle size={12} /> {fieldErrors.name}
                      </p>
                    )}
                  </div>

                  <div>
                    <label
                      htmlFor="businessName"
                      className="block text-xs uppercase tracking-wider font-medium text-[#d8c9bd] mb-2"
                    >
                      Business / Brand Name <span className="text-xs lowercase text-[#8d7c71]">(optional)</span>
                    </label>
                    <input
                      type="text"
                      id="businessName"
                      name="businessName"
                      value={formData.businessName}
                      onChange={handleChange}
                      placeholder="e.g. Daybreak Studio"
                      className="w-full h-12 px-4 bg-[#0e0501] border border-white/[0.12] rounded-xl text-sm text-[#f6f0e9] placeholder:text-[#6b5a4d] transition-all outline-none focus:border-[#f87b38] focus:ring-1 focus:ring-[#f87b38]/50 focus:bg-[#120803]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                  <div>
                    <label
                      htmlFor="phone"
                      className="block text-xs uppercase tracking-wider font-medium text-[#d8c9bd] mb-2"
                    >
                      WhatsApp / Phone Number <span className="text-[#f87b38]">*</span>
                    </label>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="+91 78109 63278"
                      required
                      aria-required="true"
                      aria-invalid={!!fieldErrors.phone}
                      aria-describedby={fieldErrors.phone ? "phone-error" : undefined}
                      className={`w-full h-12 px-4 bg-[#0e0501] border rounded-xl text-sm text-[#f6f0e9] placeholder:text-[#6b5a4d] transition-all outline-none focus:border-[#f87b38] focus:ring-1 focus:ring-[#f87b38]/50 focus:bg-[#120803] ${
                        fieldErrors.phone ? "border-red-500" : "border-white/[0.12]"
                      }`}
                    />
                    {fieldErrors.phone && (
                      <p id="phone-error" className="text-xs text-[#ff7d5c] mt-1.5 flex items-center gap-1">
                        <AlertCircle size={12} /> {fieldErrors.phone}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs uppercase tracking-wider font-medium text-[#d8c9bd] mb-2">
                      Preferred Contact Method
                    </label>
                    <div
                      role="radiogroup"
                      aria-label="Preferred Contact Method"
                      className="grid grid-cols-2 gap-2 h-12"
                    >
                      {CONTACT_METHODS.map((method) => {
                        const isSelected = formData.preferredContactMethod === method.id;
                        const Icon = method.icon;
                        return (
                          <button
                            key={method.id}
                            type="button"
                            role="radio"
                            id={`contact-method-${method.id}`}
                            aria-checked={isSelected}
                            tabIndex={isSelected ? 0 : -1}
                            onClick={() =>
                              setFormData((prev) => ({ ...prev, preferredContactMethod: method.id }))
                            }
                            onKeyDown={(e) => {
                              if (e.key === " " || e.key === "Enter") {
                                e.preventDefault();
                                setFormData((prev) => ({ ...prev, preferredContactMethod: method.id }));
                              } else if (e.key === "ArrowRight" || e.key === "ArrowDown") {
                                e.preventDefault();
                                const nextMethod: "whatsapp" | "phone" = method.id === "whatsapp" ? "phone" : "whatsapp";
                                setFormData((prevState) => ({ ...prevState, preferredContactMethod: nextMethod }));
                                document.getElementById(`contact-method-${nextMethod}`)?.focus();
                              } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
                                e.preventDefault();
                                const prevMethod: "whatsapp" | "phone" = method.id === "phone" ? "whatsapp" : "phone";
                                setFormData((prevState) => ({ ...prevState, preferredContactMethod: prevMethod }));
                                document.getElementById(`contact-method-${prevMethod}`)?.focus();
                              }
                            }}
                            className={`flex items-center justify-center gap-2 px-3 rounded-xl border text-xs font-medium transition-colors cursor-pointer select-none ${
                              isSelected
                                ? "bg-[#f87b38]/15 border-[#f87b38] text-[#f87b38] shadow-[0_0_12px_rgba(248,123,56,0.12)] font-semibold"
                                : "bg-[#0e0501] border-white/[0.12] text-[#b5a597] hover:border-white/[0.25]"
                            }`}
                          >
                            <Icon size={14} className={isSelected ? "text-[#f87b38]" : "text-[#8d7c71]"} />
                            <span>{method.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              {/* SECTION 02: Your Project */}
              <div className="space-y-5 pt-2">
                <div className="border-b border-white/[0.08] pb-3">
                  <div className="flex items-center gap-2">
                    <span className="font-['Antonio',sans-serif] text-sm tracking-wider text-[#f87b38]">
                      02
                    </span>
                    <h2 className="text-xs uppercase tracking-wider font-semibold text-[#f6f0e9]">
                      Your Project
                    </h2>
                  </div>
                  <p className="text-xs text-[#8d7c71] mt-0.5">
                    Category, requirements, budget, and estimated timeline.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                  <div>
                    <label
                      htmlFor="businessType"
                      className="block text-xs uppercase tracking-wider font-medium text-[#d8c9bd] mb-2"
                    >
                      What type of business is this? <span className="text-[#f87b38]">*</span>
                    </label>
                    <div className="relative">
                      <select
                        id="businessType"
                        name="businessType"
                        value={formData.businessType}
                        onChange={handleChange}
                        required
                        className="w-full h-12 px-4 pr-9 bg-[#0e0501] border border-white/[0.12] rounded-xl text-sm text-[#f6f0e9] transition-all outline-none appearance-none focus:border-[#f87b38] focus:ring-1 focus:ring-[#f87b38]/50 focus:bg-[#120803]"
                      >
                        {BUSINESS_TYPES.map((type) => (
                          <option key={type} value={type} className="bg-[#180e08] text-[#f6f0e9]">
                            {type}
                          </option>
                        ))}
                      </select>
                      <div className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-[#8d7c71] text-xs">
                        ▼
                      </div>
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="projectType"
                      className="block text-xs uppercase tracking-wider font-medium text-[#d8c9bd] mb-2"
                    >
                      What do you need? <span className="text-[#f87b38]">*</span>
                    </label>
                    <div className="relative">
                      <select
                        id="projectType"
                        name="projectType"
                        value={formData.projectType}
                        onChange={handleChange}
                        required
                        className="w-full h-12 px-4 pr-9 bg-[#0e0501] border border-white/[0.12] rounded-xl text-sm text-[#f6f0e9] transition-all outline-none appearance-none focus:border-[#f87b38] focus:ring-1 focus:ring-[#f87b38]/50 focus:bg-[#120803]"
                      >
                        {PROJECT_TYPES.map((type) => (
                          <option key={type} value={type} className="bg-[#180e08] text-[#f6f0e9]">
                            {type}
                          </option>
                        ))}
                      </select>
                      <div className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-[#8d7c71] text-xs">
                        ▼
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                  <div>
                    <label
                      htmlFor="budget"
                      className="block text-xs uppercase tracking-wider font-medium text-[#d8c9bd] mb-2"
                    >
                      Estimated Budget <span className="text-[#f87b38]">*</span>
                    </label>
                    <div className="relative">
                      <select
                        id="budget"
                        name="budget"
                        value={formData.budget}
                        onChange={handleChange}
                        required
                        className="w-full h-12 px-4 pr-9 bg-[#0e0501] border border-white/[0.12] rounded-xl text-sm text-[#f6f0e9] transition-all outline-none appearance-none focus:border-[#f87b38] focus:ring-1 focus:ring-[#f87b38]/50 focus:bg-[#120803]"
                      >
                        {BUDGET_RANGES.map((range) => (
                          <option key={range} value={range} className="bg-[#180e08] text-[#f6f0e9]">
                            {range}
                          </option>
                        ))}
                      </select>
                      <div className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-[#8d7c71] text-xs">
                        ▼
                      </div>
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="timeline"
                      className="block text-xs uppercase tracking-wider font-medium text-[#d8c9bd] mb-2"
                    >
                      When do you want to start? <span className="text-[#f87b38]">*</span>
                    </label>
                    <div className="relative">
                      <select
                        id="timeline"
                        name="timeline"
                        value={formData.timeline}
                        onChange={handleChange}
                        required
                        className="w-full h-12 px-4 pr-9 bg-[#0e0501] border border-white/[0.12] rounded-xl text-sm text-[#f6f0e9] transition-all outline-none appearance-none focus:border-[#f87b38] focus:ring-1 focus:ring-[#f87b38]/50 focus:bg-[#120803]"
                      >
                        {TIMELINES.map((time) => (
                          <option key={time} value={time} className="bg-[#180e08] text-[#f6f0e9]">
                            {time}
                          </option>
                        ))}
                      </select>
                      <div className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-[#8d7c71] text-xs">
                        ▼
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="currentWebsite"
                    className="block text-xs uppercase tracking-wider font-medium text-[#d8c9bd] mb-2"
                  >
                    Current Website <span className="text-xs lowercase text-[#8d7c71]">(optional)</span>
                  </label>
                  <input
                    type="url"
                    id="currentWebsite"
                    name="currentWebsite"
                    value={formData.currentWebsite}
                    onChange={handleChange}
                    placeholder="https://example.com"
                    className="w-full h-12 px-4 bg-[#0e0501] border border-white/[0.12] rounded-xl text-sm text-[#f6f0e9] placeholder:text-[#6b5a4d] transition-all outline-none focus:border-[#f87b38] focus:ring-1 focus:ring-[#f87b38]/50 focus:bg-[#120803]"
                  />
                </div>
              </div>

              {/* SECTION 03: Project Details */}
              <div className="space-y-5 pt-2">
                <div className="border-b border-white/[0.08] pb-3">
                  <div className="flex items-center gap-2">
                    <span className="font-['Antonio',sans-serif] text-sm tracking-wider text-[#f87b38]">
                      03
                    </span>
                    <h2 className="text-xs uppercase tracking-wider font-semibold text-[#f6f0e9]">
                      Project Details
                    </h2>
                  </div>
                  <p className="text-xs text-[#8d7c71] mt-0.5">
                    Describe your vision, goals, and any reference websites.
                  </p>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label
                      htmlFor="projectGoal"
                      className="block text-xs uppercase tracking-wider font-medium text-[#d8c9bd]"
                    >
                      Tell me about your project{" "}
                      <span className="text-xs lowercase text-[#8d7c71]">(optional)</span>
                    </label>
                    <span className="text-[11px] text-[#8d7c71]">
                      {formData.projectGoal.length} / 3000 chars
                    </span>
                  </div>
                  <textarea
                    id="projectGoal"
                    name="projectGoal"
                    rows={4}
                    value={formData.projectGoal}
                    onChange={handleChange}
                    placeholder="Tell me what your business does, what you want to build, and what you want the website to achieve."
                    aria-invalid={!!fieldErrors.projectGoal}
                    aria-describedby={fieldErrors.projectGoal ? "projectGoal-error" : undefined}
                    className={`w-full p-4 bg-[#0e0501] border rounded-xl text-sm text-[#f6f0e9] placeholder:text-[#6b5a4d] transition-all outline-none resize-y focus:border-[#f87b38] focus:ring-1 focus:ring-[#f87b38]/50 focus:bg-[#120803] ${
                      fieldErrors.projectGoal ? "border-red-500" : "border-white/[0.12]"
                    }`}
                  />
                  {fieldErrors.projectGoal && (
                    <p
                      id="projectGoal-error"
                      className="text-xs text-[#ff7d5c] mt-1.5 flex items-center gap-1"
                    >
                      <AlertCircle size={12} /> {fieldErrors.projectGoal}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="reference"
                    className="block text-xs uppercase tracking-wider font-medium text-[#d8c9bd] mb-2"
                  >
                    Reference website or inspiration{" "}
                    <span className="text-xs lowercase text-[#8d7c71]">(optional)</span>
                  </label>
                  <input
                    type="text"
                    id="reference"
                    name="reference"
                    value={formData.reference}
                    onChange={handleChange}
                    placeholder="A website/design you like, if you have one."
                    className="w-full h-12 px-4 bg-[#0e0501] border border-white/[0.12] rounded-xl text-sm text-[#f6f0e9] placeholder:text-[#6b5a4d] transition-all outline-none focus:border-[#f87b38] focus:ring-1 focus:ring-[#f87b38]/50 focus:bg-[#120803]"
                  />
                </div>
              </div>

              {/* SECTION 04: Contact Preference */}
              <div className="space-y-4 pt-2">
                <div className="border-b border-white/[0.08] pb-3">
                  <div className="flex items-center gap-2">
                    <span className="font-['Antonio',sans-serif] text-sm tracking-wider text-[#f87b38]">
                      04
                    </span>
                    <h2 className="text-xs uppercase tracking-wider font-semibold text-[#f6f0e9]">
                      Contact Preference
                    </h2>
                  </div>
                  <p className="text-xs text-[#8d7c71] mt-0.5">
                    Select your preferred window for contact.
                  </p>
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-wider font-medium text-[#d8c9bd] mb-2.5">
                    Best Time to Contact You{" "}
                    <span className="text-xs lowercase text-[#8d7c71]">(optional)</span>
                  </label>
                  <div
                    role="radiogroup"
                    aria-label="Best time to contact you"
                    className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3"
                  >
                    {CONTACT_TIMES.map((time, idx) => {
                      const isSelected = formData.preferredContactTime === time.id;
                      return (
                        <button
                          key={time.id}
                          type="button"
                          role="radio"
                          id={`contact-time-${time.id}`}
                          aria-checked={isSelected}
                          tabIndex={isSelected || (!formData.preferredContactTime && idx === 0) ? 0 : -1}
                          onClick={() =>
                            setFormData((prev) => ({
                              ...prev,
                              preferredContactTime: prev.preferredContactTime === time.id ? "" : time.id,
                            }))
                          }
                          onKeyDown={(e) => {
                            if (e.key === " " || e.key === "Enter") {
                              e.preventDefault();
                              setFormData((prev) => ({
                                ...prev,
                                preferredContactTime: prev.preferredContactTime === time.id ? "" : time.id,
                              }));
                            } else if (e.key === "ArrowRight" || e.key === "ArrowDown") {
                              e.preventDefault();
                              const nextIdx = (idx + 1) % CONTACT_TIMES.length;
                              const nextId = CONTACT_TIMES[nextIdx].id;
                              setFormData((prev) => ({ ...prev, preferredContactTime: nextId }));
                              document.getElementById(`contact-time-${nextId}`)?.focus();
                            } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
                              e.preventDefault();
                              const prevIdx = (idx - 1 + CONTACT_TIMES.length) % CONTACT_TIMES.length;
                              const prevId = CONTACT_TIMES[prevIdx].id;
                              setFormData((prev) => ({ ...prev, preferredContactTime: prevId }));
                              document.getElementById(`contact-time-${prevId}`)?.focus();
                            }
                          }}
                          className={`min-h-[52px] p-2.5 rounded-xl border text-center transition-colors cursor-pointer select-none flex flex-col justify-center items-center ${
                            isSelected
                              ? "bg-[#f87b38]/15 border-[#f87b38] text-[#f87b38] shadow-[0_0_14px_rgba(248,123,56,0.15)] font-semibold"
                              : "bg-[#0e0501] border-white/[0.12] text-[#b5a597] hover:border-white/[0.25]"
                          }`}
                        >
                          <span
                            className={`text-xs font-medium flex items-center gap-1.5 ${
                              isSelected ? "text-[#f87b38]" : "text-[#f6f0e9]"
                            }`}
                          >
                            {isSelected && <Check size={12} className="stroke-[3]" />}
                            {time.label}
                          </span>
                          <span className="text-[10px] text-[#8d7c71] mt-0.5">{time.sublabel}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Submit & Error Area */}
              <div className="pt-4 border-t border-white/[0.08]">
                {errorMessage && (
                  <div
                    className="p-4 mb-5 rounded-xl bg-red-950/40 border border-red-500/40 text-red-200 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                    role="alert"
                    aria-live="assertive"
                  >
                    <div className="flex items-start gap-2.5">
                      <AlertCircle size={16} className="text-red-400 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium">{errorMessage}</p>
                        <p className="text-[11px] text-red-300 mt-0.5">
                          You can retry immediately or contact Suraj directly on WhatsApp.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                      <button
                        type="button"
                        onClick={() => handleSubmit()}
                        disabled={submitting}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-[#f6f0e9] text-xs font-medium transition-colors cursor-pointer"
                      >
                        <RefreshCw size={12} className={submitting ? "animate-spin" : ""} />
                        Retry
                      </button>
                      <a
                        href={WHATSAPP_DIRECT_URL}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#f87b38]/20 hover:bg-[#f87b38]/30 text-[#f87b38] text-xs font-medium transition-colors"
                      >
                        Chat on WhatsApp <ArrowUpRight size={12} />
                      </a>
                    </div>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="orange-button w-full sm:w-auto inline-flex items-center justify-center cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed text-sm font-medium"
                  >
                    {submitting ? "Sending Enquiry..." : "Submit Project Enquiry"}
                    <span className="button-arrow">
                      {submitting ? (
                        <span className="inline-block w-4 h-4 border-2 border-[#d66a31] border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <ArrowUpRight size={16} />
                      )}
                    </span>
                  </button>

                  <p className="text-xs text-[#8d7c71]">
                    Your details are sent directly to me.
                  </p>
                </div>
              </div>
            </form>
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

      {/* SUCCESS MODAL OVERLAY */}
      {showSuccessModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
          role="dialog"
          aria-modal="true"
          aria-labelledby="success-heading"
        >
          <div className="bg-[#180e08] border border-[#68462e] rounded-2xl sm:rounded-3xl p-7 sm:p-10 max-w-lg w-full text-center shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Subtle warm ambient highlight */}
            <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-48 h-48 bg-[#f87b38]/10 blur-3xl pointer-events-none rounded-full" />

            {/* Success checkmark in existing orange visual language */}
            <div className="w-16 h-16 rounded-full bg-[#f87b38]/15 border border-[#f87b38]/40 text-[#f87b38] flex items-center justify-center mx-auto mb-5 shadow-[0_0_24px_rgba(248,123,56,0.18)]">
              <CheckCircle2 size={34} />
            </div>

            <div className="section-label justify-center mb-2 text-xs text-[#f87b38] font-semibold tracking-wider uppercase">
              <span aria-hidden="true">✦</span> PROJECT ENQUIRY SENT
            </div>

            <h2
              id="success-heading"
              className="font-['Antonio',sans-serif] text-3xl sm:text-4xl lg:text-[44px] font-thin tracking-[-1px] text-[#f6f0e9] leading-tight mb-3"
            >
              Your project enquiry is in.
            </h2>

            <p className="text-sm sm:text-base text-[#bfafa1] leading-relaxed mb-6 max-w-md mx-auto">
              Thanks for sharing the details. I’ll review your project and contact you on WhatsApp or
              phone.
            </p>

            {/* Auto redirect countdown indicator */}
            <div className="inline-flex items-center justify-center gap-2 px-3 py-1.5 rounded-full bg-[#100702] border border-white/[0.08] text-xs text-[#a99585] mb-8 font-mono">
              <Clock size={13} className="text-[#f87b38]" />
              <span>
                Returning to portfolio in {countdown} {countdown === 1 ? "second" : "seconds"}...
              </span>
            </div>

            {/* Modal Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5">
              <Link
                href="/"
                className="orange-button w-full sm:w-auto inline-flex items-center justify-center cursor-pointer text-sm font-medium"
              >
                Back to Portfolio
                <span className="button-arrow">
                  <ArrowUpRight size={16} />
                </span>
              </Link>

              <a
                href={WHATSAPP_POST_SUBMIT_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 py-2.5 px-6 rounded-full border border-white/[0.14] text-sm text-[#e4d5cb] hover:border-[#f87b38] hover:text-[#f87b38] transition-colors"
              >
                <MessageSquare size={15} />
                Continue on WhatsApp
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


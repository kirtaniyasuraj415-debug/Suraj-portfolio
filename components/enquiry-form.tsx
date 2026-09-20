"use client";

import { useState } from "react";
import {
  ArrowUpRight,
  CheckCircle2,
  ChevronDown,
  Clock,
  MessageSquare,
  X,
  AlertCircle,
} from "lucide-react";
import { getClientAnalytics } from "@/lib/firebase";

const PROJECT_TYPES = [
  "New Website",
  "Website Redesign",
  "E-commerce Store",
  "Landing Page",
  "Portfolio / Brand",
  "AI & Automation",
  "Other",
];

const BUDGET_RANGES = [
  "Under ₹15,000",
  "₹15,000 – ₹30,000",
  "₹30,000 – ₹60,000",
  "₹60,000 – ₹1,00,000",
  "₹1,00,000+",
  "Flexible / To Discuss",
];

export interface EnquiryFormData {
  name: string;
  phone: string;
  businessName: string;
  projectType: string;
  budget: string;
  projectGoal: string;
}

const initialFormData: EnquiryFormData = {
  name: "",
  phone: "",
  businessName: "",
  projectType: "New Website",
  budget: "₹15,000 – ₹30,000",
  projectGoal: "",
};

const WHATSAPP_DIRECT_URL = `https://wa.me/917810963278?text=${encodeURIComponent(
  "Hi Suraj, I am looking to start a new website/project and would like to discuss details."
)}`;

interface EnquiryFormProps {
  embedded?: boolean;
  onSuccess?: () => void;
}

export default function EnquiryForm({ embedded = false, onSuccess }: EnquiryFormProps) {
  const [formData, setFormData] = useState<EnquiryFormData>(initialFormData);
  const [submitting, setSubmitting] = useState(false);
  const [submittedData, setSubmittedData] = useState<EnquiryFormData | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const handleWhatsAppClick = () => {
    getClientAnalytics().then((analytics) => {
      if (analytics) {
        import("firebase/analytics").then(({ logEvent }) => {
          logEvent(analytics, "whatsapp_contact_click", {
            source: embedded ? "homepage_enquiry_form" : "start_project_page",
          });
        }).catch(() => {});
      }
    }).catch(() => {});
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
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
      errors.name = "Please enter your name (at least 2 characters).";
    }

    const cleanPhone = formData.phone.trim();
    const digitsOnly = cleanPhone.replace(/\D/g, "");
    if (!cleanPhone || digitsOnly.length < 6) {
      errors.phone = "Please enter a valid WhatsApp or phone number.";
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setErrorMessage(null);

    if (!validateForm()) {
      setErrorMessage("Please fill in your name and WhatsApp/phone number below.");
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

      const data = (await response.json()) as {
        success?: boolean;
        error?: string;
        lead?: EnquiryFormData;
      };

      if (!response.ok || !data.success) {
        setErrorMessage(
          data.error ||
            "Unable to send your enquiry right now. Please try again or chat directly on WhatsApp."
        );
        setSubmitting(false);
        return;
      }

      // Track lead in Firebase Analytics (Client-side, non-PII only)
      getClientAnalytics().then((analytics) => {
        if (analytics) {
          import("firebase/analytics").then(({ logEvent }) => {
            logEvent(analytics, "project_enquiry_submitted", {
              project_type: formData.projectType,
              budget: formData.budget,
              source: embedded ? "homepage" : "dedicated_page",
            });
          }).catch(() => {});
        }
      }).catch(() => {});

      // Keep submitted copy for the success popup modal
      setSubmittedData({ ...formData });
      // Reset active form
      setFormData(initialFormData);
      setFieldErrors({});
      setSubmitting(false);
      setShowSuccessModal(true);
      if (onSuccess) onSuccess();
    } catch {
      setErrorMessage(
        "Network connection issue. Your details have not been lost. Please retry or message Suraj on WhatsApp."
      );
      setSubmitting(false);
    }
  };

  const whatsappFollowupUrl = submittedData
    ? `https://wa.me/917810963278?text=${encodeURIComponent(
        `Hi Suraj, I just submitted an enquiry for ${submittedData.projectType} (Budget: ${submittedData.budget}). My name is ${submittedData.name}.`
      )}`
    : WHATSAPP_DIRECT_URL;

  return (
    <>
      <form
        onSubmit={handleSubmit}
        noValidate
        className="bg-[#160d07] border border-[#4a2e1c] rounded-2xl sm:rounded-3xl p-6 sm:p-8 md:p-10 shadow-2xl space-y-6 text-left"
        aria-label="Project enquiry form"
      >
        {/* Form Title */}
        <div className="border-b border-white/[0.08] pb-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg sm:text-xl font-semibold text-[#f6f0e9] tracking-tight">
              Start Your Project
            </h2>
            <span className="text-[11px] px-2.5 py-1 rounded-full bg-[#f87b38]/15 border border-[#f87b38]/40 text-[#f87b38] font-medium flex items-center gap-1">
              <Clock size={12} /> Fast response
            </span>
          </div>
          <p className="text-xs text-[#a99585] mt-1">
            Fill in your project brief below. I receive it immediately on Telegram and will reach out to you on WhatsApp.
          </p>
        </div>

        {/* Error Banner if any */}
        {errorMessage && (
          <div
            className="p-3.5 rounded-xl bg-red-950/50 border border-red-800 text-red-200 text-xs flex items-center gap-2.5"
            role="alert"
          >
            <AlertCircle size={16} className="text-red-400 shrink-0" />
            <p className="font-medium">{errorMessage}</p>
          </div>
        )}

        {/* FIELD 1: Full Name */}
        <div>
          <label
            htmlFor="enquiry-name"
            className="block text-xs uppercase tracking-wider font-semibold text-[#d8c9bd] mb-2"
          >
            Your Name <span className="text-[#f87b38]">*</span>
          </label>
          <input
            type="text"
            id="enquiry-name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="e.g. Rahul Sharma"
            required
            aria-required="true"
            aria-invalid={!!fieldErrors.name}
            className={`w-full h-12 px-4 bg-[#0e0501] border rounded-xl text-sm text-[#f6f0e9] placeholder:text-[#6b5a4d] transition-all outline-none focus:border-[#f87b38] focus:ring-1 focus:ring-[#f87b38]/50 ${
              fieldErrors.name ? "border-red-500" : "border-white/[0.14]"
            }`}
          />
          {fieldErrors.name && (
            <p className="text-xs text-red-400 mt-1.5 flex items-center gap-1">
              <AlertCircle size={12} /> {fieldErrors.name}
            </p>
          )}
        </div>

        {/* FIELD 2: WhatsApp / Phone Number */}
        <div>
          <label
            htmlFor="enquiry-phone"
            className="block text-xs uppercase tracking-wider font-semibold text-[#d8c9bd] mb-2"
          >
            WhatsApp / Phone Number <span className="text-[#f87b38]">*</span>
          </label>
          <input
            type="tel"
            id="enquiry-phone"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            placeholder="e.g. +91 98765 43210"
            required
            aria-required="true"
            aria-invalid={!!fieldErrors.phone}
            className={`w-full h-12 px-4 bg-[#0e0501] border rounded-xl text-sm text-[#f6f0e9] placeholder:text-[#6b5a4d] transition-all outline-none focus:border-[#f87b38] focus:ring-1 focus:ring-[#f87b38]/50 ${
              fieldErrors.phone ? "border-red-500" : "border-white/[0.14]"
            }`}
          />
          <p className="text-[11px] text-[#8d7c71] mt-1">
            I will reach out to you on this WhatsApp / Phone number.
          </p>
          {fieldErrors.phone && (
            <p className="text-xs text-red-400 mt-1.5 flex items-center gap-1">
              <AlertCircle size={12} /> {fieldErrors.phone}
            </p>
          )}
        </div>

        {/* FIELD 3: Business / Brand Name (Optional) */}
        <div>
          <label
            htmlFor="enquiry-businessName"
            className="block text-xs uppercase tracking-wider font-semibold text-[#d8c9bd] mb-2"
          >
            Business / Brand Name <span className="text-xs lowercase text-[#8d7c71]">(optional)</span>
          </label>
          <input
            type="text"
            id="enquiry-businessName"
            name="businessName"
            value={formData.businessName}
            onChange={handleChange}
            placeholder="e.g. Sharma Studio, Aura Clinic, etc."
            className="w-full h-12 px-4 bg-[#0e0501] border border-white/[0.14] rounded-xl text-sm text-[#f6f0e9] placeholder:text-[#6b5a4d] transition-all outline-none focus:border-[#f87b38] focus:ring-1 focus:ring-[#f87b38]/50"
          />
        </div>

        {/* DROPDOWN SELECTORS: Project Type & Estimated Budget */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {/* FIELD 4: Project Type (Dropdown Selector) */}
          <div>
            <label
              htmlFor="enquiry-projectType"
              className="block text-xs uppercase tracking-wider font-semibold text-[#d8c9bd] mb-2"
            >
              What do you need? <span className="text-[#f87b38]">*</span>
            </label>
            <div className="relative">
              <select
                id="enquiry-projectType"
                name="projectType"
                value={formData.projectType}
                onChange={handleChange}
                className="w-full h-12 pl-4 pr-10 bg-[#0e0501] border border-white/[0.14] rounded-xl text-sm text-[#f6f0e9] appearance-none transition-all outline-none focus:border-[#f87b38] focus:ring-1 focus:ring-[#f87b38]/50 cursor-pointer"
              >
                {PROJECT_TYPES.map((type) => (
                  <option
                    key={type}
                    value={type}
                    className="bg-[#180e08] text-[#f6f0e9] py-2"
                  >
                    {type}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={18}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#a99585] pointer-events-none"
              />
            </div>
          </div>

          {/* FIELD 5: Estimated Budget (Dropdown Selector) */}
          <div>
            <label
              htmlFor="enquiry-budget"
              className="block text-xs uppercase tracking-wider font-semibold text-[#d8c9bd] mb-2"
            >
              Estimated Budget <span className="text-[#f87b38]">*</span>
            </label>
            <div className="relative">
              <select
                id="enquiry-budget"
                name="budget"
                value={formData.budget}
                onChange={handleChange}
                className="w-full h-12 pl-4 pr-10 bg-[#0e0501] border border-white/[0.14] rounded-xl text-sm text-[#f6f0e9] appearance-none transition-all outline-none focus:border-[#f87b38] focus:ring-1 focus:ring-[#f87b38]/50 cursor-pointer"
              >
                {BUDGET_RANGES.map((b) => (
                  <option
                    key={b}
                    value={b}
                    className="bg-[#180e08] text-[#f6f0e9] py-2"
                  >
                    {b}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={18}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#a99585] pointer-events-none"
              />
            </div>
          </div>
        </div>

        {/* FIELD 6: Project Details / Message */}
        <div>
          <label
            htmlFor="enquiry-projectGoal"
            className="block text-xs uppercase tracking-wider font-semibold text-[#d8c9bd] mb-2"
          >
            Tell Me About Your Project <span className="text-xs lowercase text-[#8d7c71]">(optional)</span>
          </label>
          <textarea
            id="enquiry-projectGoal"
            name="projectGoal"
            rows={3}
            value={formData.projectGoal}
            onChange={handleChange}
            placeholder="What is your website about? Any specific features or design references you like?"
            className="w-full p-4 bg-[#0e0501] border border-white/[0.14] rounded-xl text-sm text-[#f6f0e9] placeholder:text-[#6b5a4d] transition-all outline-none focus:border-[#f87b38] focus:ring-1 focus:ring-[#f87b38]/50 resize-none"
          />
        </div>

        {/* Submit Button */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={submitting}
            className="orange-button w-full sm:w-auto inline-flex items-center justify-center cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed text-sm font-semibold"
          >
            {submitting ? "Delivering to Telegram..." : "Send Project Enquiry"}
            <span className="button-arrow">
              {submitting ? (
                <span className="inline-block w-4 h-4 border-2 border-[#d66a31] border-t-transparent rounded-full animate-spin" />
              ) : (
                <ArrowUpRight size={16} />
              )}
            </span>
          </button>
          <p className="text-[11px] text-[#8d7c71] mt-2.5">
            ⚡ Direct alert sends to Suraj’s personal Telegram bot instantly.
          </p>
        </div>
      </form>

      {/* SUCCESS CONFIRMATION POPUP MODAL */}
      {showSuccessModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200"
          role="dialog"
          aria-modal="true"
          aria-labelledby="enquiry-modal-heading"
        >
          <div className="bg-[#180e08] border border-[#f87b38]/50 rounded-2xl sm:rounded-3xl p-6 sm:p-9 max-w-lg w-full text-center shadow-[0_0_50px_rgba(248,123,56,0.15)] relative overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Close button */}
            <button
              type="button"
              onClick={() => setShowSuccessModal(false)}
              className="absolute top-4 right-4 text-[#a99585] hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
              aria-label="Close popup"
            >
              <X size={20} />
            </button>

            {/* Glowing checkmark badge */}
            <div className="w-16 h-16 rounded-full bg-[#f87b38]/20 border border-[#f87b38] text-[#f87b38] flex items-center justify-center mx-auto mb-4 shadow-[0_0_25px_rgba(248,123,56,0.3)]">
              <CheckCircle2 size={36} className="stroke-[2.5]" />
            </div>

            <div className="section-label justify-center mb-1 text-xs text-[#f87b38] font-bold tracking-wider uppercase">
              <span aria-hidden="true">✦</span> ENQUIRY DELIVERED SUCCESSFULLY!
            </div>

            <h2
              id="enquiry-modal-heading"
              className="font-['Antonio',sans-serif] text-3xl sm:text-4xl font-thin tracking-[-1px] text-[#f6f0e9] leading-tight mb-2"
            >
              Thank you, {submittedData?.name || "there"}!
            </h2>

            <p className="text-sm text-[#d8c9bd] leading-relaxed mb-5 max-w-md mx-auto">
              Your project details have been delivered directly to Suraj via Telegram bot. I review every project brief personally and will reach out to you on WhatsApp within 2–4 hours.
            </p>

            {/* Submitted Summary Card */}
            {submittedData && (
              <div className="p-4 rounded-xl bg-[#0f0602] border border-white/[0.1] text-left text-xs space-y-2 mb-6 text-[#bfafa1]">
                <div className="flex justify-between border-b border-white/[0.06] pb-1.5">
                  <span className="text-[#8d7c71]">Name:</span>
                  <span className="font-semibold text-[#f6f0e9]">{submittedData.name}</span>
                </div>
                <div className="flex justify-between border-b border-white/[0.06] pb-1.5">
                  <span className="text-[#8d7c71]">WhatsApp / Phone:</span>
                  <span className="font-semibold text-[#f87b38]">{submittedData.phone}</span>
                </div>
                <div className="flex justify-between border-b border-white/[0.06] pb-1.5">
                  <span className="text-[#8d7c71]">Project:</span>
                  <span className="text-[#f6f0e9]">{submittedData.projectType}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#8d7c71]">Budget:</span>
                  <span className="text-[#f6f0e9]">{submittedData.budget}</span>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <a
                href={whatsappFollowupUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={handleWhatsAppClick}
                className="orange-button w-full sm:w-auto inline-flex items-center justify-center gap-2 cursor-pointer text-sm font-semibold py-3 px-6"
              >
                <MessageSquare size={16} />
                <span>Chat on WhatsApp Now</span>
                <ArrowUpRight size={16} />
              </a>

              <button
                type="button"
                onClick={() => setShowSuccessModal(false)}
                className="w-full sm:w-auto inline-flex items-center justify-center py-3 px-5 rounded-full border border-white/[0.14] text-sm text-[#e4d5cb] hover:border-white/[0.3] hover:text-white transition-colors cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

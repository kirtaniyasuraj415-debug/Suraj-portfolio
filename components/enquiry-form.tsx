"use client";

import { useState, useRef, useEffect } from "react";
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
import { PROJECT_TYPES, BUDGET_RANGES, ENQUIRY_LIMITS, enquirySchema, type EnquiryFormData, type EnquiryResponse } from "@/lib/project-enquiry";
export type { EnquiryFormData } from "@/lib/project-enquiry";

const initialFormData: EnquiryFormData = {
  name: "",
  phone: "",
  businessName: "",
  projectType: "New Website",
  budget: "₹15,000 – ₹30,000",
  projectGoal: "",
  preferredContactMethod: "whatsapp",
  preferredContactTime: "",
  businessType: "",
  timeline: "",
  currentWebsite: "",
  reference: "",
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
  const formRef = useRef<HTMLFormElement | null>(null);
  const submissionInFlight = useRef(false);
  const submitController = useRef<AbortController | null>(null);
  const successDialogRef = useRef<HTMLDialogElement | null>(null);
  const [delivery, setDelivery] = useState<"sent" | "saved">("sent");

  useEffect(() => () => submitController.current?.abort(), []);
  useEffect(() => {
    if (showSuccessModal) successDialogRef.current?.showModal();
  }, [showSuccessModal]);

  const closeSuccess = () => {
    setShowSuccessModal(false);
    if (delivery === "sent") {
      setFormData(initialFormData);
      formRef.current?.reset();
    }
  };


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

  const focusField = (name: string) => {
    const field = formRef.current?.elements.namedItem(name);
    if (field instanceof HTMLElement) {
      field.scrollIntoView({ behavior: "smooth", block: "center" });
      field.focus();
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (submissionInFlight.current || showSuccessModal || !formRef.current) return;
    setErrorMessage(null);

    // Read real form controls as well as React state. Native radio selections also
    // survive slow hydration, touch input and browser autofill.
    const values = { ...formData, ...Object.fromEntries(new window.FormData(formRef.current)) };
    const parsed = enquirySchema.safeParse(values);
    if (!parsed.success) {
      const errors = Object.fromEntries(parsed.error.issues.map(issue => [issue.path[0], issue.message]));
      setFieldErrors(errors);
      setErrorMessage(parsed.error.issues[0].message);
      focusField(String(parsed.error.issues[0].path[0]));
      return;
    }
    setFieldErrors({});
    submissionInFlight.current = true;
    setSubmitting(true);
    const controller = new AbortController();
    submitController.current = controller;
    const timeout = setTimeout(() => controller.abort(), 20000);
    try {
      const response = await fetch("/api/project-enquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
        signal: controller.signal,
      });
      const data = await response.json().catch(() => null) as EnquiryResponse | null;
      if (!response.ok || !data?.success || (!data.telegramDelivered && !data.firestoreStored)) {
        setFieldErrors(data?.fieldErrors ?? {});
        setErrorMessage(data?.error || "We couldn’t confirm delivery. Your details are still here. Please try again or contact me on WhatsApp.");
        if (data?.fieldErrors) focusField(Object.keys(data.fieldErrors)[0]);
        return;
      }
      getClientAnalytics().then(async analytics => {
        if (!analytics) return;
        const { logEvent } = await import("firebase/analytics");
        logEvent(analytics, "project_enquiry_submitted", {
          preferred_contact_method: parsed.data.preferredContactMethod,
          preferred_contact_time: parsed.data.preferredContactTime || "not_specified",
          project_type: parsed.data.projectType,
          delivery: data.telegramDelivered ? "sent" : "saved",
        });
      }).catch(() => {});
      setDelivery(data.telegramDelivered ? "sent" : "saved");
      setSubmittedData(parsed.data);
      setShowSuccessModal(true);
      onSuccess?.();
    } catch {
      setErrorMessage(controller.signal.aborted
        ? "Delivery is taking longer than expected. Your details are still here. Please contact me on WhatsApp to confirm your enquiry."
        : "We couldn’t connect. Your details are still here. Please try again or contact me on WhatsApp.");
    } finally {
      clearTimeout(timeout);
      submitController.current = null;
      submissionInFlight.current = false;
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
        ref={formRef}
        aria-busy={submitting}
        onSubmit={handleSubmit}
        noValidate
        className="enquiry-form-shell rounded-2xl sm:rounded-3xl p-6 sm:p-8 md:p-10 shadow-2xl space-y-6 text-left"
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
            Share your project brief and choose how you’d like me to contact you.
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
            maxLength={ENQUIRY_LIMITS.name}
            disabled={submitting}
            value={formData.name}
            onChange={handleChange}
            placeholder="e.g. Rahul Sharma"
            required
            aria-required="true"
            aria-invalid={!!fieldErrors.name}
            className={`w-full h-12 px-4 bg-[#020202] border rounded-xl text-sm text-[#f6f0e9] placeholder:text-[#6b5a4d] transition-all outline-none focus:border-[#f87b38] focus:ring-1 focus:ring-[#f87b38]/50 ${
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
            maxLength={ENQUIRY_LIMITS.phone}
            disabled={submitting}
            value={formData.phone}
            onChange={handleChange}
            placeholder="e.g. +91 98765 43210"
            required
            aria-required="true"
            aria-invalid={!!fieldErrors.phone}
            className={`w-full h-12 px-4 bg-[#020202] border rounded-xl text-sm text-[#f6f0e9] placeholder:text-[#6b5a4d] transition-all outline-none focus:border-[#f87b38] focus:ring-1 focus:ring-[#f87b38]/50 ${
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

        <fieldset disabled={submitting} className="min-w-0">
          <legend className="block text-xs uppercase tracking-wider font-semibold text-[#d8c9bd] mb-2">Preferred Contact Method</legend>
          <div className="grid grid-cols-2 gap-2 h-12">
            {[{ value: "whatsapp", label: "WhatsApp" }, { value: "phone", label: "Phone Call" }].map(option => (
              <label key={option.value} className="enquiry-choice relative block cursor-pointer">
                <input type="radio" name="preferredContactMethod" value={option.value} defaultChecked={option.value === "whatsapp"} onChange={handleChange} className="enquiry-radio" />
                <span className="enquiry-choice-content flex h-full items-center justify-center rounded-xl border text-xs font-medium transition-colors">{option.label}</span>
              </label>
            ))}
          </div>
        </fieldset>

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
            maxLength={ENQUIRY_LIMITS.businessName}
            disabled={submitting}
            value={formData.businessName}
            onChange={handleChange}
            placeholder="e.g. Sharma Studio, Aura Clinic, etc."
            className="w-full h-12 px-4 bg-[#020202] border border-white/[0.14] rounded-xl text-sm text-[#f6f0e9] placeholder:text-[#6b5a4d] transition-all outline-none focus:border-[#f87b38] focus:ring-1 focus:ring-[#f87b38]/50"
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
                className="w-full h-12 pl-4 pr-10 bg-[#020202] border border-white/[0.14] rounded-xl text-sm text-[#f6f0e9] appearance-none transition-all outline-none focus:border-[#f87b38] focus:ring-1 focus:ring-[#f87b38]/50 cursor-pointer"
              >
                {PROJECT_TYPES.map((type) => (
                  <option
                    key={type}
                    value={type}
                    className="bg-[#050505] text-[#f6f0e9] py-2"
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
                className="w-full h-12 pl-4 pr-10 bg-[#020202] border border-white/[0.14] rounded-xl text-sm text-[#f6f0e9] appearance-none transition-all outline-none focus:border-[#f87b38] focus:ring-1 focus:ring-[#f87b38]/50 cursor-pointer"
              >
                {BUDGET_RANGES.map((b) => (
                  <option
                    key={b}
                    value={b}
                    className="bg-[#050505] text-[#f6f0e9] py-2"
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
            maxLength={ENQUIRY_LIMITS.projectGoal}
            disabled={submitting}
            rows={3}
            value={formData.projectGoal}
            onChange={handleChange}
            placeholder="What is your website about? Any specific features or design references you like?"
            className="w-full p-4 bg-[#020202] border border-white/[0.14] rounded-xl text-sm text-[#f6f0e9] placeholder:text-[#6b5a4d] transition-all outline-none focus:border-[#f87b38] focus:ring-1 focus:ring-[#f87b38]/50 resize-none"
          />
        </div>

        <fieldset disabled={submitting} className="min-w-0">
          <legend className="block text-xs uppercase tracking-wider font-semibold text-[#d8c9bd] mb-2">Best Time to Contact You <span className="lowercase font-normal text-[#8d7c71]">(optional · IST)</span></legend>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[{ value: "morning", label: "Morning", time: "9 AM – 12 PM" }, { value: "afternoon", label: "Afternoon", time: "12 PM – 5 PM" }, { value: "evening", label: "Evening", time: "5 PM – 9 PM" }, { value: "anytime", label: "Anytime", time: "Flexible" }].map(option => (
              <label key={option.value} className="enquiry-choice relative block cursor-pointer">
                <input type="radio" name="preferredContactTime" value={option.value} onChange={handleChange} className="enquiry-radio" />
                <span className="enquiry-choice-content flex min-h-[56px] flex-col items-center justify-center rounded-xl border p-2 text-xs transition-colors">
                  <span className="font-medium">{option.label}</span>
                  <span className="text-[10px] text-[#8d7c71] mt-1">{option.time}</span>
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        {/* Submit Button */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={submitting}
            className="orange-button w-full sm:w-auto inline-flex items-center justify-center cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed text-sm font-semibold"
          >
            {submitting ? "Sending Enquiry..." : "Send Project Enquiry"}
            <span className="button-arrow">
              {submitting ? (
                <span className="inline-block w-4 h-4 border-2 border-[#d66a31] border-t-transparent rounded-full animate-spin" />
              ) : (
                <ArrowUpRight size={16} />
              )}
            </span>
          </button>
          <p className="text-[11px] text-[#8d7c71] mt-2.5">
            Your details are sent directly to Suraj. Confirmation appears after delivery.
          </p>
        </div>
      </form>

      {/* SUCCESS CONFIRMATION POPUP MODAL */}
      {showSuccessModal && (
        <dialog
          ref={successDialogRef}
          onCancel={event => { event.preventDefault(); closeSuccess(); }}
          className="fixed inset-0 z-50 m-auto w-[calc(100%-2rem)] max-w-lg max-h-[90dvh] overflow-y-auto border-0 p-0 bg-transparent text-[#f6f0e9] backdrop:bg-black/85 backdrop:backdrop-blur-md"
          aria-labelledby="enquiry-modal-heading"
          aria-describedby="enquiry-modal-description"
        >
          <div className="bg-[#050505] border border-[#f87b38]/50 rounded-2xl sm:rounded-3xl p-6 sm:p-9 max-w-lg w-full text-center shadow-[0_0_50px_rgba(248,123,56,0.15)] relative overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Close button */}
            <button
              type="button"
              onClick={closeSuccess}
              className="absolute top-4 right-4 text-[#a99585] hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
              aria-label="Close popup"
            >
              <X size={20} />
            </button>

            {/* Glowing checkmark badge */}
            <div className="w-16 h-16 rounded-full bg-[#f87b38]/20 border border-[#f87b38] text-[#f87b38] flex items-center justify-center mx-auto mb-4 shadow-[0_0_25px_rgba(248,123,56,0.3)]">
              {delivery === "sent" ? <CheckCircle2 size={36} className="stroke-[2.5]" /> : <AlertCircle size={36} />}
            </div>

            <div className="section-label justify-center mb-1 text-xs text-[#f87b38] font-bold tracking-wider uppercase">
              <span aria-hidden="true">✦</span> {delivery === "sent" ? "ENQUIRY DELIVERED SUCCESSFULLY!" : "DETAILS SAVED · NOTIFICATION UNCONFIRMED"}
            </div>

            <h2
              id="enquiry-modal-heading"
              className="font-['Antonio',sans-serif] text-3xl sm:text-4xl font-thin tracking-[-1px] text-[#f6f0e9] leading-tight mb-2"
            >
              Thank you, {submittedData?.name || "there"}!
            </h2>

            <p id="enquiry-modal-description" className="text-sm text-[#d8c9bd] leading-relaxed mb-5 max-w-md mx-auto">
              {delivery === "sent"
                ? "Your enquiry has reached Suraj. I’ll review the details and contact you using your selected preference."
                : "Your details were saved, but I couldn’t confirm the notification. Please use WhatsApp below to make sure I see your enquiry."}
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
                onClick={closeSuccess}
                className="w-full sm:w-auto inline-flex items-center justify-center py-3 px-5 rounded-full border border-white/[0.14] text-sm text-[#e4d5cb] hover:border-white/[0.3] hover:text-white transition-colors cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </dialog>
      )}
    </>
  );
}

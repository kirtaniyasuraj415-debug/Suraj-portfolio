import { z } from "zod";

export const BUSINESS_TYPES = [
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
] as const;

export const PROJECT_TYPES = [
  "New Website",
  "Website Redesign",
  "E-commerce Store",
  "Landing Page",
  "Portfolio / Brand",
  "AI & Automation",
  "Other",
] as const;

const LEGACY_PROJECT_TYPES = [
  "New Business Website",
  "Website Redesign",
  "Landing Page",
  "Portfolio Website",
  "E-commerce Website",
  "AI / Automation",
  "Website + Automation",
  "Not Sure Yet",
  "Other",
] as const;

export const BUDGET_RANGES = [
  "Under ₹15,000",
  "₹15,000 – ₹30,000",
  "₹30,000 – ₹60,000",
  "₹60,000 – ₹1,00,000",
  "₹1,00,000+",
  "Flexible / To Discuss",
] as const;

const LEGACY_BUDGET_RANGES = [
  "Under ₹10,000",
  "₹10,000 – ₹25,000",
  "₹25,000 – ₹50,000",
  "₹50,000 – ₹1,00,000",
  "₹1,00,000+",
  "Not Sure Yet",
] as const;

export const TIMELINES = [
  "As soon as possible",
  "Within 1–2 weeks",
  "Within 1 month",
  "Within 1–3 months",
  "Flexible / Not Sure",
] as const;

export const ENQUIRY_LIMITS = { name: 100, businessName: 120, phone: 32, currentWebsite: 240, projectGoal: 2500, reference: 240 } as const;
const optionalText = (max: number) => z.string().trim().max(max, `Please use at most ${max} characters.`).default("");

// One set of rules for browser validation and the server endpoint.
export const enquirySchema = z.object({
  name: z.string().trim().min(2, "Please enter your name (at least 2 characters).").max(ENQUIRY_LIMITS.name),
  businessName: optionalText(ENQUIRY_LIMITS.businessName),
  phone: z.string().trim().max(ENQUIRY_LIMITS.phone).refine(value => {
    const digits = value.replace(/\D/g, "");
    return /^\+?[\d\s().-]+$/.test(value) && digits.length >= 7 && digits.length <= 15;
  }, "Enter a valid phone number with 7–15 digits, including your country code."),
  preferredContactMethod: z.enum(["whatsapp", "phone"]).default("whatsapp"),
  businessType: z.enum([...BUSINESS_TYPES, ""]).default(""),
  projectType: z.enum([...PROJECT_TYPES, ...LEGACY_PROJECT_TYPES]).default("New Website"),
  currentWebsite: optionalText(ENQUIRY_LIMITS.currentWebsite),
  budget: z.enum([...BUDGET_RANGES, ...LEGACY_BUDGET_RANGES]).default("Flexible / To Discuss"),
  timeline: z.enum([...TIMELINES, ""]).default(""),
  projectGoal: optionalText(ENQUIRY_LIMITS.projectGoal),
  reference: optionalText(ENQUIRY_LIMITS.reference),
  preferredContactTime: z.enum(["", "morning", "afternoon", "evening", "anytime"]).default(""),
});
export type EnquiryFormData = z.infer<typeof enquirySchema>;
export type EnquiryResponse = {
  success: boolean;
  delivery?: "sent" | "saved" | "failed";
  telegramDelivered?: boolean;
  firestoreStored?: boolean;
  requestId?: string;
  error?: string;
  fieldErrors?: Record<string, string>;
};

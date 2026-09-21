import test from "node:test";
import assert from "node:assert/strict";
import { handleProjectEnquiry, validateProjectEnquiry } from "../server/project-enquiry.mjs";

const lead = {
  name: "Test Lead",
  phone: "+91 90000 00000",
  businessName: "Test Studio",
  preferredContactMethod: "phone",
  preferredContactTime: "evening",
  projectType: "New Website",
  budget: "₹15,000 – ₹30,000",
  projectGoal: "Need a conversion-focused business website.",
  businessType: "Photography / Studio",
  timeline: "Within 1 month",
  currentWebsite: "",
  reference: "",
};

test("validator accepts the real form payload shape", () => {
  const result = validateProjectEnquiry(lead);
  assert.equal(result.valid, true);
  assert.equal(result.lead.preferredContactMethod, "phone");
  assert.equal(result.lead.preferredContactTime, "evening");
});

test("Telegram success is returned even if Firestore fails", async () => {
  let message = "";
  const result = await handleProjectEnquiry(lead, {
    skipRateLimit: true,
    botToken: "test-token",
    chatId: "test-chat",
    telegramSender: async (_token, _chat, text) => { message = text; return { success: true, messageId: 1 }; },
    firestoreWriter: async () => ({ success: false, code: "HTTP_403" }),
    log() {},
  });
  assert.equal(result.status, 200);
  assert.equal(result.body.telegramDelivered, true);
  assert.equal(result.body.firestoreStored, false);
  assert.match(message, /Test Lead/);
  assert.match(message, /Preferred Contact: Phone Call/);
  assert.match(message, /Best Time: Evening/);
});

test("Firestore-only persistence is honest about Telegram failure", async () => {
  const result = await handleProjectEnquiry(lead, {
    skipRateLimit: true,
    botToken: "test-token",
    chatId: "test-chat",
    telegramSender: async () => ({ success: false, code: "HTTP_403" }),
    firestoreWriter: async () => ({ success: true }),
    log() {},
  });
  assert.equal(result.status, 202);
  assert.equal(result.body.success, true);
  assert.equal(result.body.telegramDelivered, false);
  assert.equal(result.body.firestoreStored, true);
});

test("both provider failures return failure", async () => {
  const result = await handleProjectEnquiry(lead, {
    skipRateLimit: true,
    botToken: "test-token",
    chatId: "test-chat",
    telegramSender: async () => ({ success: false, code: "NETWORK_ERROR" }),
    firestoreWriter: async () => ({ success: false, code: "HTTP_403" }),
    log() {},
  });
  assert.equal(result.status, 502);
  assert.equal(result.body.success, false);
});

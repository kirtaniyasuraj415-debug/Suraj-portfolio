import test from 'node:test';
import assert from 'node:assert/strict';
import { handleEnquiryRequest, formatTelegramMessage } from '../lib/server/project-enquiry.ts';
import { enquirySchema, ENQUIRY_LIMITS, BUSINESS_TYPES, PROJECT_TYPES, BUDGET_RANGES, TIMELINES } from '../lib/project-enquiry.ts';

const lead = { name: 'Test Enquiry', phone: '+91 90000 00000', preferredContactMethod: 'phone', preferredContactTime: 'evening', projectGoal: 'A new website' };
const request = (body = lead) => new Request('http://localhost/api/project-enquiry', { method: 'POST', body: JSON.stringify(body) });
const reply = (data, status = 200) => Response.json(data, { status });
const settings = fetch => ({ telegram: { botToken: 'test-token', chatId: 'test-chat' }, firestore: { projectId: 'test-project', apiKey: 'test-key' }, timeoutMs: 40, fetch, log() {} });

// All transport is mocked: these tests send no real leads or messages.
test('both providers receive the exact choices and report confirmed delivery', async () => {
  const calls = [];
  const response = await handleEnquiryRequest(request(), settings(async (url, init) => {
    calls.push({ url, ...init, body: JSON.parse(init.body) });
    return url.includes('telegram.org') ? reply({ ok: true }) : reply({ name: 'projects/test/documents/projectEnquiries/test' });
  }));
  const body = await response.json();
  assert.equal(response.status, 200);
  assert.equal(body.delivery, 'sent');
  assert.equal(body.telegramDelivered, true);
  assert.equal(body.firestoreStored, true);
  assert.match(calls[0].body.text, /Preferred contact: Phone Call/);
  assert.match(calls[0].body.text, /Best time: Evening/);
  assert.equal(calls[1].body.fields.preferredContactMethod.stringValue, 'phone');
  assert.equal(calls[1].body.fields.preferredContactTime.stringValue, 'evening');
  assert.equal(calls[2].body.fields.telegramNotificationStatus.stringValue, 'sent');
  assert.equal(response.headers.get('cache-control'), 'no-store');
});

test('a stalled Firestore request never stops Telegram from being sent', async () => {
  let sent = false;
  const response = await handleEnquiryRequest(request(), settings(async url => {
    if (url.includes('telegram.org')) { sent = true; return reply({ ok: true }); }
    assert.equal(sent, true);
    return new Promise(() => {});
  }));
  const body = await response.json();
  assert.equal(body.telegramDelivered, true);
  assert.equal(body.firestoreStored, false);
});

test('database-only persistence is saved, never claimed as notified', async () => {
  const response = await handleEnquiryRequest(request(), settings(async url => url.includes('telegram.org')
    ? reply({ ok: false, description: 'Forbidden' }, 403)
    : reply({ name: 'projects/test/documents/projectEnquiries/test' })));
  assert.equal(response.status, 202);
  assert.deepEqual(Object.assign(await response.json(), { requestId: null }), {
    success: true, delivery: 'saved', telegramDelivered: false, firestoreStored: true, requestId: null,
  });
});

test('both failures return an actionable error instead of success', async () => {
  const response = await handleEnquiryRequest(request(), settings(async () => reply({ ok: false }, 403)));
  const body = await response.json();
  assert.equal(response.status, 502);
  assert.equal(body.success, false);
  assert.match(body.error, /WhatsApp/);
});

test('hanging Telegram response bodies have a deadline', async () => {
  const response = await handleEnquiryRequest(request(), settings(async url => url.includes('telegram.org')
    ? { ok: true, status: 200, json: () => new Promise(() => {}) }
    : reply({ name: 'projects/test/documents/projectEnquiries/test' })));
  assert.equal(response.status, 202);
  assert.equal((await response.json()).telegramDelivered, false);
});

test('status update timeouts cannot turn a delivered enquiry into failure', async () => {
  const response = await handleEnquiryRequest(request(), settings(async (url, init) => {
    if (init.method === 'PATCH') return new Promise(() => {});
    return url.includes('telegram.org') ? reply({ ok: true }) : reply({ name: 'projects/test/documents/projectEnquiries/test' });
  }));
  assert.equal(response.status, 200);
  assert.equal((await response.json()).telegramDelivered, true);
});

test('Firebase credential failures are isolated from Telegram', async () => {
  const config = settings(async () => reply({ ok: true }));
  config.firestore.authorization = async () => { throw new Error('bad server credentials'); };
  const response = await handleEnquiryRequest(request(), config);
  const body = await response.json();
  assert.equal(body.telegramDelivered, true);
  assert.equal(body.firestoreStored, false);
});

test('configured authorization is sent only to Firestore', async () => {
  const config = settings(async (url, init) => {
    assert.equal(init.headers.Authorization, url.includes('telegram.org') ? undefined : 'Bearer test-access');
    return url.includes('telegram.org') ? reply({ ok: true }) : reply({ name: 'projects/test/documents/projectEnquiries/test' });
  });
  config.firestore.authorization = async () => 'Bearer test-access';
  assert.equal((await handleEnquiryRequest(request(), config)).status, 200);
});

test('invalid names, phones, contact choices and lengths are rejected before any external request', async () => {
  const badInputs = [{ name: 'a' }, { phone: 'abc12345' }, { preferredContactMethod: 'email' }, { preferredContactTime: 'night' }, { projectGoal: 'x'.repeat(ENQUIRY_LIMITS.projectGoal + 1) }, { businessName: 'x'.repeat(121) }];
  for (const invalid of badInputs) {
    const response = await handleEnquiryRequest(request({ ...lead, ...invalid }), settings(async () => assert.fail('must not send')));
    assert.equal(response.status, 400);
    assert.ok((await response.json()).fieldErrors);
  }
});

test('malformed JSON and excessive request bodies are client errors', async () => {
  const config = settings(async () => assert.fail('must not send'));
  const malformed = new Request('http://localhost', { method: 'POST', body: '{invalid' });
  assert.equal((await handleEnquiryRequest(malformed, config)).status, 400);
  assert.equal((await handleEnquiryRequest(request({ ...lead, extra: 'x'.repeat(25000) }), config)).status, 413);
});

test('the longest valid enquiry fits one Telegram message without losing details', () => {
  const longest = values => [...values].sort((a, b) => b.length - a.length)[0];
  const input = enquirySchema.parse({ ...lead,
    ...Object.fromEntries(Object.entries(ENQUIRY_LIMITS).filter(([key]) => key !== 'phone').map(([key, limit]) => [key, 'x'.repeat(limit)])),
    businessType: longest(BUSINESS_TYPES), projectType: longest(PROJECT_TYPES), budget: longest(BUDGET_RANGES), timeline: longest(TIMELINES), preferredContactTime: 'afternoon',
  });
  const text = formatTelegramMessage(input, '00000000-0000-4000-8000-000000000000');
  assert.ok(text.length <= 4096, `message is ${text.length} characters`);
  assert.ok(text.includes(input.projectGoal));
  assert.ok(text.includes(input.reference));
});

test('network errors never expose bot credentials, contact details or URLs in logs', async () => {
  const logs = [];
  const config = settings(async () => { throw new Error('https://api.telegram.org/botSECRET/sendMessage name=PRIVATE'); });
  config.log = (...args) => logs.push(args);
  await handleEnquiryRequest(request(), config);
  assert.doesNotMatch(JSON.stringify(logs), /SECRET|PRIVATE|https/);
  assert.match(JSON.stringify(logs), /NETWORK_OR_RESPONSE_ERROR/);
});

test('429 and malformed provider responses never count as delivery', async () => {
  for (const response of [reply({ ok: false }, 429), new Response('<html>Error</html>', { status: 502 })]) {
    const result = await handleEnquiryRequest(request(), settings(async url => url.includes('telegram.org') ? response : reply({}, 403)));
    assert.equal(result.status, 502);
  }
});

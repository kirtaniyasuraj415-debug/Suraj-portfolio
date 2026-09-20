import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import assert from 'node:assert/strict';
import fs from 'node:fs';

// Production UI, mocked provider responses: no real messages are sent by this test.
const port = 3107;
const base = `http://127.0.0.1:${port}`;
const server = spawn(process.execPath, ['node_modules/next/dist/bin/next', 'start', '-p', String(port), '-H', '127.0.0.1'], { stdio: ['ignore', 'pipe', 'pipe'] });
let serverLog = '';
server.stdout.on('data', data => { serverLog += data; });
server.stderr.on('data', data => { serverLog += data; });
let browser;
const errors = [];
const captures = [];
const results = [];

async function open(viewport, url) {
  const context = await browser.newContext({ viewport, isMobile: viewport.width < 600, hasTouch: viewport.width < 600 });
  const page = await context.newPage();
  page.on('pageerror', error => errors.push(error.message));
  await page.route(/google-analytics|googletagmanager/, route => route.abort());
  await page.goto(base + url, { waitUntil: 'networkidle' });
  return page;
}
async function fill(page) {
  await page.locator('[name="name"]').fill('Browser Test');
  await page.locator('[name="phone"]').fill('+91 90000 00000');
  await page.locator('[name="businessName"]').fill('Test Studio');
  await page.locator('[name="projectGoal"]').fill('Website form verification only.');
}
async function respond(page, body, status = 200) {
  await page.unroute('**/api/project-enquiry');
  await page.route('**/api/project-enquiry', async route => {
    captures.push(route.request().postDataJSON());
    await route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) });
  });
}

(async () => {
  for (let count = 0; count < 100; count++) {
    if (server.exitCode !== null) throw new Error('Server stopped: ' + serverLog);
    try { if ((await fetch(base)).ok) break; } catch {}
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  browser = await chromium.launch({
    ...(process.env.BROWSER_EXECUTABLE_PATH ? { executablePath: process.env.BROWSER_EXECUTABLE_PATH } : {}),
    headless: true, args: ['--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu', '--no-zygote'],
  });
  const desktop = await open({ width: 1440, height: 1000 }, '/start-project');
  await desktop.getByRole('button', { name: 'Send Project Enquiry', exact: true }).click();
  assert.equal(await desktop.locator('[name="name"]').evaluate(el => el === document.activeElement), true);
  assert.equal(captures.length, 0);
  results.push('Invalid form focuses the first field without sending');
  await fill(desktop);
  await desktop.locator('[name="projectType"]').selectOption('E-commerce Store');
  await desktop.locator('[name="budget"]').selectOption('₹30,000 – ₹60,000');
  await desktop.locator('[name="preferredContactMethod"][value="phone"]').check();
  await desktop.locator('[name="preferredContactTime"][value="evening"]').check();
  await desktop.locator('[name="preferredContactTime"][value="evening"]').click();
  assert.equal(await desktop.locator('[name="preferredContactTime"][value="evening"]').isChecked(), true);
  await respond(desktop, { success: true, telegramDelivered: true, firestoreStored: false, delivery: 'sent' });
  await desktop.getByRole('button', { name: 'Send Project Enquiry', exact: true }).click();
  await desktop.getByRole('dialog').waitFor();
  assert.match(await desktop.getByRole('dialog').innerText(), /ENQUIRY DELIVERED SUCCESSFULLY/);
  assert.equal(captures.at(-1).preferredContactMethod, 'phone');
  assert.equal(captures.at(-1).preferredContactTime, 'evening');
  assert.equal(captures.at(-1).projectType, 'E-commerce Store');
  results.push('Desktop dedicated form sends all selected choices and confirms delivery');
  await desktop.getByRole('button', { name: 'Done', exact: true }).click();
  assert.equal(await desktop.locator('[name="name"]').inputValue(), '');
  await desktop.locator('[name="preferredContactMethod"][value="whatsapp"]').press('ArrowRight');
  assert.equal(await desktop.locator('[name="preferredContactMethod"][value="phone"]').isChecked(), true);
  results.push('Native radio keyboard selection and post-success reset work');

  const mobile = await open({ width: 390, height: 844 }, '/#enquiry');
  await fill(mobile);
  await mobile.locator('[name="preferredContactMethod"][value="phone"]').tap();
  await mobile.locator('[name="preferredContactMethod"][value="whatsapp"]').tap();
  await mobile.locator('[name="preferredContactTime"][value="morning"]').tap();
  await mobile.locator('[name="preferredContactTime"][value="afternoon"]').tap();
  assert.equal(await mobile.locator('[name="preferredContactMethod"]:checked').count(), 1);
  assert.equal(await mobile.locator('[name="preferredContactTime"]:checked').count(), 1);
  assert.equal(await mobile.locator('[name="preferredContactTime"][value="afternoon"]').isChecked(), true);
  await mobile.waitForFunction(() => getComputedStyle(document.querySelector('[name="preferredContactTime"][value="afternoon"] + span')).borderTopColor === 'rgb(248, 123, 56)');
  await respond(mobile, { success: false, error: 'Test delivery failure. Your details are still here.' }, 502);
  await mobile.getByRole('button', { name: 'Send Project Enquiry', exact: true }).tap();
  await mobile.locator('form [role="alert"]').waitFor();
  assert.equal(await mobile.locator('[name="name"]').inputValue(), 'Browser Test');
  assert.equal(await mobile.locator('dialog').count(), 0);
  results.push('Mobile homepage touch choices work; failed submissions preserve details');
  await respond(mobile, { success: true, telegramDelivered: false, firestoreStored: true, delivery: 'saved' }, 202);
  await mobile.getByRole('button', { name: 'Send Project Enquiry', exact: true }).tap();
  await mobile.getByRole('dialog').waitFor();
  const partialText = await mobile.getByRole('dialog').innerText();
  assert.match(partialText, /NOTIFICATION UNCONFIRMED/);
  assert.doesNotMatch(partialText, /DELIVERED SUCCESSFULLY/);
  await mobile.getByRole('button', { name: 'Done', exact: true }).tap();
  assert.equal(await mobile.locator('[name="name"]').inputValue(), 'Browser Test');
  results.push('Database-only save never falsely confirms a Telegram notification');

  await mobile.unroute('**/api/project-enquiry');
  await mobile.route('**/api/project-enquiry', route => route.fulfill({ status: 404, contentType: 'text/html', body: '<html>Not found</html>' }));
  await mobile.getByRole('button', { name: 'Send Project Enquiry', exact: true }).tap();
  await mobile.locator('form [role="alert"]').waitFor();
  assert.match(await mobile.locator('form [role="alert"]').innerText(), /couldn’t confirm delivery/);
  results.push('Missing/non-JSON server endpoint shows an error and preserves the form');

  const before = captures.length;
  await mobile.unroute('**/api/project-enquiry');
  await mobile.route('**/api/project-enquiry', async route => {
    captures.push(route.request().postDataJSON());
    await new Promise(resolve => setTimeout(resolve, 200));
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, telegramDelivered: true, firestoreStored: false }) });
  });
  await mobile.locator('form').evaluate(form => { form.requestSubmit(); form.requestSubmit(); });
  await mobile.getByRole('dialog').waitFor();
  assert.equal(captures.length - before, 1);
  results.push('Double submission creates one request');

  const narrow = await open({ width: 320, height: 780 }, '/start-project');
  assert.equal(await narrow.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
  await narrow.locator('[name="preferredContactTime"][value="anytime"]').tap();
  assert.equal(await narrow.locator('[name="preferredContactTime"][value="anytime"]').isChecked(), true);
  results.push('320px layout has no horizontal overflow and all choices remain usable');
  fs.mkdirSync('work/booking-verification', { recursive: true });
  await narrow.screenshot({ path: 'work/booking-verification/mobile.png', fullPage: true });
  await desktop.screenshot({ path: 'work/booking-verification/desktop.png', fullPage: true });
  assert.deepEqual(errors, []);
  const report = { passed: results.length, results, pageErrors: errors };
  fs.writeFileSync('work/booking-verification/report.json', JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
})().catch(error => { console.error(error); process.exitCode = 1; }).finally(async () => {
  await browser?.close();
  server.kill('SIGTERM');
});

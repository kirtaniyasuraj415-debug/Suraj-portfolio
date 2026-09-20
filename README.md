# Suraj Kirtaniya — Portfolio

A responsive web developer portfolio inspired by the supplied orange-and-black reference. The hero layers oversized typography behind a transparent, warmly lit portrait of Suraj. Includes about, concept projects, services, process, and email contact sections.

## Content

- The portrait was generated from Suraj’s supplied photograph with his requested studio lighting and clothing treatment.
- The four project previews are explicitly labeled independent concepts, not completed client engagements.
- The homepage and `/start-project` share an enquiry form. It posts to a Next.js server endpoint, sends a Telegram notification and separately attempts a Firestore backup.
- No invented client testimonials, delivery counts, or ratings.
- Stock photography credits and source pages are in `docs/image-sources.json`. Photos are used under the Unsplash license.
- Local fonts: Antonio and DM Sans (Google Fonts, SIL Open Font License).

## Implementation

Uses Next.js 16, React 19, Tailwind, shadcn dialog and sheet primitives, and Lucide icons. Fonts and images are local assets. The former scroll-video sequence has been removed at the user’s request.

The marquee is a CSS animation. Reduced-motion preferences disable animation and smooth scrolling. Native anchor links, keyboard focus, mobile navigation, and project dialogs provide accessible interactions.

## Development and deployment

Requires Node.js 22.18 or newer. Install with `bun install --frozen-lockfile` (the repository includes `bun.lock`) or `npm install`. Use `npm run dev` locally. A production deployment runs `npm run build` then `npm start`.

**Deploy the Next.js server, not just static HTML.** Both forms use `POST /api/project-enquiry` on the same origin. GitHub Pages, a static export, or a preview serving only the frontend cannot run this endpoint. With standalone containers, run `.next/standalone/server.js` and include `public` and `.next/static` in the standalone output.

After importing changes into AI Studio, sync the latest GitHub `main` and redeploy. An already imported AI Studio project does not necessarily update when GitHub changes. Testing a bot separately in AI Studio does not test the deployed website endpoint.

## Telegram notifications

Set `TELEGRAM_BOT_TOKEN` and `TELEGRAM_CHAT_ID` in the **server deployment environment**. See `.env.example` for names; do not put these in frontend code. The existing private deployment fallback remains server-only for compatibility. Non-empty environment values take precedence, so check that deployment settings are not overriding the intended bot/chat with stale values.

Open the bot and press Start. For groups/channels, give the bot permission to post to that destination. Telegram is called immediately, independently of Firebase. A successful confirmation is shown only when Telegram returns `ok: true`; a database-only save shows an explicit unconfirmed-notification message. Failed or timed-out requests keep the entered details. No automatic resend is performed after a timeout, because the provider may already have received the request.

Normal delivery starts as soon as the validated form reaches the server; exact latency depends on the host and Telegram. The Telegram request has an 8-second deadline including response-body reading. The form has a 20-second timeout. Project details are limited to 2,500 characters so every accepted field fits a single Telegram message; validation runs in both browser and server.

## Firebase / Firestore setup

The public web configuration is in `lib/firebase-config.ts`. Analytics is optional and loaded lazily; it cannot block the form controls. An API key identifies the Firebase project but does **not** grant the server database access.

For project `suraj-portfolio-b90e6`:

1. Open [Firestore Database](https://console.firebase.google.com/project/suraj-portfolio-b90e6/firestore) and create/activate the default database if needed.
2. Enable the [Cloud Firestore API](https://console.cloud.google.com/apis/library/firestore.googleapis.com?project=suraj-portfolio-b90e6). During diagnosis this API returned `403 PERMISSION_DENIED` with a disabled/not-yet-used API message.
3. Configure server authentication. On Google Cloud Run use the runtime service account / Application Default Credentials. On other hosts set `FIREBASE_SERVICE_ACCOUNT_JSON` to a service-account JSON secret in hosting settings, or provide `GOOGLE_APPLICATION_CREDENTIALS` as a server-only file path.
4. That service account needs Firestore access in this project (for example the Cloud Datastore User role). Keep database rules private; no public-read rule is required. Never add the service-account JSON file to GitHub or chat.
5. Redeploy after changing environment variables. Server requests use OAuth authorization when configured; otherwise the existing rules-based REST behavior is preserved.

The `projectEnquiries` document stores all form fields, creation time, source, and Telegram status. Failed Firestore writes do not stop Telegram delivery. Database writes and notification-status updates have bounded deadlines.

Official references: [Firestore REST authentication](https://firebase.google.com/docs/firestore/use-rest-api), [Google server authentication library](https://github.com/googleapis/google-auth-library-nodejs), [Telegram sendMessage](https://core.telegram.org/bots/api#sendmessage).

## Diagnosing a deployment

Open `/api/project-enquiry` on the deployed site first. It must return JSON with `version: enquiry-delivery-v2`. If it returns a webpage, 404, or another version, the corrected server has not been deployed there. This read-only check exposes no credentials or leads.

Then use the website's actual form and inspect its `POST /api/project-enquiry` network request:

| Result | Meaning / action |
| --- | --- |
| 404, 405, or an HTML response | The deployed frontend is missing the Next.js POST endpoint, or the wrong server/build is running. Redeploy the Next.js app. |
| 400 | Field validation failed; fix the highlighted values. |
| 200 with `telegramDelivered: true` | Telegram acknowledged the notification. Check that the deployment chat ID is the intended destination. |
| 202 with `firestoreStored: true` and `telegramDelivered: false` | Details were saved but notification was not confirmed. Use the WhatsApp fallback and check server logs. |
| 502 | Neither provider acknowledged the enquiry. Values remain in the form. |

Provider logs include a request reference and a code, never the bot token, full URL or customer's form data. Telegram HTTP 401 indicates bot authentication trouble; 403 commonly means the bot was blocked or cannot post; 400 requires checking the destination; 429 indicates rate limiting. `TIMEOUT` indicates no response within the deadline, not proof that no message reached Telegram.

## Verification

- `npm test`: provider-isolated API regression tests. No real messages or database writes.
- `npm run lint` and `npx tsc --noEmit`: static checks.
- `npm run build`: production compilation and route generation.
- `npx playwright install chromium`, then `npm run test:browser` after a build: exercises both forms, touch and keyboard choices, invalid data, delivery/partial/failure confirmation, duplicate submit protection and narrow layouts. It starts a local production server and mocks the enquiry endpoint, so no real customer notification is sent. Optional `BROWSER_EXECUTABLE_PATH` selects an already installed Chromium.

Browser screenshots and the test report are written to the ignored `work/booking-verification/` directory. Browser checks emulate screen sizes and touch; they are not a physical-phone test. Live production delivery additionally needs the actual deployment URL and outbound access to Telegram.

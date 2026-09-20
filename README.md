# Suraj Kirtaniya — Portfolio

A responsive web developer portfolio inspired by the supplied orange-and-black reference. The hero layers oversized typography behind a transparent, warmly lit portrait of Suraj. Includes about, concept projects, services, process, and email contact sections.

## Content

- The portrait was generated from Suraj’s supplied photograph with his requested studio lighting and clothing treatment.
- The four project previews are explicitly labeled independent concepts, not completed client engagements.
- Contact links open an email draft to kirtaniyasuraj415@gmail.com; the site does not send or store messages.
- No invented client testimonials, delivery counts, or ratings.
- Stock photography credits and source pages are in `docs/image-sources.json`. Photos are used under the Unsplash license.
- Local fonts: Antonio and DM Sans (Google Fonts, SIL Open Font License).

## Implementation

Uses the existing Vinext / React Sites starter, Tailwind, shadcn dialog and sheet primitives, and Lucide icons. Fonts and images are local assets. The former scroll-video sequence has been removed at the user’s request.

The marquee is a CSS animation. Reduced-motion preferences disable animation and smooth scrolling. Native anchor links, keyboard focus, mobile navigation, and project dialogs provide accessible interactions.

## Development and publishing

Follow the Sites building/hosting skills for managed preview, builds, and publishing. Preserve the existing project identity in `.openai/hosting.json`.

## Telegram Lead Notifications Setup

The `/start-project` enquiry page sends project leads directly to your Telegram bot via a secure server-side endpoint (`POST /api/project-enquiry`).

Telegram setup requires two environment variables:

```env
TELEGRAM_BOT_TOKEN=
TELEGRAM_CHAT_ID=
```

### Steps to configure:

1. **Create a Telegram bot using BotFather**:
   - Open Telegram and search for `@BotFather`.
   - Send `/newbot` and follow the prompts to choose a name and username for your bot.

2. **Obtain the bot token**:
   - BotFather will provide an HTTP API token (e.g. `123456789:ABCdefGhIJKlmNoPQRsTUVwxyZ`).
   - This value corresponds to `TELEGRAM_BOT_TOKEN`.

3. **Start/chat with the bot or add it to the desired destination**:
   - Open your new bot's link in Telegram and press **Start** (or send any message like `/start`).
   - If you want notifications sent to a Telegram group or channel, add your bot as an admin/member to that group/channel.

4. **Obtain the destination chat ID**:
   - Send a message to your bot or group.
   - Open `https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getUpdates` in your browser.
   - Look for `"chat":{"id":123456789}` in the JSON output.
   - This number is your `TELEGRAM_CHAT_ID`.

5. **Add both values as deployment environment variables**:
   - Set `TELEGRAM_BOT_TOKEN` and `TELEGRAM_CHAT_ID` in your production environment settings or container configuration.

6. **Redeploy**:
   - Once configured, all submitted project enquiries will instantly notify your Telegram chat.


## Verification

The desktop and mobile layouts were checked in the browser, including narrow 320px and 390px frames. Verified the layered hero, horizontal overflow, mobile menu section navigation, project dialog opening and dismissal, and email destinations. Mobile checks use browser viewport simulation, not a physical-device performance benchmark.

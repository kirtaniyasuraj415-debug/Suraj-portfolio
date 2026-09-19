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

## Verification

The desktop and mobile layouts were checked in the browser, including narrow 320px and 390px frames. Verified the layered hero, horizontal overflow, mobile menu section navigation, project dialog opening and dismissal, and email destinations. Mobile checks use browser viewport simulation, not a physical-device performance benchmark.

# NHGPPO website: rules for Claude Code

Version 1.4 · 19 November 2026 · Owner: Jamie Durham (Systemwork) · Client: NHGPPO Ltd

Static Astro site for nhgppo.co.uk, hosted on Netlify (NHGPPO's team). Built from the approved design: Concept 2 "Two doors", canvas https://claude.ai/artifact/VWwEWky5W9dDSDWnMUE3AH. Project docs live in the claude.ai Project "NHS" (START-HERE, spec, chat-jobs, runbooks). Board: https://claude.ai/artifact/CNjPJBpETHZ8Ma6ji4E4yk

## How to ship
1. Work only from a board card that is in Doing.
2. Branch from main, change, run `npm run build` (the build runs the gate and fails on any broken rule).
3. Open a pull request. Jamie reviews and merges. Claude never merges.
4. Nothing is live until it has been read on the live domain.

## Rules the gate enforces (scripts/gate.mjs)
- R2 No NHS logo or NHS identity (no NHS blue #005EB8). The site uses NHGPPO's own logo, copied as it is (`public/logo.svg`).
- R3 No placeholder text (lorem ipsum, TODO, TBC, [date]).
- R4 No secrets in the repo. Keys go in Netlify's environment only; `.env` is ignored.
- R5 WCAG 2.2 AA: axe rules on every page, one h1, alt on every image, zoom allowed, lang en-GB.
- R6 Same URLs as the old site: `/`, `/about-us/`, `/services/`, `/the-team/`, `/mission/`, `/contact/`, plus `/accessibility/` and `/privacy-notice/`. Services anchors: `#service-provision`, `#pcn-support`, `#partnership-working`.
- R8 Security headers in `netlify.toml`: HSTS, nosniff, frame, referrer, permissions, CSP.
- Style: UK English, no em-dashes or en-dashes.
New rules get a test in the gate that is shown to fail first.

## Design
- Tokens in `src/styles/site.css` come from the canvas `project/handoff/tokens.json`. Navy and white do the work; the bright colours live only in the logo and the 5px top bar. Green tint for patient guidance, red for errors only, yellow for keyboard focus only.
- Fonts are self-hosted from `@fontsource` (Poppins 400, 500, 600; Atkinson Hyperlegible Next 400, 600).
- Icons are Tabler outline, stroke 1.75 (`src/components/Icon.astro`).
- Dark mode follows `prefers-color-scheme`.

## Open items (not in this build)
- Contact form: waits on NHGPPO's privacy wording (NHG-006). The privacy notice describes the site as it is (no forms, no cookies).
- Sanity content model (NHG-004): content is in the pages for now; Sanity project ID `nkph39u2`.
- The sculptural renders from the canvas (decorative) are not yet in the repo; Tabler icons stand in.
- Testimonial consent (NHG-011), services and contracts check (NHG-012), favicon (NHG-013), logo master (NHG-014).

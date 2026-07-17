---
title: Homepage GSAP and Lenis Motion System
status: draft
created: 2026-07-17
depth: standard
type: software
domain: software
source: User grilling session and https://incredibles.dev motion reference
deepened: null
---

# Homepage GSAP and Lenis Motion System

> **Hero note:** GitHub issue #3 supersedes this historical plan's references to
> retaining a particle hero. The active homepage hero direction is documented in
> [`docs/hero-implementation-handoff.md`](../hero-implementation-handoff.md).
> The below-the-fold GSAP/Lenis decisions remain historical context.

## Summary

Add a homepage-only motion system that gives Obsolete a controlled editorial feel: subtle desktop scroll inertia, concise one-time content reveals, a masked featured-work image treatment, and a continuous orange takeover into the Contact CTA. Use Lenis and GSAP/ScrollTrigger as progressive enhancement, preserve the existing layout and copy, simplify motion on mobile, honor reduced-motion preferences, and remove effects whenever they threaten smoothness.

## Goal

- **Primary outcome:** Make the existing homepage feel authored and fluid without turning it into a motion demo or redesigning its structure.
- **Success looks like:** The homepage has a brief staged hero entrance, subtle desktop inertia, clipped typography and image-mask reveals, and a reversible non-pinned Contact takeover; mobile, reduced-motion, no-JavaScript, anchors, and other routes remain robust.
- **Non-goals:** Redesigning page geometry or copy, copying the reference site's branding/layout, animating `/work` or `/contact`, adding sticky-header behavior, or introducing long pinned/cinematic sequences.

## Source & Origin Trace

- **User request:** Use GSAP for “cool animations,” buttery smooth scrolling, and scroll-linked animation.
- **Reference:** `https://incredibles.dev` is a benchmark for motion feel only, not layout, spacing, branding, or content staging.
- **Repository guidance:** `AGENTS.md`; Astro project conventions and background-dev-server commands.
- **External implementation references:**
  - GSAP ScrollTrigger: `https://gsap.com/docs/v3/Plugins/ScrollTrigger/`
  - GSAP context cleanup: `https://gsap.com/docs/v3/GSAP/gsap.context()/`
  - GSAP responsive/reduced-motion setup: `https://gsap.com/docs/v3/GSAP/gsap.matchMedia()/`
  - Lenis README and GSAP integration: `https://github.com/darkroomengineering/lenis`
  - Astro client scripts: `https://docs.astro.build/en/guides/client-side-scripts/`
- **Origin IDs preserved:** `D-001`–`D-012` and `AE-001`–`AE-011` below.
- **Origin coverage check:** Every decision and acceptance example maps to at least one implementation unit; excluded ideas are listed under Out of Scope.

## Decisions

| ID    | Decision                                                                                                         | Rationale                                                                                           | Source                                                |
| ----- | ---------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| D-001 | Use a controlled editorial motion direction.                                                                     | Motion should support credibility and hierarchy rather than produce constant spectacle.             | Grilling session                                      |
| D-002 | Borrow only motion feel from `incredibles.dev`; preserve Obsolete's layout and copy.                             | The reference's long pinned spatial choreography would require a redesign the user rejected.        | Grilling session                                      |
| D-003 | Scope the first pass to the homepage.                                                                            | Keeps tuning focused and prevents global behavior from affecting utilitarian routes.                | Grilling session                                      |
| D-004 | Use Lenis for inertia and GSAP + ScrollTrigger for choreography.                                                 | Separates smooth-scroll responsibility from animation while following the selected reference stack. | Grilling session                                      |
| D-005 | Enable subtle inertia only on desktop/fine-pointer contexts; use mobile-lite motion with native touch scrolling. | Preserves touch behavior and reduces mobile instability.                                            | Grilling session                                      |
| D-006 | Use clipped text reveals and a featured-image mask/scale as the two main recurring motifs.                       | A limited vocabulary protects the controlled editorial direction.                                   | Grilling session                                      |
| D-007 | Run entrance reveals once; keep the Contact takeover reversible because it is scroll-linked.                     | Prevents visual churn while preserving a responsive section transition.                             | Grilling session                                      |
| D-008 | Stage the hero over roughly 0.8–1.2 seconds and retain the existing particle visual.                             | Adds authored first-load polish without delaying access to content.                                 | Grilling session                                      |
| D-009 | Pause the Remotion Player when its hero visual is offscreen and resume when visible.                             | Avoids background rendering competing with scroll performance.                                      | Grilling session                                      |
| D-010 | Keep the header static in normal document flow.                                                                  | Avoids another motion system and preserves viewport space assumptions.                              | Grilling session                                      |
| D-011 | Make the orange Contact transition a continuous wipe with no pinning or scroll lock.                             | Delivers a signature moment while preserving direct page movement.                                  | Grilling session                                      |
| D-012 | Smoothness, accessibility, and progressive enhancement beat visual complexity.                                   | The requested “buttery” feel fails if effects cause frame drops or hide content.                    | Grilling session and existing reduced-motion handling |

## Acceptance Examples

| ID     | Scenario                                                                             | Expected outcome                                                                                                                                   |
| ------ | ------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| AE-001 | Desktop, fine pointer, normal motion                                                 | Scrolling has restrained inertia without obvious input lag; ScrollTrigger remains synchronized.                                                    |
| AE-002 | Mobile/touch viewport                                                                | Native touch scrolling remains intact; only short, simplified entrance motion runs; no Lenis or pinning.                                           |
| AE-003 | `prefers-reduced-motion: reduce`                                                     | Lenis and non-essential GSAP choreography are disabled, content is immediately visible, and the hero remains static.                               |
| AE-004 | Fresh homepage load                                                                  | Hero eyebrow, title lines, lead/actions, and visual settle in over about 0.8–1.2 seconds without blocking interaction.                             |
| AE-005 | Hero leaves and re-enters the viewport                                               | The Remotion Player pauses offscreen and resumes only when visible and motion is allowed.                                                          |
| AE-006 | Featured Work first enters the viewport                                              | Heading/content reveal once and the project image unveils through a restrained mask/scale treatment.                                               |
| AE-007 | User scrolls down, then back up                                                      | One-time entrance reveals do not replay; no duplicate triggers or stale inline states appear.                                                      |
| AE-008 | User approaches Contact from Capabilities                                            | Orange continuously covers the outgoing dark section as normal scrolling proceeds; the effect reverses cleanly when scrolling back and never pins. |
| AE-009 | JavaScript fails, homepage is opened directly at a hash, or another route is visited | Content remains visible and usable; `/work`, `/contact`, header behavior, and static layout are unchanged.                                         |
| AE-010 | Skip link and in-page navigation are used                                            | Skip-link behavior remains immediate and accessible; intended homepage anchors land correctly without Lenis fighting native/CSS scrolling.         |
| AE-011 | Midrange-device performance check                                                    | No effect with visible recurring frame drops ships; expensive effects are reduced or removed rather than accepted.                                 |

## Scope

### In Scope

- Add `gsap` and `lenis` using the repository's detected Bun workflow.
- Add a homepage-scoped motion bootstrap and cleanup boundary.
- Synchronize Lenis with ScrollTrigger on eligible desktop contexts.
- Reconcile existing CSS smooth scrolling with Lenis, native anchors, and reduced motion.
- Add stable motion hooks/wrappers to homepage components without changing semantic reading order or copy.
- Implement the hero entrance, one-time text/image reveals, and continuous Contact takeover.
- Pause/resume the Remotion Player according to visibility and motion preference.
- Test breakpoint changes, reduced-motion changes, direct hash loads, no-JavaScript fallback, and other-route isolation.

### Out of Scope

- Motion on `/work` or `/contact`.
- Global Lenis initialization in `BaseLayout.astro`.
- GSAP ScrollSmoother, sticky or shrinking header behavior, pinned sections, scroll snapping, strong parallax, cursor effects, or a page-transition system.
- Replacing the Remotion particle visual.
- Changing copy, section order, desktop/mobile layout intent, or adding decorative assets.
- Recreating the reference site's large whitespace/pinned-typography choreography.
- Adding a new automated browser-test framework solely for this pass unless implementation uncovers a stable existing option.

### Assumptions

- Modern evergreen Chrome, Safari, and Firefox are the supported browser baseline.
- Bun is authoritative because project preflight reports it as the package manager; `package-lock.json` should not be changed unless repository policy explicitly requires dual-lockfile maintenance.
- Current uncommitted and untracked files are user work. Implementation must inspect and preserve them rather than resetting, overwriting, or broadly formatting them.
- The site currently uses full-page navigation, not Astro ClientRouter/view transitions; homepage-only initialization can therefore remain local to `index.astro`, while still providing explicit cleanup for media-query rebuilds and future safety.
- Existing content remains fully visible before JavaScript initializes and after animation cleanup.

### Planning-Time Open Questions

- None. The grilling session resolved the material product and architecture forks.

### Implementation-Time Questions

- Tune exact Lenis duration/easing and animation distances against the reference by feel, while staying within D-001 and D-012.
- Choose transform/overflow-mask versus `clip-path` per effect after profiling; preserve the same accepted visual result.
- Choose the exact IntersectionObserver threshold/root margin for pausing the hero based on observed playback and scroll behavior.
- Decide whether tiny rule-line draws remain incidental micro-motion; they must not become a third dominant motif.

## Context / Evidence

- `package.json:5-34` — Bun validation scripts are available, but GSAP and Lenis are not yet dependencies.
- `astro.config.mjs:1-13` — React is the only Astro integration; no router or animation integration is configured.
- `src/pages/index.astro:9-14` — The homepage is a simple Hero → Featured Work → Capabilities → Contact CTA composition and is the correct place to scope the motion bootstrap.
- `src/layouts/BaseLayout.astro:31-36` — The shared skip link, static Header, and main slot serve every route; homepage animation should not be initialized here.
- `src/components/Header.astro:6-24` — Existing header markup is static and is intentionally outside the animation scope.
- `src/components/Hero.astro:7-41` — Existing title-line spans, clarification block, actions, and visual provide natural staged-reveal targets; the React island uses `client:only="react"`.
- `src/components/Hero.astro:193-197` — Existing reduced-motion CSS establishes a project accessibility precedent.
- `src/components/FeaturedWork.astro:7-82` — Heading, introduction, proof image, ledger, and actions provide stable reveal groups; the image already has fixed dimensions/aspect behavior.
- `src/components/Capabilities.astro:5-50` — Header, introduction, and repeated capability rows are suitable for one-time grouped reveals without pinning.
- `src/components/ContactCta.astro:5-23` — The existing orange section directly follows the dark Capabilities section, enabling the continuous takeover at their boundary.
- `src/components/ObsoleteHeroIsland.tsx:14-82` — The Player already tracks reduced motion but currently autoplays/loops whenever allowed; installed `@remotion/player` types expose `PlayerRef.play()` and `pause()`.
- `src/styles/global.css:3-12` — `html { scroll-behavior: smooth; }` must be reconciled to avoid double-smoothing and must become immediate under reduced motion.
- Official Lenis guidance synchronizes `lenis.on('scroll', ScrollTrigger.update)` and Lenis RAF work with the GSAP ticker; cleanup must remove the ticker callback and destroy Lenis.
- Official GSAP guidance supports `gsap.context()` for collecting/reverting animations and ScrollTriggers and `gsap.matchMedia()` for responsive and reduced-motion setup/cleanup.
- Official Astro guidance confirms processed component/page `<script>` tags can import npm modules and are bundled, typed, and deduplicated.
- Repository preflight found no automated test directory; verification therefore combines project checks with explicit browser scenarios.

## Implementation Units

### U-001 — Establish the homepage motion runtime

- **Goal:** Add a homepage-only, disposable Lenis/GSAP runtime that supports responsive conditions, reduced motion, anchor correctness, and later section timelines.
- **Origin:** D-003, D-004, D-005, D-012; AE-001, AE-002, AE-003, AE-009, AE-010.
- **Likely files/areas:** `package.json`, `bun.lock`, `src/pages/index.astro`, new `src/scripts/home-motion.ts` (or equivalent homepage-scoped module), `src/styles/global.css`.
- **Dependencies:** None.
- **Guardrails:**
  - Use Bun and avoid opportunistic lockfile churn.
  - Register ScrollTrigger once; keep Lenis homepage-only.
  - Use one timing source for Lenis/GSAP synchronization and retain removable references for every ticker callback/listener.
  - Enable inertia only when motion is allowed and the context is desktop/fine-pointer; mobile and touch remain native.
  - Use `gsap.context()`/`gsap.matchMedia()` or equivalent explicit cleanup so breakpoint or preference changes do not duplicate triggers/listeners.
  - Default HTML/CSS must remain visible and usable if imports or initialization fail.
  - Do not globally intercept the shared skip link. Preserve hash/history and focus behavior for in-page navigation.
  - Do not add layout wrappers solely because ScrollSmoother patterns use them; Lenis does not require the rejected ScrollSmoother architecture.
- **Acceptance:** A no-op section choreography can run through the shared runtime; eligible desktop scrolling is subtly eased and synchronized, while mobile/reduced-motion/other routes stay native and leak-free.
- **Verification scenarios:**
  - Happy path: Open `/` on desktop and confirm subtle inertia with synchronized trigger positions.
  - Edge cases: Resize across the desktop/mobile breakpoint repeatedly; toggle reduced motion at runtime; refresh at a nonzero scroll position and at `/#featured-work`.
  - Error/failure path: Block JavaScript or force the motion module to fail during a local check; all content and native scrolling remain usable.
  - Accessibility: Activate the skip link and homepage hash links by keyboard; focus and destination remain correct.
  - Integration/user flow: Visit `/work` and `/contact`; verify no Lenis classes, ticker, or animation behavior is applied.
  - Regression check: Header remains static and the existing CSS layout is unchanged before timelines are added.
  - Covers: AE-001, AE-002, AE-003, AE-009, AE-010.
- **Risks:** Double-smoothing, stale triggers, duplicate ticker callbacks, and anchor interception. Mitigate with a single owner, explicit teardown, scoped selectors, and native fallback tests.

### U-002 — Add the hero entrance and offscreen Player lifecycle

- **Goal:** Deliver the brief staged hero entrance and stop the Remotion Player from consuming animation work while offscreen.
- **Origin:** D-006, D-007, D-008, D-009, D-012; AE-003, AE-004, AE-005, AE-007.
- **Likely files/areas:** `src/components/Hero.astro`, `src/components/ObsoleteHeroIsland.tsx`, the homepage motion runtime module.
- **Dependencies:** Establish the homepage motion runtime.
- **Guardrails:**
  - Keep the total entrance near 0.8–1.2 seconds and make interactive links available immediately.
  - Reuse existing title-line structure where practical; any added wrappers must not alter accessible naming or duplicate spoken text.
  - Apply hidden/offset states only after successful initialization and ensure cleanup restores stable visible styles.
  - Run the entrance once per page load; it must not replay on scroll-back.
  - Use the installed Player ref API and visibility observation rather than unmounting/recreating the composition on every viewport crossing.
  - Reduced-motion behavior remains static; do not resume playback when reduced motion is active.
  - Observation/timeline work must not cause React state churn on every scroll frame.
- **Acceptance:** The hero settles in with concise editorial timing; the particle Player visibly resumes when appropriate, pauses offscreen, and stays static for reduced-motion users.
- **Verification scenarios:**
  - Happy path: Fresh desktop load shows the staged sequence once and then normal scroll behavior.
  - Edge cases: Rapidly scroll past and back into the hero; background/foreground the tab; resize during the intro.
  - Error/failure path: If the Player ref is not yet available, the observer fails safely without breaking the React island.
  - Accessibility: Screen-reader text and action tab order are unchanged; reduced motion exposes final content immediately.
  - Integration/user flow: Scroll from the hero into Featured Work without overlapping or delayed entrance states.
  - Regression check: Existing fallback image remains available and the particle composition's visual dimensions/loop behavior are unchanged while visible.
  - Covers: AE-003, AE-004, AE-005, AE-007.
- **Risks:** Player ref timing, intersection thrash, and intro flash. Mitigate with idempotent visibility handling, conservative observer thresholds, and visible-by-default markup.

### U-003 — Implement one-time Featured Work and Capabilities reveals

- **Goal:** Establish the recurring motion vocabulary through clipped typography and one restrained image mask/scale, while keeping capability content calm and readable.
- **Origin:** D-001, D-002, D-006, D-007, D-012; AE-002, AE-003, AE-006, AE-007, AE-011.
- **Likely files/areas:** `src/components/FeaturedWork.astro`, `src/components/Capabilities.astro`, the homepage motion runtime module; component-local styles where masks require them.
- **Dependencies:** Establish the homepage motion runtime.
- **Guardrails:**
  - Preserve current section geometry, responsive layout, copy, links, figure semantics, and ordered-list semantics.
  - Treat clipped text and image mask/scale as the only major motifs; capability rows should use restrained grouped timing rather than bespoke effects per row.
  - Entrance triggers run once. Do not reverse or replay them when scrolling back.
  - Animate compositor-friendly properties first. Any `clip-path`, filter, or large paint area must survive profiling or be replaced with a cheaper mask/transform approach.
  - Mobile uses shorter distances/durations and no smooth-scroll dependency.
  - Reduced motion and initialization failure leave final states visible.
- **Acceptance:** Featured Work and Capabilities enter with a coherent editorial rhythm; the project image gets the only prominent mask/scale treatment; scrolling backward does not replay entrances.
- **Verification scenarios:**
  - Happy path: Slow and fast downward scrolling both resolve every group to its final state without partial clipping.
  - Edge cases: Enter a trigger from a deep-link/refresh position; resize while a reveal is in progress; test unusually short and tall viewports.
  - Error/failure path: Disable the motion module after markup changes; headings, image, facts, capability rows, and CTAs remain visible.
  - Accessibility: Reading order, heading hierarchy, image alt text, list semantics, and keyboard targets remain unchanged.
  - Integration/user flow: Hero completion flows naturally into Featured Work; Capabilities remains readable before the Contact transition begins.
  - Regression check: Existing hover/focus/reduced-motion CSS and responsive image source selection still work.
  - Performance: Record a representative scroll; simplify any recurring paint-heavy treatment that causes visible drops.
  - Covers: AE-002, AE-003, AE-006, AE-007, AE-011.
- **Risks:** Oversized image repaints, trigger timing after fonts/images settle, and content remaining clipped on fast scroll. Mitigate with bounded masks, refresh after stable layout, and explicit final states.

### U-004 — Build the continuous orange Contact takeover

- **Goal:** Create the signature reversible transition from dark Capabilities into the orange Contact CTA without pinning, scroll locking, or changing section order.
- **Origin:** D-001, D-002, D-006, D-011, D-012; AE-002, AE-003, AE-008, AE-011.
- **Likely files/areas:** `src/components/Capabilities.astro`, `src/components/ContactCta.astro`, the homepage motion runtime module; component-local transition-layer styles if required.
- **Dependencies:** Establish the homepage motion runtime and the stable final geometry from Featured Work/Capabilities reveals.
- **Guardrails:**
  - Normal document scrolling must continue throughout; no ScrollTrigger pin, snap, artificial spacer, or wheel lock.
  - Preserve the current orange final state and Contact content layout.
  - The takeover is scroll-scrubbed and reversible; Contact's text may use a concise clipped entrance but must become readable before interaction is expected.
  - The transition layer must not capture pointer events, hide focus targets, create horizontal overflow, or cover later content after its trigger range.
  - Mobile uses a shorter/lighter wipe; reduced motion uses the static section boundary.
  - Prefer transform/overflow techniques when `clip-path` produces costly full-width paints.
- **Acceptance:** Orange progressively and smoothly covers the outgoing dark field as the user scrolls into Contact, reverses cleanly on upward scroll, and never feels pinned.
- **Verification scenarios:**
  - Happy path: Scroll slowly and quickly through the boundary in both directions; wipe progress remains connected to scroll and resolves to exact dark/orange endpoints.
  - Edge cases: Stop mid-transition, reverse repeatedly, resize mid-wipe, and test short mobile landscape viewports.
  - Error/failure path: With JavaScript disabled, the normal hard boundary between Capabilities and Contact remains correct.
  - Accessibility: Contact heading, copy, CTA, focus outline, and contrast remain available throughout and at rest.
  - Integration/user flow: Capability anchor navigation and Contact CTA activation remain unaffected.
  - Regression check: No sticky header, layout spacer, horizontal scrollbar, or blank gap appears.
  - Performance: Inspect the full-width transition for paint spikes; simplify before shipping if smoothness degrades.
  - Covers: AE-002, AE-003, AE-008, AE-011.
- **Risks:** Full-viewport paint cost, stacking-context bugs, and scrub endpoints drifting after layout changes. Mitigate with isolated non-interactive layers, measured trigger geometry, and post-load refresh.

### U-005 — Harden lifecycle, accessibility, performance, and release evidence

- **Goal:** Prove the complete motion system meets the agreed fallbacks and does not regress routes, navigation, layout, or project checks.
- **Origin:** D-003, D-005, D-007, D-010, D-012; AE-001–AE-011.
- **Likely files/areas:** All files touched by the four feature units; project validation scripts; browser/manual verification notes.
- **Dependencies:** All four feature units.
- **Guardrails:**
  - Fix root causes; do not suppress lint/type errors or weaken reduced-motion handling.
  - Refresh scroll measurements only at meaningful layout-stability points, not continuously.
  - Confirm teardown removes Lenis RAF/ticker work, ScrollTriggers, observers, and media-query handlers.
  - Smoothness wins: reduce distances, masks, scrub work, or animation count before accepting frame drops.
  - Do not format or modify unrelated dirty files.
- **Acceptance:** Project checks pass, all acceptance examples have evidence, no blocking diagnostics remain in touched files, and manual desktop/mobile/reduced-motion/no-JS flows are documented.
- **Verification scenarios:**
  - Automated checks: `bun run check`, `bun run lint`, `bun run format:check`, and `bun run build`.
  - Desktop integration: Chromium plus a Safari/Firefox spot check where available; validate inertia, anchors, one-time reveals, reversible takeover, and static header.
  - Mobile integration: Test approximately 390px width and a touch-emulated/tablet context; confirm no Lenis or pinning.
  - Accessibility: Emulate reduced motion, use keyboard-only navigation and skip link, and verify content with JavaScript disabled.
  - Lifecycle: Repeatedly resize across conditions and toggle reduced motion; inspect for duplicated triggers/listeners/tickers and stale inline styles.
  - Performance: Capture a representative hero-to-Contact scroll on ordinary hardware with CPU pressure if available; record any simplified effect and why.
  - Regression: Visit `/work` and `/contact`, direct-load homepage hashes, and confirm existing images/CTAs/hover/focus states.
  - Covers: AE-001–AE-011.
- **Risks:** Subjective feel passing while measurable lifecycle or fallback issues remain. Mitigate by requiring both visual review and explicit evidence for every acceptance example.

## Dependency Order

1. **Establish the homepage motion runtime** first because every feature needs one scoped runtime, responsive policy, and cleanup contract.
2. **Add the hero entrance and offscreen Player lifecycle** after the runtime because it depends on the shared motion conditions.
3. **Implement Featured Work and Capabilities reveals** after the runtime because this establishes final section geometry before the boundary transition is tuned.
4. **Build the continuous orange Contact takeover** after section reveals because its trigger range depends on stable Capabilities/Contact layout.
5. **Harden and validate** last because it evaluates the composed runtime and all fallback paths while permitting targeted simplification in earlier units.

## Verification Plan

- **Unit-level checks:** Run Astro/type diagnostics on each touched source group before broad checks; verify component semantics and final visible states after each unit.
- **Integration/user-flow checks:** Traverse the homepage from first load to Contact at slow, normal, and fast scroll speeds; reverse direction; use in-page links and keyboard navigation.
- **Regression checks:** Confirm other routes have no Lenis/GSAP behavior, the header stays static, the Remotion visual still renders, responsive layouts match current intent, and no unrelated dirty files change.
- **Manual checks where automation is unavailable:** Motion feel against `incredibles.dev`, reduced-motion emulation, no-JavaScript fallback, resize/media-query teardown, and a browser performance trace.
- **Evidence expected in implementation handoff:** Changed-file list, dependency/lockfile changes, command results, diagnostics summary, acceptance-example checklist, browsers/viewports tested, performance observations, and any intentionally simplified effect.

## Risks & Mitigations

| Risk                                                                  | Impact                                                   | Mitigation                                                                                      | Watch in unit                     |
| --------------------------------------------------------------------- | -------------------------------------------------------- | ----------------------------------------------------------------------------------------------- | --------------------------------- |
| Lenis and CSS/native smooth scrolling both act on the same navigation | Double easing, bad anchors, inaccessible skip behavior   | Reconcile global `scroll-behavior`, scope anchor handling, and explicitly exclude the skip link | Runtime; hardening                |
| GSAP state hides content before initialization or after teardown      | Blank/partially clipped content                          | Visible-by-default markup, initialization-owned states, fail-safe cleanup/final states          | Runtime; all choreography         |
| Breakpoint or preference changes duplicate runtime work               | Memory leaks, accelerated animations, incorrect triggers | Single owner plus context/matchMedia cleanup; test repeated changes                             | Runtime; hardening                |
| Remotion keeps rendering offscreen                                    | Frame drops and wasted CPU                               | Player ref + IntersectionObserver pause/resume; no per-frame React updates                      | Hero; hardening                   |
| Full-width masks or `clip-path` cause repaint spikes                  | Signature effects undermine smoothness                   | Profile early; prefer bounded overflow/transform masks and simplify aggressively                | Section reveals; Contact takeover |
| Fonts/images settle after triggers are measured                       | Misaligned starts/ends                                   | Refresh after meaningful layout stability and resize, not on every frame                        | Runtime; section choreography     |
| Existing user changes are overwritten                                 | Loss of unrelated work                                   | Inspect current files immediately before edits; use targeted edits; never reset or broad-format | All                               |
| Motion leaks onto shared routes through BaseLayout/global state       | Work/contact regressions                                 | Initialize only from `index.astro`; keep shared CSS changes fallback-safe                       | Runtime; hardening                |
| Reference feel encourages scope creep                                 | Layout redesign or excessive effects                     | Enforce D-001, D-002, and the two-motif limit                                                   | Section reveals; Contact takeover |

## Handoff Prompt

Implement the homepage motion system in `docs/plans/2026-07-17-001-software-homepage-gsap-lenis-motion-plan.md` in the listed dependency order. Preserve all current uncommitted work and keep the implementation homepage-only. Use Bun to add Lenis and GSAP; provide subtle fine-pointer desktop inertia, native mobile scrolling with mobile-lite reveals, a brief one-time hero entrance, offscreen Remotion pause/resume, one-time clipped-text and featured-image mask/scale reveals, and a reversible continuous orange Contact takeover with no pinning. Keep content visible without JavaScript, preserve skip/hash navigation and semantics, disable non-essential motion for reduced-motion users, and simplify any effect that harms smoothness. Run project diagnostics/check/lint/format-check/build and return evidence for `AE-001`–`AE-011`. Escalate only if implementation reveals a conflict with existing user changes, anchor accessibility, or a performance constraint that would materially change an approved decision.

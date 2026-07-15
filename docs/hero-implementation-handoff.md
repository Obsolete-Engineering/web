# Updated Hero Implementation Handoff

## Objective

Implement the approved hero direction from Paper in the existing Astro site.
The result should align the current header and hero with `DESIGN.md` and
`docs/language.md` without expanding the work into the rest of the homepage.

This is an implementation handoff, not an invitation to redesign the concept.
Preserve the decisions below unless the repository or browser behavior makes a
small adjustment necessary.

## Sources of truth

Use these references in this order:

1. [`DESIGN.md`](../DESIGN.md) — brand and visual-system principles.
2. [`docs/language.md`](./language.md) — voice and approved language patterns.
3. [Paper: Obsolete — Updated Hero Direction][paper] — desktop and mobile
   composition.
4. This handoff — implementation constraints, responsive behavior, and
   acceptance criteria.

The Paper file contains two artboards:

- `Hero — Desktop 1440`
- `Hero — Mobile 390`

## Approved decisions

The `/grilling` session established the following direction:

- Scope the first implementation milestone to the header and hero.
- Make typography the primary visual event.
- Use an editorial, asymmetric composition rather than a conventional 50/50
  marketing split.
- Keep the particle animation, but make it a secondary supporting object.
- Remove the particle animation's bordered panel so it dissolves into the paper
  background.
- Use a slim studio masthead.
- Use a short clarifying paragraph rather than the full canonical paragraph
  from the language guide.
- Design and verify both desktop and mobile behavior.
- On mobile, retain only the wordmark and Contact action in the masthead.

## Current implementation gap

The current hero copy mostly reflects the new positioning, but its presentation
still carries the previous software-interface direction:

- `body` uses a persistent technical grid.
- `Hero.astro` uses a radial gradient.
- The page is composed as a conventional left-copy/right-panel split.
- The particle piece is enclosed in a bordered, gridded rectangle.
- Supporting body copy is set in mono.
- The animation includes fake interface marks.
- The full navigation points to sections that do not currently exist.

The updated direction should feel like a carefully art-directed studio site,
not a software dashboard or system-status screen.

## Required copy

Production copy remains centralised in `src/copy.ts`.

### Headline

> The internet could be more interesting.

Line breaks are compositional rather than semantic:

- Desktop: `The internet` / `could be more interesting.`
- Mobile: `The internet` / `could be more` / `interesting.`

The final period is orange and should remain hidden from assistive technology if
the accessible heading already includes punctuation.

### Clarifying paragraph

> Obsolete is a creative technology studio for creative companies. We design
> and engineer ambitious digital experiences worth spending time with.

Set this paragraph in the sans-serif body face, not mono.

### Actions

Primary:

> Bring us an idea

Secondary:

> See our work

Use sentence case. Do not turn these into terminal commands, status labels, or
all-caps interface controls.

### Eyebrow

Use:

> Creative technology studio

The desktop Paper artboard includes `Independent studio / London + the
internet` as a visual placeholder. Do not introduce that factual location claim
without explicit approval.

## Desktop composition

Reference viewport: `1440 × 900`.

### Desktop masthead

- Height: approximately `88px`.
- Horizontal padding: `48px`.
- Warm paper background with one thin bottom rule.
- Left group: symbol, `OBSOLETE` wordmark, short rule, studio descriptor.
- Right group: Work, About, Contact.
- Contact receives a small orange punctuation dot.
- Navigation should read as editorial text, not toolbar controls.

Do not ship dead links. If Work, About, or Contact targets still do not exist at
implementation time, resolve their destinations as part of the same change or
omit unavailable links until their sections/routes exist. Record any omitted
item in the implementation summary.

### Desktop hero

- Continue the paper background from the masthead; no gradient and no global
  technical grid.
- Use approximately `48px` horizontal page padding.
- Place the eyebrow near the upper-left edge.
- Set the headline at approximately `116px`, weight `600`, line-height `0.9`,
  with tight negative tracking.
- Let the two-line headline dominate most of the width.
- Place the clarifying paragraph and actions in the lower-left quadrant.
- Keep the paragraph around `430px` wide and approximately `20px`.
- Place the particle field in the lower-right quadrant at roughly `640 × 300`.
- The particle field must have no visible card, border, grid, or different
  background colour.
- Treat orange as punctuation: the headline period, primary action, and a few
  particle accents are enough.

The supplied values describe the 1440px artboard. Use fluid CSS (`clamp()`,
relative widths, and bounded max-widths) rather than hard-coding a layout that
only works at that exact viewport.

## Mobile composition

Reference viewport: `390 × 844`.

The status bar shown in Paper is presentation chrome only. Do not implement a
fake operating-system status bar in the website.

### Mobile masthead

- Height: approximately `64px`.
- Horizontal padding: `20px`.
- Show the symbol and wordmark on the left.
- Show only Contact with the orange punctuation dot on the right.
- Do not add a hamburger menu for this milestone.

### Mobile hero

- Horizontal padding: `20px`.
- Use `Creative technology studio` as the eyebrow.
- Set the headline at approximately `58px`, weight `600`, line-height `0.91`,
  with tight negative tracking.
- Preserve the approved three-line break without clipping at 390px.
- Place the clarifying paragraph directly below the headline at approximately
  `16px` with comfortable line-height.
- Keep both actions visible and tappable. The primary action remains orange;
  the secondary action is a quiet text link with a rule.
- Place the particle field below the actions, spanning most of the viewport
  width.
- Keep the particle visual secondary to the headline and copy.

At narrower supported widths, preserve content and tap-target clarity even if
line breaks or gaps need small adjustments.

## Motion and particle treatment

Retain the existing Remotion implementation as the technical foundation, but
change its presentation and remove obsolete visual language.

Required outcomes:

- Remove the outer border, internal grid, and raised panel treatment from
  `.hero__visual` and `.hero__image-placeholder`.
- Make the canvas background match `--color-neutral` exactly so its bounds are
  visually undetectable.
- Remove the fake interface marks created by `addInterfaceMarks()`.
- Keep motion restrained and purposeful. The animation should support the hero,
  not compete with the headline.
- The first meaningful frame and reduced-motion state should present the
  Obsolete mark shown in Paper, not a software-marked cube.
- Preserve `prefers-reduced-motion` support and respond to preference changes.
- Avoid a blank or layout-shifting visual while React/Remotion hydrates. Reserve
  the final dimensions and provide a static logo-form fallback if necessary.
- Keep the player muted, non-interactive, and absent from the keyboard tab
  order.

The existing morph sequence may remain if it still feels like an abstract motion
study after interface marks are removed. Do not add terminal text, system
statuses, glitch effects, or decorative controls.

## Expected file scope

Inspect the code before editing. The likely implementation surface is:

- `src/copy.ts`
  - tighten the hero lead;
  - reduce desktop navigation to the approved masthead items;
  - add the eyebrow/caption copy if it remains visible.
- `src/components/Header.astro`
  - implement the slim desktop masthead;
  - implement wordmark + Contact on mobile;
  - remove toolbar-like framing and spacing.
- `src/components/Hero.astro`
  - replace the boxed split layout with the editorial composition;
  - use sans-serif body copy;
  - implement the approved CTA treatment;
  - position the unboxed particle field responsively.
- `src/components/ObsoleteHeroIsland.tsx`
  - preserve reduced-motion preference handling;
  - ensure the initial/static state matches the approved logo-form frame;
  - avoid hydration-related layout shift.
- `src/remotion/ObsoleteParticleHero.tsx`
  - remove interface marks;
  - make the reduced-motion output logo-focused;
  - adjust framing/cropping only as needed for the unboxed field.
- `src/styles/global.css`
  - remove the persistent body grid;
  - retain global focus, selection, and accessibility behavior.
- `src/styles/tokens.css`
  - reuse the existing palette and type tokens;
  - add or adjust tokens only when the value is genuinely shared.
- `src/components/ui/Button.astro`
  - inspect before reuse; its current forced uppercase treatment conflicts with
    the approved sentence-case CTAs.

Avoid unrelated component refactors or implementing the remaining homepage
sections in this milestone.

## Implementation sequence

1. Update central copy and navigation data.
2. Rebuild the masthead structure and responsive states.
3. Recompose the hero with static content and responsive typography.
4. Remove global and local grid/gradient/panel styling.
5. Integrate the existing particle player into the unboxed field.
6. Remove old interface cues and fix initial/reduced-motion framing.
7. Verify accessibility, intermediate breakpoints, and visual parity.
8. Run project checks and review the final diff for accidental broad changes.

## Accessibility requirements

- Preserve the skip link and `main#content` target.
- Keep one semantic `h1` containing the complete headline.
- Do not expose decorative punctuation, dots, particle marks, or arrows as
  redundant screen-reader content.
- Navigation must retain a useful accessible name.
- All rendered links must lead to real destinations.
- Focus indicators must remain visible and use the orange accent.
- CTA hit areas should be at least `44px` high.
- The particle animation needs an appropriate concise accessible label if it
  conveys brand content; otherwise treat it as decorative.
- Reduced-motion mode must not animate.
- Verify colour contrast for muted mono labels and secondary copy.

## Acceptance criteria

### Visual

- [ ] Desktop closely matches the `Hero — Desktop 1440` Paper artboard.
- [ ] Mobile closely matches the `Hero — Mobile 390` Paper artboard, excluding
      the mock device status bar.
- [ ] The headline is the dominant element at both reference sizes.
- [ ] The page contains no radial gradient or persistent technical grid.
- [ ] The particle field has no visible rectangular panel boundary.
- [ ] Supporting paragraph text uses the sans-serif body face.
- [ ] Orange is used sparingly and primarily as punctuation.
- [ ] No content clips or causes horizontal scrolling at 390px, 768px, 1024px,
      or 1440px.

### Behavior

- [ ] Header and CTA links lead to real destinations.
- [ ] Desktop navigation reduces to Work, About, and Contact when those
      destinations exist.
- [ ] Mobile masthead shows only wordmark and Contact.
- [ ] The animation remains muted and non-interactive.
- [ ] Reduced-motion mode renders a static logo-form composition.
- [ ] The hero does not jump when the React island hydrates.

### Language

- [ ] Hero copy exactly matches the approved strings in this handoff.
- [ ] No retirement, replacement, fake-system, or terminal language remains in
      the header or hero.
- [ ] CTA labels use sentence case.
- [ ] Accessibility copy remains literal and useful.

## Verification

Discover project commands from `package.json` and repository guidance before
running checks. At minimum:

```sh
npm run build
```

Also perform:

- LSP/type diagnostics on changed Astro, TypeScript, and TSX files;
- desktop screenshot comparison at `1440 × 900`;
- mobile screenshot comparison at `390 × 844`;
- responsive checks around `768px` and `1024px`;
- keyboard-only navigation and visible-focus review;
- a `prefers-reduced-motion: reduce` check;
- a no-horizontal-overflow check at 320px and 390px;
- a final `git diff` review.

Do not claim visual parity from build success alone.

## Non-goals

- Building Selected work, What we make, How we work, Services, About, Notes, or
  Contact sections.
- Rebranding the logo or changing the approved palette.
- Replacing Remotion with a new animation framework.
- Adding a mobile menu or navigation drawer.
- Adding gradients, glass effects, heavy shadows, glitch effects, or fake UI.
- Broadly rewriting the existing UI component library.

## Handoff completion report

The implementing agent should finish with:

1. a concise summary of visual and motion changes;
2. the exact files changed;
3. checks and viewport reviews performed;
4. any intentional differences from the Paper artboards;
5. unresolved navigation destinations or content dependencies;
6. remaining visual, performance, or accessibility risks.

[paper]: https://app.paper.design/file/01KXHK8AQCT8JP87892V3RNV53/1-0

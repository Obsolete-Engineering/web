# Integrated Hero Surface Implementation

> **Current direction:** GitHub issue #3 supersedes issue #2 and the earlier
> particle/asymmetric and dark-molten hero handoffs.

## Purpose

The homepage masthead and hero form one warm-paper interactive surface. The
composition remains full-height and centred in this order:

1. `Creative technology studio`
2. `The internet could be more interesting.`
3. the approved clarification from `src/copy.ts`
4. `Bring us an idea` and `See our work`

Do not recompose the hero, copy the Incredibles implementation, or restore the
particle panel, dark palette, custom cursor, grain overlay, or glitch treatment.
`CONTEXT.md`, `DESIGN.md`, and `docs/language.md` define the canonical brand
terms, visual system, and copy rules.

## Rendering model

- `src/components/Hero.astro` server-renders the complete semantic composition,
  representative poster, and one decorative canvas.
- `src/scripts/fluid-hero.ts` owns the explicit OGL mount/dispose lifecycle,
  adaptive quality, visibility pausing, context-loss fallback, input mapping,
  and headline mask.
- `src/scripts/fluid-shaders.ts` owns the simulation passes and warm-paper
  display shader.
- `public/fluid-hero-poster.webp` is the static representative frame used while
  loading, without JavaScript, for reduced motion, after WebGL failure, and
  after context loss.

The poster and canvas always occupy identical hero bounds. The poster remains
visible until a complete live frame is ready, then crossfades without layout
shift.

## Art direction

The resting field is the design-system paper colour with no visible ambient
motion, authored mark, or standing dither pattern. Orange remains limited to
brand punctuation and temporary interaction. The live canvas and static poster
return to the same nearly flat warm-paper state.

Fine-pointer and hovering pen movement updates an eased simulation point. The
engine injects overlapping, velocity-sensitive splats along that eased path so
a sweep forms one broad connected orange trail with soft fluid edges rather
than a stamped brush or viewport-height wipe. Ordered fine print dither appears
only inside active dye, and dye dissipation returns the field fully to rest
within a few seconds.

The headline is the only reactive copy. Its rendered DOM typography supplies a
stable text mask; the active orange dither is composited through those glyphs
without moving, warping, or edge-splitting them. The eyebrow, clarification,
actions, focus indicators, masthead, and navigation remain crisp.

A small orange pointer dot uses the same eased position over non-interactive
hero space. It supplements the unchanged native cursor and hides over controls,
outside the hero, for touch input, in fallback states, and for reduced motion.
A stationary primary touch tap on non-interactive hero space injects one pulse
on release. Touch movement, control taps, cancelled gestures, and multi-touch
do not inject fluid; no touch handler calls `preventDefault()`.

## Accessibility and resilience

- Keep one literal semantic `h1`; visual shader layers are hidden from
  assistive technology and absent from the tab order.
- Preserve the skip-link, masthead, and hero-action focus order and orange focus
  indicators.
- Reduced motion never initializes the engine or reacts to pointer/touch input;
  runtime preference changes stop or restart it without shifting the layout.
- JavaScript-disabled, unsupported-WebGL, loading, and context-loss states retain
  the same complete warm-paper composition and real links.
- The render loop pauses when the hero is offscreen, the document is hidden, or
  the shared homepage motion controller pauses it.
- Inner-page mastheads and every section below the homepage hero remain outside
  this implementation.

## Browser-level verification

Drive future changes through `tests/homepage-hero.spec.ts`. Its contract covers:

- approved content, destinations, centred responsive composition, text zoom,
  and no horizontal overflow;
- warm-paper desktop/mobile visual baselines;
- stable transparent ink masthead, native cursors, and the restrained eased
  pointer dot;
- headline-only dither compositing with stable geometry;
- a quiet resting field, localized broad connected trail, velocity response,
  short full decay, and touch tap pulse;
- swipe/control/multi-touch behaviour;
- reduced motion, no JavaScript, WebGL failure/context loss, and poster/canvas
  parity;
- keyboard accessibility and offscreen/background GPU pausing.

Run `npm run check`, `npm run lint`, `npm run format:check`, `npm run build`, and
`npm run test:browser` before handoff. Manual review at 1440×900 and 390×844 is
still required for dither character, trail continuity, eased follow, pointer-dot
restraint, headline readability, and overall brand fit.

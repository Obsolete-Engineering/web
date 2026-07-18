# Integrated Hero Symbol Field

## Purpose

The homepage masthead and hero remain one full-height, centred composition in this order:

1. `Creative technology studio`
2. `The internet could be more interesting.`
3. the approved clarification from `src/copy.ts`
4. `Bring us an idea` and `See our work`

Do not recompose the hero or alter its copy, typography, or actions. The animated surface is a background layer only.

## Rendering model

- `src/components/Hero.astro` server-renders the complete semantic composition, representative poster, and one decorative canvas.
- `src/scripts/fluid-hero.ts` owns the OGL lifecycle, low-resolution fluid displacement, adaptive quality, visibility pausing, fallback states, and input mapping.
- `src/scripts/fluid-shaders.ts` owns the simulation passes and procedural symbol-field display shader.
- `public/fluid-hero-poster.webp` is the static representative field used while loading, without JavaScript, for reduced motion, after WebGL failure, and after context loss.

The poster and canvas always occupy the same edge-to-edge hero bounds. The poster remains visible until a complete live frame is ready, then crossfades without layout shift.

## Reference-derived motion concept

Firecrawl inspection of `incredibles.dev` showed an oversized, clipped, pointer-events-none hero canvas behind the content. Its implementation combines a slow procedural dither field with a low-resolution fluid simulation, eased pointer coordinates, velocity-sensitive splats, visibility pausing, and a small follower dot. This project borrows that overall motion model only; its symbols, palette, layout, typography, and assets remain Obsolete’s.

## Art direction

The resting surface is warm paper filled edge to edge with tiny graphite checker, cross, and four-point symbols. Deterministic symbol variation and broad, low-contrast density bands create the flowing texture seen in the approved screenshot. Multiple slow, incommensurate waves move and displace the field continuously so no obvious loop reset is visible.

The centre remains quieter, not empty, to protect headline readability. The canvas never masks or recolours text: masthead, eyebrow, headline, clarification, and actions all sit above it and remain crisp.

Fine-pointer movement updates an eased simulation point. Overlapping velocity splats create a connected local wake that displaces the field and temporarily turns nearby symbols orange before dissipating. A small monochrome follower supplements the unchanged native cursor over non-interactive hero space and hides over controls. Touch keeps native scrolling; a stationary non-control tap may create one simplified local disturbance.

## Performance and resilience

- The procedural field renders in one display pass and reuses the existing low-resolution OGL fluid targets; no new dependency is required.
- Quality begins lower on mobile and can step down when sustained frame time exceeds the device budget.
- The canvas is sized from the hero’s CSS bounds and device-pixel ratio, so resizing changes resolution rather than stretching the rendered image.
- The render loop pauses when the hero is offscreen, the document is hidden, or the shared homepage motion controller pauses it.
- Reduced motion never initializes WebGL and shows the static symbol poster with no pointer response.
- JavaScript-disabled, unsupported-WebGL, loading, and context-loss states retain the complete composition and working links.

## Browser-level verification

`tests/homepage-hero.spec.ts` covers:

- approved content, destinations, centred responsive composition, text zoom, and no horizontal overflow;
- desktop/mobile static symbol-field baselines;
- edge-to-edge poster/canvas geometry and content-over-canvas layering;
- visible but restrained ambient motion and a connected, temporary orange pointer trail;
- reduced motion, no JavaScript, WebGL fallback, touch scrolling, and action taps;
- native control cursors, keyboard accessibility, and offscreen/background GPU pausing.

Run `bun run check`, `bun run lint`, `bun run format:check`, `bun run build`, and `bun run test:browser` before handoff. Manually review at 1440×900 and 390×844 for symbol density, continuous wave quality, pointer restraint, headline readability, and complete edge coverage.

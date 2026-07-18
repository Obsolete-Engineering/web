# Integrated Hero Field Awakening

## Purpose

The homepage masthead, hero composition, and warm-paper symbol field form one integrated opening experience. The existing shader remains the visual centerpiece; the ceremony changes how the established hero is revealed, not what the hero becomes.

The final composition remains, in order:

1. `Creative technology studio`
2. `The internet could be more interesting.`
3. the approved clarification from `src/copy.ts`
4. `Bring us an idea` and `See our work`

Copy, semantic order, final geometry, destinations, and resting shader identity do not change. The ceremony is a brief visual exception to continuous legibility: content may be visually withheld and resolved into place, but it must remain semantically present and immediately yield to clear user intent.

## Governing concept: Field awakening

The field begins latent rather than blank. Warm paper and faint graphite symbols are visible immediately, creating anticipation without resembling a loader.

One restrained orange **punctuation impulse** begins at the future viewport position of the headline’s orange period. Orange remains local to that origin and its short fluid wake. A broader graphite pressure response travels through the field, increasing density, edge definition, and tonal contrast while shallow material depth settles back to the existing flat surface.

Every subsequent beat should feel caused by that impulse. This perceived causality—not maximum intensity—is the primary measure of the “wow” moment.

Do not introduce:

- a splash screen, progress indicator, or loading copy;
- a separate photograph, project still, or imagery layer;
- shader-distorted typography or navigation;
- glow, bloom, gradients, or a visible spotlight;
- a camera flight, dramatic zoom, pointer-tilted plane, or 3D scene;
- an orange ring crossing the whole viewport;
- a hard reset between the ceremony and the interactive field.

## Desktop beat sheet

The target duration is approximately **2.1 seconds**. Exact values may be tuned visually, but the order and pacing hierarchy should remain.

| Time         | Beat                                                                                                                                                         |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `0.00–0.28s` | Warm paper and a faint, softened symbol field hold in a slightly enlarged latent state. Hero and masthead content are visually withheld.                     |
| `0.28s`      | The punctuation impulse begins at the measured centre of the future headline period. Local orange dye and a wider graphite pressure response start together. |
| `0.42s`      | Wordmark and masthead rule resolve first, establishing identity.                                                                                             |
| `0.56s`      | Masthead descriptor and navigation resolve.                                                                                                                  |
| `0.64s`      | Hero eyebrow resolves.                                                                                                                                       |
| `0.72–1.12s` | Headline lines lift through shallow, crisp clips in reading order. The orange period locks the transition from field to typography.                          |
| `1.12s`      | Clarifying copy resolves.                                                                                                                                    |
| `1.38s`      | Hero actions resolve and the complete proposition is visually available.                                                                                     |
| `1.65s`      | Normal orange pointer interaction becomes available.                                                                                                         |
| `2.10s`      | Material depth and authored pressure finish settling; the remaining fluid wake continues dissipating naturally.                                              |

Use precise, non-bouncy easing. The interface should feel drawn into resolution, not dropped, floated, or elastically thrown into place.

## Mobile adaptation

Mobile tells the same story in approximately **1.6 seconds**:

- preserve the beat order and punctuation origin;
- measure the period’s actual responsive position rather than reusing a desktop coordinate;
- reduce overscale, displacement, and pressure intensity;
- retain native swipe scrolling;
- do not introduce drag painting;
- keep the existing stationary tap pulse as the settled touch interaction.

The mobile version is a compressed adaptation, not a static downgrade or a frame-for-frame copy of desktop.

## Shader choreography

The ceremony must use the existing shader identity and rendering pipeline.

### Latent state

- Keep warm paper visible from first paint.
- Lower symbol density and paper-to-graphite contrast without making the surface empty.
- Slightly soften mark edges and enlarge the apparent field by roughly `5–7%` on desktop, less on mobile.
- Preserve edge coverage throughout the settle.

### Punctuation impulse

- Derive the impulse coordinate from the rendered `.hero__title-period` position relative to the hero bounds; do not hard-code viewport UVs.
- Inject one local orange disturbance into the existing fluid simulation.
- Carry the full-field awakening with a restrained graphite pressure response in the existing display pass.
- Keep the orange region local. Density, sharpness, distortion, and tonal material light may travel farther than dye.

### Shallow material depth and light

Depth is temporary and surface-like:

- slightly enlarged and softened at the start;
- a restrained local bulge around the impulse;
- gradual return to the current field scale and mark definition.

“Lighting” means changes in symbol sharpness, density, and paper-to-graphite contrast. Do not add bloom, glow, radial light, or glossy shading.

### Resting state

All ceremony-only parameters resolve to the field’s current values. After the settle, preserve today’s:

- warm-paper palette and fine deterministic symbols;
- quiet centre and full edge coverage;
- slow incommensurate ambient waves;
- eased velocity-driven orange fluid trail;
- touch tap pulse;
- native cursor and hero pointer-dot rules.

The ceremony’s final wake must dissipate inside the same running simulation. Do not clear targets or snap to a pristine frame at `2.1s`.

## Interface choreography

Typography and controls remain crisp DOM content above the canvas. Use shallow clipping, opacity, and small positional settles; never render or mask text through the shader.

Reveal order:

1. wordmark and masthead rule;
2. masthead descriptor and navigation;
3. eyebrow;
4. headline lines in reading order;
5. orange period lock;
6. clarification;
7. actions.

Final content geometry, colour, wrapping, and interaction behavior must match the current hero. The masthead and hero should not recompose into temporary alternate layouts.

The existing `setupHeroEntrance()` currently requires a missing `[data-motion="hero-visual"]` target and therefore returns before animating the current hero. Do not add a dummy visual merely to satisfy that guard. Replace the obsolete precondition and give the ceremony one explicit orchestration path for shader readiness, shader progress, DOM timing, interruption, and cleanup.

## Responsiveness during the ceremony

The field should respond before the authored sequence finishes without competing with it:

- fine-pointer movement creates restrained graphite displacement during the ceremony;
- suppress additional orange pointer dye until approximately `1.65s`;
- pointer movement alone does not cancel or steer the authored impulse;
- settled pointer behavior remains unchanged;
- touch continues to prioritize scrolling and control activation.

## Intent and interruption

The ceremony must never block navigation or exploration.

Immediately fast-forward to the fully resolved hero when the visitor:

- scrolls;
- presses `Tab` or moves focus into masthead/hero controls;
- presses `Escape`;
- activates a link or control;
- arrives at the homepage with a meaningful URL hash;
- hides the document or triggers a disruptive resize/orientation change mid-sequence.

Fast-forwarding must preserve the initiating action. Do not intercept a link activation, suppress native scroll, trap focus, or require a second click.

Visually withheld content remains in the semantic document. Do not apply `aria-hidden`, `inert`, disabled states, or altered tab order. A focus attempt resolves the ceremony before focus is painted.

## Replay policy

Play the full ceremony only on the first eligible homepage view in a browser tab session.

- Record completion or intentional fast-forward in session-scoped state.
- Repeat homepage views in the same tab show the complete resolved hero immediately.
- A new tab creates a new eligible session.
- Browser back/forward restoration must not restart the ceremony.
- If session storage is unavailable, fail open rather than repeatedly forcing the entrance.

## Rendering and performance budget

Retain the current architecture:

- `src/components/Hero.astro` server-renders the complete semantic composition, representative poster, and decorative canvas.
- `src/scripts/fluid-hero.ts` owns the OGL lifecycle, low-resolution fluid displacement, adaptive quality, visibility pausing, fallback states, and input mapping.
- `src/scripts/fluid-shaders.ts` owns the existing simulation passes and procedural display shader.
- GSAP, already present in `src/scripts/home-motion.ts`, coordinates crisp DOM timing.
- `public/fluid-hero-poster.webp` remains the representative final field for static and fallback states.

The ceremony may add uniforms and orchestration around the existing display pass and may inject the authored splat into the current simulation. It must not add:

- a dependency;
- a second canvas;
- a second simulation;
- a new render target;
- an additional post-processing pass;
- a 3D scene.

Prioritize smoothness over effect fidelity. Lower quality tiers may reduce overscale, pressure, edge modulation, and displacement while preserving the causal beat order. If live WebGL misses its short readiness window or frame delivery becomes visibly unstable, use **ceremony fail-open**: show the final poster and complete interface immediately, without an abbreviated imitation or error message.

The existing quality adaptation, DPR caps, resize handling, offscreen pausing, document visibility pausing, and shared homepage motion pause remain required.

## Static and reduced-motion experience

Reduced-motion, JavaScript-disabled, unsupported-WebGL, context-loss, and fail-open states show the fully resolved hero immediately:

- final representative poster visible;
- masthead, headline, clarification, and actions visible;
- no delayed fade, latent hold, pointer follower, or tap response;
- complete semantics and working links;
- no layout shift when a live canvas is unavailable.

Reduced motion never initializes WebGL, matching the existing behavior.

## Verification

Extend `tests/homepage-hero.spec.ts` to cover the ceremony in addition to the existing hero guarantees.

### Ceremony behavior

- first eligible desktop session follows the agreed reveal order and settles within the target duration;
- mobile follows the same order with compressed timing and reduced intensity;
- the punctuation impulse originates from the rendered period position at desktop and mobile widths;
- orange remains local while graphite pressure affects a broader area;
- final field and content geometry match the current resting baselines;
- the simulation continues across the ceremony-to-exploration handoff without a reset;
- repeat homepage views in the same session do not replay the ceremony.

### Interruption and accessibility

- scroll, focus/`Tab`, `Escape`, and control activation fast-forward immediately;
- the initiating scroll, focus, or activation still succeeds;
- content is never removed from the accessibility tree or tab order;
- reduced motion shows the complete static hero from first paint and does not create a WebGL context;
- no-JavaScript and WebGL-fallback states show the complete poster composition;
- hash/deep-link arrival skips the ceremony;
- pointer movement during ceremony produces no competing orange trail;
- touch scrolling and action taps remain native.

### Performance and resilience

- no new render pass, target, canvas, or dependency is introduced;
- slow readiness and unstable frame delivery fail open to the complete hero;
- GPU draws pause offscreen and while the document is hidden;
- context loss retains the complete composition;
- no horizontal overflow or layout shift occurs at supported breakpoints and text zoom levels.

Run:

```sh
bun run check
bun run lint
bun run format:check
bun run build
bun run test:browser
```

Manually review at least `1440×900` and `390×844`, including a first eligible view, a repeat same-session view, an intentional fast-forward, reduced motion, and a forced fallback. Judge the result primarily on perceived causality, smoothness, headline readability, orange restraint, and the absence of a visible mode switch at the handoff.

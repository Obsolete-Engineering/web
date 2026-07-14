---
version: alpha
name: Obsolete
description: A creative technology studio identity built around good taste, serious engineering, and ambitious digital experiences.

colors:
primary: "#111111"
secondary: "#6F6A61"
tertiary: "#FF4B1F"
neutral: "#F4F1EA"
surface: "#EBE6DC"
surface-raised: "#FFFDF8"
surface-inverse: "#1A1A1A"
line: "#D8D2C7"
muted: "#8B857A"
on-primary: "#F4F1EA"
on-tertiary: "#111111"
success: "#1F8F4D"
warning: "#D99A00"
error: "#D72626"

typography:
headline-display:
fontFamily: Inter, Helvetica Neue, Arial, sans-serif
fontSize: 72px
fontWeight: 600
lineHeight: 0.95
letterSpacing: -0.05em
headline-lg:
fontFamily: Inter, Helvetica Neue, Arial, sans-serif
fontSize: 48px
fontWeight: 600
lineHeight: 1
letterSpacing: -0.04em
headline-md:
fontFamily: Inter, Helvetica Neue, Arial, sans-serif
fontSize: 32px
fontWeight: 600
lineHeight: 1.05
letterSpacing: -0.03em
body-lg:
fontFamily: Inter, Helvetica Neue, Arial, sans-serif
fontSize: 20px
fontWeight: 400
lineHeight: 1.45
letterSpacing: -0.01em
body-md:
fontFamily: Inter, Helvetica Neue, Arial, sans-serif
fontSize: 16px
fontWeight: 400
lineHeight: 1.55
letterSpacing: -0.005em
body-sm:
fontFamily: Inter, Helvetica Neue, Arial, sans-serif
fontSize: 14px
fontWeight: 400
lineHeight: 1.45
letterSpacing: 0em
label-md:
fontFamily: IBM Plex Mono, Space Mono, Courier New, monospace
fontSize: 12px
fontWeight: 500
lineHeight: 1
letterSpacing: 0.04em
label-sm:
fontFamily: IBM Plex Mono, Space Mono, Courier New, monospace
fontSize: 11px
fontWeight: 500
lineHeight: 1
letterSpacing: 0.06em

rounded:
none: 0px
sm: 2px
md: 6px
lg: 12px
full: 9999px

spacing:
xs: 4px
sm: 8px
md: 16px
lg: 24px
xl: 40px
xxl: 64px
section: 120px
container: 1440px
gutter: 24px

components:
button-primary:
backgroundColor: "{colors.tertiary}"
textColor: "{colors.on-tertiary}"
typography: "{typography.label-md}"
rounded: "{rounded.sm}"
padding: 14px
height: 44px
button-secondary:
backgroundColor: "{colors.primary}"
textColor: "{colors.on-primary}"
typography: "{typography.label-md}"
rounded: "{rounded.sm}"
padding: 14px
height: 44px
button-ghost:
backgroundColor: "transparent"
textColor: "{colors.primary}"
typography: "{typography.label-md}"
rounded: "{rounded.sm}"
padding: 14px
height: 44px
card-default:
backgroundColor: "{colors.surface}"
textColor: "{colors.primary}"
typography: "{typography.body-md}"
rounded: "{rounded.md}"
padding: 24px
panel-inverse:
backgroundColor: "{colors.surface-inverse}"
textColor: "{colors.on-primary}"
typography: "{typography.body-md}"
rounded: "{rounded.md}"
padding: 24px
chip-label:
backgroundColor: "{colors.neutral}"
textColor: "{colors.primary}"
typography: "{typography.label-sm}"
rounded: "{rounded.full}"
padding: 8px
input-default:
backgroundColor: "{colors.surface-raised}"
textColor: "{colors.primary}"
typography: "{typography.body-md}"
rounded: "{rounded.sm}"
padding: 14px
height: 48px
---

# Obsolete Design System

## Overview

Obsolete is a creative technology studio for creative companies.

The studio designs and builds ambitious digital experiences where strong ideas,
sharp creative thinking, and serious engineering meet. The website should feel
confident, culturally aware, and expertly made. “Obsolete” is the name, not a
line that every message has to explain.

The visual identity combines:

* editorial design
* software precision
* industrial design objects
* contemporary culture
* interactive craft
* studio restraint
* playful intelligence

The emotional tone is playfully intelligent. Obsolete should feel tasteful,
technically formidable, curious, collaborative, and quietly confident.
Personality should come through in memorable ideas and precise details, never
forced jokes or agency theatre.

Primary brand idea:

**The internet could be more interesting.**

Supporting proposition:

**Good taste. Serious engineering.**

The website should show that Obsolete cares equally about creative direction,
interaction, engineering quality, and the experience people have with the
finished work.

The design should never feel like a generic digital agency, SaaS template,
startup landing page, trend-chasing portfolio, cyberpunk brand, or retro
computer joke.

Do not build the voice around retirement, replacement, or explaining the
company name. Obsolete is the identity; the work is the story.

## Colors

The palette is restrained, warm, and functional. It should feel at home across
printed matter, a studio worktable, and a precisely made digital experience.

* **Primary / Ink (#111111):** Used for main text, headlines, dark panels, and
  high-confidence elements.
* **Secondary / Utility Grey (#6F6A61):** Used for captions, project details,
  quiet copy, and supporting information.
* **Tertiary / Orange (#FF4B1F):** The only expressive accent. Used for primary
  calls to action, emphasis, moments of surprise, and small brand details.
* **Neutral / Paper (#F4F1EA):** Main background. Softer than white, warmer
  than grey.
* **Surface (#EBE6DC):** Used for cards, panels, grouped sections, and composed
  content blocks.
* **Surface Raised (#FFFDF8):** Used for inputs, active panels, and areas that
  need to sit slightly above the page.
* **Surface Inverse (#1A1A1A):** Used for high-contrast sections, footer
  modules, and immersive visual moments.
* **Line (#D8D2C7):** Used for rules, dividers, borders, grids, and structural
  elements.
* **Muted (#8B857A):** Used for lower-emphasis labels and disabled states.

Use orange like punctuation, not decoration. One important orange thing per
view is usually enough.

Avoid gradients, neon palettes, rainbow systems, and colourful SaaS decoration.

## Typography

Typography carries most of the identity.

Use a clean sans-serif for core brand communication and a mono font as a
technical counterpoint. The sans-serif should feel modern, precise, and neutral
enough to let the ideas do the work. Use mono for project indices, disciplines,
captions, and small production details—not fake operating-system messages.

Headlines should be short, memorable, and confident. Lead with an interesting
thought, then make the offer clear in supporting copy.

Good headline examples:

* The internet could be more interesting.
* Good taste. Serious engineering.
* Bring us the idea you cannot stop thinking about.
* Make something worth spending time with.
* Complicated, made delightful.

Use mono typography for concise supporting labels such as:

* `Creative technology studio`
* `Selected work — 01`
* `Design + engineering`
* `Idea → launch`
* `Built for the web`

Never use mono styling to turn the page into a fake terminal, status screen, or
software dashboard. Obsolete should feel like a highly skilled creative studio,
not a code editor theme.

Avoid overly quirky display fonts. The brand’s personality should come from
language, composition, and interaction details, not novelty type.

## Layout

The layout should feel like a carefully art-directed digital experience rather
than a brochure or software dashboard.

Use a strong grid, generous spacing, clear hierarchy, thin rules, modular
sections, and confident composition. Pages should feel intentionally assembled,
not decorated.

Layout principles:

* use strong alignment
* balance clear blocks with moments of expressive composition
* use thin borders instead of decorative shapes
* allow large empty space around important statements
* frame work with restraint so the work remains the focus
* make project details easy to scan
* create rhythm through scale, contrast, and pacing
* make every section earn its place

Desktop layouts can be more expansive and art-directed. Mobile layouts should
retain the same confidence while remaining simple, readable, and direct.

Suggested homepage structure:

1. Hero
2. Selected work
3. What we make
4. How we work
5. Services
6. About and perspective
7. Contact CTA

The site should demonstrate the combination of taste and engineering before it
claims it. Creative companies should leave feeling understood, excited, and
confident that Obsolete can make the idea real.

## Elevation & Depth

Depth should be created through tonal contrast, borders, spacing, and layering
rather than heavy shadows.

Use:

* thin borders
* surface changes
* inset panels
* caption bars
* dark inverse panels
* subtle raised surfaces
* structured overlap only when useful

Avoid:

* glossy shadows
* floating SaaS cards
* glassmorphism
* dramatic blur
* excessive depth effects

The site should feel flat, structured, and object-like. It should resemble a
carefully made digital object, not a marketing graphic.

## Shapes

The shape language is precise and minimally softened.

Use sharp or slightly rounded corners. The default radius should be small.
Components can be squared when the interface needs to feel more industrial or
direct.

Shape principles:

* buttons: small radius
* cards: modest radius
* chips: full radius only when they are clearly labels
* inputs: small radius
* panels: modest radius
* rules and dividers: thin and visible

Avoid bubbly UI, overly soft cards, pill-shaped everything, and decorative blob
shapes.

The overall shape language should feel engineered and intentional, never cold
for the sake of appearing technical.

## Components

### Buttons

Buttons should be direct, compact, inviting, and slightly playful.

Primary CTA examples:

* `Bring us an idea`
* `Start a conversation`
* `Make something interesting`
* `Tell us what you are thinking`

Secondary CTA examples:

* `See our work`
* `How we work`
* `Meet the studio`
* `Read our notes`

Buttons should have clear hover, active, disabled, and focus states. Focus
states must be visible and should use the orange accent.

### Cards

Cards should feel like restrained editorial frames for work, capabilities, or
ideas.

A good card includes:

* small mono label or project index
* short title
* specific description
* optional discipline, year, or collaborator details
* clear action

Example:

`capability / creative development`

#### Digital experiences

Distinctive websites and interactive products where strong ideas meet serious
engineering.

`Designed to be remembered. Built to perform.`

### Tags and Labels

Tags should help people scan the work and understand the studio’s capabilities.
They should feel precise, not promotional.

Examples:

* `creative direction`
* `design`
* `engineering`
* `interactive`
* `prototyping`
* `motion`
* `launch`
* `ongoing support`

### Forms

Forms should feel like the beginning of a good conversation, not submitting a
ticket.

Field labels:

* `What are you hoping to make?`
* `What makes the idea interesting?`
* `Who is it for?`
* `Why now?`
* `Links, references, or useful context`

Submit button:

* `Bring us an idea`
* `Send the brief`
* `Start the conversation`

Success message:

`Idea received. We will be in touch soon.`

Error message:

`That did not send. Give it another go.`

### Case Studies

Case studies should feel like collaborations and demonstrate the combination of
creative judgment and technical depth. Avoid generic portfolio summaries and
unexplained beauty shots.

Recommended structure:

* client and context
* the idea or brief
* creative approach
* technical challenge
* what we made
* result

Example:

**Idea:** Turn a complex cultural archive into an experience worth exploring.
**Creative approach:** Treat discovery like wandering, not searching.
**Engineering:** Deliver fast, accessible interaction across thousands of
pieces of content.
**Result:** A distinctive digital destination that invites people to stay.

### Motion

Motion should feel expressive and purposeful, never added as surface
decoration.

Use:

* quick fades
* precise reveals
* typographic transitions
* tactile hover responses
* restrained spatial movement
* transitions that support the central idea
* occasional moments of surprise

Avoid:

* bouncy animation
* liquid motion without a concept
* heavy parallax
* glitch overload
* slow cinematic transitions that delay the experience

Motion should feel art-directed and technically assured.

## Do's and Don'ts

Do:

* make the site feel like a carefully made digital experience
* use the orange accent sparingly
* use typography, spacing, and grid as the main identity
* present services as clear creative and technical capabilities
* use playful intelligence in memorable details
* show taste, process, and technical thinking—not just polished visuals
* write direct, specific copy
* use borders and panels to create structure
* make accessibility and performance non-negotiable
* make creative companies feel understood and excited to collaborate

Don't:

* make every sentence explain the name Obsolete
* use retirement and replacement as recurring messaging devices
* sound like a generic agency or SaaS company
* use generic SaaS gradients
* use cyberpunk styling
* overuse glitch effects
* copy Teenage Engineering too directly
* rely on fake code screenshots, statuses, or version numbers
* use stock office imagery
* make everything lowercase just for style
* use vague innovation language
* add decorative icons without function
* force jokes until the expertise feels unserious

Avoid copy such as:

* unlock your potential
* supercharge your business
* cutting-edge solutions
* next-gen platform
* digital transformation
* bespoke software partner
* seamless experiences
* disruptive innovation
* world-class technology
* we make things obsolete
* retire the old way
* replacement pending

Prefer language such as:

* idea
* make
* build
* design
* engineer
* craft
* experiment
* collaborate
* interesting
* ambitious
* distinctive
* considered
* useful
* human
* delightful
* technically serious

Final rule:

**Every design decision should show that Obsolete brings good taste and
serious engineering to ideas worth making.**

---
version: alpha
name: Obsolete
description: A design-led software house identity for replacing outdated tools, workflows, and badly designed software.

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
chip-status:
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

Obsolete is a design-led software house.

The brand builds digital products, platforms, tools, and systems for teams ready to replace outdated ways of working. The website should not look old, broken, nostalgic, or retro. It should look like the replacement: clear, precise, useful, and slightly amused by the mess it was built to remove.

The visual identity combines:

* software interface
* technical manual
* industrial design object
* product documentation
* decommission notice
* design studio restraint
* dry system humour

The emotional tone is serious but playful. Obsolete should feel engineered, tasteful, calm, useful, and quietly strange. The humour should appear in small details, not in the main structure.

Primary brand idea:

**Beautiful software for retiring bad systems.**

The website should make visitors feel that Obsolete cares equally about interface, product logic, engineering quality, and the removal of unnecessary complexity.

The design should never feel like a generic software agency, SaaS template, startup landing page, cyberpunk brand, or retro computer joke.

Obsolete is not trying to look obsolete.

Obsolete makes the old way obsolete.

## Colors

The palette is restrained, warm, and functional. It should feel like engineering paper, a system label, a product manual, and a software interface.

* **Primary / Ink (#111111):** Used for main text, headlines, dark panels, and high-confidence interface elements.
* **Secondary / Utility Grey (#6F6A61):** Used for captions, metadata, quiet copy, and supporting interface language.
* **Tertiary / Signal Orange (#FF4B1F):** The only expressive accent. Used for primary calls to action, alerts, status moments, and small brand details.
* **Neutral / Paper (#F4F1EA):** Main background. Softer than white, warmer than grey.
* **Surface (#EBE6DC):** Used for cards, panels, grouped sections, and interface blocks.
* **Surface Raised (#FFFDF8):** Used for inputs, active panels, and areas that need to sit slightly above the page.
* **Surface Inverse (#1A1A1A):** Used for high-contrast sections, footer modules, and dark system panels.
* **Line (#D8D2C7):** Used for rules, dividers, borders, grids, and structural elements.
* **Muted (#8B857A):** Used for lower-emphasis labels and disabled states.

The signal color should be used like a system event, not decoration. One important orange thing per view is usually enough.

Avoid gradients, neon palettes, rainbow systems, and colourful SaaS decoration.

## Typography

Typography carries most of the identity.

Use a clean sans-serif for core brand communication and a mono font for system metadata. The sans-serif should feel modern, precise, and neutral enough to let the words do the work. The mono should feel like product labels, version numbers, small machine notes, and interface metadata.

Headlines should be short, direct, and confident.

Good headline examples:

* Make the old way obsolete.
* Retire your workaround.
* Software, considered.
* Goodbye, bad interface.
* Built to replace what no longer works.

Use mono typography for labels such as:

* `status: old way detected`
* `service: repair`
* `system: replacement pending`
* `version: v0.1`
* `result: process retired`

Do not overuse mono typography. Obsolete should feel like a designed software house, not a code editor theme.

Avoid overly quirky display fonts. The brand’s strangeness should come from language, layout, and interaction details, not novelty type.

## Layout

The layout should feel like a working interface rather than a brochure.

Use a strict grid, generous spacing, clear hierarchy, thin rules, modular sections, and object-like panels. Pages should feel intentionally assembled, not decorated.

Layout principles:

* use strong alignment
* favour clear blocks over freeform composition
* use thin borders instead of decorative shapes
* allow large empty space around important statements
* group related content into interface-like panels
* make metadata visible
* use before/after structures where useful
* make every section feel useful

Desktop layouts can be more technical and grid-based. Mobile layouts should feel like a stacked manual: simple, readable, and direct.

Suggested homepage structure:

1. Hero
2. What we replace
3. What we make
4. How we work
5. Selected work
6. Services
7. Contact CTA

The site should make the old way feel heavy, messy, slow, or fragile — and make Obsolete feel like the clean replacement.

## Elevation & Depth

Depth should be created through tonal contrast, borders, spacing, and layering rather than heavy shadows.

Use:

* thin borders
* surface changes
* inset panels
* metadata strips
* dark inverse panels
* subtle raised surfaces
* structured overlap only when useful

Avoid:

* glossy shadows
* floating SaaS cards
* glassmorphism
* dramatic blur
* excessive depth effects

The site should feel flat, structured, and object-like. It should resemble a useful system, not a marketing graphic.

## Shapes

The shape language is precise and minimally softened.

Use sharp or slightly rounded corners. The default radius should be small. Components can be squared when the interface needs to feel more industrial or direct.

Shape principles:

* buttons: small radius
* cards: modest radius
* chips: full radius only when they are clearly labels
* inputs: small radius
* panels: modest radius
* rules and dividers: thin and visible

Avoid bubbly UI, overly soft cards, pill-shaped everything, and decorative blob shapes.

The overall shape language should feel engineered, not friendly for the sake of being friendly.

## Components

### Buttons

Buttons should be direct, compact, and slightly deadpan.

Primary CTA examples:

* `Show us the old way`
* `Start replacing`
* `Retire a system`
* `Discuss a replacement`

Secondary CTA examples:

* `View repairs`
* `Inspect work`
* `See the process`
* `Read the notes`

Buttons should have clear hover, active, disabled, and focus states. Focus states must be visible and should use the signal color.

### Cards

Cards should feel like product modules or system records.

A good card includes:

* small mono label
* short title
* useful description
* optional status or metadata
* clear action

Example:

`service: repair`

**Interface repair**

For products that technically work, but feel painful, cluttered, or unclear.

`status: useful when redesigned`

### Tags and Status Labels

Tags should feel like system labels, not marketing badges.

Examples:

* `design-led`
* `replacement`
* `repair`
* `retired`
* `old way detected`
* `built properly`
* `interface repaired`
* `process retired`

### Forms

Forms should feel like submitting an old system for inspection.

Field labels:

* `What needs replacing?`
* `Where does it hurt?`
* `Who still uses this?`
* `How are you solving it now?`
* `Screenshots, links, or notes`

Submit button:

* `Send old way`
* `Begin replacement`
* `Submit for inspection`

Success message:

`Old way received. We will inspect it shortly.`

Error message:

`Something resisted replacement. Try again.`

### Case Studies

Case studies should be framed as system replacements, not generic portfolio pieces.

Recommended structure:

* client
* old system
* problem
* replacement
* what was retired
* result

Example:

**Old system:** Spreadsheet with 14 tabs and one terrified owner.
**Replacement:** Custom quoting tool with approval states and pricing logic.
**Retired:** Duplicate entry, version confusion, approval chasing, and avoidable panic.

### Motion

Motion should feel functional, not decorative.

Use:

* quick fades
* snapping panels
* cursor-like reveals
* status changes
* simple progress transitions
* cross-outs
* archive/replacement moments
* interface state changes

Avoid:

* bouncy animation
* liquid motion
* heavy parallax
* glitch overload
* slow cinematic transitions

Motion should feel like a system responding.

## Do's and Don'ts

Do:

* make the site feel like a designed software product
* use the signal color sparingly
* use typography, spacing, and grid as the main identity
* make services feel like named system modules
* use dry humour in small details
* show product thinking, not just visuals
* write direct, useful copy
* use borders and panels to create structure
* make accessibility non-negotiable
* make the old way feel ready to retire

Don't:

* make the brand look old, dusty, broken, or nostalgic
* use generic SaaS gradients
* use cyberpunk styling
* overuse glitch effects
* copy Teenage Engineering too directly
* rely on fake code screenshots
* use stock office imagery
* make everything lowercase just for style
* use vague innovation language
* add decorative icons without function
* make the brand silly
* use more software when less would do

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

Prefer copy such as:

* replace
* retire
* repair
* reduce
* diagnose
* system
* interface
* product
* tool
* workflow
* useful
* considered
* built properly
* old way
* workaround
* no longer fit for purpose

Final rule:

**Every design decision should make Obsolete feel like the calm, useful replacement for a system that has outstayed its welcome.**

# Craft Applied Featured Work — Paper Design Handoff

## Objective

Create desktop and mobile designs in Paper for the first homepage section after
the approved Obsolete hero: a single featured project for Craft Applied.

This is a design task, not an implementation task. The final Paper artboards must
be specific enough for a later implementation agent to reproduce the layout,
responsive behaviour, typography, content hierarchy, media treatment, and CTA
without inventing missing decisions.

The section should prove the hero's claim through real work. It must feel like an
editorially composed feature for one substantial project, not a portfolio grid
with empty slots.

## Sources of truth

Use these sources in this order:

1. [`DESIGN.md`](../DESIGN.md) — Obsolete visual system, layout, project-card,
   case-study, tag, and motion guidance.
2. [`docs/language.md`](./language.md) — project language, case-study structure,
   approved vocabulary, and CTA tone.
3. [Paper: Obsolete — Updated Hero Direction][paper] — the approved visual
   context that this section must follow.
4. [Craft Applied][craft-applied] — the live project and the source for real
   visual material.
5. [Craft Applied Website v4.0 release notes][craft-release] — public technical
   context and stated project priorities.
6. This handoff — scope, content, composition, Paper workflow, and acceptance
   criteria.

Do not treat Firecrawl summaries as permission to invent outcomes or attribution.
The user has explicitly confirmed that Obsolete owned both design and development
for the project. Public claims still need to remain faithful to the live site and
published release notes.

## Confirmed decisions

| ID    | Decision                                                                                 | Rationale                                                                         |
| ----- | ---------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| D-001 | Feature one project only: Craft Applied.                                                 | It is the only currently publishable project.                                     |
| D-002 | Label the section `Featured work — 01`, not `Selected work`.                             | A singular feature is honest and gives the project appropriate weight.            |
| D-003 | Present Obsolete's role as design and development.                                       | Explicitly confirmed by the user.                                                 |
| D-004 | Design the homepage feature, not a full case-study page.                                 | This is the next section after the hero.                                          |
| D-005 | Create desktop and mobile artboards in the existing Obsolete Paper file.                 | The new section must be judged against the approved hero direction.               |
| D-006 | Use real Craft Applied imagery or screenshots.                                           | The work must be evidence, not an unexplained beauty-shot placeholder.            |
| D-007 | Keep Obsolete's warm neutral wrapper around the project media.                           | The client identity should be visible without replacing Obsolete's site identity. |
| D-008 | Do not publish metrics, testimonials, dates, or business outcomes that are not supplied. | The public site does not provide enough evidence for quantified claims.           |

## Public project evidence

A Firecrawl crawl of `https://craftapplied.com` covered 30 pages. The following
facts are safe inputs for the design and draft copy:

- Craft Applied describes itself as a studio crafting websites and applications
  with strategy, UI/UX design, and software development.
- The live site contains service positioning, technology and tooling, selected
  work, case studies, editorial content, an accessibility statement, and a
  contact flow.
- The current site reports Astro `v5.14.5` in its generated metadata.
- The published v4 release notes identify Astro, SolidJS, a TailwindCSS UI kit,
  and Plausible analytics.
- Publicly stated priorities include performance, consistency, usability,
  accessibility, privacy, and easier ongoing development.
- The site uses a light cream and dark ink identity with a green accent.
- Firecrawl's branding extraction reported these useful references:
  - cream: `#FAF4E6`
  - background: `#FDFAF2`
  - green: `#00853E`
  - ink: `#000000`
  - primary type: DM Sans
  - mono type: DM Mono

Treat the Craft colors and typography as project content. Use them inside source
media, crops, or a restrained identity detail; do not replace Obsolete's Inter,
IBM Plex Mono, paper, ink, and orange system across the surrounding section.

## Required section copy

Use the following copy in the artboards unless source inspection reveals a
factual conflict.

### Eyebrow

> Featured work — 01

### Project title

> Craft Applied

### Project statement

> A clearer, faster home for a multidisciplinary digital studio.

### Summary

> We designed and developed a content-rich website that turns a broad service
> offering into a clear journey—from capabilities and technology to selected
> work, editorial thinking, and contact.

### Project facts

Use a compact, scannable metadata treatment:

- `Client / Craft Applied`
- `Role / Design + development`
- `Focus / Strategy, UX/UI, content architecture, engineering`
- `Platform / Astro, SolidJS, TailwindCSS, Plausible`

The focus and platform may wrap or split into smaller rows on mobile. Do not add
a year, location, collaborator, award, or performance score without approval.

### Action

Primary project action:

> Visit Craft Applied

Destination: `https://craftapplied.com`

Use a small external-link arrow as decorative punctuation. The action must remain
literal and must not imply that a full case study already exists.

## Visual direction

The feature should feel expansive, precise, and materially different from the
hero while remaining part of the same site.

Required characteristics:

- Continue the editorial asymmetry established by the hero.
- Shift the section background from `--color-neutral` (`#F4F1EA`) to the subtle
  warm surface `--color-surface` (`#EBE6DC`) to create a new chapter without a
  dramatic theme change.
- Introduce the section with one thin rule and the mono eyebrow.
- Keep the project title in Obsolete's sans-serif display face.
- Make the live work the largest visual event in the section.
- Use a real desktop screenshot as the primary media asset.
- Use a real mobile screenshot or a purposeful detail crop to prove responsive
  design rather than shrinking the desktop image until it is unreadable.
- Frame media with at most a thin rule. Do not use browser chrome, device mockups,
  glass, gradients, heavy shadows, floating cards, or fake interface controls.
- Let Craft Applied's cream, black, and green appear inside the project media.
  Keep Obsolete orange limited to the section rule, index punctuation, focus, or
  CTA punctuation.
- Preserve generous empty space around the statement and project title.
- Keep metadata easy to scan and visibly secondary to the project media.

## Desktop composition

Reference artboard: `1440 × 1200`.

Create an artboard named:

> Featured Work — Desktop 1440

Composition guardrails:

- Section background: `#EBE6DC`.
- Horizontal page padding: approximately `48px`.
- Top and bottom padding: approximately `88–112px`.
- Top row: thin orange rule plus `Featured work — 01` at the left.
- Project header: a large `Craft Applied` title on the left and the project
  statement/summary on the right or lower-right.
- Keep the project title clearly subordinate to the homepage hero headline; aim
  for approximately `72–88px`, weight `600`, with tight tracking.
- Keep the statement around `28–36px`; keep the supporting summary around
  `18–20px` and no wider than approximately `480px`.
- Place a real Craft Applied desktop screenshot below the header as the dominant
  media field, approximately `1344px` wide. Its crop should reveal the site's
  identity and enough content structure to communicate the work.
- Do not place descriptive copy over detailed screenshot content.
- Place metadata and `Visit Craft Applied` in a clear row below the main media,
  or in a narrow information rail that does not reduce the media excessively.
- A second image may be used only when it proves a distinct responsive or
  editorial detail. Do not simulate multiple projects.

Use fluid proportions and alignment logic that can later be implemented with
bounded widths and CSS grid. Do not solve the artboard with arbitrary absolute
positions that have no responsive interpretation.

## Mobile composition

Reference artboard: `390 × 1080`.

Create an artboard named:

> Featured Work — Mobile 390

Composition guardrails:

- Horizontal page padding: `20px`.
- Top and bottom padding: approximately `64–80px`.
- Keep the eyebrow and orange rule compact.
- Set `Craft Applied` at approximately `48–58px`, weight `600`, with tight
  tracking and no clipping.
- Place the project statement and summary directly after the title.
- Stack metadata into short labelled rows; do not compress it into illegible
  chips.
- Use a real mobile screenshot or a tall purposeful crop as the main visual.
  Desktop screenshots must not be reduced into unreadable thumbnails.
- Keep `Visit Craft Applied` at least `44px` high and visibly actionable.
- Preserve a confident amount of empty space while keeping all essential content
  in a coherent reading order.
- No horizontal overflow, clipped type, or off-artboard media.

The mobile artboard must be independently art-directed, not a scaled-down desktop
composition.

## Media acquisition and handling

The Paper agent should inspect the live site before composing the final media.
Use real source material in this preference order:

1. a current full-page or viewport screenshot of `https://craftapplied.com`;
2. a current mobile viewport screenshot of the same page;
3. purposeful crops from those screenshots;
4. the site's real logo only as a small identity detail.

If the agent can insert remote images through `paper_write_html`, use the live
source or a durable captured asset. Do not embed an expiring Firecrawl storage URL
in the final design. If durable screenshots cannot be imported, keep clearly
named media frames and report the missing asset as a blocker rather than drawing
fake Craft Applied interfaces.

Do not alter, recolor, or redraw the Craft Applied website in a way that could be
mistaken for the delivered work.

## Paper MCP workflow

Use the Paper MCP as the editing surface and preserve the existing hero artboards.

### U-001 — Inspect the existing design context

- Open [the existing Paper file][paper] with `paper_open_file`.
- Use `paper_get_basic_info`, `paper_get_tree_summary`, `paper_get_tokens`, and
  `paper_get_computed_styles` to inspect the hero artboards and shared tokens.
- Capture `Hero — Desktop 1440` and `Hero — Mobile 390` with
  `paper_get_screenshot` for side-by-side reference.
- Do not modify the approved hero artboards.

Acceptance: the agent can identify the paper, ink, line, orange, sans, mono, and
spacing treatments used by the hero before creating new nodes.

### U-002 — Create a dedicated Paper page and artboards

- Create or open a page named `Featured Work` with `paper_create_page` and
  `paper_open_page`.
- Create the two required top-level artboards with `paper_create_artboard`.
- Keep generous separation between artboards on the canvas.
- Apply existing tokens where possible instead of introducing near-duplicate
  colours or spacing values.

Acceptance: both correctly named artboards exist at `1440 × 1200` and
`390 × 1080`.

### U-003 — Build the desktop composition incrementally

- Use `paper_write_html` in small, reviewable blocks: section shell, eyebrow,
  project header, media, then metadata/action.
- Inspect each block with `paper_get_tree_summary` and `paper_get_screenshot`.
- Use `paper_update_styles`, `paper_set_text_content`, and `paper_move_nodes` for
  refinement rather than repeatedly recreating the artboard.

Acceptance: the desktop artboard satisfies the content and composition
requirements without obscuring the work or copying the hero layout.

### U-004 — Build the mobile composition as a distinct layout

- Recompose the hierarchy for `390px`; do not merely scale the desktop group.
- Use the real mobile project view or a deliberate mobile crop.
- Verify title wrapping, metadata readability, CTA size, and edge spacing.

Acceptance: the mobile artboard is complete, readable, and contains no clipped or
placeholder content.

### U-005 — Review, refine, and finish

- Capture both artboards at scale `1` with `paper_get_screenshot`.
- Review colour contrast, alignment, hierarchy, media fidelity, and spacing.
- Use `paper_get_computed_styles` on key text and layout nodes to verify intended
  values rather than judging only by eye.
- Call `paper_finish_working_on_nodes` for every node or artboard marked as being
  actively edited.

Acceptance: Paper contains two finished artboards with no active editing markers,
unresolved placeholder text, or accidental changes to the hero designs.

## Accessibility and content requirements

- Maintain strong contrast for all Obsolete copy and metadata.
- Do not place copy over a visually busy screenshot unless a solid background
  guarantees contrast.
- CTA text must remain literal: `Visit Craft Applied`.
- Decorative arrows and punctuation must not carry essential meaning.
- The later implementation must be able to provide useful alt text for every
  project image; design annotations should distinguish decorative crops from
  meaningful views.
- Do not use tiny mono labels below approximately `10px` desktop or `9px` mobile.
- Do not encode project facts by colour alone.
- Reading order must remain logical on mobile: eyebrow, title, statement,
  summary, media, metadata, action.

## Acceptance criteria

### Paper deliverables

- [ ] A dedicated `Featured Work` Paper page exists in the current Obsolete file.
- [ ] `Featured Work — Desktop 1440` exists at `1440 × 1200`.
- [ ] `Featured Work — Mobile 390` exists at `390 × 1080`.
- [ ] The approved hero artboards are unchanged.
- [ ] Both artboards use real Craft Applied visual material or explicitly report
      a durable media-import blocker.

### Visual

- [ ] The section reads unmistakably as one featured project, not an incomplete
      portfolio grid.
- [ ] Project media is the dominant visual event.
- [ ] Obsolete's neutral, ink, mono, sans, and orange system remains recognizable.
- [ ] Craft Applied's identity appears within the work without taking over the
      surrounding site chrome.
- [ ] No gradients, glass, heavy shadows, browser chrome, device mockups, fake UI,
      or unexplained decorative effects appear.
- [ ] Desktop and mobile feel related but independently art-directed.

### Content

- [ ] Required project copy appears exactly as approved in this handoff.
- [ ] Obsolete's role is shown as design and development.
- [ ] No unsupported metric, testimonial, award, year, or business outcome is
      shown.
- [ ] The live-site CTA uses `https://craftapplied.com`.
- [ ] Language remains specific, direct, and free of generic agency claims.

### Responsive and implementation readiness

- [ ] The desktop composition has a clear grid and bounded content widths.
- [ ] The mobile composition has no clipping or horizontal overflow.
- [ ] Metadata and media have an obvious implementation order.
- [ ] Text styles, spacing, dimensions, and key alignments can be inspected in
      Paper rather than inferred from a flattened screenshot.

## Verification

Before reporting completion, the Paper agent must:

1. capture the finished desktop and mobile artboards;
2. compare them against the existing hero artboards for continuity;
3. inspect key computed styles for title, summary, metadata, CTA, and media frame;
4. confirm that the source media depicts the live Craft Applied site;
5. confirm the hero artboards were not modified;
6. confirm all working-on-node markers were removed;
7. review the complete Paper page at normal zoom for composition and pacing.

Do not claim readiness from node creation alone. The final screenshots are the
primary visual evidence.

## Out of scope / non-goals

- Designing or implementing a full Craft Applied case-study page.
- Designing additional fictional or unpublished projects.
- Reworking the approved hero, masthead, particle treatment, or global identity.
- Redesigning the Craft Applied website inside the portfolio image.
- Writing production Astro components or responsive CSS.
- Inventing testimonials, results, performance scores, awards, or client quotes.
- Designing the later What we make, How we work, Services, About, or Contact
  sections.

## Handoff completion report

The Paper agent should finish with:

1. the Paper file URL and page name;
2. desktop and mobile artboard node IDs;
3. screenshots of both finished artboards;
4. a concise summary of the visual concept;
5. the source and crop used for each project image;
6. any intentional differences from this handoff;
7. unresolved copy, media, accessibility, or implementation dependencies;
8. confirmation that `paper_finish_working_on_nodes` was called.

## Compact agent prompt

Open the existing Obsolete Paper file and design a single Craft Applied featured
work section on a new `Featured Work` page. Preserve the approved hero artboards.
Create `Featured Work — Desktop 1440` at `1440 × 1200` and
`Featured Work — Mobile 390` at `390 × 1080`. Follow the copy, visual direction,
responsive guardrails, media rules, Paper MCP workflow, and acceptance criteria
in this handoff. Use real Craft Applied screenshots, do not invent outcomes or
additional projects, build incrementally with Paper MCP tools, verify with final
screenshots and computed styles, and call `paper_finish_working_on_nodes` before
reporting completion.

[paper]: https://app.paper.design/file/01KXHK8AQCT8JP87892V3RNV53/1-0
[craft-applied]: https://craftapplied.com
[craft-release]: https://craftapplied.com/blog/craft-applied-website-v4-0-release/

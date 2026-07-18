# Video Marketing Copy Insights

Research brief based on Alex Hormozi’s “14 Years of Marketing Advice in 35 Minutes,” applied to Obsolete’s current website copy and positioning.

## Key findings

### Primary-source lessons

The timestamps below link directly to the [YouTube video](https://www.youtube.com/watch?v=JDR-R--4HhM). Claims labeled **Video claim** reflect its manually created English captions; recommendations labeled **Application** are my inference.

1. **Prioritize the opening message.**  
   **Video claim:** Hormozi calls the headline the most important copy element and says strong variants can multiply downstream readership ([00:17–01:31](https://www.youtube.com/watch?v=JDR-R--4HhM&t=17s)). He recommends deliberate testing rather than treating the first line as decoration ([02:07–02:48](https://www.youtube.com/watch?v=JDR-R--4HhM&t=127s)).  
   **Application:** Keep Obsolete’s memorable hero hook, but make the clarification beneath it more concrete and commercially legible.

2. **Use proof competitors cannot copy.**  
   **Video claim:** “Proof will always outdo promise”; competitors can copy an offer but not earned experience ([03:36–05:16](https://www.youtube.com/watch?v=JDR-R--4HhM&t=216s)).  
   **Application:** Surface the existing Craft Applied evidence earlier. Do not invent metrics, testimonials, awards, or outcomes.

3. **Make the audience self-identify.**  
   **Video claim:** Name the intended customer—and, when useful, who the offer is not for—so the right reader recognizes “this is for me” ([05:16–06:48](https://www.youtube.com/watch?v=JDR-R--4HhM&t=316s)). Specific situations outperform generic marketing language ([08:00–09:44](https://www.youtube.com/watch?v=JDR-R--4HhM&t=480s)).  
   **Application:** “Creative companies” is directionally useful but broad. Add concrete engagement fit without adopting an aggressive exclusionary tone.

4. **Give a reason and sell one next step.**  
   **Video claim:** Explain why the reader should take the next step; “a confused mind does not buy” ([09:44–11:29](https://www.youtube.com/watch?v=JDR-R--4HhM&t=584s)).  
   **Application:** CTAs should state the action and what follows, not rely only on the poetic “Bring us an idea.”

5. **Use honest limitations to increase trust.**  
   **Video claim:** Owning a real limitation can trade some promise for greater trust and address concerns before the prospect raises them ([12:22–15:48](https://www.youtube.com/watch?v=JDR-R--4HhM&t=742s)).  
   **Application:** The pricing estimator already has credible scope boundaries and assumptions. Promote these as signs of a disciplined engagement rather than hiding them deep in the page.

6. **Describe observable moments, not abstractions.**  
   **Video claim:** “Show, don’t tell” means describing what the outcome looks and feels like instead of repeating generic benefits ([16:31–18:42](https://www.youtube.com/watch?v=JDR-R--4HhM&t=991s)).  
   **Application:** Replace abstract phrases such as “ambitious digital experiences” with recognizable deliverables and evidence: clearer service journeys, reusable publishing patterns, accessible responsive interfaces, or dependable AI behavior.

7. **Make calls to action explicit.**  
   **Video claim:** Tell readers exactly what to do and what will happen next ([27:37–29:31](https://www.youtube.com/watch?v=JDR-R--4HhM&t=1657s)).  
   **Application:** Use descriptive button labels and add a short post-click expectation near the contact CTA.

8. **Reduce linguistic friction.**  
   **Video claim:** Copy loses readers when it makes them pause; he advocates short sentences, familiar words, strong proof, and simplicity over concision ([30:08–33:21](https://www.youtube.com/watch?v=JDR-R--4HhM&t=1808s)).  
   **Application:** Simplify dense process copy, but do not mechanically target a third-grade reading level. This is a considered B2B service and can retain precise technical language.

## Current-site diagnosis

- `src/copy.ts:511–517` has a strong brand headline, but the clarification still depends on broad category language: “creative companies,” “ambitious,” and “digital experiences.”
- `src/copy.ts:521–528` uses distinctive CTAs, but “Bring us an idea” does not explain what happens after the click.
- The strongest proof—Craft Applied’s role, scope, platform, live site, and case study—does not appear until after the capabilities section (`src/pages/index.astro`).
- `src/copy.ts:202–273` is the strongest conversion-oriented section: it provides prices, fit, boundaries, assumptions, and a reason to continue.
- `src/copy.ts:380–448` presents credible AI judgment, but introducing AI product delivery before pricing may broaden the apparent offer and compete with the main creative-technology positioning.
- `src/copy.ts:491–495` repeats the invitation without adding qualification, proof, or the next-step expectation.
- `src/copy.ts:142–145` says the inquiry form is a prototype and sends nothing. Until replaced, this is a material conversion blocker, not merely a copy issue.

## Prioritized recommendations

### P0 — Clarify the hero without discarding the brand hook

Keep:

> The internet could be more interesting.

Test this clarification:

> Obsolete designs and builds custom websites, digital products, and AI experiences for creative companies. Creative direction, design, and engineering stay in one team from first idea to launch.

CTA test:

- **Primary:** `Tell us about your project`
- **Secondary:** `See the work`

Supporting expectation:

> Share the idea, timing, and likely investment. We’ll review the fit and suggest the next step.

Verify the actual response process before publishing that expectation.

### P0 — Put earned proof near the first decision point

Add a compact proof line immediately after the hero or move Featured Work ahead of Capabilities:

> **Recent work / Craft Applied**  
> Design, content architecture, and engineering for a live multidisciplinary studio platform.  
> `View the case study →`

This uses documented facts rather than unsupported performance claims.

### P1 — Make fit and non-fit explicit

Suggested section:

> **A good fit when**  
> You have a distinctive idea, a complex story, or a product interaction that cannot be solved well with a template.
>
> **Probably not the right fit when**  
> You need commodity production, an unlimited brief, or technology added without a clear user benefit.

This is an inferred positioning recommendation; validate it against the studio’s actual commercial policy.

### P1 — Turn scope limits into trust signals

Rewrite the estimator introduction:

> Choose the closest type of project to see a realistic investment range. Each range covers creative direction, design, and engineering with a defined scope, one feedback lead, and two revision rounds.

This brings existing assumptions (`src/copy.ts:226–234`) forward instead of adding new promises.

### P1 — Make the final CTA answer objections

Example:

> **Have an idea but not a finished brief?**  
> Send the rough version. Tell us what you want to make, who it is for, and what is getting in the way. We’ll use that to decide whether a focused project makes sense.
>
> `Start a project inquiry →`

This retains the direct, collaborative tone in `docs/language.md` while lowering uncertainty.

### P2 — Strengthen credibility through case-study specificity

Prefer evidence already present in the repository:

- role: design and development;
- six-discipline content structure;
- Astro/SolidJS implementation;
- reusable editorial patterns;
- responsive and keyboard-aware interface;
- live-site link.

Avoid “clearer,” “faster,” or business-result claims unless benchmarks or client confirmation can substantiate them.

### P2 — Simplify hierarchy

Recommended homepage order:

1. Brand hook, clear offer, primary CTA
2. Featured project/proof
3. Capabilities
4. AI product delivery, framed as a specialist engagement
5. Pricing and scope
6. Objection-aware final CTA

This is an inference from the video’s “proof before promise” principle, not a layout instruction stated by Hormozi.

### P3 — Test rather than overwrite

Test controlled variants for:

- current expressive hero vs. a more outcome-led clarification;
- `Bring us an idea` vs. `Tell us about your project`;
- proof immediately after hero vs. after capabilities;
- final CTA with and without next-step copy.

Measure qualified inquiry starts and completed submissions, not only clicks.

## Advice that does not cleanly fit Obsolete

- **Artificial urgency/scarcity:** Hormozi requires it to be legitimate ([21:25–23:16](https://www.youtube.com/watch?v=JDR-R--4HhM&t=1285s)). Do not add countdowns or “limited slots” unless capacity is real and enforced.
- **Status framing:** His status-benefit tactic ([18:42–21:25](https://www.youtube.com/watch?v=JDR-R--4HhM&t=1122s)) could sound gauche for a quietly confident creative studio. Prefer professional pride and clarity over envy.
- **P.S. statements:** Useful for ads and email ([25:45–27:30](https://www.youtube.com/watch?v=JDR-R--4HhM&t=1545s)), but unnecessary as a literal homepage convention.
- **Third-grade reading level:** Treat this as a warning against friction, not a mandatory score.
- **Sensational hooks:** “Grab the reader by the throat” is incompatible with the language guide’s restrained voice. Preserve curiosity without hype.
- **Humor:** The video calls it optional and secondary to the other principles ([33:46–34:31](https://www.youtube.com/watch?v=JDR-R--4HhM&t=2026s)). Obsolete’s “one clever move” rule is a better fit.

## Evidence and sources

- Primary: [Alex Hormozi, “14 Years of Marketing Advice in 35 Minutes”](https://www.youtube.com/watch?v=JDR-R--4HhM), manually created English captions retrieved for this review.
- Transcript cross-check: [Sozai transcript](https://sozai.app/transcript/14-years-of-marketing-advice-in-35-minutes-transcript/)
- Chapter/quotation cross-check: [Rosetta](https://rosetta.to/u/alexhormozi/14-years-of-marketing-advice-in-35-minutes)
- Repository sources: `src/copy.ts`, `src/pages/index.astro`, relevant homepage components, and `docs/language.md`.

## Gaps and uncertainties

- No conversion analytics, customer interviews, search-intent data, or current lead-quality data were available.
- No verified client metrics or testimonials support quantified Craft Applied outcomes.
- The studio’s genuine capacity, response time, minimum engagement, and non-fit policy need confirmation.
- The prototype contact form prevents evaluating end-to-end conversion until it can submit inquiries.

## SaaS idea seeds

1. **Claim Ledger:** maps every marketing claim to evidence, approval, and expiry.
2. **Proof-First Auditor:** finds promises that appear before substantiation on a site.
3. **CTA Journey Checker:** compares button language with the actual next screen and flags mismatches.
4. **Audience Specificity Linter:** detects broad positioning and suggests evidence-based qualifiers.
5. **Voice-Safe Copy Optimizer:** applies conversion principles within a brand’s language guide.
6. **Objection Map Builder:** converts sales calls and inquiry data into prioritized web objections.
7. **Ethical Scarcity Validator:** permits urgency copy only when inventory or capacity data supports it.
8. **Copy Experiment Planner:** generates controlled headline and CTA tests with qualified-lead metrics.

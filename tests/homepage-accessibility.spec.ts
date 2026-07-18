import { expect, test, type Locator, type Page } from '@playwright/test';

const proposition = 'The internet could be more interesting.';
const concreteOffer =
  'Obsolete designs and builds custom websites and digital products for creative companies, with creative direction, design, and engineering held by one team from idea to launch.';
const stalePropositions = [
  'Obsolete is a creative technology studio for creative companies.',
  'We design and engineer ambitious digital experiences worth spending time with.',
] as const;
const sectionHeadings = [
  'Craft Applied',
  'From first thought to finished thing.',
  'AI should earn its place.',
  'A useful range, before the brief.',
  'Bring us the idea you cannot stop thinking about.',
] as const;
const pricing = [
  ['Campaign / launch', '£5–10k'],
  ['Studio / brand site', '£10–20k'],
  ['Editorial platform', '£15–30k'],
  ['Digital product', '£25–50k'],
] as const;

const appearsBefore = async (first: Locator, second: Locator) =>
  first.evaluate(
    (element, following) =>
      Boolean(
        element.compareDocumentPosition(following as Node) & Node.DOCUMENT_POSITION_FOLLOWING,
      ),
    await second.elementHandle(),
  );

const expectCoherentSectionOutline = async (page: Page) => {
  await expect(page.getByRole('heading', { level: 1, name: proposition })).toHaveCount(1);

  const headings = sectionHeadings.map((name) =>
    page.getByRole('heading', { level: 2, name, exact: true }),
  );
  await Promise.all(headings.map((heading) => expect(heading).toBeVisible()));

  const orderChecks = await Promise.all(
    headings.slice(0, -1).map((heading, index) => appearsBefore(heading, headings[index + 1])),
  );
  expect(orderChecks).toEqual(headings.slice(1).map(() => true));

  const levels = await page
    .getByRole('heading')
    .evaluateAll((elements) => elements.map((element) => Number(element.tagName.slice(1))));
  expect(levels.filter((level) => level === 1)).toHaveLength(1);
  for (let index = 1; index < levels.length; index += 1) {
    expect(
      levels[index] - levels[index - 1],
      `heading level jumps from h${levels[index - 1]} to h${levels[index]}`,
    ).toBeLessThanOrEqual(1);
  }
};

const expectCurrentPropositionOnly = async (page: Page) => {
  const hero = page.getByRole('region', { name: proposition });

  await expect(page.getByRole('heading', { level: 1, name: proposition })).toHaveCount(1);
  await expect(hero.getByText(concreteOffer, { exact: true })).toHaveCount(1);
  await expect(hero.getByText(concreteOffer, { exact: true })).toBeVisible();
  await expect(hero.getByRole('link', { name: 'Bring us an idea' })).toHaveCount(1);
  await expect(hero.getByRole('link', { name: 'Bring us an idea' })).toHaveAttribute(
    'href',
    '/contact#project-inquiry',
  );
  await expect(hero.getByRole('link', { name: 'See our work' })).toHaveCount(1);
  await expect(hero.getByRole('link', { name: 'See our work' })).toHaveAttribute('href', '/work');

  await Promise.all(
    stalePropositions.map((staleProposition) =>
      expect(page.getByText(staleProposition, { exact: true })).toHaveCount(0),
    ),
  );
};

const expectFeaturedWork = async (page: Page) => {
  const work = page.getByRole('region', { name: 'Craft Applied' });

  await expect(work.getByText('A complex offer, made clear.', { exact: true })).toBeVisible();
  await expect(work.getByText(/six disciplines.+clear service model/iu)).toBeVisible();
  await expect(work.getByText(/reusable work and editorial publishing patterns/iu)).toBeVisible();
  await expect(work.getByText(/accessible, responsive interface/iu)).toBeVisible();
  await expect(
    work.getByRole('img', { name: /Craft Applied homepage.+deep green background/iu }),
  ).toBeVisible();
  await expect(work.getByRole('link', { name: 'View case study' })).toHaveAttribute(
    'href',
    '/work/craft-applied',
  );
  await expect(
    work.getByRole('link', { name: 'Visit Craft Applied (external site)' }),
  ).toHaveAttribute('href', 'https://craftapplied.com');
};

const expectCompleteAiExplanation = async (page: Page) => {
  const ai = page.getByRole('region', { name: 'AI should earn its place.' });

  await expect(
    ai.getByText('Specialist engagement / AI product delivery', { exact: true }),
  ).toBeVisible();
  await expect(ai.getByText(/^We start with a specific user outcome:/u)).toBeVisible();
  await expect(ai.getByText(/the most useful answer is not to use AI/iu)).toBeVisible();

  const outcomes = [
    ['Find', 'Make the right thing easier to discover.', /material too large or complex/iu],
    ['Decide', 'Turn complexity into useful choices.', /keeping judgment with the person/iu],
    ['Create', 'Give people better ways to make.', /drafting, adapting, and exploring/iu],
  ] as const;
  await Promise.all(
    outcomes.flatMap(([label, title, description]) => [
      expect(ai.getByRole('link', { name: new RegExp(label, 'u') })).toHaveAttribute(
        'href',
        '#ai-judgment-loop',
      ),
      expect(ai.getByRole('heading', { name: title, exact: true })).toBeVisible(),
      expect(ai.getByText(description)).toBeVisible(),
    ]),
  );

  await expect(
    ai.getByRole('heading', { name: 'From useful idea to production-ready AI product.' }),
  ).toBeVisible();
  const deliverySteps = [
    ['Establish the fit', /test whether AI improves it enough/iu],
    ['Prove the behavior', /prototype with real users and representative data/iu],
    ['Engineer dependable use', /evaluations, safeguards, privacy boundaries/iu],
    ['Launch and improve', /observe real use, then refine/iu],
  ] as const;
  await Promise.all(
    deliverySteps.flatMap(([title, description]) => [
      expect(ai.getByRole('heading', { name: title, exact: true })).toBeVisible(),
      expect(ai.getByText(description)).toBeVisible(),
    ]),
  );

  await expect(
    ai.getByText(/scoped after we understand the opportunity, data, risk/iu),
  ).toBeVisible();
  await expect(ai.getByRole('link', { name: 'Start a conversation' })).toHaveAttribute(
    'href',
    '/contact#project-inquiry',
  );
};

const expectClosingInquiry = async (page: Page) => {
  const invitation = page.getByRole('region', {
    name: 'Bring us the idea you cannot stop thinking about.',
  });

  await expect(invitation.getByRole('heading', { name: 'Good fit' })).toBeVisible();
  await expect(invitation.getByRole('heading', { name: 'Likely not a fit' })).toBeVisible();
  await expect(invitation.getByText(/An unfinished brief is welcome/iu)).toBeVisible();
  await expect(invitation.getByRole('link', { name: 'Start a project inquiry' })).toHaveAttribute(
    'href',
    '/contact#project-inquiry',
  );
};

const expectCompleteVisitorJourney = async (page: Page) => {
  await expectCurrentPropositionOnly(page);
  await expectFeaturedWork(page);
  await expectCompleteAiExplanation(page);
  await expectClosingInquiry(page);
  await expectCoherentSectionOutline(page);
};

const expectControlWithinDocument = async (control: Locator, page: Page) => {
  await control.scrollIntoViewIfNeeded();
  await expect(control).toBeVisible();
  const [box, viewportWidth] = await Promise.all([
    control.boundingBox(),
    page.evaluate(() => document.documentElement.clientWidth),
  ]);
  expect(box).not.toBeNull();
  if (!box) return;
  expect(box.width).toBeGreaterThan(0);
  expect(box.height).toBeGreaterThanOrEqual(44);
  expect(box.x).toBeGreaterThanOrEqual(0);
  expect(box.x + box.width).toBeLessThanOrEqual(viewportWidth);
};

const expectControlsWithinDocument = async (
  controls: Locator[],
  page: Page,
  index = 0,
): Promise<void> => {
  if (index >= controls.length) return;
  await expectControlWithinDocument(controls[index], page);
  return expectControlsWithinDocument(controls, page, index + 1);
};

const expectInteractivePricing = async (estimator: Locator, index = 0): Promise<void> => {
  if (index >= pricing.length) return;
  const [label, range] = pricing[index];
  await estimator.getByRole('button', { name: label }).click();
  await expect(estimator.getByText(range, { exact: true })).toBeVisible();
  return expectInteractivePricing(estimator, index + 1);
};

test('preserves the complete visitor journey at 200% text size', async ({ page }) => {
  await page.setViewportSize({ width: 640, height: 900 });
  await page.goto('/');
  await page.addStyleTag({ content: 'html { font-size: 200% !important; }' });

  await expectCompleteVisitorJourney(page);

  const work = page.getByRole('region', { name: 'Craft Applied' });
  const ai = page.getByRole('region', { name: 'AI should earn its place.' });
  const estimator = page.getByRole('region', { name: 'Project pricing estimator' });
  const invitation = page.getByRole('region', {
    name: 'Bring us the idea you cannot stop thinking about.',
  });
  const controls = [
    page.getByRole('region', { name: proposition }).getByRole('link', { name: 'Bring us an idea' }),
    page.getByRole('region', { name: proposition }).getByRole('link', { name: 'See our work' }),
    work.getByRole('link', { name: 'View case study' }),
    work.getByRole('link', { name: 'Visit Craft Applied (external site)' }),
    ai.getByRole('link', { name: 'Start a conversation' }),
    estimator.getByRole('link', { name: 'Start a conversation' }),
    invitation.getByRole('link', { name: 'Start a project inquiry' }),
    ...pricing.map(([label]) => estimator.getByRole('button', { name: label })),
  ];

  await expectInteractivePricing(estimator);
  await expectControlsWithinDocument(controls, page);

  const widths = await page.evaluate(() => ({
    client: document.documentElement.clientWidth,
    scroll: document.documentElement.scrollWidth,
  }));
  expect(widths.scroll).toBeLessThanOrEqual(widths.client);
});

test('keeps the complete visitor journey readable with reduced motion', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');

  await expectCompleteVisitorJourney(page);

  const hero = page.getByRole('region', { name: proposition });
  const work = page.getByRole('region', { name: 'Craft Applied' });
  const readableContent = [
    page.getByRole('heading', { level: 1, name: proposition }),
    hero.getByText(concreteOffer, { exact: true }),
    hero.getByRole('link', { name: 'Bring us an idea' }),
    hero.getByRole('link', { name: 'See our work' }),
    work.getByRole('heading', { level: 2, name: 'Craft Applied' }),
    work.getByText('A complex offer, made clear.', { exact: true }),
    work.getByText(/six disciplines.+clear service model/iu),
    work.getByRole('link', { name: 'View case study' }),
    work.getByRole('link', { name: 'Visit Craft Applied (external site)' }),
  ];
  await Promise.all(readableContent.map((content) => expect(content).toHaveCSS('opacity', '1')));
  const staticActions = [
    hero.getByRole('link', { name: 'Bring us an idea' }),
    hero.getByRole('link', { name: 'See our work' }),
    work.getByRole('link', { name: 'View case study' }),
    work.getByRole('link', { name: 'Visit Craft Applied (external site)' }),
  ];
  await Promise.all(
    staticActions.map((action) => expect(action).toHaveCSS('transition-duration', '0s')),
  );

  const estimator = page.getByRole('region', { name: 'Project pricing estimator' });
  await expectInteractivePricing(estimator);
});

test('renders the complete current journey without JavaScript', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto('/');

  await expectCompleteVisitorJourney(page);

  const estimator = page.getByRole('region', { name: 'Project pricing estimator' });
  await Promise.all(
    pricing.flatMap(([label, range]) => [
      expect(estimator.getByText(label, { exact: true }).filter({ visible: true })).toBeVisible(),
      expect(estimator.getByText(range, { exact: true }).filter({ visible: true })).toBeVisible(),
    ]),
  );

  await context.close();
});

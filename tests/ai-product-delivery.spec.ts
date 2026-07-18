import { expect, test, type Locator, type Page } from '@playwright/test';

const sectionTitle = 'AI should earn its place.';
const capabilitiesTitle = 'From first thought to finished thing.';
const outcomes = ['Find', 'Decide', 'Create'] as const;
const steps = [
  'Establish the fit',
  'Prove the behavior',
  'Engineer dependable use',
  'Launch and improve',
] as const;

const getSection = (page: Page) => page.getByRole('region', { name: sectionTitle });

const expectCompleteOffer = async (section: Locator) => {
  await expect(section).toBeVisible();
  await Promise.all(
    outcomes
      .map((outcome) =>
        expect(section.getByRole('link', { name: new RegExp(outcome, 'iu') })).toBeVisible(),
      )
      .concat(
        steps.map((step) => expect(section.getByRole('heading', { name: step })).toBeVisible()),
      ),
  );
  await expect(section.getByRole('link', { name: 'Start a conversation' })).toBeVisible();
};

const appearsBefore = async (first: Locator, second: Locator) =>
  first.evaluate(
    (element, following) =>
      Boolean(
        element.compareDocumentPosition(following as Node) & Node.DOCUMENT_POSITION_FOLLOWING,
      ),
    await second.elementHandle(),
  );

test('presents one connected practice before the specialist AI engagement and pricing', async ({
  page,
}) => {
  await page.goto('/');

  const featuredWork = page.getByRole('region', { name: 'Craft Applied' });
  const capabilities = page.getByRole('region', { name: capabilitiesTitle });
  const section = getSection(page);
  const pricing = page.getByRole('region', { name: /project pricing/iu });

  await expect(section).toBeVisible();
  expect(await appearsBefore(featuredWork, capabilities)).toBe(true);
  expect(await appearsBefore(capabilities, section)).toBe(true);
  expect(await appearsBefore(section, pricing)).toBe(true);

  await expect(
    section.getByText('Specialist engagement / AI product delivery', { exact: true }),
  ).toBeVisible();
  await expect(section.getByText('For creative product teams', { exact: true })).toBeVisible();
  await expect(section.getByText(/^We start with a specific user outcome:/u)).toBeVisible();
  await expect(section.getByText(/AI-enabled product/u)).toBeVisible();
  await expect(section.getByText(/AI fit/u).first()).toBeVisible();
  await expect(section.getByText('AI product judgment loop', { exact: true })).toBeVisible();
  await expect(section.getByText(/production-ready AI product/u)).toBeVisible();
  await expect(section.getByText(/the most useful answer is not to use AI/iu)).toBeVisible();
  await expect(
    section.getByText(/scoped after we understand the opportunity, data, risk/iu),
  ).toBeVisible();
  await expect(section.getByRole('link', { name: 'Start a conversation' })).toHaveAttribute(
    'href',
    '/contact#project-inquiry',
  );

  await expect(
    section.getByText(/AI transformation|AI solutions|AI for its own sake/iu),
  ).toHaveCount(0);
});

test('explains why direction, design, and engineering stay connected through launch', async ({
  page,
}) => {
  await page.goto('/');
  const section = page.getByRole('region', { name: capabilitiesTitle });

  await expect(
    section.getByText(
      /creative direction, design, and engineering stay connected from the first decision through launch/iu,
    ),
  ).toBeVisible();

  const capabilityGroups = [
    ['Direction', 'Creative direction', 'Experience strategy', 'Rapid prototyping'],
    ['Design', 'Art direction', 'UX + UI systems', 'Interaction + motion'],
    ['Engineering', 'Creative development', 'Web platforms', 'Performance + accessibility'],
  ];
  await Promise.all(
    capabilityGroups.flatMap((capability) =>
      [expect(section.getByText(capability[0], { exact: true }).first()).toBeVisible()].concat(
        capability
          .slice(1)
          .map((detail) => expect(section.getByText(detail, { exact: true })).toBeVisible()),
      ),
    ),
  );
});

test('makes every outcome and delivery stage explicit without an invented case study', async ({
  page,
}) => {
  await page.goto('/');
  const section = getSection(page);

  await Promise.all(
    outcomes.flatMap((outcome) => {
      const link = section.getByRole('link', { name: new RegExp(outcome, 'iu') });
      return [
        expect(link).toBeVisible(),
        expect(link).toHaveAttribute('href', '#ai-judgment-loop'),
      ];
    }),
  );
  await Promise.all(
    steps.map((step) => expect(section.getByRole('heading', { name: step })).toBeVisible()),
  );

  await expect(section.getByText(/client|case study|our work/iu)).toHaveCount(0);
});

test('connects outcomes to the judgment loop with pointer and keyboard focus', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  const section = getSection(page);
  const routes = section.locator('.ai-delivery__route span');

  await section.getByRole('link', { name: /Find/iu }).focus();
  await expect
    .poll(() => routes.nth(0).evaluate((element) => getComputedStyle(element).backgroundColor))
    .toBe('rgb(255, 75, 31)');

  await section.getByRole('link', { name: /Decide/iu }).hover();
  await expect
    .poll(() => routes.nth(1).evaluate((element) => getComputedStyle(element).backgroundColor))
    .toBe('rgb(255, 75, 31)');
});

test('keeps the process field usable by keyboard and on narrow screens', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await page.goto('/');
  const section = getSection(page);
  const outcomeLinks = outcomes.map((outcome) =>
    section.getByRole('link', { name: new RegExp(outcome, 'iu') }),
  );

  const [firstBox, secondBox, thirdBox] = await Promise.all(
    outcomeLinks.map((link) => link.boundingBox()),
  );
  if (!firstBox || !secondBox || !thirdBox) {
    throw new Error('AI outcome links were not rendered');
  }
  for (const box of [firstBox, secondBox, thirdBox]) {
    expect(box.height).toBeGreaterThanOrEqual(48);
  }
  expect(firstBox.y + firstBox.height).toBeLessThanOrEqual(secondBox.y);
  expect(secondBox.y + secondBox.height).toBeLessThanOrEqual(thirdBox.y);

  await outcomeLinks[0].focus();
  await expect(outcomeLinks[0]).toBeFocused();
  const focus = await outcomeLinks[0].evaluate((element) => {
    const style = getComputedStyle(element);
    return { style: style.outlineStyle, width: style.outlineWidth };
  });
  expect(focus.style).not.toBe('none');
  expect(focus.width).toBe('2px');

  await page.keyboard.press('Tab');
  await expect(outcomeLinks[1]).toBeFocused();
  await page.keyboard.press('Shift+Tab');
  await expect(outcomeLinks[0]).toBeFocused();

  const overflow = await page.evaluate(() => ({
    client: document.documentElement.clientWidth,
    scroll: document.documentElement.scrollWidth,
  }));
  expect(overflow.scroll).toBeLessThanOrEqual(overflow.client);
});

test('keeps the complete AI offer available without JavaScript and motion', async ({
  request,
  browser,
}) => {
  const response = await request.get('/');
  const html = await response.text();
  expect(html).toContain(sectionTitle);
  expect(html).toContain('Establish the fit');
  expect(html).toContain('Launch and improve');

  const reducedMotionContext = await browser.newContext({ reducedMotion: 'reduce' });
  const reducedMotionPage = await reducedMotionContext.newPage();
  await reducedMotionPage.goto('/');
  const reducedMotionSection = getSection(reducedMotionPage);
  await expectCompleteOffer(reducedMotionSection);
  expect(
    await reducedMotionSection
      .getByRole('link', { name: /Find/iu })
      .evaluate((element) => getComputedStyle(element).transitionDuration),
  ).toBe('0s');
  await reducedMotionContext.close();

  const noScriptContext = await browser.newContext({ javaScriptEnabled: false });
  const noScriptPage = await noScriptContext.newPage();
  await noScriptPage.goto('/');
  const noScriptSection = getSection(noScriptPage);
  await expectCompleteOffer(noScriptSection);
  await noScriptContext.close();
});

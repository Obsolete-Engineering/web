import { expect, test } from '@playwright/test';

const engagements = [
  {
    label: 'Campaign / launch',
    range: '£5–10k',
    fit: 'A focused launch or campaign experience',
    boundary: 'One clear outcome, shaped through a tightly bounded process',
  },
  {
    label: 'Studio / brand site',
    range: '£10–20k',
    fit: 'A compact custom marketing, portfolio, or brand website',
    boundary: 'A coherent custom site built around a focused story and content journey',
  },
  {
    label: 'Editorial platform',
    range: '£15–30k',
    fit: 'A content-rich publishing experience',
    boundary: 'A focused content model and limited reusable publishing system',
  },
  {
    label: 'Digital product',
    range: '£25–50k',
    fit: 'A focused product concept or one core MVP workflow',
    boundary: 'Discovery and delivery stay centred on the product’s essential job',
  },
] as const;

const getEstimator = (page: import('@playwright/test').Page) =>
  page.getByRole('region', { name: /project pricing/iu });

test('sits between featured work and the closing contact invitation in a neutral state', async ({
  page,
}) => {
  await page.goto('/');

  const featuredWork = page.getByRole('region', { name: 'Craft Applied' });
  const estimator = getEstimator(page);
  const contact = page.getByRole('region', {
    name: 'Bring us the idea you cannot stop thinking about.',
  });

  await expect(estimator).toBeVisible();
  expect(
    await featuredWork.evaluate(
      (featured, pricing) =>
        Boolean(
          featured.compareDocumentPosition(pricing as Node) & Node.DOCUMENT_POSITION_FOLLOWING,
        ),
      await estimator.elementHandle(),
    ),
  ).toBe(true);
  expect(
    await estimator.evaluate(
      (pricing, contactSection) =>
        Boolean(
          pricing.compareDocumentPosition(contactSection as Node) &
          Node.DOCUMENT_POSITION_FOLLOWING,
        ),
      await contact.elementHandle(),
    ),
  ).toBe(true);

  await expect(estimator.getByText('Choose an engagement')).toBeVisible();
  await expect(estimator.getByRole('link', { name: 'Start a conversation' })).toHaveCount(0);

  await Promise.all(
    engagements.flatMap((engagement) => [
      expect(estimator.getByRole('button', { name: engagement.label })).toHaveAttribute(
        'aria-pressed',
        'false',
      ),
      expect(estimator.getByText(engagement.range, { exact: true })).toHaveCount(0),
    ]),
  );
});

for (const engagement of engagements) {
  test(`shows the right full-service estimate and boundaries for ${engagement.label}`, async ({
    page,
  }) => {
    await page.goto('/');
    const estimator = getEstimator(page);
    const option = estimator.getByRole('button', { name: engagement.label });
    const result = estimator.getByRole('region', { name: 'Estimate result' });
    await option.click();

    await expect(option).toHaveAttribute('aria-pressed', 'true');
    await expect(result.getByRole('heading', { name: engagement.label })).toBeVisible();
    await expect(result.getByText(engagement.range, { exact: true })).toBeVisible();
    await expect(result.getByText(engagement.fit, { exact: false })).toBeVisible();
    await expect(result.getByText(engagement.boundary, { exact: false })).toBeVisible();
    await expect(
      result.getByText(/range covers creative direction, design, and engineering/iu),
    ).toBeVisible();
    await expect(
      result.getByText(/Indicative, includes VAT, and confirmed through a scoped proposal/iu),
    ).toBeVisible();
    await expect(result.getByText(/final content and core assets/iu)).toBeVisible();
    await expect(result.getByText(/one feedback lead/iu)).toBeVisible();
    await expect(result.getByText(/two revision rounds/iu)).toBeVisible();

    const action = result.getByRole('link', { name: 'Start a conversation' });
    await expect(action).toHaveAttribute('href', '/contact#project-inquiry');
    const href = await action.getAttribute('href');
    expect(href).not.toBeNull();
    if (href) expect(new URL(href, page.url()).search).toBe('');
  });
}

test('supports keyboard selection, announces updates, and keeps focus on the selected control', async ({
  page,
}) => {
  await page.goto('/');
  const estimator = getEstimator(page);
  const options = engagements.map(({ label }) => estimator.getByRole('button', { name: label }));

  await options[0].focus();
  await page.keyboard.press('Enter');
  await expect(options[0]).toBeFocused();
  await expect(options[0]).toHaveAttribute('aria-pressed', 'true');
  await expect(estimator.getByRole('status')).toContainText(engagements[0].label);

  await page.keyboard.press('Tab');
  await page.keyboard.press('Space');
  await expect(options[1]).toBeFocused();
  await expect(options[1]).toHaveAttribute('aria-pressed', 'true');
  await expect(estimator.getByRole('status')).toContainText(engagements[1].label);

  await page.keyboard.press('Tab');
  await page.keyboard.press('Enter');
  await expect(options[2]).toBeFocused();
  await expect(options[2]).toHaveAttribute('aria-pressed', 'true');
  await expect(estimator.getByRole('status')).toContainText(engagements[2].label);

  await page.keyboard.press('Tab');
  await page.keyboard.press('Space');
  await expect(options[3]).toBeFocused();
  await expect(options[3]).toHaveAttribute('aria-pressed', 'true');
  await expect(estimator.getByRole('status')).toContainText(engagements[3].label);

  const focusStyle = await options[3].evaluate((element) => {
    const style = getComputedStyle(element);
    return { outlineStyle: style.outlineStyle, outlineWidth: style.outlineWidth };
  });
  expect(focusStyle.outlineStyle).not.toBe('none');
  expect(focusStyle.outlineWidth).toBe('2px');

  await page.keyboard.press('Tab');
  await expect(estimator.getByRole('link', { name: 'Start a conversation' })).toBeFocused();
});

test('stacks controls before the result with comfortable targets and no mobile overflow', async ({
  page,
}) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await page.goto('/');
  const estimator = getEstimator(page);
  const firstOption = estimator.getByRole('button', { name: engagements[0].label });
  await firstOption.click();

  const listBox = await estimator
    .getByRole('group', { name: /engagement options/iu })
    .boundingBox();
  const resultBox = await estimator.getByRole('region', { name: 'Estimate result' }).boundingBox();
  expect(listBox).not.toBeNull();
  expect(resultBox).not.toBeNull();
  if (!listBox || !resultBox) throw new Error('Pricing layout boxes were not rendered');
  expect(listBox.y + listBox.height).toBeLessThanOrEqual(resultBox.y);

  const targetHeights = await Promise.all(
    engagements.map(async ({ label }) => {
      const box = await estimator.getByRole('button', { name: label }).boundingBox();
      return box?.height;
    }),
  );
  for (const height of targetHeights) expect(height).toBeGreaterThanOrEqual(48);

  const overflow = await page.evaluate(() => ({
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
  }));
  expect(overflow.scrollWidth).toBeLessThanOrEqual(overflow.clientWidth);
});

test('reflows at 200% text size without clipping or horizontal overflow', async ({ page }) => {
  await page.setViewportSize({ width: 640, height: 900 });
  await page.goto('/');
  await page.addStyleTag({ content: 'html { font-size: 200% !important; }' });

  const estimator = getEstimator(page);
  await estimator.getByRole('button', { name: 'Digital product' }).click();
  await expect(estimator.getByText('£25–50k', { exact: true })).toBeVisible();

  const overflow = await page.evaluate(() => ({
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
  }));
  expect(overflow.scrollWidth).toBeLessThanOrEqual(overflow.clientWidth);
});

test.describe('with reduced motion', () => {
  test('keeps selection immediate and removes nonessential pricing transitions', async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');
    const estimator = getEstimator(page);
    const option = estimator.getByRole('button', { name: 'Editorial platform' });
    await option.click();

    await expect(estimator.getByText('£15–30k', { exact: true })).toBeVisible();
    expect(await option.evaluate((element) => getComputedStyle(element).transitionDuration)).toBe(
      '0s',
    );
  });
});

test('keeps all commercial content in the server response and available without JavaScript', async ({
  request,
  browser,
}) => {
  const response = await request.get('/');
  const html = await response.text();

  for (const engagement of engagements) {
    expect(html).toContain(engagement.label);
    expect(html).toContain(engagement.range);
    expect(html).toContain(engagement.fit);
  }
  const normalizedHtml = html.toLowerCase();
  expect(normalizedHtml).toContain('final content and core assets');
  expect(normalizedHtml).toContain('one feedback lead');
  expect(normalizedHtml).toContain('two revision rounds');

  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto('/');
  const estimator = getEstimator(page);
  await Promise.all(
    engagements.map((engagement) =>
      expect(
        estimator.getByText(engagement.range, { exact: true }).filter({ visible: true }),
      ).toBeVisible(),
    ),
  );
  await context.close();
});

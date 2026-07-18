import { expect, test } from '@playwright/test';

import {
  analyzeGrainFrames,
  assertWarmMonochromeGrain,
  expectCanvasToCoverSurface,
  installGrainContextRequestTrace,
  installGrainDrawTrace,
  installGrainFailure,
  readGrainContextRequests,
  readGrainDrawTrace,
  resetGrainDrawTrace,
  type GrainFailure,
} from './grain-surface-helpers';

const engagements = [
  {
    label: 'Campaign / launch',
    range: '£5–10k',
    fit: 'A focused launch or campaign experience for one important moment.',
    boundary:
      'One clear outcome, shaped through a tightly bounded process rather than an open-ended programme of work.',
  },
  {
    label: 'Studio / brand site',
    range: '£10–20k',
    fit: 'A compact custom marketing, portfolio, or brand website for a creative company.',
    boundary:
      'A coherent custom site built around a focused story and content journey, not an unlimited digital estate.',
  },
  {
    label: 'Editorial platform',
    range: '£15–30k',
    fit: 'A content-rich publishing experience for an editorial team with a clear point of view.',
    boundary:
      'A focused content model and limited reusable publishing system, designed around the material that matters most.',
  },
  {
    label: 'Digital product',
    range: '£25–50k',
    fit: 'A focused product concept or one core MVP workflow for a product team ready to learn by making.',
    boundary:
      'Discovery and delivery stay centred on the product’s essential job rather than a broad platform or expanding feature list.',
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
  await expect(
    estimator.getByText(
      /Every range assumes a defined scope, one feedback lead, and two revision rounds/iu,
    ),
  ).toBeVisible();
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

test('keeps static grain on the result from first paint and without JavaScript', async ({
  request,
  browser,
}) => {
  const response = await request.get('/');
  const html = await response.text();
  expect(html).toContain('data-pricing-grain');
  expect(html).toContain('data-grain-state="static"');

  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto('/');
  const estimator = getEstimator(page);
  const fallbackSurfaces = estimator.locator('.pricing-estimator__fallback-result');
  await expect(fallbackSurfaces).toHaveCount(engagements.length);
  await expect(fallbackSurfaces.first()).toHaveAttribute('data-grain-state', 'static');
  await expect(fallbackSurfaces.first().locator('.pricing-estimator__grain')).toHaveCSS(
    'background-image',
    /capabilities-grain\.png/u,
  );
  await expect(
    fallbackSurfaces.first().getByRole('link', { name: 'Start a conversation' }),
  ).toBeVisible();
  await context.close();
});

test('uses static result grain without requesting WebGL for reduced motion', async ({ page }) => {
  await installGrainContextRequestTrace(page);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  const result = getEstimator(page).getByRole('region', { name: 'Estimate result' });
  await result.scrollIntoViewIfNeeded();

  await expect(result).toHaveAttribute('data-grain-state', 'static');
  await expect(result.locator('.pricing-estimator__grain')).toHaveAttribute('aria-hidden', 'true');
  await expect(result.locator('.pricing-estimator__grain')).toHaveCSS('pointer-events', 'none');
  await expect(result.locator('[data-grain-canvas]')).not.toHaveAttribute('tabindex', /.+/u);
  expect(await readGrainContextRequests(page)).toBe(0);
});

for (const failure of [
  'unsupported WebGL',
  'shader initialization',
] as const satisfies readonly GrainFailure[]) {
  test(`keeps pricing content available after ${failure}`, async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await installGrainFailure(page, failure);
    await page.goto('/');
    const estimator = getEstimator(page);
    const result = estimator.getByRole('region', { name: 'Estimate result' });
    await result.scrollIntoViewIfNeeded();

    await expect(result).toHaveAttribute('data-grain-state', 'fallback');
    await expect(result.locator('.pricing-estimator__grain')).toHaveCSS(
      'background-image',
      /capabilities-grain\.png/u,
    );
    const option = estimator.getByRole('button', { name: 'Campaign / launch' });
    await option.click();
    await expect(option).toHaveAttribute('aria-pressed', 'true');
    await expect(result.getByText('£5–10k', { exact: true })).toBeVisible();
    expect(errors).toEqual([]);
  });
}

test('arbitrates overlapping grain surfaces through one active renderer', async ({ page }) => {
  await installGrainDrawTrace(page);
  await page.setViewportSize({ width: 1200, height: 800 });
  await page.goto('/');
  const capabilities = page.getByRole('region', { name: 'From first thought to finished thing.' });
  const result = getEstimator(page).getByRole('region', { name: 'Estimate result' });
  test.skip(
    [
      await capabilities.getAttribute('data-grain-state'),
      await result.getAttribute('data-grain-state'),
    ].includes('fallback'),
    'WebGL is unavailable',
  );

  const overlap = await page.addStyleTag({
    content: `
      [data-capabilities-grain] {
        bottom: 0 !important;
        left: 0 !important;
        position: fixed !important;
        right: 50% !important;
        top: 0 !important;
      }
      [data-pricing-grain] {
        bottom: 0 !important;
        left: 50% !important;
        position: fixed !important;
        right: 0 !important;
        top: 0 !important;
      }
    `,
  });
  await expect
    .poll(async () => {
      const states = await Promise.all([
        capabilities.evaluate((element) => (element as HTMLElement).dataset.grainState),
        result.evaluate((element) => (element as HTMLElement).dataset.grainState),
      ]);
      return states.filter((state) => state === 'live').length;
    })
    .toBe(1);

  await resetGrainDrawTrace(page);
  await page.waitForTimeout(300);
  const draws = await readGrainDrawTrace(page);
  const activeRenderers = [draws.capabilities, draws.pricing].filter((count) => count > 1);
  expect(activeRenderers).toHaveLength(1);
  expect(Math.min(draws.capabilities, draws.pricing)).toBeLessThanOrEqual(1);
  await overlap.evaluate((element) => (element as HTMLElement).remove());

  const justOffscreen = await page.addStyleTag({
    content: `
      [data-pricing-grain] {
        height: 400px !important;
        left: 0 !important;
        position: fixed !important;
        top: calc(100vh + 1px) !important;
        width: 600px !important;
      }
    `,
  });
  await expect(result).toHaveAttribute('data-grain-state', /paused|static/u);
  await resetGrainDrawTrace(page);
  await page.waitForTimeout(220);
  expect((await readGrainDrawTrace(page)).pricing).toBe(0);
  await justOffscreen.evaluate((element) => (element as HTMLElement).remove());
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
    await expect(result.getByText(engagement.fit, { exact: true })).toBeVisible();
    await expect(result.getByText(engagement.boundary, { exact: true })).toBeVisible();
    await expect(estimator.getByRole('status')).toHaveText(
      `${engagement.label}. Indicative estimate ${engagement.range}, including VAT.`,
    );
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
  const action = estimator.getByRole('link', { name: 'Start a conversation' });
  await expect(action).toBeFocused();

  const result = estimator.getByRole('region', { name: 'Estimate result' });
  await expect(result.locator('.pricing-estimator__grain')).toHaveAttribute('aria-hidden', 'true');
  await expect(result.locator('.pricing-estimator__grain')).toHaveCSS('pointer-events', 'none');
  await expect(result.locator('[data-grain-canvas]')).not.toHaveAttribute('tabindex', /.+/u);
  expect(
    await result.evaluate((element) => ({
      content: getComputedStyle(element.querySelector('[data-pricing-result-content]')!).zIndex,
      grain: getComputedStyle(element.querySelector('.pricing-estimator__grain')!).zIndex,
    })),
  ).toEqual({ content: '1', grain: '0' });
});

test('pauses, resumes, resizes, and disposes the pricing grain without offscreen GPU work', async ({
  page,
}) => {
  await installGrainDrawTrace(page);
  await page.setViewportSize({ width: 1200, height: 800 });
  await page.goto('/');
  const estimator = getEstimator(page);
  const result = estimator.getByRole('region', { name: 'Estimate result' });
  await expect(result).toHaveAttribute('data-grain-state', /static|fallback/u);
  test.skip((await result.getAttribute('data-grain-state')) === 'fallback', 'WebGL is unavailable');

  await resetGrainDrawTrace(page);
  await page.waitForTimeout(220);
  expect((await readGrainDrawTrace(page)).pricing).toBe(0);

  await result.scrollIntoViewIfNeeded();
  await expect(result).toHaveAttribute('data-grain-state', 'live');
  await expect(result).toHaveAttribute('data-grain-quality', 'desktop');
  const canvas = result.locator('[data-grain-canvas]');
  await expectCanvasToCoverSurface(result);
  expect(
    await canvas.evaluate(
      (element) =>
        Math.round(
          ((element as HTMLCanvasElement).width / element.getBoundingClientRect().width) * 100,
        ) / 100,
    ),
  ).toBeLessThanOrEqual(1.51);

  await estimator.getByRole('button', { name: 'Editorial platform' }).click();
  await expect(result.getByText('£15–30k', { exact: true })).toBeVisible();
  await expect(result).toHaveAttribute('data-grain-state', 'live');
  const hiddenContent = await page.addStyleTag({
    content: '.pricing-estimator__result-content { visibility: hidden !important; }',
  });
  const staticOverride = await page.addStyleTag({
    content: '.pricing-estimator__grain canvas { opacity: 0 !important; }',
  });
  const staticFrame = await canvas.screenshot();
  await staticOverride.evaluate((element) => (element as HTMLElement).remove());
  const first = await canvas.screenshot();
  await resetGrainDrawTrace(page);
  await page.waitForTimeout(1_100);
  const activeDraws = await readGrainDrawTrace(page);
  expect(activeDraws.pricing).toBeGreaterThanOrEqual(16);
  expect(activeDraws.pricing).toBeLessThanOrEqual(22);
  expect(activeDraws.capabilities).toBeLessThanOrEqual(1);
  expect(activeDraws.hero).toBeLessThanOrEqual(1);
  const second = await canvas.screenshot();
  const desktopAnalysis = await analyzeGrainFrames(page, first, second);
  const staticAnalysis = await analyzeGrainFrames(page, staticFrame, staticFrame);
  assertWarmMonochromeGrain(desktopAnalysis);
  expect(Math.abs(desktopAnalysis.luminance - staticAnalysis.luminance)).toBeLessThan(4);
  expect(Math.abs(desktopAnalysis.spread - staticAnalysis.spread)).toBeLessThan(4);

  await page.evaluate(() => {
    Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'hidden' });
    document.dispatchEvent(new Event('visibilitychange'));
  });
  await expect(result).toHaveAttribute('data-grain-state', 'paused');
  await resetGrainDrawTrace(page);
  await page.waitForTimeout(220);
  expect((await readGrainDrawTrace(page)).pricing).toBe(0);
  await page.evaluate(() => {
    Object.defineProperty(document, 'visibilityState', {
      configurable: true,
      get: () => 'visible',
    });
    document.dispatchEvent(new Event('visibilitychange'));
  });
  await expect(result).toHaveAttribute('data-grain-state', 'live');

  const capabilities = page.getByRole('region', { name: 'From first thought to finished thing.' });
  await capabilities.scrollIntoViewIfNeeded();
  await expect(result).toHaveAttribute('data-grain-state', 'paused');
  await resetGrainDrawTrace(page);
  await page.waitForTimeout(220);
  expect((await readGrainDrawTrace(page)).pricing).toBe(0);

  await page.setViewportSize({ width: 390, height: 844 });
  await expect(result).toHaveAttribute('data-grain-state', 'static');
  await expect(canvas).toHaveCSS('opacity', '0');
  await result.scrollIntoViewIfNeeded();
  await expect(result).toHaveAttribute('data-grain-state', 'live');
  await expect(result).toHaveAttribute('data-grain-quality', 'mobile');
  await expectCanvasToCoverSurface(result);
  expect(
    await canvas.evaluate(
      (element) =>
        Math.round(
          ((element as HTMLCanvasElement).width / element.getBoundingClientRect().width) * 100,
        ) / 100,
    ),
  ).toBeLessThanOrEqual(0.91);
  const mobileFirst = await canvas.screenshot();
  await resetGrainDrawTrace(page);
  await page.waitForTimeout(1_100);
  const mobileDraws = (await readGrainDrawTrace(page)).pricing;
  expect(mobileDraws).toBeGreaterThanOrEqual(13);
  expect(mobileDraws).toBeLessThanOrEqual(16);
  const mobileSecond = await canvas.screenshot();
  const mobileAnalysis = await analyzeGrainFrames(page, mobileFirst, mobileSecond);
  assertWarmMonochromeGrain(mobileAnalysis);
  expect(Math.abs(mobileAnalysis.luminance - desktopAnalysis.luminance)).toBeLessThan(3);
  expect(Math.abs(mobileAnalysis.spread - desktopAnalysis.spread)).toBeLessThan(3);
  await hiddenContent.evaluate((element) => (element as HTMLElement).remove());

  await canvas.dispatchEvent('webglcontextlost');
  await expect(result).toHaveAttribute('data-grain-state', 'fallback');
  await expect(result.getByText('£15–30k', { exact: true })).toBeVisible();

  await page.reload();
  const reloadedResult = getEstimator(page).getByRole('region', { name: 'Estimate result' });
  await reloadedResult.scrollIntoViewIfNeeded();
  test.skip(
    (await reloadedResult.getAttribute('data-grain-state')) === 'fallback',
    'WebGL is unavailable',
  );
  await expect(reloadedResult).toHaveAttribute('data-grain-state', 'live');
  await page.evaluate(() => window.dispatchEvent(new PageTransitionEvent('pagehide')));
  await expect(reloadedResult).toHaveAttribute('data-grain-state', 'static');
  await resetGrainDrawTrace(page);
  await page.waitForTimeout(220);
  expect((await readGrainDrawTrace(page)).pricing).toBe(0);
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

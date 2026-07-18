import { expect, test, type Page } from '@playwright/test';

const title = 'The internet could be more interesting.';
const viewports = [
  { width: 320, height: 720 },
  { width: 390, height: 844 },
  { width: 768, height: 900 },
  { width: 844, height: 390 },
  { width: 1024, height: 768 },
  { width: 1440, height: 900 },
] as const;

const getHero = (page: Page) => page.getByRole('region', { name: title });

const expectNoHorizontalOverflow = async (page: Page) => {
  const widths = await page.evaluate(() => ({
    client: document.documentElement.clientWidth,
    scroll: document.documentElement.scrollWidth,
  }));
  expect(widths.scroll).toBeLessThanOrEqual(widths.client);
};

const expectCurrentHeroComposition = async (page: Page) => {
  const hero = getHero(page);
  const heading = page.getByRole('heading', { level: 1, name: title });
  const lead = hero.locator('.hero__lead');
  const actions = hero.locator('.hero__actions');
  const primaryAction = hero.getByRole('link', { name: 'Bring us an idea' });
  const secondaryAction = hero.getByRole('link', { name: 'See our work' });

  await expect(heading).toHaveCount(1);
  await expect(heading).toBeVisible();
  await expect(lead).toHaveText(
    'Obsolete designs and builds custom websites and digital products for creative companies, with creative direction, design, and engineering held by one team from idea to launch.',
  );
  await expect(lead).toBeVisible();
  await expect(actions).toHaveCount(1);
  await expect(actions).toBeVisible();
  await expect(primaryAction).toBeVisible();
  await expect(primaryAction).toHaveAttribute('href', '/contact#project-inquiry');
  await expect(secondaryAction).toBeVisible();
  await expect(secondaryAction).toHaveAttribute('href', '/work');
};

const compareScreenshots = (page: Page, first: Uint8Array, second: Uint8Array) =>
  page.evaluate(
    async ([firstEncoded, secondEncoded]) => {
      const decode = async (encoded: string) => {
        const response = await fetch(`data:image/png;base64,${encoded}`);
        const bitmap = await createImageBitmap(await response.blob());
        const canvas = document.createElement('canvas');
        canvas.width = bitmap.width;
        canvas.height = bitmap.height;
        const context = canvas.getContext('2d');
        if (!context) throw new Error('Screenshot comparison canvas is unavailable.');
        context.drawImage(bitmap, 0, 0);
        bitmap.close();
        return context.getImageData(0, 0, canvas.width, canvas.height).data;
      };
      const [firstPixels, secondPixels] = await Promise.all([
        decode(firstEncoded),
        decode(secondEncoded),
      ]);
      let totalDifference = 0;
      for (let index = 0; index < firstPixels.length; index += 4) {
        totalDifference += Math.abs(firstPixels[index] - secondPixels[index]);
        totalDifference += Math.abs(firstPixels[index + 1] - secondPixels[index + 1]);
        totalDifference += Math.abs(firstPixels[index + 2] - secondPixels[index + 2]);
      }
      return totalDifference / ((firstPixels.length / 4) * 3);
    },
    [Buffer.from(first).toString('base64'), Buffer.from(second).toString('base64')],
  );

const getOrangeSignal = (page: Page, screenshot: Uint8Array) =>
  page.evaluate(async (encoded) => {
    const response = await fetch(`data:image/png;base64,${encoded}`);
    const bitmap = await createImageBitmap(await response.blob());
    const canvas = document.createElement('canvas');
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Canvas analysis is unavailable.');
    context.drawImage(bitmap, 0, 0);
    bitmap.close();
    const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
    let orange = 0;
    for (let index = 0; index < pixels.length; index += 4) {
      orange += Math.max(pixels[index] - pixels[index + 1] - 12, 0);
    }
    return orange;
  }, Buffer.from(screenshot).toString('base64'));

const getLuminanceSpread = (page: Page, screenshot: Uint8Array) =>
  page.evaluate(async (encoded) => {
    const response = await fetch(`data:image/png;base64,${encoded}`);
    const bitmap = await createImageBitmap(await response.blob());
    const canvas = document.createElement('canvas');
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Canvas analysis is unavailable.');
    context.drawImage(bitmap, 0, 0);
    bitmap.close();
    const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
    let count = 0;
    let sum = 0;
    let sumSquares = 0;
    for (let index = 0; index < pixels.length; index += 16) {
      const luminance =
        pixels[index] * 0.2126 + pixels[index + 1] * 0.7152 + pixels[index + 2] * 0.0722;
      count += 1;
      sum += luminance;
      sumSquares += luminance * luminance;
    }
    const mean = sum / count;
    return Math.sqrt(Math.max(sumSquares / count - mean * mean, 0));
  }, Buffer.from(screenshot).toString('base64'));

const expectLiveCanvas = async (page: Page) => {
  const hero = getHero(page);
  await expect(hero).toHaveAttribute('data-fluid-state', /live|fallback/u);
  test.skip((await hero.getAttribute('data-fluid-state')) !== 'live', 'WebGL is unavailable');
};

const installDrawCounter = (page: Page) =>
  page.addInitScript(() => {
    const state = window as typeof window & { fluidDrawCount: number };
    state.fluidDrawCount = 0;
    for (const prototype of [WebGLRenderingContext.prototype, WebGL2RenderingContext.prototype]) {
      const drawArrays = prototype.drawArrays;
      Object.defineProperty(prototype, 'drawArrays', {
        configurable: true,
        value(this: WebGLRenderingContext, ...arguments_: unknown[]) {
          state.fluidDrawCount += 1;
          return Reflect.apply(drawArrays, this, arguments_);
        },
      });
    }
  });

test('preserves the approved proposition, actions, and stable masthead', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');

  const hero = getHero(page);
  await expect(hero).toBeVisible();
  await expectCurrentHeroComposition(page);
  await expect(hero.getByText('Creative technology studio', { exact: true })).toBeVisible();
  await expect(hero.getByRole('img')).toHaveCount(0);

  const header = page.getByRole('banner', { name: 'Site header' });
  await expect(header).toHaveAttribute('data-header-variant', 'overlay');
  await expect(header).toHaveCSS('position', 'absolute');
  await expect(header).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');
  await expect(header).toHaveCSS('border-bottom-width', '0px');

  const [heroBox, firstLineBox, middleBox, lastBox] = await Promise.all([
    hero.boundingBox(),
    hero.locator('[data-title-line="first"]').boundingBox(),
    hero.locator('[data-title-part="middle"]').boundingBox(),
    hero.locator('[data-title-part="last"]').boundingBox(),
  ]);
  expect(heroBox?.y).toBe(0);
  expect(heroBox?.height).toBe(900);
  expect(firstLineBox?.y).toBeLessThan(middleBox?.y ?? 0);
  expect(Math.abs((middleBox?.y ?? 0) - (lastBox?.y ?? 0))).toBeLessThan(2);
});

test('describes the concrete offer in page metadata', async ({ page }) => {
  await page.goto('/');

  await expect(page).toHaveTitle('Obsolete | Custom websites and digital products');
  await expect(page.locator('meta[name="description"]')).toHaveAttribute(
    'content',
    /creative technology studio.+custom websites and digital products for creative companies/iu,
  );
});

test('puts documented proof after the proposition and preserves the homepage order', async ({
  page,
}) => {
  await page.goto('/');

  const featuredWork = page.getByRole('region', { name: 'Craft Applied' });
  const orderedSections = [
    getHero(page),
    featuredWork,
    page.getByRole('region', { name: 'From first thought to finished thing.' }),
    page.getByRole('region', { name: 'AI should earn its place.' }),
    page.getByRole('region', { name: 'Project pricing estimator' }),
    page.getByRole('region', { name: 'Bring us the idea you cannot stop thinking about.' }),
  ];

  await Promise.all(orderedSections.map((section) => expect(section).toBeVisible()));
  const orderChecks = await Promise.all(
    orderedSections
      .slice(0, -1)
      .map(async (current, index) =>
        current.evaluate(
          (element, following) =>
            Boolean(
              element.compareDocumentPosition(following as Node) & Node.DOCUMENT_POSITION_FOLLOWING,
            ),
          await orderedSections[index + 1].elementHandle(),
        ),
      ),
  );
  expect(orderChecks).toEqual(orderedSections.slice(1).map(() => true));

  await expect(featuredWork.getByText('A complex offer, made clear.')).toBeVisible();
  await expect(featuredWork.getByText(/six disciplines.+clear service model/iu)).toBeVisible();
  await expect(
    featuredWork.getByText(/reusable work and editorial publishing patterns/iu),
  ).toBeVisible();
  await expect(featuredWork.getByText(/accessible, responsive interface/iu)).toBeVisible();
  await expect(
    featuredWork.getByText('Design + development / Live', { exact: true }),
  ).toBeVisible();
  await expect(featuredWork.getByText('Design + development', { exact: true })).toBeVisible();
  await expect(featuredWork.getByText(/Astro, SolidJS, TailwindCSS, Plausible/iu)).toBeVisible();
  await expect(featuredWork.getByText(/\bfaster\b/iu)).toHaveCount(0);
  await expect(featuredWork.getByRole('link', { name: 'View case study' })).toHaveAttribute(
    'href',
    '/work/craft-applied',
  );
  await expect(
    featuredWork.getByRole('link', { name: 'Visit Craft Applied (external site)' }),
  ).toHaveAttribute('href', 'https://craftapplied.com');
});

for (const viewport of viewports) {
  test(`keeps the centered composition usable at ${viewport.width}px`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.goto('/');

    const hero = getHero(page);
    const heading = page.getByRole('heading', { level: 1, name: title });
    await expect(hero).toBeVisible();
    await expect(heading).toBeVisible();
    await expect(hero.getByRole('link', { name: 'Bring us an idea' })).toBeVisible();
    await expect(hero.getByRole('link', { name: 'See our work' })).toBeVisible();
    await expectNoHorizontalOverflow(page);

    const [heroBox, headingBox] = await Promise.all([hero.boundingBox(), heading.boundingBox()]);
    expect(heroBox?.height).toBeGreaterThanOrEqual(viewport.height);
    expect(headingBox).not.toBeNull();
    if (heroBox && headingBox) {
      expect(
        Math.abs(heroBox.x + heroBox.width / 2 - (headingBox.x + headingBox.width / 2)),
      ).toBeLessThan(3);
      expect(headingBox.x).toBeGreaterThanOrEqual(16);
      expect(headingBox.x + headingBox.width).toBeLessThanOrEqual(viewport.width - 16);
    }

    if (viewport.width <= 700) {
      const [firstLineBox, middleBox, lastBox] = await Promise.all([
        hero.locator('[data-title-line="first"]').boundingBox(),
        hero.locator('[data-title-part="middle"]').boundingBox(),
        hero.locator('[data-title-part="last"]').boundingBox(),
      ]);
      expect(firstLineBox?.y).toBeLessThan(middleBox?.y ?? 0);
      expect(middleBox?.y).toBeLessThan(lastBox?.y ?? 0);
    }
  });
}

for (const viewport of [
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'mobile', width: 390, height: 844 },
] as const) {
  test(`matches the static symbol-field ${viewport.name} baseline`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');
    await page.evaluate(() => document.fonts.ready);
    await expect(getHero(page)).toHaveScreenshot(`hero-warm-paper-${viewport.name}.png`, {
      animations: 'disabled',
      maxDiffPixelRatio: 0.005,
    });
  });
}

test('keeps interface content out of the decorative poster artwork', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await page.addStyleTag({
    content:
      'header, .hero__content, .hero__canvas, .hero__pointer-dot { visibility: hidden !important; }',
  });

  await expect(getHero(page).locator('[data-fluid-poster]')).toHaveScreenshot(
    'hero-warm-paper-artwork.png',
    { animations: 'disabled', maxDiffPixelRatio: 0.005 },
  );
});

test('reflows at 200% text size without hiding content or actions', async ({ page }) => {
  await page.setViewportSize({ width: 768, height: 1100 });
  await page.goto('/');
  await page.addStyleTag({ content: 'html { font-size: 200% !important; }' });

  const hero = getHero(page);
  await expect(page.getByRole('heading', { level: 1, name: title })).toBeVisible();
  await expect(
    hero.getByText(/custom websites and digital products for creative companies/iu),
  ).toBeVisible();
  await expect(hero.getByRole('link', { name: 'Bring us an idea' })).toBeVisible();
  await expect(hero.getByRole('link', { name: 'See our work' })).toBeVisible();
  await expectNoHorizontalOverflow(page);
});

test('keeps the poster and complete hero available without JavaScript', async ({
  request,
  browser,
}) => {
  const response = await request.get('/');
  const html = await response.text();
  expect(html).toContain(title);
  expect(html).toContain('Bring us an idea');
  expect(html).toContain('/fluid-hero-poster.webp');

  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto('/');
  const hero = getHero(page);
  await expect(hero).toBeVisible();
  await expect(hero.locator('[data-fluid-poster]')).toBeVisible();
  await expectCurrentHeroComposition(page);
  await context.close();
});

test('uses a static, non-interactive symbol field for reduced motion', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');

  const hero = getHero(page);
  await expect(hero.locator('[data-fluid-poster]')).toBeVisible();
  await expect(hero).toHaveAttribute('data-fluid-state', 'static');
  await expect(hero.locator('[data-fluid-pointer-dot]')).toBeHidden();
  await expectCurrentHeroComposition(page);

  const before = await page.screenshot();
  await page.mouse.move(100, 400);
  await page.mouse.move(1200, 400, { steps: 4 });
  await page.waitForTimeout(250);
  expect((await page.screenshot()).equals(before)).toBe(true);
});

test('falls back without errors when WebGL is unavailable', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.addInitScript(() => {
    const getContext = HTMLCanvasElement.prototype.getContext;
    Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
      configurable: true,
      value(this: HTMLCanvasElement, type: string, ...attributes: unknown[]) {
        if (type.startsWith('webgl')) return null;
        return Reflect.apply(getContext, this, [type, ...attributes]);
      },
    });
  });
  await page.goto('/');

  const hero = getHero(page);
  await expect(hero).toHaveAttribute('data-fluid-state', 'fallback');
  await expect(hero.locator('[data-fluid-poster]')).toBeVisible();
  await expectCurrentHeroComposition(page);
  expect(errors).toEqual([]);
});

test('fills the hero edge to edge with a dense, continuously moving symbol field', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  await expectLiveCanvas(page);
  await page.waitForTimeout(350);

  const hero = getHero(page);
  const canvas = hero.locator('[data-fluid-canvas]');
  const [heroBox, canvasBox, contentLayer, backdropLayer] = await Promise.all([
    hero.boundingBox(),
    canvas.boundingBox(),
    hero.locator('.hero__content').evaluate((element) => getComputedStyle(element).zIndex),
    hero.locator('.hero__backdrop').evaluate((element) => getComputedStyle(element).zIndex),
  ]);
  expect(canvasBox).toEqual(heroBox);
  expect(Number(contentLayer)).toBeGreaterThan(Number(backdropLayer));

  const first = await canvas.screenshot();
  expect(await getLuminanceSpread(page, first)).toBeGreaterThan(1.2);
  await page.waitForTimeout(700);
  const second = await canvas.screenshot();
  const ambientDifference = await compareScreenshots(page, first, second);
  expect(ambientDifference).toBeGreaterThan(0.08);
  expect(ambientDifference).toBeLessThan(1.5);

  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(180);
  expect(await canvas.boundingBox()).toEqual(await hero.boundingBox());
  expect(await getLuminanceSpread(page, await canvas.screenshot())).toBeGreaterThan(1.2);
});

test('restores a connected fluid mouse trail without moving the content', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  await expectLiveCanvas(page);
  await page.waitForTimeout(350);

  const hero = getHero(page);
  const canvas = hero.locator('[data-fluid-canvas]');
  const heading = page.getByRole('heading', { level: 1, name: title });
  const headingBox = await heading.boundingBox();
  const ambientStart = await canvas.screenshot();
  await page.waitForTimeout(120);
  const ambientEnd = await canvas.screenshot();
  const ambientDifference = await compareScreenshots(page, ambientStart, ambientEnd);

  await page.mouse.move(180, 720);
  const moveTrailStep = async (index: number): Promise<void> => {
    if (index > 18) return;
    await page.mouse.move(180 + index * 58, 720 - index * 22);
    await page.waitForTimeout(12);
    await moveTrailStep(index + 1);
  };
  await moveTrailStep(1);
  const ambientOrange = await getOrangeSignal(page, ambientEnd);
  let active = await canvas.screenshot();
  await expect
    .poll(
      async () => {
        active = await canvas.screenshot();
        return getOrangeSignal(page, active);
      },
      { intervals: [50, 80, 120], timeout: 1800 },
    )
    .toBeGreaterThan(ambientOrange + 1_000);
  const pointerDifference = await compareScreenshots(page, ambientEnd, active);
  expect(pointerDifference).toBeGreaterThan(ambientDifference * 3);
  expect(await heading.boundingBox()).toEqual(headingBox);

  const pointerDot = hero.locator('[data-fluid-pointer-dot]');
  await expect(pointerDot).toHaveCSS('width', '6px');
  await expect(pointerDot).toHaveCSS('height', '6px');
  const primaryAction = hero.getByRole('link', { name: 'Bring us an idea' });
  const actionBox = await primaryAction.boundingBox();
  if (!actionBox) throw new Error('Primary hero action is not visible.');
  await page.mouse.move(actionBox.x + actionBox.width / 2, actionBox.y + actionBox.height / 2);
  await expect(pointerDot).toBeHidden();
  await expect(primaryAction).toHaveCSS('cursor', 'pointer');
});

test('preserves touch scrolling and action taps', async ({ browser }) => {
  const context = await browser.newContext({
    hasTouch: true,
    isMobile: true,
    viewport: { width: 390, height: 844 },
  });
  const page = await context.newPage();
  await page.goto('/');
  await expect(getHero(page).locator('[data-fluid-pointer-dot]')).toBeHidden();

  const session = await context.newCDPSession(page);
  await session.send('Input.dispatchTouchEvent', {
    type: 'touchStart',
    touchPoints: [{ x: 200, y: 730 }],
  });
  await session.send('Input.dispatchTouchEvent', {
    type: 'touchMove',
    touchPoints: [{ x: 200, y: 180 }],
  });
  await session.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(100);

  await page.evaluate(() => window.scrollTo(0, 0));
  await Promise.all([
    page.waitForURL('**/contact#project-inquiry'),
    getHero(page).getByRole('link', { name: 'Bring us an idea' }).tap(),
  ]);
  await context.close();
});

test('pauses GPU draws after the hero leaves the viewport and while the document is hidden', async ({
  page,
}) => {
  await installDrawCounter(page);
  await page.goto('/');
  await expectLiveCanvas(page);

  await page.evaluate(() => {
    (window as typeof window & { fluidDrawCount: number }).fluidDrawCount = 0;
  });
  await page.waitForTimeout(180);
  expect(
    await page.evaluate(
      () => (window as typeof window & { fluidDrawCount: number }).fluidDrawCount,
    ),
  ).toBeGreaterThan(0);

  await page.evaluate(() => window.scrollTo(0, window.innerHeight + 300));
  await page.waitForTimeout(180);
  await page.evaluate(() => {
    (window as typeof window & { fluidDrawCount: number }).fluidDrawCount = 0;
  });
  await page.waitForTimeout(220);
  expect(
    await page.evaluate(
      () => (window as typeof window & { fluidDrawCount: number }).fluidDrawCount,
    ),
  ).toBeLessThanOrEqual(1);

  await page.evaluate(() => {
    window.scrollTo(0, 0);
    Object.defineProperty(document, 'visibilityState', {
      configurable: true,
      get: () => 'hidden',
    });
    document.dispatchEvent(new Event('visibilitychange'));
    (window as typeof window & { fluidDrawCount: number }).fluidDrawCount = 0;
  });
  await page.waitForTimeout(220);
  expect(
    await page.evaluate(
      () => (window as typeof window & { fluidDrawCount: number }).fluidDrawCount,
    ),
  ).toBeLessThanOrEqual(1);
});

test('keeps decorative layers out of the tab order and shows keyboard focus', async ({ page }) => {
  await page.goto('/');
  const hero = getHero(page);
  await expect(hero.locator('.hero__backdrop')).toHaveAttribute('aria-hidden', 'true');
  await expect(hero.locator('canvas')).not.toHaveAttribute('tabindex', /.+/u);
  await expect(hero.locator('[data-fluid-poster]')).toHaveAttribute('alt', '');
  await expect(hero.locator('[data-fluid-pointer-dot]')).toHaveAttribute('aria-hidden', 'true');

  await page.keyboard.press('Tab');
  await expect(page.getByRole('link', { name: 'Skip to content' })).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(page.getByRole('link', { name: 'Obsolete home' })).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(page.getByRole('link', { name: 'Work', exact: true })).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(page.getByRole('link', { name: 'Contact', exact: true })).toBeFocused();
  await page.keyboard.press('Tab');
  const primaryAction = hero.getByRole('link', { name: 'Bring us an idea' });
  await expect(primaryAction).toBeFocused();
  const focus = await primaryAction.evaluate((element) => {
    const style = getComputedStyle(element);
    return { color: style.outlineColor, style: style.outlineStyle, width: style.outlineWidth };
  });
  expect(focus.style).not.toBe('none');
  expect(focus.width).toBe('2px');
  expect(focus.color).not.toBe('rgba(0, 0, 0, 0)');
});

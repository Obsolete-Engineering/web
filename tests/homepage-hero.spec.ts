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

test('renders the approved proposition, actions, and overlay masthead', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');

  const hero = getHero(page);
  await expect(hero).toBeVisible();
  await expect(page.getByRole('heading', { level: 1, name: title })).toHaveCount(1);
  await expect(hero.getByText('Creative technology studio', { exact: true })).toBeVisible();
  await expect(
    hero.getByText(/Obsolete is a creative technology studio for creative companies/iu),
  ).toBeVisible();
  await expect(hero.getByRole('link', { name: 'Bring us an idea' })).toHaveAttribute(
    'href',
    '/contact',
  );
  await expect(hero.getByRole('link', { name: 'See our work' })).toHaveAttribute('href', '/work');
  await expect(hero.getByRole('img')).toHaveCount(0);

  const header = page.getByRole('banner', { name: 'Site header' });
  await expect(header).toHaveAttribute('data-header-variant', 'overlay');
  await expect(header).toHaveCSS('position', 'absolute');
  await expect(header).toHaveCSS('color', 'rgb(244, 241, 234)');

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

  await page.goto('/work');
  const innerHeader = page.getByRole('banner', { name: 'Site header' });
  await expect(innerHeader).toHaveAttribute('data-header-variant', 'paper');
  await expect(innerHeader).not.toHaveCSS('position', 'absolute');
  await expect(innerHeader).toHaveCSS('color', 'rgb(17, 17, 17)');
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
    expect(heroBox?.height).toBe(viewport.height);
    expect(headingBox).not.toBeNull();
    if (heroBox && headingBox) {
      const heroCenter = heroBox.x + heroBox.width / 2;
      const headingCenter = headingBox.x + headingBox.width / 2;
      expect(Math.abs(heroCenter - headingCenter)).toBeLessThan(3);
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

test('reflows at 200% text size without hiding content or actions', async ({ page }) => {
  await page.setViewportSize({ width: 768, height: 1100 });
  await page.goto('/');
  await page.addStyleTag({ content: 'html { font-size: 200% !important; }' });

  const hero = getHero(page);
  await expect(page.getByRole('heading', { level: 1, name: title })).toBeVisible();
  await expect(hero.getByText(/creative technology studio for creative companies/iu)).toBeVisible();
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
  expect(html).toContain('See our work');
  expect(html).toContain('/fluid-hero-poster.webp');

  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto('/');
  const hero = getHero(page);
  await expect(hero).toBeVisible();
  await expect(hero.locator('[data-fluid-poster]')).toBeVisible();
  await expect(hero.getByRole('link', { name: 'Bring us an idea' })).toBeVisible();
  await expect(hero.getByRole('link', { name: 'See our work' })).toBeVisible();
  await context.close();
});

test('uses a stable static composition for reduced motion', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');

  const hero = getHero(page);
  const poster = hero.locator('[data-fluid-poster]');
  const cursor = hero.locator('[data-fluid-cursor]');
  await expect(poster).toBeVisible();
  await expect(hero).toHaveAttribute('data-fluid-state', 'static');
  await expect(cursor).toBeHidden();

  const before = await page.screenshot();
  await page.waitForTimeout(350);
  const after = await page.screenshot();
  expect(after.equals(before)).toBe(true);

  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await expect(hero).toHaveAttribute('data-fluid-state', /live|fallback/u);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(hero).toHaveAttribute('data-fluid-state', 'static');
});

test('falls back without errors when WebGL initialization is unavailable', async ({ page }) => {
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
  await expect(page.getByRole('heading', { level: 1, name: title })).toBeVisible();
  expect(errors).toEqual([]);
});

test('returns to the poster after WebGL context loss without shifting layout', async ({ page }) => {
  await page.goto('/');
  const hero = getHero(page);
  const poster = hero.locator('[data-fluid-poster]');
  const canvas = hero.locator('canvas');

  await expect(hero).toHaveAttribute('data-fluid-state', /live|fallback/u);
  const [before, posterBox, canvasBox] = await Promise.all([
    hero.boundingBox(),
    poster.boundingBox(),
    canvas.boundingBox(),
  ]);
  expect(canvasBox).toEqual(posterBox);
  if ((await hero.getAttribute('data-fluid-state')) === 'live') {
    const lostWithExtension = await canvas.evaluate((element) => {
      const canvasElement = element as HTMLCanvasElement;
      const context = canvasElement.getContext('webgl2') ?? canvasElement.getContext('webgl');
      const extension = context?.getExtension('WEBGL_lose_context');
      extension?.loseContext();
      return Boolean(extension);
    });
    if (!lostWithExtension) await canvas.dispatchEvent('webglcontextlost');
    await expect(hero).toHaveAttribute('data-fluid-state', 'fallback');
  }
  await expect(poster).toBeVisible();
  const after = await hero.boundingBox();
  expect(after).toEqual(before);
});

test('keeps pointer light, title distortion, and cursor treatment local to the hero', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  const hero = getHero(page);
  const titleBox = await page.getByRole('heading', { level: 1, name: title }).boundingBox();
  expect(titleBox).not.toBeNull();

  await page.mouse.move(80, 420);
  await expect(hero).toHaveAttribute('data-fluid-pointer-active', '');

  if (titleBox) {
    await page.mouse.move(titleBox.x + titleBox.width / 2, titleBox.y + titleBox.height / 2);
  }
  await expect(hero).toHaveAttribute('data-fluid-title-active', '');
  await expect(hero.locator('[data-fluid-title-effect]')).toHaveCSS('opacity', '0.72');

  const action = hero.getByRole('link', { name: 'Bring us an idea' });
  const actionBox = await action.boundingBox();
  expect(actionBox).not.toBeNull();
  if (actionBox)
    await page.mouse.move(actionBox.x + actionBox.width / 2, actionBox.y + actionBox.height / 2);
  await expect(hero).toHaveAttribute('data-fluid-pointer-control', '');
  await expect(hero.locator('[data-fluid-cursor]')).toHaveCSS('opacity', '0');
});

test('pauses GPU draws after the hero leaves the viewport', async ({ page }) => {
  await page.addInitScript(() => {
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
  await page.goto('/');
  const hero = getHero(page);
  await expect(hero).toHaveAttribute('data-fluid-state', /live|fallback/u);
  test.skip((await hero.getAttribute('data-fluid-state')) !== 'live', 'WebGL is unavailable');

  await page.evaluate(() => {
    (window as typeof window & { fluidDrawCount: number }).fluidDrawCount = 0;
  });
  await page.waitForTimeout(180);
  const visibleDraws = await page.evaluate(
    () => (window as typeof window & { fluidDrawCount: number }).fluidDrawCount,
  );
  expect(visibleDraws).toBeGreaterThan(0);

  await page.evaluate(() => {
    document.documentElement.style.scrollBehavior = 'auto';
    window.scrollTo(0, window.innerHeight + 300);
  });
  await page.waitForTimeout(180);
  await page.evaluate(() => {
    (window as typeof window & { fluidDrawCount: number }).fluidDrawCount = 0;
  });
  await page.waitForTimeout(240);
  const offscreenDraws = await page.evaluate(
    () => (window as typeof window & { fluidDrawCount: number }).fluidDrawCount,
  );
  expect(offscreenDraws).toBeLessThanOrEqual(1);
});

test('keeps touch interaction ambient and leaves vertical scrolling available', async ({
  browser,
}) => {
  const context = await browser.newContext({
    hasTouch: true,
    isMobile: true,
    viewport: { width: 390, height: 844 },
  });
  const page = await context.newPage();
  await page.goto('/');
  const hero = getHero(page);
  const center = await hero.boundingBox();
  expect(center).not.toBeNull();
  if (center) await page.touchscreen.tap(center.width / 2, center.height / 2);
  await expect(hero).not.toHaveAttribute('data-fluid-pointer-active', '');
  await expect(hero.locator('[data-fluid-cursor]')).toBeHidden();

  await page.evaluate(() => window.scrollTo(0, window.innerHeight));
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(0);
  await context.close();
});

test('keeps decorative layers out of the tab order and shows keyboard focus', async ({ page }) => {
  await page.goto('/');
  const hero = getHero(page);
  await expect(hero.locator('canvas')).not.toHaveAttribute('tabindex', /.+/u);
  await expect(hero.locator('[data-fluid-cursor]')).not.toHaveAttribute('tabindex', /.+/u);

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

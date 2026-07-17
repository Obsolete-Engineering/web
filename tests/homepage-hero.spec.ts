import { expect, test, type Locator, type Page } from '@playwright/test';

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

const getScreenshotOrange = (page: Page, screenshot: Uint8Array) =>
  page.evaluate(async (encoded) => {
    const response = await fetch(`data:image/png;base64,${encoded}`);
    const bitmap = await createImageBitmap(await response.blob());
    const canvas = document.createElement('canvas');
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;
    const context = canvas.getContext('2d');
    if (!context) return 0;
    context.drawImage(bitmap, 0, 0);
    bitmap.close();
    const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
    let orange = 0;
    for (let index = 0; index < pixels.length; index += 4) {
      const red = pixels[index];
      const green = pixels[index + 1];
      const blue = pixels[index + 2];
      if (red > 160 && red - green > 10 && green - blue > 4) {
        orange += red - green;
      }
    }
    return orange;
  }, Buffer.from(screenshot).toString('base64'));

const getCanvasOrange = async (page: Page) =>
  getScreenshotOrange(page, await getHero(page).locator('[data-fluid-canvas]').screenshot());

const getLocatorOrange = async (page: Page, locator: Locator) =>
  getScreenshotOrange(page, await locator.screenshot());

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
      if (firstPixels.length !== secondPixels.length) {
        throw new Error('Screenshot dimensions do not match.');
      }
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

const getMaskedResponse = (page: Page, quiet: Uint8Array, active: Uint8Array) =>
  page.evaluate(
    async ([quietEncoded, activeEncoded]) => {
      const decode = async (encoded: string) => {
        const response = await fetch(`data:image/png;base64,${encoded}`);
        const bitmap = await createImageBitmap(await response.blob());
        const canvas = document.createElement('canvas');
        canvas.width = bitmap.width;
        canvas.height = bitmap.height;
        const context = canvas.getContext('2d');
        if (!context) throw new Error('Text response canvas is unavailable.');
        context.drawImage(bitmap, 0, 0);
        bitmap.close();
        return context.getImageData(0, 0, canvas.width, canvas.height).data;
      };
      const [quietPixels, activePixels] = await Promise.all([
        decode(quietEncoded),
        decode(activeEncoded),
      ]);
      let changedGlyphs = 0;
      let changedPaper = 0;
      let glyphCount = 0;
      let glyphOrangeGain = 0;
      let paperCount = 0;
      for (let index = 0; index < quietPixels.length; index += 4) {
        const quietLuminance =
          quietPixels[index] * 0.2126 +
          quietPixels[index + 1] * 0.7152 +
          quietPixels[index + 2] * 0.0722;
        const orangeGain =
          Math.max(activePixels[index] - activePixels[index + 1], 0) -
          Math.max(quietPixels[index] - quietPixels[index + 1], 0);
        if (quietLuminance < 90) {
          glyphCount += 1;
          glyphOrangeGain += Math.max(orangeGain, 0);
          if (orangeGain > 12) changedGlyphs += 1;
        } else if (quietLuminance > 230) {
          paperCount += 1;
          if (orangeGain > 12) changedPaper += 1;
        }
      }
      return {
        changedGlyphRatio: changedGlyphs / Math.max(glyphCount, 1),
        changedPaperRatio: changedPaper / Math.max(paperCount, 1),
        glyphCount,
        glyphOrangeGain: glyphOrangeGain / Math.max(glyphCount, 1),
      };
    },
    [Buffer.from(quiet).toString('base64'), Buffer.from(active).toString('base64')],
  );

const getTapRegionOrange = async (page: Page) =>
  getScreenshotOrange(
    page,
    await page.screenshot({ clip: { x: 275, y: 665, width: 110, height: 110 } }),
  );

const getWakeRegionOrange = async (page: Page) =>
  getScreenshotOrange(
    page,
    await page.screenshot({ clip: { x: 120, y: 680, width: 1200, height: 120 } }),
  );

const expectLiveCanvas = async (page: Page) => {
  const hero = getHero(page);
  await expect(hero).toHaveAttribute('data-fluid-state', /live|fallback/u);
  test.skip((await hero.getAttribute('data-fluid-state')) !== 'live', 'WebGL is unavailable');
};

const moveAcrossHero = async (page: Page, delay: number) => {
  const y = Math.round(((await getHero(page).boundingBox())?.height ?? 900) * 0.82);
  const points = 12;
  await page.mouse.move(180, y);
  const positions = Array.from(
    { length: points },
    (_, index) => 180 + (1040 * (index + 1)) / points,
  );
  const moveToPosition = async (index: number): Promise<void> => {
    if (index >= positions.length) return;
    await page.mouse.move(positions[index], y);
    if (delay > 0) await page.waitForTimeout(delay);
    await moveToPosition(index + 1);
  };
  await moveToPosition(0);
  await page.waitForTimeout(32);
  await page.evaluate(() => {
    document.dispatchEvent(new CustomEvent('home-motion-pause', { detail: { paused: true } }));
  });
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

test('renders the approved proposition, actions, and stable masthead', async ({ page }) => {
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
    '/contact#project-inquiry',
  );
  await expect(hero.getByRole('link', { name: 'See our work' })).toHaveAttribute('href', '/work');
  await expect(hero.getByRole('img')).toHaveCount(0);

  const header = page.getByRole('banner', { name: 'Site header' });
  await expect(header).toHaveAttribute('data-header-variant', 'overlay');
  await expect(header).toHaveCSS('position', 'absolute');
  await expect(header).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');
  await expect(header).toHaveCSS('border-bottom-width', '0px');
  await expect(header).toHaveCSS('color', 'rgb(17, 17, 17)');

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
    expect(heroBox?.height).toBeGreaterThanOrEqual(viewport.height);
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

for (const viewport of [
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'mobile', width: 390, height: 844 },
] as const) {
  test(`matches the approved warm-paper ${viewport.name} baseline`, async ({ page }) => {
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

test('uses a stable, non-interactive static composition for reduced motion', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');

  const hero = getHero(page);
  const poster = hero.locator('[data-fluid-poster]');
  const pointerDot = hero.locator('[data-fluid-pointer-dot]');
  await expect(poster).toBeVisible();
  await expect(hero).toHaveAttribute('data-fluid-state', 'static');
  await expect(hero).not.toHaveAttribute('data-fluid-pointer-active', /.+/u);
  await expect(pointerDot).toBeHidden();

  const before = await page.screenshot();
  await page.mouse.move(100, 400);
  await page.mouse.move(1200, 400, { steps: 4 });
  await hero.evaluate((element) => {
    const options = {
      bubbles: true,
      clientX: 300,
      clientY: 700,
      isPrimary: true,
      pointerId: 1,
      pointerType: 'touch',
    };
    element.dispatchEvent(new PointerEvent('pointerdown', options));
    element.dispatchEvent(new PointerEvent('pointerup', options));
  });
  await page.waitForTimeout(350);
  const after = await page.screenshot();
  expect(after.equals(before)).toBe(true);

  const beforeBox = await hero.boundingBox();
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await expect(hero).toHaveAttribute('data-fluid-state', /live|fallback/u);
  await expect(hero).toHaveJSProperty('clientHeight', beforeBox?.height);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(hero).toHaveAttribute('data-fluid-state', 'static');
  expect(await hero.boundingBox()).toEqual(beforeBox);
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
  expect(await hero.boundingBox()).toEqual(before);
});

test('keeps live and fallback states within the warm-paper visual family', async ({ browser }) => {
  const viewport = { width: 1440, height: 900 };
  const reducedContext = await browser.newContext({ reducedMotion: 'reduce', viewport });
  const reducedPage = await reducedContext.newPage();
  await reducedPage.goto('/');
  await reducedPage.evaluate(() => document.fonts.ready);
  const reduced = await getHero(reducedPage).screenshot();

  const noScriptContext = await browser.newContext({ javaScriptEnabled: false, viewport });
  const noScriptPage = await noScriptContext.newPage();
  await noScriptPage.goto('/');
  await noScriptPage.evaluate(() => document.fonts.ready);
  const noScript = await getHero(noScriptPage).screenshot();

  const fallbackContext = await browser.newContext({ viewport });
  const fallbackPage = await fallbackContext.newPage();
  await fallbackPage.addInitScript(() => {
    const getContext = HTMLCanvasElement.prototype.getContext;
    Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
      configurable: true,
      value(this: HTMLCanvasElement, type: string, ...attributes: unknown[]) {
        if (type.startsWith('webgl')) return null;
        return Reflect.apply(getContext, this, [type, ...attributes]);
      },
    });
  });
  await fallbackPage.goto('/');
  await expect(getHero(fallbackPage)).toHaveAttribute('data-fluid-state', 'fallback');
  const fallback = await getHero(fallbackPage).screenshot();

  const liveContext = await browser.newContext({ viewport });
  const livePage = await liveContext.newPage();
  await livePage.goto('/');
  await expectLiveCanvas(livePage);
  await livePage.waitForTimeout(420);
  const live = await getHero(livePage).screenshot();

  expect(await compareScreenshots(livePage, reduced, noScript)).toBeLessThan(0.8);
  expect(await compareScreenshots(livePage, reduced, fallback)).toBeLessThan(0.8);
  expect(await compareScreenshots(livePage, reduced, live)).toBeLessThan(3);

  const canvas = getHero(livePage).locator('canvas');
  const lostWithExtension = await canvas.evaluate((element) => {
    const canvasElement = element as HTMLCanvasElement;
    const context = canvasElement.getContext('webgl2') ?? canvasElement.getContext('webgl');
    const extension = context?.getExtension('WEBGL_lose_context');
    extension?.loseContext();
    return Boolean(extension);
  });
  if (!lostWithExtension) await canvas.dispatchEvent('webglcontextlost');
  await expect(getHero(livePage)).toHaveAttribute('data-fluid-state', 'fallback');
  await livePage.waitForTimeout(420);
  const contextLoss = await getHero(livePage).screenshot();
  expect(await compareScreenshots(livePage, reduced, contextLoss)).toBeLessThan(0.8);

  await Promise.all([
    reducedContext.close(),
    noScriptContext.close(),
    fallbackContext.close(),
    liveContext.close(),
  ]);
});

test('creates a stronger fast wake and returns to quiet after about two seconds', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  await expectLiveCanvas(page);
  await page.waitForTimeout(400);

  const ambient = await getWakeRegionOrange(page);
  await moveAcrossHero(page, 55);
  const slowWake = await getWakeRegionOrange(page);
  expect(slowWake).toBeGreaterThan(ambient);

  await page.reload();
  await expectLiveCanvas(page);
  await page.waitForTimeout(400);
  const fastAmbient = await getWakeRegionOrange(page);
  await moveAcrossHero(page, 4);
  const fastWake = await getWakeRegionOrange(page);

  expect(fastWake - fastAmbient).toBeGreaterThan((slowWake - ambient) * 1.2);
  expect(fastWake).toBeGreaterThan(fastAmbient * 1.03);
  const primaryAction = getHero(page).getByRole('link', { name: 'Bring us an idea' });
  const primaryBox = await primaryAction.boundingBox();
  if (!primaryBox) throw new Error('Primary hero action is not visible.');
  await page.mouse.move(primaryBox.x + primaryBox.width / 2, primaryBox.y + primaryBox.height / 2);
  await page.evaluate(() => {
    document.dispatchEvent(new CustomEvent('home-motion-pause', { detail: { paused: false } }));
  });
  await page.waitForTimeout(2200);
  await page.evaluate(() => {
    document.dispatchEvent(new CustomEvent('home-motion-pause', { detail: { paused: true } }));
  });
  const decayed = await getWakeRegionOrange(page);
  expect(Math.abs(decayed - fastAmbient)).toBeLessThan(800);
});

test('creates a localized broad connected trail instead of a viewport-height wipe', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  await expectLiveCanvas(page);
  await page.waitForTimeout(400);

  const trailClips = Array.from({ length: 5 }, (_, index) => ({
    x: 250 + index * 160,
    y: 680,
    width: 150,
    height: 120,
  }));
  const quietClip = { x: 250, y: 120, width: 790, height: 120 };
  const quietBefore = await page.screenshot({ clip: quietClip });
  const trailBefore = await Promise.all(trailClips.map((clip) => page.screenshot({ clip })));

  await page.mouse.move(260, 740);
  const moveTrailStep = async (index: number): Promise<void> => {
    if (index > 10) return;
    await page.mouse.move(260 + index * 80, 740);
    await page.waitForTimeout(20);
    await moveTrailStep(index + 1);
  };
  await moveTrailStep(1);
  await page.waitForTimeout(160);
  await page.evaluate(() => {
    document.dispatchEvent(new CustomEvent('home-motion-pause', { detail: { paused: true } }));
  });

  const quietAfter = await page.screenshot({ clip: quietClip });
  const trailAfter = await Promise.all(trailClips.map((clip) => page.screenshot({ clip })));
  const quietDifference = await compareScreenshots(page, quietBefore, quietAfter);
  const trailDifferences = await Promise.all(
    trailBefore.map((before, index) => compareScreenshots(page, before, trailAfter[index])),
  );
  const trailOrangeBefore = await Promise.all(
    trailBefore.map((screenshot) => getScreenshotOrange(page, screenshot)),
  );
  const trailOrangeAfter = await Promise.all(
    trailAfter.map((screenshot) => getScreenshotOrange(page, screenshot)),
  );

  const activeSegments = trailDifferences.map(
    (difference, index) =>
      difference > 1.2 && trailOrangeAfter[index] > trailOrangeBefore[index] + 4000,
  );
  const firstActive = activeSegments.indexOf(true);
  const lastActive = activeSegments.lastIndexOf(true);
  expect(activeSegments.filter(Boolean).length).toBeGreaterThanOrEqual(4);
  expect(activeSegments.slice(firstActive, lastActive + 1).every(Boolean)).toBe(true);
  expect(quietDifference).toBeLessThan(
    trailDifferences.reduce((total, difference) => total + difference, 0) /
      trailDifferences.length /
      4,
  );
});

test('aligns the active headline mask without splitting glyph edges', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  await expectLiveCanvas(page);
  await page.waitForTimeout(500);

  const hero = getHero(page);
  const canvas = hero.locator('[data-fluid-canvas]');
  const heading = page.getByRole('heading', { level: 1, name: title });
  const titleSource = hero.locator('[data-fluid-title-source]');
  const headingBox = await heading.boundingBox();
  if (!headingBox) throw new Error('Hero headline is not visible.');
  const headingClip = {
    x: Math.floor(headingBox.x),
    y: Math.floor(headingBox.y),
    width: Math.ceil(headingBox.width),
    height: Math.ceil(headingBox.height),
  };

  await canvas.evaluate((element) => {
    element.style.visibility = 'hidden';
  });
  await hero.locator('[data-fluid-mask-line]').evaluateAll((lines) => {
    for (const line of lines) line.setAttribute('style', 'color: #111 !important');
  });
  const domHeadline = await page.screenshot({ clip: headingClip });
  await canvas.evaluate((element) => {
    element.style.removeProperty('visibility');
  });
  await hero.locator('[data-fluid-mask-line]').evaluateAll((lines) => {
    for (const line of lines) line.removeAttribute('style');
  });
  await titleSource.evaluate((element) => {
    element.style.visibility = 'hidden';
  });
  const quietMask = await page.screenshot({ clip: headingClip });
  await titleSource.evaluate((element) => {
    element.style.removeProperty('visibility');
  });
  expect(await compareScreenshots(page, domHeadline, quietMask)).toBeLessThan(2);

  const y = headingBox.y + headingBox.height * 0.7;
  await page.mouse.move(headingBox.x + 40, y);
  const moveHeadlineStep = async (index: number): Promise<void> => {
    if (index > 10) return;
    await page.mouse.move(headingBox.x + 40 + index * ((headingBox.width - 80) / 10), y);
    await page.waitForTimeout(20);
    await moveHeadlineStep(index + 1);
  };
  await moveHeadlineStep(1);
  await page.waitForTimeout(140);
  await page.evaluate(() => {
    document.dispatchEvent(new CustomEvent('home-motion-pause', { detail: { paused: true } }));
  });
  await titleSource.evaluate((element) => {
    element.style.visibility = 'hidden';
  });
  await hero.locator('[data-fluid-pointer-dot]').evaluate((element) => {
    element.style.visibility = 'hidden';
  });
  const activeMask = await page.screenshot({ clip: headingClip });
  const response = await getMaskedResponse(page, quietMask, activeMask);
  expect(response.glyphCount).toBeGreaterThan(1000);
  expect(response.changedGlyphRatio).toBeGreaterThan(0.08);
  expect(response.changedPaperRatio).toBeGreaterThan(0.03);
  expect(response.glyphOrangeGain).toBeGreaterThan(5);
});

test('keeps the resting field quiet and the headline response local', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  await expectLiveCanvas(page);

  const hero = getHero(page);
  const heading = page.getByRole('heading', { level: 1, name: title });
  const stableElements = [
    page.getByRole('banner', { name: 'Site header' }),
    hero.getByText('Creative technology studio', { exact: true }),
    hero.locator('.hero__lead'),
    hero.locator('.hero__actions'),
  ];
  const beforeHeading = await heading.boundingBox();
  const beforeStable = await Promise.all(stableElements.map((element) => element.boundingBox()));
  const headlineOrangeBefore = await getLocatorOrange(page, heading);
  const stableOrangeBefore = await Promise.all(
    stableElements.map((element) => getLocatorOrange(page, element)),
  );
  await page.waitForTimeout(400);
  const quietClip = { x: 200, y: 120, width: 1040, height: 100 };
  const quietBefore = await page.screenshot({ clip: quietClip });
  await page.waitForTimeout(500);
  const quietAfter = await page.screenshot({ clip: quietClip });
  expect(await compareScreenshots(page, quietBefore, quietAfter)).toBeLessThan(0.1);

  expect(beforeHeading).not.toBeNull();
  if (beforeHeading) {
    const y = beforeHeading.y + beforeHeading.height / 2;
    await page.mouse.move(beforeHeading.x + 8, y);
    await page.mouse.move(beforeHeading.x + beforeHeading.width - 8, y, { steps: 12 });
    await page.waitForTimeout(32);
    await page.evaluate(() => {
      document.dispatchEvent(new CustomEvent('home-motion-pause', { detail: { paused: true } }));
    });
  }
  const headlineOrangeAfter = await getLocatorOrange(page, heading);
  const stableOrangeAfter = await Promise.all(
    stableElements.map((element) => getLocatorOrange(page, element)),
  );
  expect(headlineOrangeAfter).toBeGreaterThan(headlineOrangeBefore + 1000);
  expect(
    stableOrangeAfter.every(
      (orange, index) =>
        Math.abs(orange - stableOrangeBefore[index]) <=
        Math.max(stableOrangeBefore[index] * 0.02, 800),
    ),
  ).toBe(true);
  expect(await heading.boundingBox()).toEqual(beforeHeading);
  expect(await Promise.all(stableElements.map((element) => element.boundingBox()))).toEqual(
    beforeStable,
  );
  await expect(hero.locator('[data-fluid-mask-line]')).toHaveCount(3);
  await expect(hero.locator('[data-fluid-title-effect]')).toHaveCount(0);
});

test('eases a small pointer dot while preserving native control cursors', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  await expectLiveCanvas(page);

  const hero = getHero(page);
  const pointerDot = hero.locator('[data-fluid-pointer-dot]');
  await expect(pointerDot).toHaveAttribute('aria-hidden', 'true');
  await expect(pointerDot).toHaveCSS('background-color', 'rgb(255, 75, 31)');
  await expect(pointerDot).toHaveCSS('width', '8px');
  await expect(pointerDot).toHaveCSS('height', '8px');

  await page.mouse.move(180, 720);
  await expect(hero).toHaveAttribute('data-fluid-pointer-active', 'true');
  await expect(pointerDot).toBeVisible();
  await page.waitForTimeout(80);
  const start = await pointerDot.boundingBox();
  expect(start).not.toBeNull();

  await page.evaluate(() => {
    document.dispatchEvent(new CustomEvent('home-motion-pause', { detail: { paused: true } }));
  });
  await page.mouse.move(1220, 720);
  const paused = await pointerDot.boundingBox();
  expect(paused?.x).toBeCloseTo(start?.x ?? 0, 0);

  await page.evaluate(() => {
    document.dispatchEvent(new CustomEvent('home-motion-pause', { detail: { paused: false } }));
  });
  await page.waitForTimeout(34);
  const following = await pointerDot.boundingBox();
  expect(following?.x).toBeGreaterThan((start?.x ?? 0) + 30);
  expect(following?.x).toBeLessThan(1180);
  await expect
    .poll(async () => (await pointerDot.boundingBox())?.x ?? 0, { timeout: 1800 })
    .toBeGreaterThan(1100);

  const primaryAction = hero.getByRole('link', { name: 'Bring us an idea' });
  const primaryBox = await primaryAction.boundingBox();
  if (!primaryBox) throw new Error('Primary hero action is not visible.');
  await page.mouse.move(primaryBox.x + primaryBox.width / 2, primaryBox.y + primaryBox.height / 2);
  await expect(hero).not.toHaveAttribute('data-fluid-pointer-active', /.+/u);
  await expect(pointerDot).toBeHidden();
  expect(await hero.evaluate((element) => getComputedStyle(element).cursor)).not.toBe('none');
  await expect(primaryAction).toHaveCSS('cursor', 'pointer');
  await expect(hero.getByRole('link', { name: 'See our work' })).toHaveCSS('cursor', 'pointer');

  await page.mouse.move(180, 720);
  await expect(hero).toHaveAttribute('data-fluid-pointer-active', 'true');
  await page.evaluate(() => window.scrollTo(0, window.innerHeight + 300));
  await page.mouse.move(180, 100);
  await expect(hero).not.toHaveAttribute('data-fluid-pointer-active', /.+/u);
});

test('creates one touch tap pulse while preserving action taps and swipe scrolling', async ({
  browser,
}) => {
  const context = await browser.newContext({
    hasTouch: true,
    isMobile: true,
    viewport: { width: 390, height: 844 },
  });
  const page = await context.newPage();
  await page.goto('/');
  await expectLiveCanvas(page);
  await expect(getHero(page).locator('[data-fluid-pointer-dot]')).toBeHidden();
  await page.waitForTimeout(350);

  const ambient = await getTapRegionOrange(page);
  await page.touchscreen.tap(330, 720);
  await expect
    .poll(() => getTapRegionOrange(page), { intervals: [16, 24, 32], timeout: 1800 })
    .toBeGreaterThan(ambient * 1.08);

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

test('ignores multi-touch input', async ({ browser }) => {
  const context = await browser.newContext({
    hasTouch: true,
    isMobile: true,
    viewport: { width: 390, height: 844 },
  });
  const page = await context.newPage();
  await page.goto('/');
  await expectLiveCanvas(page);
  await page.waitForTimeout(350);
  const before = await getCanvasOrange(page);

  const session = await context.newCDPSession(page);
  await session.send('Input.dispatchTouchEvent', {
    type: 'touchStart',
    touchPoints: [
      { id: 1, x: 120, y: 700 },
      { id: 2, x: 270, y: 700 },
    ],
  });
  await session.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await page.waitForTimeout(120);
  const after = await getCanvasOrange(page);
  expect(Math.abs(after - before) / before).toBeLessThan(0.02);
  await context.close();
});

test('pauses GPU draws after the hero leaves the viewport', async ({ page }) => {
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

  await page.evaluate(() => {
    window.scrollTo(0, window.innerHeight + 300);
  });
  await page.waitForTimeout(180);
  await page.evaluate(() => {
    (window as typeof window & { fluidDrawCount: number }).fluidDrawCount = 0;
  });
  await page.waitForTimeout(240);
  expect(
    await page.evaluate(
      () => (window as typeof window & { fluidDrawCount: number }).fluidDrawCount,
    ),
  ).toBeLessThanOrEqual(1);

  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(180);
  await page.evaluate(() => {
    (window as typeof window & { fluidDrawCount: number }).fluidDrawCount = 0;
  });
  await page.waitForTimeout(180);
  expect(
    await page.evaluate(
      () => (window as typeof window & { fluidDrawCount: number }).fluidDrawCount,
    ),
  ).toBeGreaterThan(0);
});

test('pauses GPU draws while the document is hidden', async ({ page }) => {
  await installDrawCounter(page);
  await page.goto('/');
  await expectLiveCanvas(page);
  await page.evaluate(() => {
    Object.defineProperty(document, 'visibilityState', {
      configurable: true,
      get: () => 'hidden',
    });
    document.dispatchEvent(new Event('visibilitychange'));
    (window as typeof window & { fluidDrawCount: number }).fluidDrawCount = 0;
  });
  await page.waitForTimeout(240);
  expect(
    await page.evaluate(
      () => (window as typeof window & { fluidDrawCount: number }).fluidDrawCount,
    ),
  ).toBeLessThanOrEqual(1);

  await page.evaluate(() => {
    Object.defineProperty(document, 'visibilityState', {
      configurable: true,
      get: () => 'visible',
    });
    (window as typeof window & { fluidDrawCount: number }).fluidDrawCount = 0;
    document.dispatchEvent(new Event('visibilitychange'));
  });
  await page.waitForTimeout(240);
  expect(
    await page.evaluate(
      () => (window as typeof window & { fluidDrawCount: number }).fluidDrawCount,
    ),
  ).toBeGreaterThan(0);
});

test('keeps decorative layers out of the tab order and shows keyboard focus', async ({ page }) => {
  await page.goto('/');
  const hero = getHero(page);
  await expect(hero.locator('canvas')).not.toHaveAttribute('tabindex', /.+/u);
  await expect(hero.locator('[data-fluid-poster]')).toHaveAttribute('alt', '');
  await expect(hero.locator('[data-fluid-pointer-dot]')).toHaveAttribute('aria-hidden', 'true');
  await expect(hero.locator('[data-fluid-pointer-dot]')).not.toHaveAttribute('tabindex', /.+/u);

  await page.keyboard.press('Tab');
  await expect(page.getByRole('link', { name: 'Skip to content' })).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(page.getByRole('link', { name: 'Obsolete home' })).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(page.getByRole('link', { name: 'Work', exact: true })).toBeFocused();
  await page.keyboard.press('Tab');
  const headerContact = page.getByRole('link', { name: 'Contact', exact: true });
  await expect(headerContact).toBeFocused();
  await expect(headerContact).toHaveAttribute('href', '/contact');
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

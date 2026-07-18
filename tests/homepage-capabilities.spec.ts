import { expect, test, type Locator, type Page } from '@playwright/test';

const capabilitiesTitle = 'From first thought to finished thing.';
const getCapabilities = (page: Page) => page.getByRole('region', { name: capabilitiesTitle });

const scrollCapabilitiesIntoView = async (page: Page) => {
  const capabilities = getCapabilities(page);
  await capabilities.scrollIntoViewIfNeeded();
  await expect(capabilities).toHaveAttribute('data-grain-state', /live|fallback/u);
  return capabilities;
};

const expectCanvasToCoverCapabilities = async (page: Page) => {
  const capabilities = getCapabilities(page);
  const [sectionBox, canvasBox] = await Promise.all([
    capabilities.boundingBox(),
    capabilities.locator('canvas').boundingBox(),
  ]);
  if (!sectionBox || !canvasBox) throw new Error('The capabilities grain geometry is unavailable.');
  for (const property of ['x', 'y', 'width', 'height'] as const) {
    expect(Math.abs(sectionBox[property] - canvasBox[property])).toBeLessThanOrEqual(1);
  }
};

const expectStaticGrain = async (capabilities: Locator) => {
  await expect(capabilities.locator('.capabilities__grain')).toHaveCSS(
    'background-image',
    /capabilities-grain\.png/u,
  );
};

const installDrawTrace = (page: Page) =>
  page.addInitScript(() => {
    const state = window as typeof window & {
      grainDraws: { capabilities: number; hero: number };
    };
    state.grainDraws = { capabilities: 0, hero: 0 };
    for (const prototype of [WebGLRenderingContext.prototype, WebGL2RenderingContext.prototype]) {
      const drawArrays = prototype.drawArrays;
      Object.defineProperty(prototype, 'drawArrays', {
        configurable: true,
        value(this: WebGLRenderingContext, ...arguments_: unknown[]) {
          const target =
            this.canvas instanceof HTMLCanvasElement && this.canvas.matches('[data-grain-canvas]')
              ? 'capabilities'
              : 'hero';
          state.grainDraws[target] += 1;
          return Reflect.apply(drawArrays, this, arguments_);
        },
      });
    }
  });

const resetDrawTrace = (page: Page) =>
  page.evaluate(() => {
    const state = window as typeof window & {
      grainDraws: { capabilities: number; hero: number };
    };
    state.grainDraws = { capabilities: 0, hero: 0 };
  });

const readDrawTrace = (page: Page) =>
  page.evaluate(
    () =>
      (
        window as typeof window & {
          grainDraws: { capabilities: number; hero: number };
        }
      ).grainDraws,
  );

const analyzeGrainFrames = (page: Page, first: Uint8Array, second: Uint8Array) =>
  page.evaluate(
    async ([firstEncoded, secondEncoded]) => {
      const decode = async (encoded: string) => {
        const response = await fetch(`data:image/png;base64,${encoded}`);
        const bitmap = await createImageBitmap(await response.blob());
        const canvas = document.createElement('canvas');
        canvas.width = bitmap.width;
        canvas.height = bitmap.height;
        const context = canvas.getContext('2d');
        if (!context) throw new Error('Grain analysis canvas is unavailable.');
        context.drawImage(bitmap, 0, 0);
        bitmap.close();
        return context.getImageData(0, 0, canvas.width, canvas.height).data;
      };
      const [firstPixels, secondPixels] = await Promise.all([
        decode(firstEncoded),
        decode(secondEncoded),
      ]);
      let difference = 0;
      let luminanceSum = 0;
      let luminanceSquares = 0;
      const channels = [0, 0, 0];
      let count = 0;
      for (let index = 0; index < firstPixels.length; index += 16) {
        const red = firstPixels[index];
        const green = firstPixels[index + 1];
        const blue = firstPixels[index + 2];
        const luminance = red * 0.2126 + green * 0.7152 + blue * 0.0722;
        channels[0] += red;
        channels[1] += green;
        channels[2] += blue;
        luminanceSum += luminance;
        luminanceSquares += luminance * luminance;
        difference +=
          Math.abs(red - secondPixels[index]) +
          Math.abs(green - secondPixels[index + 1]) +
          Math.abs(blue - secondPixels[index + 2]);
        count += 1;
      }
      const mean = luminanceSum / count;
      return {
        channels: channels.map((channel) => channel / count),
        difference: difference / (count * 3),
        luminance: mean,
        spread: Math.sqrt(Math.max(luminanceSquares / count - mean * mean, 0)),
      };
    },
    [Buffer.from(first).toString('base64'), Buffer.from(second).toString('base64')],
  );

test('keeps the complete capabilities experience above a non-interactive grain field', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');

  const capabilities = getCapabilities(page);
  const grain = capabilities.locator('.capabilities__grain');
  await expect(capabilities).toHaveAttribute('data-grain-state', 'static');
  await expect(
    capabilities.getByRole('heading', { level: 2, name: capabilitiesTitle }),
  ).toBeVisible();
  await expect(capabilities.getByRole('heading', { level: 3 })).toHaveCount(3);
  await expect(capabilities.getByRole('link', { name: '01 / Direction' })).toHaveAttribute(
    'href',
    '#direction',
  );
  await expect(capabilities.getByRole('link', { name: '02 / Design' })).toHaveAttribute(
    'href',
    '#design',
  );
  await expect(capabilities.getByRole('link', { name: '03 / Engineering' })).toHaveAttribute(
    'href',
    '#engineering',
  );
  await expect(grain).toHaveAttribute('aria-hidden', 'true');
  await expect(grain).toHaveCSS('pointer-events', 'none');
  await expectStaticGrain(capabilities);
  await expect(grain.locator('canvas')).not.toHaveAttribute('tabindex', /.+/u);
});

test('uses stable static grain without initializing WebGL for reduced motion', async ({ page }) => {
  await page.addInitScript(() => {
    const getContext = HTMLCanvasElement.prototype.getContext;
    Object.assign(window, { grainWebGlContextRequests: 0 });
    Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
      configurable: true,
      value(this: HTMLCanvasElement, type: string, ...attributes: unknown[]) {
        if (type.startsWith('webgl')) {
          (
            window as typeof window & { grainWebGlContextRequests: number }
          ).grainWebGlContextRequests += 1;
        }
        return Reflect.apply(getContext, this, [type, ...attributes]);
      },
    });
  });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');

  const capabilities = getCapabilities(page);
  await capabilities.scrollIntoViewIfNeeded();
  await expect(capabilities).toHaveAttribute('data-grain-state', 'static');
  await page.evaluate(() => document.fonts.ready);
  const first = await capabilities.screenshot({ animations: 'disabled' });
  await page.mouse.move(80, 240);
  await page.mouse.wheel(0, 120);
  await page.waitForTimeout(250);
  const second = await capabilities.screenshot({ animations: 'disabled' });
  expect(second.equals(first)).toBe(true);
  expect(
    await page.evaluate(
      () =>
        (window as typeof window & { grainWebGlContextRequests: number }).grainWebGlContextRequests,
    ),
  ).toBe(0);
});

test('keeps static grain and the complete homepage journey without JavaScript', async ({
  browser,
  request,
}) => {
  const [response, textureResponse] = await Promise.all([
    request.get('/'),
    request.get('/capabilities-grain.png'),
  ]);
  const html = await response.text();
  expect(textureResponse.ok()).toBe(true);
  expect(textureResponse.headers()['content-type']).toBe('image/png');
  expect(html).toContain('data-grain-state="static"');

  const context = await browser.newContext({
    javaScriptEnabled: false,
    viewport: { width: 1440, height: 900 },
  });
  const page = await context.newPage();
  await page.goto('/');

  const capabilities = getCapabilities(page);
  await expect(capabilities).toHaveAttribute('data-grain-state', 'static');
  await expectStaticGrain(capabilities);
  await expect(capabilities.getByText('Creative direction', { exact: true })).toBeVisible();
  await expect(
    capabilities.getByText('Performance + accessibility', { exact: true }),
  ).toBeVisible();
  await expect(page.getByRole('region', { name: 'Craft Applied' })).toBeVisible();
  await expect(
    page.getByRole('region', { name: 'Bring us the idea you cannot stop thinking about.' }),
  ).toBeVisible();
  await context.close();
});

for (const failure of ['unsupported WebGL', 'shader initialization'] as const) {
  test(`fails open for ${failure}`, async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.addInitScript((selectedFailure) => {
      if (selectedFailure === 'unsupported WebGL') {
        const getContext = HTMLCanvasElement.prototype.getContext;
        Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
          configurable: true,
          value(this: HTMLCanvasElement, type: string, ...attributes: unknown[]) {
            if (type.startsWith('webgl')) return null;
            return Reflect.apply(getContext, this, [type, ...attributes]);
          },
        });
        return;
      }

      for (const prototype of [WebGLRenderingContext.prototype, WebGL2RenderingContext.prototype]) {
        const getProgramParameter = prototype.getProgramParameter;
        Object.defineProperty(prototype, 'getProgramParameter', {
          configurable: true,
          value(this: WebGLRenderingContext, program: WebGLProgram, parameter: GLenum) {
            if (parameter === this.LINK_STATUS) return false;
            return Reflect.apply(getProgramParameter, this, [program, parameter]);
          },
        });
      }
    }, failure);
    await page.setViewportSize({ width: 1200, height: 800 });
    await page.goto('/');

    const capabilities = getCapabilities(page);
    await capabilities.scrollIntoViewIfNeeded();
    await expect(capabilities).toHaveAttribute('data-grain-state', 'fallback');
    await expectStaticGrain(capabilities);
    await expect(
      capabilities.getByRole('heading', { level: 2, name: capabilitiesTitle }),
    ).toBeVisible();
    expect(errors).toEqual([]);
  });
}

test('keeps static cover until the first frame and avoids overlapping offscreen GPU work', async ({
  page,
}) => {
  await installDrawTrace(page);
  await page.setViewportSize({ width: 1200, height: 800 });
  await page.goto('/');

  const capabilities = getCapabilities(page);
  await expect(capabilities).toHaveAttribute('data-grain-state', /static|fallback/u);
  test.skip(
    (await capabilities.getAttribute('data-grain-state')) === 'fallback',
    'WebGL is unavailable',
  );
  await expect(capabilities.locator('canvas')).toHaveCSS('opacity', '0');
  await resetDrawTrace(page);
  await page.waitForTimeout(220);
  const initialDraws = await readDrawTrace(page);
  expect(initialDraws.capabilities).toBe(0);

  await capabilities.scrollIntoViewIfNeeded();
  await expect(capabilities).toHaveAttribute('data-grain-state', 'live');
  await resetDrawTrace(page);
  await page.waitForTimeout(240);
  const activeDraws = await readDrawTrace(page);
  expect(activeDraws.capabilities).toBeGreaterThan(1);
  expect(activeDraws.hero).toBeLessThanOrEqual(1);

  await page.evaluate(() => window.scrollTo(0, 0));
  await expect(capabilities).toHaveAttribute('data-grain-state', 'paused');
  await resetDrawTrace(page);
  await page.waitForTimeout(220);
  const pausedDraws = await readDrawTrace(page);
  expect(pausedDraws.capabilities).toBeLessThanOrEqual(1);

  await capabilities.scrollIntoViewIfNeeded();
  await expect(capabilities).toHaveAttribute('data-grain-state', 'live');
  await page.evaluate(() => window.dispatchEvent(new Event('pagehide')));
  await expect(capabilities).toHaveAttribute('data-grain-state', 'static');
  await resetDrawTrace(page);
  await page.waitForTimeout(220);
  const disposedDraws = await readDrawTrace(page);
  expect(disposedDraws.capabilities).toBe(0);
});

test('runs live grain only while it can contribute and resumes coherently', async ({ page }) => {
  await installDrawTrace(page);
  await page.setViewportSize({ width: 1200, height: 800 });
  await page.goto('/');

  const capabilities = await scrollCapabilitiesIntoView(page);
  test.skip(
    (await capabilities.getAttribute('data-grain-state')) !== 'live',
    'WebGL is unavailable',
  );

  const canvas = capabilities.locator('canvas');
  const heading = capabilities.getByRole('heading', { level: 2, name: capabilitiesTitle });
  await expectCanvasToCoverCapabilities(page);
  await expect(canvas).toHaveCSS('pointer-events', 'none');
  await expect(capabilities).toHaveAttribute('data-grain-quality', 'desktop');
  const desktopPixelRatio = await canvas.evaluate((element) => {
    const canvasElement = element as HTMLCanvasElement;
    return canvasElement.width / canvasElement.getBoundingClientRect().width;
  });
  expect(desktopPixelRatio).toBeLessThanOrEqual(1.51);
  await page.waitForTimeout(900);

  const foregroundBefore = {
    box: await heading.boundingBox(),
    color: await heading.evaluate((element) => getComputedStyle(element).color),
  };
  const hiddenContent = await page.addStyleTag({
    content: '.capabilities__inner { visibility: hidden !important; }',
  });
  const staticOverride = await page.addStyleTag({
    content: '.capabilities__grain canvas { opacity: 0 !important; }',
  });
  const staticSurface = await canvas.screenshot();
  await staticOverride.evaluate((element) => (element as HTMLElement).remove());
  const first = await canvas.screenshot();
  await resetDrawTrace(page);
  await page.waitForTimeout(1_100);
  const liveDraws = await readDrawTrace(page);
  expect(liveDraws.capabilities).toBeGreaterThanOrEqual(16);
  expect(liveDraws.capabilities).toBeLessThanOrEqual(22);
  const second = await canvas.screenshot();
  await hiddenContent.evaluate((element) => (element as HTMLElement).remove());
  const frameAnalysis = await analyzeGrainFrames(page, first, second);
  const staticAnalysis = await analyzeGrainFrames(page, staticSurface, staticSurface);
  expect(frameAnalysis.difference).toBeGreaterThan(0.4);
  expect(frameAnalysis.difference).toBeLessThan(12);
  expect(frameAnalysis.spread).toBeGreaterThan(1.5);
  expect(frameAnalysis.spread).toBeLessThan(10);
  expect(frameAnalysis.channels[0]).toBeGreaterThan(frameAnalysis.channels[1]);
  expect(frameAnalysis.channels[1]).toBeGreaterThan(frameAnalysis.channels[2]);
  expect(Math.abs(frameAnalysis.luminance - staticAnalysis.luminance)).toBeLessThan(4);
  expect(Math.abs(frameAnalysis.spread - staticAnalysis.spread)).toBeLessThan(4);
  expect({
    box: await heading.boundingBox(),
    color: await heading.evaluate((element) => getComputedStyle(element).color),
  }).toEqual(foregroundBefore);

  await page.evaluate(() => window.scrollTo(0, 0));
  await expect(capabilities).toHaveAttribute('data-grain-state', 'paused');

  await capabilities.scrollIntoViewIfNeeded();
  await expect(capabilities).toHaveAttribute('data-grain-state', 'live');
  await page.evaluate(() => {
    Object.defineProperty(document, 'visibilityState', {
      configurable: true,
      get: () => 'hidden',
    });
    document.dispatchEvent(new Event('visibilitychange'));
  });
  await expect(capabilities).toHaveAttribute('data-grain-state', 'paused');
  await page.evaluate(() => {
    Object.defineProperty(document, 'visibilityState', {
      configurable: true,
      get: () => 'visible',
    });
    document.dispatchEvent(new Event('visibilitychange'));
  });
  await expect(capabilities).toHaveAttribute('data-grain-state', 'live');

  await page.evaluate(() => window.scrollTo(0, 0));
  await expect(capabilities).toHaveAttribute('data-grain-state', 'paused');
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(capabilities).toHaveAttribute('data-grain-state', 'static');
  await expect(canvas).toHaveCSS('opacity', '0');
  await capabilities.scrollIntoViewIfNeeded();
  await expect(capabilities).toHaveAttribute('data-grain-state', 'live');
  await expect(capabilities).toHaveAttribute('data-grain-quality', 'mobile');
  await expectCanvasToCoverCapabilities(page);
  const mobilePixelRatio = await canvas.evaluate((element) => {
    const canvasElement = element as HTMLCanvasElement;
    return canvasElement.width / canvasElement.getBoundingClientRect().width;
  });
  expect(mobilePixelRatio).toBeLessThanOrEqual(0.91);

  const hiddenMobileContent = await page.addStyleTag({
    content: '.capabilities__inner { visibility: hidden !important; }',
  });
  const mobileFirst = await canvas.screenshot();
  await resetDrawTrace(page);
  await page.waitForTimeout(1_100);
  const mobileDraws = await readDrawTrace(page);
  expect(mobileDraws.capabilities).toBeGreaterThanOrEqual(13);
  expect(mobileDraws.capabilities).toBeLessThanOrEqual(16);
  const mobileSecond = await canvas.screenshot();
  await hiddenMobileContent.evaluate((element) => (element as HTMLElement).remove());
  const mobileAnalysis = await analyzeGrainFrames(page, mobileFirst, mobileSecond);
  expect(mobileAnalysis.difference).toBeGreaterThan(0.4);
  expect(mobileAnalysis.spread).toBeGreaterThan(1.5);
  expect(mobileAnalysis.spread).toBeLessThan(10);
  expect(mobileAnalysis.channels[0]).toBeGreaterThan(mobileAnalysis.channels[1]);
  expect(mobileAnalysis.channels[1]).toBeGreaterThan(mobileAnalysis.channels[2]);
  expect(Math.abs(mobileAnalysis.luminance - frameAnalysis.luminance)).toBeLessThan(3);
  expect(Math.abs(mobileAnalysis.spread - frameAnalysis.spread)).toBeLessThan(3);
});

test('falls back without losing content when the WebGL context is lost', async ({ page }) => {
  await page.goto('/');
  const capabilities = await scrollCapabilitiesIntoView(page);
  test.skip(
    (await capabilities.getAttribute('data-grain-state')) !== 'live',
    'WebGL is unavailable',
  );

  await capabilities.locator('canvas').dispatchEvent('webglcontextlost');
  await expect(capabilities).toHaveAttribute('data-grain-state', 'fallback');
  await expectStaticGrain(capabilities);
  await expect(
    capabilities.getByRole('heading', { level: 2, name: capabilitiesTitle }),
  ).toBeVisible();
  await expect(capabilities.getByText('Build the difficult part properly.')).toBeVisible();
});

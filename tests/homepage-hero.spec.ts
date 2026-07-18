import { expect, test, type Browser, type Page } from '@playwright/test';

test.describe.configure({ mode: 'default' });

const title = 'The internet could be more interesting.';
const viewports = [
  { width: 320, height: 720 },
  { width: 390, height: 844 },
  { width: 768, height: 900 },
  { width: 844, height: 390 },
  { width: 1024, height: 768 },
  { width: 1440, height: 900 },
] as const;

// No evidence has been approved for these homepage claim forms. A future claim must add
// that evidence and intentionally update this visitor-visible baseline at the same time.
const unsupportedHomepageClaims = [
  [
    'comparative speed',
    /\b(?:fast(?:er|est)?|quick(?:er|est)?|instant(?:ly)?|outperform(?:s|ed)?|half the (?:load )?time)\b|\b(?:loads?|renders?|responds?)\s+(?:in|within|under)\s+\d+(?:\.\d+)?\s*(?:ms|milliseconds?|seconds?)\b/iu,
  ],
  [
    'quantified outcome',
    /\b(?:increase(?:d|s)?|improve(?:d|s)?|improvement|reduce(?:d|s)?|save(?:d|s|ings?)?|boost(?:ed|s)?|grow(?:s|th|n)?|grew|cut|uplift)\b[^\n.!?]{0,60}(?:\d+(?:\.\d+)?\s*(?:%|[x×])|[£$€]\s*\d[\d,.]*\s*(?:k|m|b|million|billion)?)/iu,
  ],
  [
    'quantified outcome',
    /(?:\d+(?:\.\d+)?\s*(?:%|[x×])|[£$€]\s*\d[\d,.]*\s*(?:k|m|b|million|billion)?)[^\n.!?]{0,60}\b(?:increase(?:d|s)?|improve(?:d|s)?|improvement|reduce(?:d|s)?|save(?:d|s|ings?)?|boost(?:ed|s)?|grow(?:s|th|n)?|grew|cut|uplift)\b/iu,
  ],
  [
    'testimonial',
    /\b(?:testimonials?|what (?:our )?clients say|clients? (?:say|said)|client stories)\b|[“"][^”"\n]{20,}[”"]\s*(?:[—-]|,\s*(?:CEO|Founder|Director)\b)/iu,
  ],
  ['award', /\b(?:award(?:ed|s|-winning)?|winner|Cannes Lions?|Webbys?|Awwwards?|D&AD|BAFTA)\b/iu],
  [
    'customer count',
    /(?:\b(?:join|trusted by|serving|used by|chosen by)\s+)?(?:\b(?:over|more than)\s+)?(?:\d[\d,]*(?:\+)?|hundreds?|thousands?|millions?)\s+(?:clients?|customers?|companies|teams|businesses)\b/iu,
  ],
  [
    'business result',
    /\b(?:increase(?:d|s)?|improve(?:d|s)?|reduce(?:d|s)?|boost(?:ed|s)?|grow(?:s|n)?|grew|rise|rises|rose|cut|double(?:d|s)?|triple(?:d|s)?|growth|uplift)\b[^\n.!?]{0,60}\b(?:conversions?|revenue|sales|profit|roi|traffic|retention|leads?|costs?)\b/iu,
  ],
  [
    'business result',
    /\b(?:conversions?|revenue|sales|profit|roi|traffic|retention|leads?|costs?)\b[^\n.!?]{0,60}\b(?:increase(?:d|s)?|improve(?:d|s)?|reduce(?:d|s)?|boost(?:ed|s)?|grow(?:s|n)?|grew|rise|rises|rose|cut|double(?:d|s)?|triple(?:d|s)?|growth|uplift)\b/iu,
  ],
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

const expectResolvedHero = async (page: Page) => {
  await expectCurrentHeroComposition(page);
  await expect
    .poll(() =>
      page.locator('[data-ceremony-part]').evaluateAll((elements) =>
        elements.every((element) => {
          const style = getComputedStyle(element);
          return style.opacity === '1' && style.visibility === 'visible';
        }),
      ),
    )
    .toBe(true);
  expect(
    await page.evaluate(() => ({
      ariaHidden: document.querySelectorAll('[data-ceremony-part][aria-hidden="true"]').length,
      disabled: document.querySelectorAll(
        '[data-ceremony-part][aria-disabled="true"], [data-ceremony-part][disabled]',
      ).length,
      inert: document.querySelectorAll('[data-ceremony-part][inert]').length,
      tabIndex: document.querySelectorAll('[data-ceremony-part][tabindex]').length,
    })),
  ).toEqual({ ariaHidden: 1, disabled: 0, inert: 0, tabIndex: 0 });
};

const installCeremonyVisibilityTrace = (page: Page) =>
  page.addInitScript(() => {
    const samples: { opacity: number[]; state: string | undefined }[] = [];
    const sample = () => {
      const hero = document.querySelector<HTMLElement>('[data-fluid-hero]');
      const parts = Array.from(document.querySelectorAll<HTMLElement>('[data-ceremony-part]'));
      if (!hero || parts.length !== 10) return;
      samples.push({
        opacity: parts.map((part) => Number(getComputedStyle(part).opacity)),
        state: hero.dataset.ceremonyState,
      });
    };
    new MutationObserver(sample).observe(document, {
      attributeFilter: ['data-ceremony-state'],
      attributes: true,
      childList: true,
      subtree: true,
    });
    window.addEventListener('DOMContentLoaded', sample, { once: true });
    Object.assign(window, { ceremonyVisibilitySamples: samples });
  });

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

const getOrangeLocality = (
  page: Page,
  screenshot: Uint8Array,
  localPoint: [number, number],
  height: number,
) =>
  page.evaluate(
    async ({ encoded, height: sampledHeight, localPoint: measuredPoint }) => {
      const response = await fetch(`data:image/png;base64,${encoded}`);
      const bitmap = await createImageBitmap(await response.blob());
      const canvas = document.createElement('canvas');
      canvas.width = bitmap.width;
      canvas.height = bitmap.height;
      const context = canvas.getContext('2d');
      if (!context) throw new Error('Ceremony analysis canvas is unavailable.');
      context.drawImage(bitmap, 0, 0);
      bitmap.close();
      const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
      let localCount = 0;
      let localOrange = 0;
      let remoteCount = 0;
      let remoteOrange = 0;

      for (let y = 0; y < sampledHeight; y += 2) {
        for (let x = 0; x < canvas.width; x += 2) {
          const index = (y * canvas.width + x) * 4;
          const distance = Math.hypot(x - measuredPoint[0], y - measuredPoint[1]);
          const orange = Math.max(pixels[index] - pixels[index + 1] - 12, 0);
          if (distance <= 58) {
            localCount += 1;
            localOrange += orange;
          } else if (distance >= 190) {
            remoteCount += 1;
            remoteOrange += orange;
          }
        }
      }

      return {
        local: localOrange / Math.max(localCount, 1),
        remote: remoteOrange / Math.max(remoteCount, 1),
      };
    },
    { encoded: Buffer.from(screenshot).toString('base64'), height, localPoint },
  );

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

const settleHeroCeremony = async (page: Page) => {
  const hero = getHero(page);
  await expect(hero).toHaveAttribute(
    'data-ceremony-state',
    /eligible|ready|running|settled|skipped/u,
  );
  const state = await hero.getAttribute('data-ceremony-state');
  if (state === 'eligible' || state === 'ready' || state === 'running') {
    await page.keyboard.press('Escape');
  }
  await expect(hero).toHaveAttribute('data-ceremony-state', /settled|skipped/u);
};

const expectLiveCanvas = async (page: Page, resolveCeremony = true) => {
  const hero = getHero(page);
  await expect(hero).toHaveAttribute('data-fluid-state', /live|fallback/u);
  test.skip((await hero.getAttribute('data-fluid-state')) !== 'live', 'WebGL is unavailable');
  if (resolveCeremony) await settleHeroCeremony(page);
};

const createMobileCeremonyPage = async (browser: Browser) => {
  const context = await browser.newContext({
    hasTouch: true,
    isMobile: true,
    viewport: { width: 390, height: 844 },
  });
  const page = await context.newPage();
  await page.addInitScript(() => window.sessionStorage.clear());
  return { context, page };
};

const installCeremonyObserver = (page: Page) =>
  page.addInitScript(() => {
    const state = window as typeof window & {
      ceremonyEvents: { name: string; part?: string; time: number }[];
    };
    state.ceremonyEvents = [];
    new MutationObserver((records) => {
      for (const record of records) {
        if (!(record.target instanceof HTMLElement)) continue;
        if (
          record.attributeName === 'data-ceremony-revealed' &&
          record.target.dataset.ceremonyRevealed === 'true'
        ) {
          state.ceremonyEvents.push({
            name: 'reveal',
            part: record.target.dataset.ceremonyPart,
            time: performance.now(),
          });
        }
        if (record.attributeName === 'data-ceremony-state') {
          state.ceremonyEvents.push({
            name: `state:${record.target.dataset.ceremonyState}`,
            time: performance.now(),
          });
        }
        if (record.attributeName === 'data-ceremony-pointer-dye') {
          state.ceremonyEvents.push({
            name: `pointer:${record.target.dataset.ceremonyPointerDye}`,
            time: performance.now(),
          });
        }
      }
    }).observe(document, {
      attributeFilter: [
        'data-ceremony-pointer-dye',
        'data-ceremony-revealed',
        'data-ceremony-state',
      ],
      attributes: true,
      subtree: true,
    });
  });

const installClearCounter = (page: Page) =>
  page.addInitScript(() => {
    const state = window as typeof window & { fluidClearCount: number };
    state.fluidClearCount = 0;
    for (const prototype of [WebGLRenderingContext.prototype, WebGL2RenderingContext.prototype]) {
      const clear = prototype.clear;
      Object.defineProperty(prototype, 'clear', {
        configurable: true,
        value(this: WebGLRenderingContext, ...arguments_: unknown[]) {
          state.fluidClearCount += 1;
          return Reflect.apply(clear, this, arguments_);
        },
      });
    }
  });

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

test('keeps visitor-visible homepage language free of unsupported claims', async ({ page }) => {
  await page.goto('/');

  const visitorVisibleCopy = await page.locator('body').innerText();
  for (const [claimType, pattern] of unsupportedHomepageClaims) {
    expect(
      visitorVisibleCopy,
      `visitor-visible homepage copy contains an unsupported ${claimType} claim`,
    ).not.toMatch(pattern);
  }
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
    await settleHeroCeremony(page);
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
    await page.addStyleTag({ content: 'astro-dev-toolbar { display: none !important; }' });
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
  await settleHeroCeremony(page);
  await expect(page.getByRole('heading', { level: 1, name: title })).toBeVisible();
  await expect(
    hero.getByText(/custom websites and digital products for creative companies/iu),
  ).toBeVisible();
  await expect(hero.getByRole('link', { name: 'Bring us an idea' })).toBeVisible();
  await expect(hero.getByRole('link', { name: 'See our work' })).toBeVisible();
  const [heroBox, titleBoxes] = await Promise.all([
    hero.boundingBox(),
    Promise.all(
      ['[data-title-line="first"]', '[data-title-part="middle"]', '[data-title-part="last"]'].map(
        (selector) => hero.locator(selector).boundingBox(),
      ),
    ),
  ]);
  if (!heroBox) throw new Error('The text-zoom hero geometry is unavailable.');
  for (const box of titleBoxes) {
    if (!box) throw new Error('A text-zoom title line is unavailable.');
    expect(box.x).toBeGreaterThanOrEqual(heroBox.x);
    expect(box.x + box.width).toBeLessThanOrEqual(heroBox.x + heroBox.width);
    expect(box.y).toBeGreaterThanOrEqual(heroBox.y);
    expect(box.y + box.height).toBeLessThanOrEqual(heroBox.y + heroBox.height);
  }
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

  const context = await browser.newContext({
    javaScriptEnabled: false,
    viewport: { width: 1440, height: 900 },
  });
  const page = await context.newPage();
  await page.goto('/');
  const hero = getHero(page);
  await expect(hero).toBeVisible();
  await expect(hero.locator('[data-fluid-poster]')).toBeVisible();
  await expect(hero.locator('[data-fluid-poster]')).toHaveCSS('opacity', '1');
  expect(
    await page.locator('[data-ceremony-part]').evaluateAll((elements) =>
      elements.map((element) => {
        const style = getComputedStyle(element);
        return { clipPath: style.clipPath, opacity: style.opacity };
      }),
    ),
  ).toEqual(Array.from({ length: 10 }, () => ({ clipPath: 'none', opacity: '1' })));
  await expectCurrentHeroComposition(page);
  await context.close();
});

test('keeps the mobile no-JavaScript fallback complete and actionable', async ({ browser }) => {
  const context = await browser.newContext({
    hasTouch: true,
    isMobile: true,
    javaScriptEnabled: false,
    viewport: { width: 390, height: 844 },
  });
  const page = await context.newPage();
  await page.goto('/');

  const hero = getHero(page);
  await expect(hero.locator('[data-fluid-poster]')).toHaveCSS('opacity', '1');
  await expect(hero.locator('.hero__backdrop')).toHaveAttribute('aria-hidden', 'true');
  await expectResolvedHero(page);
  await Promise.all([
    page.waitForURL('**/work'),
    hero.getByRole('link', { name: 'See our work' }).click(),
  ]);
  await context.close();
});

test('uses a static, non-interactive symbol field for reduced motion', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');

  const hero = getHero(page);
  await expect(hero.locator('[data-fluid-poster]')).toBeVisible();
  await expect(hero).toHaveAttribute('data-fluid-state', 'static');
  await expect(hero).toHaveAttribute('data-ceremony-state', 'skipped');
  await expect(hero).toHaveAttribute('data-ceremony-skip-reason', 'reduced-motion');
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
  await expect(hero).toHaveAttribute('data-ceremony-state', 'skipped');
  await expect(hero).toHaveAttribute('data-ceremony-skip-reason', 'unsupported-webgl');
  await expect(hero.locator('[data-fluid-poster]')).toBeVisible();
  await expectCurrentHeroComposition(page);
  expect(errors).toEqual([]);
});

const failOpenPaths = [
  'repeat-session',
  'hash',
  'reduced-motion',
  'storage',
  'unsupported-webgl',
] as const;

for (const viewport of [
  { name: 'desktop', width: 1024, height: 768 },
  { name: 'mobile', width: 390, height: 844 },
] as const) {
  for (const path of failOpenPaths) {
    test(`shows the ${path} ${viewport.name} view resolved from first paint`, async ({
      browser,
    }) => {
      const context = await browser.newContext({
        reducedMotion: path === 'reduced-motion' ? 'reduce' : 'no-preference',
        viewport,
      });
      const staticPage = await context.newPage();
      if (path === 'repeat-session') {
        await staticPage.addInitScript(() =>
          window.sessionStorage.setItem('obsolete:hero-ceremony-complete', 'true'),
        );
      }
      if (path === 'storage') {
        await staticPage.addInitScript(() => {
          Object.defineProperty(window, 'sessionStorage', {
            configurable: true,
            get: () => {
              throw new Error('Session storage is unavailable.');
            },
          });
        });
      }
      if (path === 'unsupported-webgl') {
        await staticPage.addInitScript(() => {
          const getContext = HTMLCanvasElement.prototype.getContext;
          Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
            configurable: true,
            value(this: HTMLCanvasElement, type: string, ...attributes: unknown[]) {
              if (type.startsWith('webgl')) return null;
              return Reflect.apply(getContext, this, [type, ...attributes]);
            },
          });
        });
      }
      await installCeremonyVisibilityTrace(staticPage);
      await staticPage.goto(path === 'hash' ? '/#featured-work' : '/');

      const hero = getHero(staticPage);
      await expect(hero).toHaveAttribute('data-ceremony-state', 'skipped');
      await expect(hero).toHaveAttribute('data-ceremony-skip-reason', path);
      await expectResolvedHero(staticPage);
      const samples = await staticPage.evaluate(
        () =>
          (
            window as typeof window & {
              ceremonyVisibilitySamples: { opacity: number[]; state?: string }[];
            }
          ).ceremonyVisibilitySamples,
      );
      expect(samples.length).toBeGreaterThan(0);
      expect(samples.every(({ opacity }) => opacity.every((value) => value === 1))).toBe(true);
      expect(
        samples.every(({ state }) =>
          state ? !['eligible', 'ready', 'running'].includes(state) : true,
        ),
      ).toBe(true);
      await context.close();
    });
  }
}

test('does not initialize WebGL or pointer responses for reduced motion', async ({ browser }) => {
  const context = await browser.newContext({
    hasTouch: true,
    isMobile: true,
    reducedMotion: 'reduce',
    viewport: { width: 390, height: 844 },
  });
  const page = await context.newPage();
  await page.addInitScript(() => {
    const getContext = HTMLCanvasElement.prototype.getContext;
    Object.assign(window, { heroWebGlContextRequests: 0 });
    Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
      configurable: true,
      value(this: HTMLCanvasElement, type: string, ...attributes: unknown[]) {
        if (type.startsWith('webgl')) {
          (
            window as typeof window & { heroWebGlContextRequests: number }
          ).heroWebGlContextRequests += 1;
        }
        return Reflect.apply(getContext, this, [type, ...attributes]);
      },
    });
  });
  await page.goto('/');

  const hero = getHero(page);
  await expect(hero).toHaveAttribute('data-fluid-state', 'static');
  await expect(hero.locator('[data-fluid-pointer-dot]')).toBeHidden();
  await hero.dispatchEvent('pointerdown', {
    clientX: 120,
    clientY: 320,
    pointerId: 1,
    pointerType: 'touch',
  });
  await expect(hero).not.toHaveAttribute('data-fluid-pointer-response', /.+/u);
  expect(
    await page.evaluate(
      () =>
        (window as typeof window & { heroWebGlContextRequests: number }).heroWebGlContextRequests,
    ),
  ).toBe(0);
  await context.close();
});

test('fails open when fluid initialization or a live context fails', async ({ browser }) => {
  const initializationContext = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const initializationPage = await initializationContext.newPage();
  const initializationErrors: string[] = [];
  initializationPage.on('pageerror', (error) => initializationErrors.push(error.message));
  await initializationPage.addInitScript(() => {
    const checkFramebufferStatus = WebGL2RenderingContext.prototype.checkFramebufferStatus;
    let framebufferChecks = 0;
    Object.defineProperty(WebGL2RenderingContext.prototype, 'checkFramebufferStatus', {
      configurable: true,
      value(this: WebGL2RenderingContext, target: GLenum) {
        if (target === this.FRAMEBUFFER) {
          framebufferChecks += 1;
          if (framebufferChecks > 1) return this.FRAMEBUFFER_UNSUPPORTED;
        }
        return Reflect.apply(checkFramebufferStatus, this, [target]);
      },
    });
  });
  await installCeremonyVisibilityTrace(initializationPage);
  await initializationPage.goto('/');
  const initializationHero = getHero(initializationPage);
  await expect(initializationHero).toHaveAttribute('data-ceremony-preflight', 'eligible');
  await expect(initializationHero).toHaveAttribute('data-fluid-state', 'fallback');
  await expect(initializationHero).toHaveAttribute('data-ceremony-state', 'skipped');
  await expect(initializationHero).toHaveAttribute('data-ceremony-skip-reason', 'fallback');
  await expectResolvedHero(initializationPage);
  const initializationSamples = await initializationPage.evaluate(
    () =>
      (
        window as typeof window & {
          ceremonyVisibilitySamples: { opacity: number[]; state?: string }[];
        }
      ).ceremonyVisibilitySamples,
  );
  expect(initializationSamples.length).toBeGreaterThan(0);
  expect(initializationSamples.every(({ opacity }) => opacity.every((value) => value === 1))).toBe(
    true,
  );
  expect(initializationErrors).toEqual([]);
  await initializationContext.close();

  const context = await browser.newContext({ viewport: { width: 1024, height: 768 } });
  const page = await context.newPage();
  await page.goto('/');
  const hero = getHero(page);
  await expectLiveCanvas(page, false);
  await hero.locator('[data-fluid-canvas]').dispatchEvent('webglcontextlost');
  await expect(hero).toHaveAttribute('data-fluid-state', 'fallback');
  await expect(hero).toHaveAttribute('data-ceremony-state', 'skipped');
  await expect(hero.locator('[data-fluid-poster]')).toBeVisible();
  await expectResolvedHero(page);
  await context.close();
});

test('fails open if a live fluid render throws', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.addInitScript(() => {
    const drawArrays = WebGL2RenderingContext.prototype.drawArrays;
    Object.assign(window, { failFluidDraw: false });
    Object.defineProperty(WebGL2RenderingContext.prototype, 'drawArrays', {
      configurable: true,
      value(this: WebGL2RenderingContext, ...arguments_: unknown[]) {
        const shouldFail =
          (window as typeof window & { failFluidDraw: boolean }).failFluidDraw &&
          this.canvas instanceof HTMLCanvasElement &&
          this.canvas.matches('[data-fluid-canvas]');
        if (shouldFail) throw new Error('Forced fluid render failure.');
        return Reflect.apply(drawArrays, this, arguments_);
      },
    });
  });
  await page.goto('/');
  await expectLiveCanvas(page);
  await page.evaluate(() => {
    (window as typeof window & { failFluidDraw: boolean }).failFluidDraw = true;
  });

  const hero = getHero(page);
  await expect(hero).toHaveAttribute('data-fluid-state', 'fallback');
  await expect(hero.locator('[data-fluid-poster]')).toBeVisible();
  await expectResolvedHero(page);
  expect(errors).toEqual([]);
});

test('fails open if fluid render targets fail during a resize', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.addInitScript(() => {
    const checkFramebufferStatus = WebGL2RenderingContext.prototype.checkFramebufferStatus;
    Object.assign(window, { failFluidResize: false });
    Object.defineProperty(WebGL2RenderingContext.prototype, 'checkFramebufferStatus', {
      configurable: true,
      value(this: WebGL2RenderingContext, target: GLenum) {
        const shouldFail =
          (window as typeof window & { failFluidResize: boolean }).failFluidResize &&
          this.canvas instanceof HTMLCanvasElement &&
          this.canvas.matches('[data-fluid-canvas]');
        if (shouldFail && target === this.FRAMEBUFFER) return this.FRAMEBUFFER_UNSUPPORTED;
        return Reflect.apply(checkFramebufferStatus, this, [target]);
      },
    });
  });
  await page.setViewportSize({ width: 1024, height: 768 });
  await page.goto('/');
  await expectLiveCanvas(page);
  await page.evaluate(() => {
    (window as typeof window & { failFluidResize: boolean }).failFluidResize = true;
  });
  await page.setViewportSize({ width: 600, height: 900 });

  const hero = getHero(page);
  await expect(hero).toHaveAttribute('data-fluid-state', 'fallback');
  await expect(hero.locator('[data-fluid-poster]')).toBeVisible();
  await expectResolvedHero(page);
  expect(errors).toEqual([]);
});

test('begins an eligible desktop view on warm paper with a faint field', async ({ page }) => {
  await page.setViewportSize({ width: 1024, height: 640 });
  await page.addInitScript(() => {
    let frameId = 0;
    Object.defineProperty(window, 'requestAnimationFrame', {
      configurable: true,
      value: () => {
        frameId += 1;
        return frameId;
      },
    });
  });
  await page.goto('/');

  const initial = await getHero(page).evaluate((hero) => {
    const poster = hero.querySelector<HTMLElement>('[data-fluid-poster]');
    const heading = hero.querySelector<HTMLElement>('#hero-title');
    const action = hero.querySelector<HTMLAnchorElement>('.hero__action--primary');
    if (!poster || !heading || !action) throw new Error('The initial hero is incomplete.');
    return {
      actionTarget: action.getAttribute('href'),
      ceremony: hero.dataset.ceremonyState,
      fluid: hero.dataset.fluidState,
      headingVisibility: getComputedStyle(heading).visibility,
      interfaceOpacity: Array.from(
        document.querySelectorAll<HTMLElement>('[data-ceremony-part]'),
        (element) => Number(getComputedStyle(element).opacity),
      ),
      posterOpacity: Number(getComputedStyle(poster).opacity),
    };
  });

  test.skip(initial.ceremony === 'skipped', 'WebGL is unavailable');
  expect(initial).toEqual({
    actionTarget: '/contact#project-inquiry',
    ceremony: 'ready',
    fluid: 'poster',
    headingVisibility: 'visible',
    interfaceOpacity: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    posterOpacity: 0.22,
  });
});

test('resolves the interface in order before handing off normal pointer dye', async ({ page }) => {
  await installCeremonyObserver(page);
  await page.setViewportSize({ width: 1024, height: 640 });
  await page.addInitScript(() => window.sessionStorage.clear());
  await page.goto('/');

  const hero = getHero(page);
  await expectLiveCanvas(page, false);
  await expect(hero).toHaveAttribute('data-ceremony-state', 'running');
  await page.mouse.move(80, 520);
  await page.mouse.move(300, 520, { steps: 4 });
  await expect(hero).toHaveAttribute('data-fluid-pointer-response', 'graphite');
  await expect(hero).not.toHaveAttribute('data-fluid-pointer-active', 'true');

  await expect(hero).toHaveAttribute('data-ceremony-pointer-dye', 'available', {
    timeout: 2_500,
  });
  await page.mouse.move(420, 520);
  await expect(hero).toHaveAttribute('data-fluid-pointer-response', 'orange');
  await expect(hero).toHaveAttribute('data-fluid-pointer-active', 'true');
  await expect(hero).toHaveAttribute('data-ceremony-state', 'settled', { timeout: 4_000 });

  const events = await page.evaluate(
    () =>
      (
        window as typeof window & {
          ceremonyEvents: { name: string; part?: string; time: number }[];
        }
      ).ceremonyEvents,
  );
  const runningAt = events.find(({ name }) => name === 'state:running')?.time;
  if (runningAt === undefined) throw new Error('The ceremony start was not observed.');
  const revealEvents = events.filter(
    (event) => event.name === 'reveal' && event.part && event.time >= runningAt,
  );
  const uniqueReveals = revealEvents.filter(
    (event, index) => revealEvents.findIndex(({ part }) => part === event.part) === index,
  );
  expect(uniqueReveals.map(({ part }) => part)).toEqual([
    'identity',
    'masthead',
    'eyebrow',
    'headline-first',
    'headline-rest',
    'period',
    'clarification',
    'actions',
  ]);

  const actionsAt = uniqueReveals.find(({ part }) => part === 'actions')?.time;
  const pointerAt = events.find(
    ({ name, time }) => name === 'pointer:available' && time >= runningAt,
  )?.time;
  const settledAt = events.find(
    ({ name, time }) => name === 'state:settled' && time >= runningAt,
  )?.time;
  expect(actionsAt).toBeDefined();
  expect(pointerAt).toBeDefined();
  expect(settledAt).toBeDefined();
  expect((actionsAt ?? 0) - runningAt).toBeGreaterThanOrEqual(1_100);
  expect((actionsAt ?? 0) - runningAt).toBeLessThanOrEqual(1_450);
  expect((pointerAt ?? 0) - runningAt).toBeGreaterThanOrEqual(1_500);
  expect((pointerAt ?? 0) - runningAt).toBeLessThanOrEqual(1_900);
  expect((settledAt ?? 0) - runningAt).toBeGreaterThanOrEqual(1_900);
  expect((settledAt ?? 0) - runningAt).toBeLessThanOrEqual(2_700);
  await expectCurrentHeroComposition(page);
});

test('fast-forwards for visitor intent without consuming the initiating action', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1024, height: 640 });
  await page.addInitScript(() => {
    if (window.location.pathname === '/') window.sessionStorage.clear();
  });
  const beginEligibleView = async () => {
    await page.goto('/');
    const hero = getHero(page);
    await expectLiveCanvas(page, false);
    await expect(hero).toHaveAttribute('data-ceremony-state', 'running');
    return hero;
  };

  await test.step('Escape resolves immediately', async () => {
    const hero = await beginEligibleView();
    await page.keyboard.press('Escape');
    await expect(hero).toHaveAttribute('data-ceremony-state', 'skipped');
    await expect(hero).toHaveAttribute('data-ceremony-skip-reason', 'key-escape');
    await expectCurrentHeroComposition(page);
  });

  await test.step('Tab keeps native focus movement', async () => {
    const hero = await beginEligibleView();
    await page.keyboard.press('Tab');
    await expect(hero).toHaveAttribute('data-ceremony-state', 'skipped');
    await expect(hero).toHaveAttribute('data-ceremony-skip-reason', 'key-tab');
    await expect(page.getByRole('link', { name: 'Skip to content' })).toBeFocused();
  });

  await test.step('scroll keeps native page movement', async () => {
    const hero = await beginEligibleView();
    await page.mouse.wheel(0, 480);
    await expect(hero).toHaveAttribute('data-ceremony-state', 'skipped');
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(0);
  });

  await test.step('control activation keeps navigation', async () => {
    const hero = await beginEligibleView();
    const workLink = page.getByRole('banner', { name: 'Site header' }).getByRole('link', {
      name: 'Work',
      exact: true,
    });
    await expect(page.locator('.site-header__nav')).toHaveAttribute(
      'data-ceremony-revealed',
      'true',
      { timeout: 1_500 },
    );
    await Promise.all([page.waitForURL('**/work'), workLink.click()]);
    expect(
      await page.evaluate(() => window.sessionStorage.getItem('obsolete:hero-ceremony-complete')),
    ).toBe('true');
    expect(await page.evaluate(() => window.location.pathname)).toBe('/work');
    await expect(hero).toHaveCount(0);
  });
});

for (const viewport of [
  { name: 'desktop', width: 1024, height: 768 },
  { name: 'mobile', width: 390, height: 844 },
] as const) {
  test(`keeps ${viewport.name} deep-link, history, and repeat views resolved`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.goto('/#featured-work');
    let hero = getHero(page);
    await expect(hero).toHaveAttribute('data-ceremony-state', 'skipped');
    await expect(hero).toHaveAttribute('data-ceremony-skip-reason', 'hash');
    await expectResolvedHero(page);
    expect(
      await page.evaluate(() => window.sessionStorage.getItem('obsolete:hero-ceremony-complete')),
    ).toBe('true');

    await page.goto('/work');
    await page.goBack();
    hero = getHero(page);
    await expect(hero).not.toHaveAttribute('data-ceremony-state', /eligible|ready|running/u);
    await expectResolvedHero(page);

    await page.goto('/work');
    await page.goto('/');
    hero = getHero(page);
    await expect(hero).toHaveAttribute('data-ceremony-state', 'skipped');
    await expect(hero).toHaveAttribute('data-ceremony-skip-reason', 'repeat-session');
    await expectResolvedHero(page);
  });

  test(`resolves ${viewport.name} focus and environmental interruptions`, async ({ page }) => {
    await page.addInitScript(() => window.sessionStorage.clear());
    const beginEligibleView = async () => {
      await page.setViewportSize(viewport);
      await page.goto('/');
      const hero = getHero(page);
      await expectLiveCanvas(page, false);
      await expect(hero).toHaveAttribute('data-ceremony-state', 'running');
      return hero;
    };

    await test.step('programmatic focus resolves before focus styling is read', async () => {
      const hero = await beginEligibleView();
      const result = await hero.evaluate((root) => {
        const action = root.querySelector<HTMLAnchorElement>('.hero__action--primary');
        if (!action) throw new Error('The primary hero action is unavailable.');
        action.focus();
        return {
          active: document.activeElement === action,
          ariaHiddenParts: root.querySelectorAll('[data-ceremony-part][aria-hidden="true"]').length,
          disabledActions: root.querySelectorAll(
            '[data-ceremony-part][inert], [aria-disabled="true"]',
          ).length,
          opacity: getComputedStyle(action).opacity,
          state: root.dataset.ceremonyState,
        };
      });
      expect(result).toEqual({
        active: true,
        ariaHiddenParts: 0,
        disabledActions: 0,
        opacity: '1',
        state: 'skipped',
      });
    });

    await test.step('page hiding resolves a bfcache candidate', async () => {
      const hero = await beginEligibleView();
      await page.evaluate(() =>
        window.dispatchEvent(new PageTransitionEvent('pagehide', { persisted: true })),
      );
      await expect(hero).toHaveAttribute('data-ceremony-state', 'skipped');
      await expect(hero).toHaveAttribute('data-ceremony-skip-reason', 'pagehide');
      await expectResolvedHero(page);
    });

    await test.step('document hiding resolves immediately', async () => {
      const hero = await beginEligibleView();
      await page.evaluate(() => {
        Object.defineProperty(document, 'visibilityState', {
          configurable: true,
          get: () => 'hidden',
        });
        document.dispatchEvent(new Event('visibilitychange'));
      });
      await expect(hero).toHaveAttribute('data-ceremony-skip-reason', 'visibility');
      await expectResolvedHero(page);
      await page.evaluate(() => {
        Object.defineProperty(document, 'visibilityState', {
          configurable: true,
          get: () => 'visible',
        });
      });
    });

    await test.step('resize resolves immediately', async () => {
      const hero = await beginEligibleView();
      await page.setViewportSize({ width: viewport.width - 20, height: viewport.height - 20 });
      await expect(hero).toHaveAttribute('data-ceremony-skip-reason', 'resize');
      await expectResolvedHero(page);
    });

    await test.step('orientation change resolves immediately', async () => {
      const hero = await beginEligibleView();
      await page.evaluate(() => window.dispatchEvent(new Event('orientationchange')));
      await expect(hero).toHaveAttribute('data-ceremony-state', 'skipped');
      await expect(hero).toHaveAttribute('data-ceremony-skip-reason', 'orientation');
      await expectResolvedHero(page);
    });
  });
}

test('awakens the first eligible desktop field from the rendered period without a reset', async ({
  page,
}) => {
  await installClearCounter(page);
  await page.setViewportSize({ width: 1024, height: 640 });
  await page.addInitScript(() => {
    const initializedKey = 'obsolete:hero-ceremony-test-initialized';
    if (window.sessionStorage.getItem(initializedKey) === 'true') return;
    window.sessionStorage.clear();
    window.sessionStorage.setItem(initializedKey, 'true');
  });
  await page.goto('/');

  const hero = getHero(page);
  const canvas = hero.locator('[data-fluid-canvas]');
  const heading = page.getByRole('heading', { level: 1, name: title });
  const period = hero.locator('.hero__title-period');
  const stableElements = [
    hero,
    canvas,
    heading,
    hero.locator('.hero__clarification'),
    page.getByRole('banner', { name: 'Site header' }),
  ];
  await expectLiveCanvas(page, false);
  await expect(hero).toHaveAttribute('data-ceremony-state', 'running');
  const [heroBox, periodBox, initialGeometry] = await Promise.all([
    hero.boundingBox(),
    period.boundingBox(),
    Promise.all(stableElements.map((element) => element.boundingBox())),
  ]);
  if (!heroBox || !periodBox) throw new Error('The punctuation origin is unavailable.');
  const interfaceState = await page.evaluate(() =>
    ['.site-header', '.hero__eyebrow', '#hero-title', '.hero__clarification'].map((selector) => {
      const element = document.querySelector<HTMLElement>(selector);
      if (!element) return false;
      const bounds = element.getBoundingClientRect();
      return (
        !element.hasAttribute('aria-hidden') &&
        !element.hasAttribute('inert') &&
        getComputedStyle(element).visibility !== 'hidden' &&
        bounds.width > 0
      );
    }),
  );
  expect(interfaceState).toEqual([true, true, true, true]);
  await expect(hero).toHaveAttribute('data-ceremony-origin', /^\d\.\d{4},\d\.\d{4}$/u);
  const originValue = await hero.getAttribute('data-ceremony-origin');
  const origin = originValue?.split(',').map(Number) as [number, number] | undefined;
  if (!origin) throw new Error('The punctuation origin was not recorded.');
  const originPixel: [number, number] = [
    heroBox.x + origin[0] * heroBox.width,
    heroBox.y + (1 - origin[1]) * heroBox.height,
  ];

  const hiddenInterface = await page.addStyleTag({
    content: 'header, .hero__content { visibility: hidden !important; }',
  });
  const clip = {
    height: 160,
    width: heroBox.width,
    x: heroBox.x,
    y: Math.min(Math.max(originPixel[1] - 80, heroBox.y), 480),
  };
  const orange = await getOrangeLocality(
    page,
    await page.screenshot({ clip }),
    [originPixel[0] - clip.x, originPixel[1] - clip.y],
    clip.height,
  );
  expect(orange.local).toBeGreaterThan(orange.remote + 0.25);
  await hiddenInterface.evaluate((element) => (element as HTMLElement).remove());

  await page.evaluate(() => {
    (window as typeof window & { fluidClearCount: number }).fluidClearCount = 0;
  });
  await expect(hero).toHaveAttribute('data-ceremony-state', 'settled', { timeout: 4_000 });
  const [settledHeroBox, settledPeriodBox] = await Promise.all([
    hero.boundingBox(),
    period.boundingBox(),
  ]);
  if (!settledHeroBox || !settledPeriodBox) {
    throw new Error('The settled punctuation origin is unavailable.');
  }
  const settledOrigin: [number, number] = [
    (settledPeriodBox.x + settledPeriodBox.width / 2 - settledHeroBox.x) / settledHeroBox.width,
    1 -
      (settledPeriodBox.y + settledPeriodBox.height / 2 - settledHeroBox.y) / settledHeroBox.height,
  ];
  expect(origin[0]).toBeCloseTo(settledOrigin[0], 3);
  expect(origin[1]).toBeCloseTo(settledOrigin[1], 3);
  await expect(hero).toHaveAttribute('data-ceremony-progress', '1');
  expect(await Promise.all(stableElements.map((element) => element.boundingBox()))).toEqual(
    initialGeometry,
  );
  expect(
    await page.evaluate(
      () => (window as typeof window & { fluidClearCount: number }).fluidClearCount,
    ),
  ).toBe(0);

  await page.reload();
  await expect(hero).toHaveAttribute('data-ceremony-state', 'skipped');
  await expect(hero).toHaveAttribute('data-ceremony-skip-reason', 'repeat-session');
  await expect(hero).toHaveAttribute('data-ceremony-progress', '1');
  await expectCurrentHeroComposition(page);
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

test('runs the mobile ceremony from the responsive period and settles without layout shift', async ({
  browser,
}) => {
  const { context, page } = await createMobileCeremonyPage(browser);
  await installCeremonyObserver(page);
  await page.goto('/');

  const hero = getHero(page);
  const period = hero.locator('.hero__title-period');
  const stableElements = [
    page.getByRole('banner', { name: 'Site header' }),
    hero.locator('.hero__eyebrow'),
    page.getByRole('heading', { level: 1, name: title }),
    hero.locator('.hero__clarification'),
    hero.locator('.hero__actions'),
  ];
  await expectLiveCanvas(page, false);
  await expect(hero).toHaveAttribute('data-ceremony-variant', 'mobile');
  await expect(hero).toHaveAttribute('data-ceremony-state', 'running');

  await expect(hero).toHaveAttribute('data-ceremony-origin', /^\d\.\d{4},\d\.\d{4}$/u);
  const origin = (await hero.getAttribute('data-ceremony-origin'))?.split(',').map(Number) as
    | [number, number]
    | undefined;
  if (!origin) throw new Error('The mobile punctuation origin was not recorded.');

  await expect(hero.locator('.hero__actions')).toHaveAttribute('data-ceremony-revealed', 'true');
  await page.waitForTimeout(140);
  const revealedGeometry = await Promise.all(
    stableElements.map((element) => element.boundingBox()),
  );
  await expect(hero).toHaveAttribute('data-ceremony-state', 'settled', { timeout: 2_500 });
  expect(await Promise.all(stableElements.map((element) => element.boundingBox()))).toEqual(
    revealedGeometry,
  );
  const [settledHeroBox, settledPeriodBox] = await Promise.all([
    hero.boundingBox(),
    period.boundingBox(),
  ]);
  if (!settledHeroBox || !settledPeriodBox) {
    throw new Error('The settled mobile punctuation origin is unavailable.');
  }
  expect(origin[0]).toBeCloseTo(
    (settledPeriodBox.x + settledPeriodBox.width / 2 - settledHeroBox.x) / settledHeroBox.width,
    3,
  );
  expect(origin[1]).toBeCloseTo(
    1 -
      (settledPeriodBox.y + settledPeriodBox.height / 2 - settledHeroBox.y) / settledHeroBox.height,
    3,
  );

  const events = await page.evaluate(
    () =>
      (
        window as typeof window & {
          ceremonyEvents: { name: string; part?: string; time: number }[];
        }
      ).ceremonyEvents,
  );
  const runningAt = events.find(({ name }) => name === 'state:running')?.time;
  if (runningAt === undefined) throw new Error('The mobile ceremony start was not observed.');
  const uniqueReveals = events
    .filter((event) => event.name === 'reveal' && event.part && event.time >= runningAt)
    .filter(
      (event, index, revealEvents) =>
        revealEvents.findIndex(({ part }) => part === event.part) === index,
    );
  expect(uniqueReveals.map(({ part }) => part)).toEqual([
    'identity',
    'masthead',
    'eyebrow',
    'headline-first',
    'headline-rest',
    'period',
    'clarification',
    'actions',
  ]);
  const actionsAt = uniqueReveals.find(({ part }) => part === 'actions')?.time;
  const pointerAt = events.find(
    ({ name, time }) => name === 'pointer:available' && time >= runningAt,
  )?.time;
  const settledAt = events.find(
    ({ name, time }) => name === 'state:settled' && time >= runningAt,
  )?.time;
  expect((actionsAt ?? 0) - runningAt).toBeGreaterThanOrEqual(800);
  expect((actionsAt ?? 0) - runningAt).toBeLessThanOrEqual(1_250);
  expect((pointerAt ?? 0) - runningAt).toBeGreaterThanOrEqual(1_450);
  expect((pointerAt ?? 0) - runningAt).toBeLessThanOrEqual(2_100);
  expect((settledAt ?? 0) - runningAt).toBeGreaterThanOrEqual(1_450);
  expect((settledAt ?? 0) - runningAt).toBeLessThanOrEqual(2_100);
  await expectCurrentHeroComposition(page);
  await expectNoHorizontalOverflow(page);
  await context.close();
});

test('preserves touch scrolling and first-attempt action taps during the mobile ceremony', async ({
  browser,
}) => {
  const scrollView = await createMobileCeremonyPage(browser);
  await scrollView.page.goto('/');
  const hero = getHero(scrollView.page);
  await expectLiveCanvas(scrollView.page, false);
  await expect(hero).toHaveAttribute('data-ceremony-variant', 'mobile');
  await expect(hero).toHaveAttribute('data-ceremony-state', 'running');
  await expect(hero.locator('[data-fluid-pointer-dot]')).toBeHidden();

  const session = await scrollView.context.newCDPSession(scrollView.page);
  await session.send('Input.dispatchTouchEvent', {
    type: 'touchStart',
    touchPoints: [{ x: 200, y: 730 }],
  });
  await session.send('Input.dispatchTouchEvent', {
    type: 'touchMove',
    touchPoints: [{ x: 200, y: 180 }],
  });
  await session.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await expect.poll(() => scrollView.page.evaluate(() => window.scrollY)).toBeGreaterThan(100);
  await expect(hero).toHaveAttribute('data-ceremony-state', 'skipped');
  await expect(hero).toHaveAttribute('data-ceremony-skip-reason', 'scroll');
  await expect(hero).not.toHaveAttribute('data-fluid-pointer-active', 'true');
  await expect(hero).not.toHaveAttribute('data-fluid-pointer-response', /.+/u);
  await scrollView.context.close();

  const actionView = await createMobileCeremonyPage(browser);
  await actionView.page.goto('/');
  const actionHero = getHero(actionView.page);
  await expectLiveCanvas(actionView.page, false);
  await expect(actionHero).toHaveAttribute('data-ceremony-state', 'running');
  await Promise.all([
    actionView.page.waitForURL('**/contact#project-inquiry'),
    actionHero.getByRole('link', { name: 'Bring us an idea' }).tap(),
  ]);
  await actionView.context.close();
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

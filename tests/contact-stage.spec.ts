import { expect, test, type Page } from '@playwright/test';

const invitationTitle = 'Bring us the idea you cannot stop thinking about.';
const minimumTitleWidthRatio = 0.52;
const maximumTitleWidthRatio = 0.58;

const getContactStage = (page: Page) =>
  page.getByRole('region', {
    name: invitationTitle,
  });

const getSculpture = (page: Page) => page.locator('[data-contact-sculpture]');

test('stages the invitation and live sculpture together on supported desktops', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('/');

  const contact = getContactStage(page);
  const upperStage = contact.locator('[data-contact-upper-stage]');
  const heading = contact.getByRole('heading', { level: 2, name: invitationTitle });
  const sculpture = getSculpture(page);

  await expect(sculpture).toHaveAttribute('data-contact-sculpture-state', 'poster');
  await expect(sculpture).not.toHaveAttribute('data-contact-sculpture-interactive', 'true');

  await contact.scrollIntoViewIfNeeded();
  await expect(heading).toBeVisible();
  await expect(sculpture).toBeVisible();
  await expect(sculpture).toHaveAttribute('aria-hidden', 'true');
  await expect(contact).toHaveAttribute('data-contact-tension-reveal', 'forming');
  await expect(sculpture).toHaveAttribute('data-contact-sculpture-state', 'forming');
  await expect(sculpture).not.toHaveAttribute('data-contact-sculpture-interactive', 'true');
  const formingProgress = Number(
    await contact.getAttribute('data-contact-tension-reveal-progress'),
  );
  expect(formingProgress).toBeGreaterThanOrEqual(0);
  expect(formingProgress).toBeLessThan(1);

  const formingBounds = await sculpture.boundingBox();
  expect(formingBounds).not.toBeNull();
  if (formingBounds) {
    await page.mouse.move(
      formingBounds.x + formingBounds.width * 0.7,
      formingBounds.y + formingBounds.height * 0.5,
    );
  }
  await expect(sculpture).not.toHaveAttribute('data-contact-sculpture-input', /.+/u);

  await expect(contact).toHaveAttribute('data-contact-tension-reveal', 'settled');
  await expect(contact).toHaveAttribute('data-contact-tension-reveal-progress', '1');
  const settledComposition = await contact.evaluate((section) => {
    const takeover = section.querySelector<HTMLElement>('[data-motion="contact-takeover"]');
    const title = section.querySelector<HTMLElement>('#contact-cta-title');
    const transform = takeover ? getComputedStyle(takeover).transform : '';
    const matrix = transform && transform !== 'none' ? new DOMMatrix(transform) : new DOMMatrix();
    return {
      copyOpacity: title ? Number(getComputedStyle(title).opacity) : 0,
      takeoverScaleY: Math.hypot(matrix.c, matrix.d),
    };
  });
  expect(settledComposition.copyOpacity).toBe(1);
  expect(settledComposition.takeoverScaleY).toBeGreaterThan(0.99);
  await expect(sculpture).toHaveAttribute('data-contact-sculpture-state', 'live');
  await expect(sculpture).toHaveAttribute('data-contact-sculpture-interactive', 'true');
  await expect(sculpture.locator('[data-contact-sculpture-canvas]')).toBeVisible();
  await expect(sculpture.locator('svg')).toBeHidden();
  await expect(sculpture.locator('a, button, input, [tabindex]')).toHaveCount(0);

  const measureComposition = () =>
    upperStage.evaluate((stage) => {
      const [title, artwork] = Array.from(stage.children) as HTMLElement[];
      const stageBox = stage.getBoundingClientRect();
      const titleBox = title.getBoundingClientRect();
      const artworkBox = artwork.getBoundingClientRect();

      return {
        artworkRight: artworkBox.right,
        titleWidthRatio: titleBox.width / stageBox.width,
        viewportWidth: document.documentElement.clientWidth,
      };
    });

  const standardDesktopComposition = await measureComposition();
  expect(standardDesktopComposition.titleWidthRatio).toBeGreaterThan(minimumTitleWidthRatio);
  expect(standardDesktopComposition.titleWidthRatio).toBeLessThan(maximumTitleWidthRatio);
  expect(standardDesktopComposition.artworkRight).toBeGreaterThan(
    standardDesktopComposition.viewportWidth,
  );
  await expect(contact).toHaveCSS('overflow-y', 'visible');

  await page.setViewportSize({ width: 1920, height: 1080 });
  const wideDesktopComposition = await measureComposition();
  expect(wideDesktopComposition.titleWidthRatio).toBeGreaterThan(minimumTitleWidthRatio);
  expect(wideDesktopComposition.titleWidthRatio).toBeLessThan(maximumTitleWidthRatio);
  expect(wideDesktopComposition.artworkRight).toBeGreaterThan(wideDesktopComposition.viewportWidth);
  const documentWidth = await page.evaluate(() => ({
    client: document.documentElement.clientWidth,
    scroll: document.documentElement.scrollWidth,
  }));
  expect(documentWidth.scroll).toBeLessThanOrEqual(documentWidth.client);

  await expect(contact.getByRole('heading', { name: 'Good fit' })).toBeVisible();
  await expect(contact.getByRole('heading', { name: 'Likely not a fit' })).toBeVisible();

  const inquiryAction = contact.getByRole('link', { name: 'Start a project inquiry' });
  await expect(inquiryAction).toHaveAttribute('href', '/contact#project-inquiry');
  await inquiryAction.focus();
  await expect(inquiryAction).toBeFocused();
});

test('responds to hover, press, and repeated clicks without changing inquiry behavior', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('/');

  const sculpture = getSculpture(page);
  await sculpture.scrollIntoViewIfNeeded();
  await expect(sculpture).toHaveAttribute('data-contact-sculpture-state', 'live');
  await expect(sculpture).toHaveAttribute('data-contact-sculpture-interactive', 'true');

  const bounds = await sculpture.boundingBox();
  expect(bounds).not.toBeNull();
  if (!bounds) return;

  const interactionPoints = [
    { x: bounds.x + bounds.width * 0.64, y: bounds.y + bounds.height * 0.42 },
    { x: bounds.x + bounds.width * 0.78, y: bounds.y + bounds.height * 0.58 },
  ];

  await page.mouse.move(interactionPoints[0].x, interactionPoints[0].y);
  await expect(sculpture).toHaveAttribute('data-contact-sculpture-input', 'hover');
  await page.mouse.move(bounds.x - 16, interactionPoints[0].y);
  await expect(sculpture).toHaveAttribute('data-contact-sculpture-input', 'idle');
  await page.mouse.move(interactionPoints[0].x, interactionPoints[0].y);

  await page.mouse.down();
  await expect(sculpture).toHaveAttribute('data-contact-sculpture-input', 'pressed');
  await page.mouse.move(interactionPoints[1].x, interactionPoints[1].y);
  await expect(sculpture).toHaveAttribute('data-contact-sculpture-input', 'hover');
  await page.mouse.up();
  await expect(sculpture).toHaveAttribute('data-contact-sculpture-input', 'hover');

  await page.mouse.move(interactionPoints[0].x, interactionPoints[0].y);
  await page.mouse.down();
  await expect(sculpture).toHaveAttribute('data-contact-sculpture-input', 'pressed');
  await page.mouse.up();
  await expect(sculpture).toHaveAttribute('data-contact-sculpture-input', 'released');

  await page.mouse.click(interactionPoints[0].x, interactionPoints[0].y, { clickCount: 4 });
  await page.mouse.click(interactionPoints[1].x, interactionPoints[1].y, { clickCount: 4 });
  await expect(sculpture).toHaveAttribute('data-contact-sculpture-input', 'released');

  const inquiryAction = getContactStage(page).getByRole('link', {
    name: 'Start a project inquiry',
  });
  await inquiryAction.click();
  await expect(page).toHaveURL(/\/contact#project-inquiry$/u);
});

test('keeps the existing text-led inquiry flow on smaller viewports', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');

  const contact = getContactStage(page);
  const sculpture = getSculpture(page);

  await contact.scrollIntoViewIfNeeded();
  await expect(sculpture).toBeHidden();
  await expect(sculpture).toHaveCSS('display', 'none');
  await expect(sculpture).toHaveAttribute('data-contact-sculpture-state', 'static');
  await expect(sculpture).not.toHaveAttribute('data-contact-sculpture-interactive', 'true');

  const heading = contact.getByRole('heading', { level: 2, name: invitationTitle });
  await expect(heading).toBeVisible();
  const upperStageHeight = await contact
    .locator('[data-contact-upper-stage]')
    .evaluate((stage) => ({
      heading: stage.firstElementChild?.getBoundingClientRect().height,
      stage: stage.getBoundingClientRect().height,
    }));
  expect(upperStageHeight.stage).toBeCloseTo(upperStageHeight.heading ?? 0, 0);

  await expect(contact.getByText(/An unfinished brief is welcome/iu)).toBeVisible();
  await expect(contact.getByRole('link', { name: 'Start a project inquiry' })).toHaveAttribute(
    'href',
    '/contact#project-inquiry',
  );
});

test('does not reserve sculpture space for coarse-pointer visitors', async ({ browser }) => {
  const context = await browser.newContext({
    hasTouch: true,
    viewport: { width: 1280, height: 900 },
  });
  const page = await context.newPage();
  await page.goto('/');

  await expect(getSculpture(page)).toHaveCSS('display', 'none');
  await expect(getSculpture(page)).toHaveAttribute('data-contact-sculpture-state', 'static');
  await expect(getSculpture(page)).not.toHaveAttribute(
    'data-contact-sculpture-interactive',
    'true',
  );
  await expect(
    getContactStage(page).getByRole('link', { name: 'Start a project inquiry' }),
  ).toBeVisible();

  await context.close();
});

test('presents the sculpture as a static poster for reduced motion', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');

  const sculpture = getSculpture(page);
  await expect(sculpture).toBeVisible();
  await expect(sculpture).toHaveAttribute('data-contact-sculpture-state', 'static');
  await expect(sculpture).not.toHaveAttribute('data-contact-sculpture-interactive', 'true');
  await expect(getContactStage(page)).not.toHaveAttribute('data-contact-tension-reveal', /.+/u);
  await expect(sculpture.locator('svg')).toBeVisible();
  await expect(sculpture.locator('[data-contact-sculpture-canvas]')).toBeHidden();
  await expect(sculpture).toHaveCSS('animation-duration', '0s');
  await expect(sculpture).toHaveCSS('transition-duration', '0s');
  await expect(sculpture).toHaveCSS('pointer-events', 'none');
});

test('fails open to the poster when WebGL is unavailable', async ({ page }) => {
  await page.addInitScript(() => {
    const originalGetContext = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (
      this: HTMLCanvasElement,
      contextId,
      ...args
    ) {
      if (contextId === 'webgl' || contextId === 'webgl2') return null;
      return Reflect.apply(originalGetContext, this, [contextId, ...args]);
    } as typeof HTMLCanvasElement.prototype.getContext;
  });
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('/');

  const sculpture = getSculpture(page);
  await sculpture.scrollIntoViewIfNeeded();
  await expect(sculpture).toHaveAttribute('data-contact-sculpture-state', 'fallback');
  await expect(sculpture).not.toHaveAttribute('data-contact-sculpture-interactive', 'true');
  await expect(sculpture.locator('svg')).toBeVisible();
  await expect(sculpture.locator('[data-contact-sculpture-canvas]')).toBeHidden();
  await expect(
    getContactStage(page).getByRole('link', { name: 'Start a project inquiry' }),
  ).toBeVisible();
});

test('fails open to the poster when shader initialization fails', async ({ page }) => {
  await page.addInitScript(() => {
    for (const prototype of [WebGLRenderingContext.prototype, WebGL2RenderingContext.prototype]) {
      const getProgramParameter = prototype.getProgramParameter;
      Object.defineProperty(prototype, 'getProgramParameter', {
        configurable: true,
        value(this: WebGLRenderingContext, program: WebGLProgram, parameter: GLenum) {
          if (
            this.canvas instanceof HTMLCanvasElement &&
            this.canvas.matches('[data-contact-sculpture-canvas]') &&
            parameter === this.LINK_STATUS
          ) {
            return false;
          }
          return Reflect.apply(getProgramParameter, this, [program, parameter]);
        },
      });
    }
  });
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('/');

  const sculpture = getSculpture(page);
  await sculpture.scrollIntoViewIfNeeded();
  await expect(sculpture).toHaveAttribute('data-contact-sculpture-state', 'fallback');
  await expect(sculpture.locator('svg')).toBeVisible();
  await expect(sculpture.locator('[data-contact-sculpture-canvas]')).toBeHidden();
});

test('pauses the live sculpture offscreen and resumes it safely', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('/');

  const sculpture = getSculpture(page);
  await sculpture.scrollIntoViewIfNeeded();
  await expect(sculpture).toHaveAttribute('data-contact-sculpture-state', 'live');
  await expect(getContactStage(page)).toHaveAttribute('data-contact-tension-reveal', 'settled');

  await page.evaluate(() => window.scrollTo({ top: 0 }));
  await expect(sculpture).toHaveAttribute('data-contact-sculpture-state', 'paused');
  await expect(getContactStage(page)).toHaveAttribute('data-contact-tension-reveal', 'settled');
  await expect(sculpture).not.toHaveAttribute('data-contact-sculpture-interactive', 'true');

  await sculpture.evaluate((element) => element.scrollIntoView({ block: 'center' }));
  await expect(sculpture).toHaveAttribute('data-contact-sculpture-state', 'live');
  await expect(sculpture).toHaveAttribute('data-contact-sculpture-interactive', 'true');
  await expect(getContactStage(page)).toHaveAttribute('data-contact-tension-reveal', 'settled');
});

test('disposes the live sculpture before an Astro page swap', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('/');

  const sculpture = getSculpture(page);
  const motionRoot = page.locator('[data-home-motion]');
  const takeover = getContactStage(page).locator('[data-motion="contact-takeover"]');
  await sculpture.scrollIntoViewIfNeeded();
  await expect(sculpture).toHaveAttribute('data-contact-sculpture-state', 'live');
  await expect(motionRoot).toHaveAttribute('data-motion-ready', 'desktop');
  await expect(takeover).toHaveAttribute('style', /transform/u);

  await page.evaluate(() => document.dispatchEvent(new Event('astro:before-swap')));

  await expect(motionRoot).not.toHaveAttribute('data-motion-ready', /.+/u);
  await expect(takeover).not.toHaveAttribute('style', /.+/u);
  await expect(sculpture).toHaveAttribute('data-contact-sculpture-state', 'static');
  await expect(sculpture).not.toHaveAttribute('data-contact-sculpture-interactive', 'true');
  await expect(sculpture).not.toHaveAttribute('data-contact-sculpture-input', /.+/u);
  await expect(sculpture.locator('svg')).toBeVisible();
});

test('restores the poster when the live sculpture loses its WebGL context', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('/');

  const sculpture = getSculpture(page);
  await sculpture.scrollIntoViewIfNeeded();
  await expect(sculpture).toHaveAttribute('data-contact-sculpture-state', 'live');

  await sculpture.locator('[data-contact-sculpture-canvas]').dispatchEvent('webglcontextlost');

  await expect(sculpture).toHaveAttribute('data-contact-sculpture-state', 'fallback');
  await expect(sculpture).not.toHaveAttribute('data-contact-sculpture-interactive', 'true');
  await expect(sculpture.locator('svg')).toBeVisible();
  await expect(sculpture.locator('[data-contact-sculpture-canvas]')).toBeHidden();
  await expect(
    getContactStage(page).getByRole('link', { name: 'Start a project inquiry' }),
  ).toBeVisible();
});

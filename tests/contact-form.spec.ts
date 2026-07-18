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

const getFormSection = (page: import('@playwright/test').Page) =>
  page.getByRole('region', { name: 'Give us the shape of it.' });

const getHomepageInvitation = (page: import('@playwright/test').Page) =>
  page.getByRole('region', { name: 'Bring us the idea you cannot stop thinking about.' });

test('qualifies the homepage invitation without overpromising the prototype inquiry', async ({
  page,
}) => {
  await page.goto('/');
  const invitation = getHomepageInvitation(page);

  await expect(invitation).toBeVisible();
  await expect(
    invitation.getByRole('heading', {
      level: 2,
      name: 'Bring us the idea you cannot stop thinking about.',
    }),
  ).toBeVisible();
  await expect(
    invitation.getByText(/An unfinished brief is welcome\. Bring the rough idea/iu),
  ).toBeVisible();
  await expect(
    invitation.getByText(/what you want to make, who it is for, and what is getting in the way/iu),
  ).toBeVisible();
  await expect(invitation.getByRole('heading', { level: 3, name: 'Good fit' })).toBeVisible();
  await expect(
    invitation.getByText(/distinctive idea, complex story, or product interaction/iu),
  ).toBeVisible();
  await expect(invitation.getByText(/template will not solve well/iu)).toBeVisible();
  await expect(
    invitation.getByRole('heading', { level: 3, name: 'Likely not a fit' }),
  ).toBeVisible();
  await expect(
    invitation.getByText(/commodity production, an unlimited brief, or AI added/iu),
  ).toBeVisible();
  await expect(invitation.getByText(/without a clear user outcome/iu)).toBeVisible();

  const action = invitation.getByRole('link', { name: 'Start a project inquiry' });
  await expect(action).toHaveAttribute('href', '/contact#project-inquiry');
  await expect(
    invitation.getByText(/response time|we will review|successfully submitted|sent or stored/iu),
  ).toHaveCount(0);
});

test('keeps the fit-aware invitation keyboard accessible on mobile', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await page.goto('/');
  const invitation = getHomepageInvitation(page);
  const action = invitation.getByRole('link', { name: 'Start a project inquiry' });

  await action.focus();
  await expect(action).toBeFocused();
  const focus = await action.evaluate((element) => {
    const style = getComputedStyle(element);
    return { style: style.outlineStyle, width: style.outlineWidth };
  });
  expect(focus.style).not.toBe('none');
  expect(focus.width).toBe('2px');

  const [goodFitBox, nonFitBox, actionBox] = await Promise.all([
    invitation.getByRole('heading', { name: 'Good fit' }).boundingBox(),
    invitation.getByRole('heading', { name: 'Likely not a fit' }).boundingBox(),
    action.boundingBox(),
  ]);
  expect(goodFitBox).not.toBeNull();
  expect(nonFitBox).not.toBeNull();
  expect(actionBox?.height).toBeGreaterThanOrEqual(48);
  if (goodFitBox && nonFitBox) {
    expect(goodFitBox.y + goodFitBox.height).toBeLessThan(nonFitBox.y);
  }

  const overflow = await page.evaluate(() => ({
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
  }));
  expect(overflow.scrollWidth).toBeLessThanOrEqual(overflow.clientWidth);
});

test('reflows the fit-aware invitation at 200% text size', async ({ page }) => {
  await page.setViewportSize({ width: 640, height: 900 });
  await page.goto('/');
  await page.addStyleTag({ content: 'html { font-size: 200% !important; }' });
  const invitation = getHomepageInvitation(page);

  await expect(invitation.getByRole('heading', { name: 'Good fit' })).toBeVisible();
  await expect(invitation.getByRole('heading', { name: 'Likely not a fit' })).toBeVisible();
  await expect(invitation.getByRole('link', { name: 'Start a project inquiry' })).toBeVisible();

  const overflow = await page.evaluate(() => ({
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
  }));
  expect(overflow.scrollWidth).toBeLessThanOrEqual(overflow.clientWidth);
});

test('places the qualified project inquiry below the contact hero', async ({ page }) => {
  await page.goto('/contact');

  const hero = page.getByRole('region', { name: 'Bring us an idea.' });
  const formSection = getFormSection(page);

  await expect(hero).toBeVisible();
  await expect(formSection).toBeVisible();
  expect(
    await hero.evaluate(
      (heroElement, formElement) =>
        Boolean(
          heroElement.compareDocumentPosition(formElement as Node) &
          Node.DOCUMENT_POSITION_FOLLOWING,
        ),
      await formSection.elementHandle(),
    ),
  ).toBe(true);

  await expect(formSection.getByLabel('Your name')).toBeVisible();
  await expect(formSection.getByLabel('Email')).toBeVisible();
  await expect(formSection.getByLabel('Company / organization')).toBeVisible();
  await expect(formSection.getByRole('checkbox', { name: 'Direction' })).toBeVisible();
  await expect(formSection.getByRole('checkbox', { name: 'Design' })).toBeVisible();
  await expect(formSection.getByRole('checkbox', { name: 'Engineering' })).toBeVisible();
  await expect(formSection.getByRole('checkbox', { name: 'Not sure yet' })).toBeVisible();
  await expect(formSection.getByLabel('Tell us about the idea')).toBeVisible();
  await expect(
    formSection.getByRole('button', { name: 'Indicative investment', exact: true }),
  ).toBeVisible();
  await expect(
    formSection.getByRole('button', { name: 'When would you like to begin?', exact: true }),
  ).toBeVisible();
  await expect(formSection.getByRole('button', { name: 'Send the idea' })).toBeVisible();

  await expect(
    formSection.locator('input[type="tel"], input[type="url"], input[type="file"]'),
  ).toHaveCount(0);
});

test('keeps static grain from first paint and without JavaScript', async ({ request, browser }) => {
  const [response, textureResponse] = await Promise.all([
    request.get('/contact'),
    request.get('/capabilities-grain.png'),
  ]);
  expect(await response.text()).toContain('data-grain-state="static"');
  expect(textureResponse.ok()).toBe(true);

  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto('/contact');
  const formSection = getFormSection(page);

  await expect(formSection).toHaveAttribute('data-grain-state', 'static');
  await expect(formSection.locator('.contact-form__grain')).toHaveCSS(
    'background-image',
    /capabilities-grain\.png/u,
  );
  await expect(formSection.getByLabel('Your name')).toBeVisible();
  await expect(formSection.getByRole('button', { name: 'Send the idea' })).toBeVisible();
  await context.close();
});

test('uses static grain without requesting WebGL for reduced motion', async ({ page }) => {
  await installGrainContextRequestTrace(page);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/contact');
  const formSection = getFormSection(page);
  await formSection.scrollIntoViewIfNeeded();

  await expect(formSection).toHaveAttribute('data-grain-state', 'static');
  await expect(formSection.locator('.contact-form__grain')).toHaveAttribute('aria-hidden', 'true');
  await expect(formSection.locator('.contact-form__grain')).toHaveCSS('pointer-events', 'none');
  await expect(formSection.locator('[data-grain-canvas]')).not.toHaveAttribute('tabindex', /.+/u);
  expect(await readGrainContextRequests(page)).toBe(0);
});

for (const failure of [
  'unsupported WebGL',
  'shader initialization',
] as const satisfies readonly GrainFailure[]) {
  test(`keeps the contact form available after ${failure}`, async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await installGrainFailure(page, failure);
    await page.goto('/contact');
    const formSection = getFormSection(page);
    await formSection.scrollIntoViewIfNeeded();

    await expect(formSection).toHaveAttribute('data-grain-state', 'fallback');
    await expect(formSection.locator('.contact-form__grain')).toHaveCSS(
      'background-image',
      /capabilities-grain\.png/u,
    );
    await expect(formSection.getByLabel('Your name')).toBeEditable();
    await expect(formSection.getByRole('button', { name: 'Send the idea' })).toBeEnabled();
    expect(errors).toEqual([]);
  });
}

test('keeps the contact grain behind keyboard-accessible form controls', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/contact');
  const formSection = getFormSection(page);
  const orderedControls = [
    formSection.getByLabel('Your name'),
    formSection.getByLabel('Email'),
    formSection.getByLabel('Company / organization'),
    formSection.getByRole('checkbox', { name: 'Direction' }),
    formSection.getByRole('checkbox', { name: 'Design' }),
    formSection.getByRole('checkbox', { name: 'Engineering' }),
    formSection.getByRole('checkbox', { name: 'Not sure yet' }),
    formSection.getByLabel('Tell us about the idea'),
    formSection.getByRole('button', { name: 'Indicative investment', exact: true }),
    formSection.getByRole('button', { name: 'When would you like to begin?', exact: true }),
    formSection.getByRole('button', { name: 'Send the idea' }),
  ];

  await orderedControls[0].focus();
  await orderedControls.reduce(async (previous, control, index) => {
    await previous;
    await expect(control).toBeFocused();
    if (index < orderedControls.length - 1) await page.keyboard.press('Tab');
  }, Promise.resolve());

  const name = orderedControls[0];
  await name.scrollIntoViewIfNeeded();
  const box = await name.boundingBox();
  if (!box) throw new Error('The contact name field is unavailable.');
  expect(
    await page.evaluate(({ x, y }) => document.elementFromPoint(x, y)?.id, {
      x: box.x + box.width / 2,
      y: box.y + box.height / 2,
    }),
  ).toBe('contact-name');
  expect(
    await formSection.evaluate((element) => ({
      content: getComputedStyle(element.querySelector('.contact-form__inner')!).zIndex,
      grain: getComputedStyle(element.querySelector('.contact-form__grain')!).zIndex,
    })),
  ).toEqual({ content: '1', grain: '0' });
});

test('pauses, resumes, resizes, and disposes the contact grain coherently', async ({ page }) => {
  await installGrainDrawTrace(page);
  await page.setViewportSize({ width: 1200, height: 700 });
  await page.goto('/contact');
  const formSection = getFormSection(page);
  await expect(formSection).toHaveAttribute('data-grain-state', /static|fallback/u);
  test.skip(
    (await formSection.getAttribute('data-grain-state')) === 'fallback',
    'WebGL is unavailable',
  );

  await resetGrainDrawTrace(page);
  await page.waitForTimeout(220);
  expect((await readGrainDrawTrace(page)).contact).toBe(0);

  await formSection.scrollIntoViewIfNeeded();
  await expect(formSection).toHaveAttribute('data-grain-state', 'live');
  await expect(formSection).toHaveAttribute('data-grain-quality', 'desktop');
  const canvas = formSection.locator('[data-grain-canvas]');
  await expectCanvasToCoverSurface(formSection);
  await expect(canvas).toHaveCSS('pointer-events', 'none');
  expect(
    await canvas.evaluate(
      (element) =>
        Math.round(
          ((element as HTMLCanvasElement).width / element.getBoundingClientRect().width) * 100,
        ) / 100,
    ),
  ).toBeLessThanOrEqual(1.51);

  const hiddenContent = await page.addStyleTag({
    content: '.contact-form__inner { visibility: hidden !important; }',
  });
  const staticOverride = await page.addStyleTag({
    content: '.contact-form__grain canvas { opacity: 0 !important; }',
  });
  const staticFrame = await canvas.screenshot();
  await staticOverride.evaluate((element) => (element as HTMLElement).remove());
  const first = await canvas.screenshot();
  await resetGrainDrawTrace(page);
  await page.waitForTimeout(1_100);
  const desktopDraws = (await readGrainDrawTrace(page)).contact;
  expect(desktopDraws).toBeGreaterThanOrEqual(16);
  expect(desktopDraws).toBeLessThanOrEqual(22);
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
  await expect(formSection).toHaveAttribute('data-grain-state', 'paused');
  await resetGrainDrawTrace(page);
  await page.waitForTimeout(220);
  expect((await readGrainDrawTrace(page)).contact).toBe(0);
  await page.evaluate(() => {
    Object.defineProperty(document, 'visibilityState', {
      configurable: true,
      get: () => 'visible',
    });
    document.dispatchEvent(new Event('visibilitychange'));
  });
  await expect(formSection).toHaveAttribute('data-grain-state', 'live');

  await page.evaluate(() => window.scrollTo(0, 0));
  await expect(formSection).toHaveAttribute('data-grain-state', 'paused');
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(formSection).toHaveAttribute('data-grain-state', 'static');
  await expect(canvas).toHaveCSS('opacity', '0');
  await formSection.scrollIntoViewIfNeeded();
  await expect(formSection).toHaveAttribute('data-grain-state', 'live');
  await expect(formSection).toHaveAttribute('data-grain-quality', 'mobile');
  await expectCanvasToCoverSurface(formSection);
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
  const mobileDraws = (await readGrainDrawTrace(page)).contact;
  expect(mobileDraws).toBeGreaterThanOrEqual(13);
  expect(mobileDraws).toBeLessThanOrEqual(16);
  const mobileSecond = await canvas.screenshot();
  const mobileAnalysis = await analyzeGrainFrames(page, mobileFirst, mobileSecond);
  assertWarmMonochromeGrain(mobileAnalysis);
  expect(Math.abs(mobileAnalysis.luminance - desktopAnalysis.luminance)).toBeLessThan(3);
  expect(Math.abs(mobileAnalysis.spread - desktopAnalysis.spread)).toBeLessThan(3);
  await hiddenContent.evaluate((element) => (element as HTMLElement).remove());

  await canvas.dispatchEvent('webglcontextlost');
  await expect(formSection).toHaveAttribute('data-grain-state', 'fallback');
  await expect(formSection.getByLabel('Your name')).toBeVisible();

  await page.reload();
  const reloadedForm = getFormSection(page);
  await reloadedForm.scrollIntoViewIfNeeded();
  test.skip(
    (await reloadedForm.getAttribute('data-grain-state')) === 'fallback',
    'WebGL is unavailable',
  );
  await expect(reloadedForm).toHaveAttribute('data-grain-state', 'live');
  await page.evaluate(() => window.dispatchEvent(new PageTransitionEvent('pagehide')));
  await expect(reloadedForm).toHaveAttribute('data-grain-state', 'static');
  await resetGrainDrawTrace(page);
  await page.waitForTimeout(220);
  expect((await readGrainDrawTrace(page)).contact).toBe(0);
});

test('validates required fields with Zod and focuses the first error', async ({ page }) => {
  await page.goto('/contact');
  const formSection = getFormSection(page);

  await formSection.getByRole('button', { name: 'Send the idea' }).click();

  await expect(formSection.getByRole('alert')).toHaveText(
    'Check the highlighted fields and try again.',
  );
  await expect(formSection.getByLabel('Your name')).toBeFocused();
  await expect(formSection.getByText('Tell us your name.')).toBeVisible();
  await expect(formSection.getByText('Tell us where we can reply.')).toBeVisible();
  await expect(
    formSection.getByText('Choose at least one area, or select Not sure yet.'),
  ).toBeVisible();
  await expect(formSection.getByText('Give us a little context about the idea.')).toBeVisible();

  await formSection.getByLabel('Your name').fill('Ada Lovelace');
  await formSection.getByLabel('Email').fill('not-an-email');
  await formSection.getByRole('button', { name: 'Send the idea' }).click();

  await expect(formSection.getByText('Tell us your name.')).toHaveCount(0);
  await expect(formSection.getByText('Enter a valid email address.')).toBeVisible();
  await expect(formSection.getByLabel('Email')).toBeFocused();
});

test('keeps Not sure yet exclusive within the capability multi-select', async ({ page }) => {
  await page.goto('/contact');
  const formSection = getFormSection(page);
  const design = formSection.getByRole('checkbox', { name: 'Design' });
  const engineering = formSection.getByRole('checkbox', { name: 'Engineering' });
  const notSure = formSection.getByRole('checkbox', { name: 'Not sure yet' });

  await design.click();
  await expect(design).toHaveAttribute('data-state', 'checked');

  await notSure.click();
  await expect(notSure).toHaveAttribute('data-state', 'checked');
  await expect(design).toHaveAttribute('data-state', 'unchecked');

  await engineering.click();
  await expect(engineering).toHaveAttribute('data-state', 'checked');
  await expect(notSure).toHaveAttribute('data-state', 'unchecked');
});

test('submits to Web3Forms with loading and success states', async ({ page }) => {
  let releaseSubmission = () => {};
  let submittedPayload: Record<string, string> | undefined;
  const submissionPending = new Promise<void>((resolve) => {
    releaseSubmission = resolve;
  });
  await page.route('https://api.web3forms.com/submit', async (route) => {
    submittedPayload = route.request().postDataJSON() as Record<string, string>;
    await submissionPending;
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true, message: 'Submission received.' }),
    });
  });

  await page.goto('/contact');
  const formSection = getFormSection(page);

  await formSection.getByLabel('Your name').fill('Ada Lovelace');
  await formSection.getByLabel('Email').fill('ada@example.com');
  await formSection.getByLabel('Company / organization').fill('Analytical Engines');
  await formSection.getByRole('checkbox', { name: 'Direction' }).click();
  await formSection
    .getByLabel('Tell us about the idea')
    .fill('A digital experience that helps people understand an ambitious new machine.');

  const budget = formSection.getByRole('button', {
    name: 'Indicative investment',
    exact: true,
  });
  await budget.click();
  await page.getByRole('option', { name: '£10–25k' }).click();
  await expect(budget).toContainText('£10–25k');

  const startWindow = formSection.getByRole('button', {
    name: 'When would you like to begin?',
    exact: true,
  });
  await startWindow.click();
  await page.getByRole('option', { name: 'In 1–3 months' }).click();
  await expect(startWindow).toContainText('In 1–3 months');

  const submitButton = formSection.locator('button[type="submit"]');
  await expect(submitButton).toHaveAccessibleName('Send the idea');
  await submitButton.click();
  await expect(submitButton).toBeDisabled();
  await expect(submitButton).toContainText('Sending…');

  releaseSubmission();

  const notice = formSection.getByRole('status');
  await expect(notice).toBeFocused();
  await expect(notice).toContainText('Inquiry sent.');
  await expect(notice).toContainText('Thanks — your idea is on its way. We will begin by email.');
  await expect(page).toHaveURL(/\/contact$/u);
  expect(submittedPayload).toMatchObject({
    name: 'Ada Lovelace',
    email: 'ada@example.com',
    organization: 'Analytical Engines',
    capabilities: 'Direction',
    message: 'A digital experience that helps people understand an ambitious new machine.',
    budget: '£10–25k',
    start_window: 'In 1–3 months',
  });
});

test('preserves the inquiry and shows an error when delivery fails', async ({ page }) => {
  await page.route('https://api.web3forms.com/submit', async (route) => {
    await route.fulfill({
      status: 403,
      contentType: 'text/html',
      body: '<h1>Forbidden</h1>',
    });
  });

  await page.goto('/contact');
  const formSection = getFormSection(page);
  const name = formSection.getByLabel('Your name');
  await name.fill('Grace Hopper');
  await formSection.getByLabel('Email').fill('grace@example.com');
  await formSection.getByRole('checkbox', { name: 'Engineering' }).click();
  await formSection
    .getByLabel('Tell us about the idea')
    .fill('A resilient interface for a complex technical system.');

  await formSection.getByRole('button', { name: 'Send the idea' }).click();

  const notice = formSection.getByRole('alert');
  await expect(notice).toBeFocused();
  await expect(notice).toContainText('Could not send the inquiry.');
  await expect(notice).toContainText(
    'Something went wrong. Your details are still in the form, so you can try again.',
  );
  await expect(name).toHaveValue('Grace Hopper');

  await name.fill('Grace Brewster Hopper');
  await expect(notice).toHaveCount(0);
});

test('stays usable without horizontal overflow on mobile', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await page.goto('/contact');
  const formSection = getFormSection(page);

  await expect(formSection).toBeVisible();
  const checkboxBoxes = await Promise.all(
    ['Direction', 'Design', 'Engineering', 'Not sure yet'].map((name) =>
      formSection.getByRole('checkbox', { name }).boundingBox(),
    ),
  );
  for (const box of checkboxBoxes) {
    expect(box?.width).toBeGreaterThanOrEqual(24);
    expect(box?.height).toBeGreaterThanOrEqual(24);
  }

  const submitBox = await formSection.getByRole('button', { name: 'Send the idea' }).boundingBox();
  expect(submitBox?.height).toBeGreaterThanOrEqual(48);

  const overflow = await page.evaluate(() => ({
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
  }));
  expect(overflow.scrollWidth).toBeLessThanOrEqual(overflow.clientWidth);
});

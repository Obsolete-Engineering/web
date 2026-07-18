import { expect, test } from '@playwright/test';

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

test('submits through the Astro Action with loading and success states', async ({ page }) => {
  let releaseSubmission = () => {};
  const submissionPending = new Promise<void>((resolve) => {
    releaseSubmission = resolve;
  });
  await page.route(/\/_actions\/submitInquiry\/?$/u, async (route) => {
    await submissionPending;
    await route.fulfill({ status: 204 });
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
});

test('preserves the inquiry and shows an error when delivery fails', async ({ page }) => {
  await page.route(/\/_actions\/submitInquiry\/?$/u, async (route) => {
    await route.fulfill({
      status: 502,
      contentType: 'application/json',
      body: JSON.stringify({
        type: 'AstroActionError',
        code: 'BAD_GATEWAY',
        message: 'The inquiry could not be delivered.',
      }),
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

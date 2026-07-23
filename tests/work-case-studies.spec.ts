import { expect, test } from '@playwright/test';

test('lists both published case studies on the work index', async ({ page }) => {
  await page.goto('/work');

  await expect(
    page.getByRole('heading', { level: 1, name: 'Work worth spending time with.' }),
  ).toBeVisible();

  const craftApplied = page.getByRole('link', { name: 'Read case study: Craft Applied' });
  const triggerDev = page.getByRole('link', { name: 'Read case study: Trigger.dev' });

  await expect(craftApplied).toHaveAttribute('href', '/work/craft-applied');
  await expect(triggerDev).toHaveAttribute('href', '/work/trigger-dev');
  await expect(
    triggerDev.getByRole('img', {
      name: /Trigger\.dev homepage.+AI agents and workflows.+dark product interface/iu,
    }),
  ).toBeVisible();
});

test('publishes the Trigger.dev case study with product proof and project actions', async ({
  page,
}) => {
  await page.goto('/work/trigger-dev');

  await expect(page).toHaveTitle('Trigger.dev case study | Obsolete');
  await expect(page.getByRole('heading', { level: 1, name: 'Trigger.dev' })).toBeVisible();
  await expect(
    page.getByText('Complex infrastructure, made approachable.', { exact: true }),
  ).toBeVisible();

  await expect(
    page.getByRole('heading', { level: 2, name: 'Six capabilities. One reliable runtime.' }),
  ).toBeVisible();
  await expect(page.getByRole('heading', { level: 3, name: 'Long-running tasks' })).toBeVisible();
  await expect(page.getByRole('heading', { level: 3, name: 'Observability' })).toBeVisible();
  await expect(
    page.getByRole('heading', { level: 2, name: 'The docs are part of the product.' }),
  ).toBeVisible();

  await expect(
    page.getByRole('link', { name: 'Visit Trigger.dev (external site)' }),
  ).toHaveAttribute('href', 'https://trigger.dev');
  await expect(page.getByRole('link', { name: 'All work' })).toHaveAttribute('href', '/work');
});

test('keeps the Trigger.dev case study within a mobile viewport', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/work/trigger-dev');

  const dimensions = await page.evaluate(() => ({
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
  }));

  expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.clientWidth);
  await expect(
    page.getByRole('img', {
      name: /responsive Trigger\.dev homepage.+mobile screen/iu,
    }),
  ).toBeVisible();
});

test('reflows the Trigger.dev case study when text is resized to 200%', async ({ page }) => {
  await page.setViewportSize({ width: 640, height: 900 });
  await page.goto('/work/trigger-dev');
  await page.addStyleTag({ content: 'html { font-size: 200% !important; }' });

  const dimensions = await page.evaluate(() => ({
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
  }));

  expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.clientWidth);
});

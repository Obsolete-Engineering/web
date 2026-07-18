import { expect, test, type Page } from '@playwright/test';

const invitationTitle = 'Bring us the idea you cannot stop thinking about.';
const minimumTitleWidthRatio = 0.52;
const maximumTitleWidthRatio = 0.58;

const getContactStage = (page: Page) =>
  page.getByRole('region', {
    name: invitationTitle,
  });

const getSculpture = (page: Page) => page.locator('[data-contact-sculpture]');

test('stages the invitation and static sculpture together on supported desktops', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('/');

  const contact = getContactStage(page);
  const upperStage = contact.locator('[data-contact-upper-stage]');
  const heading = contact.getByRole('heading', { level: 2, name: invitationTitle });
  const sculpture = getSculpture(page);

  await contact.scrollIntoViewIfNeeded();
  await expect(heading).toBeVisible();
  await expect(sculpture).toBeVisible();
  await expect(sculpture).toHaveAttribute('aria-hidden', 'true');
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

test('keeps the existing text-led inquiry flow on smaller viewports', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');

  const contact = getContactStage(page);
  const sculpture = getSculpture(page);

  await contact.scrollIntoViewIfNeeded();
  await expect(sculpture).toBeHidden();
  await expect(sculpture).toHaveCSS('display', 'none');

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
  await expect(sculpture).toHaveCSS('animation-duration', '0s');
  await expect(sculpture).toHaveCSS('transition-duration', '0s');
  await expect(sculpture).toHaveCSS('pointer-events', 'none');
});

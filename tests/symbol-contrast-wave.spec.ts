import { expect, test, type Page } from '@playwright/test';

import { HERO_CEREMONY_SESSION_KEY } from '../src/scripts/hero-ceremony';

type ContrastWaveMetrics = {
  changedPercent: number;
  maximumDelta: number;
  meanDelta: number;
};

const installContrastWaveControl = (page: Page) =>
  page.addInitScript(
    ({ ceremonySessionKey }) => {
      const state = window as typeof window & { contrastWavePhaseOverride: number };
      const uniformNames = new WeakMap<WebGLUniformLocation, string>();
      window.sessionStorage.setItem(ceremonySessionKey, 'true');
      state.contrastWavePhaseOverride = 0.95;

      for (const prototype of [WebGLRenderingContext.prototype, WebGL2RenderingContext.prototype]) {
        const getUniformLocation = prototype.getUniformLocation;
        const uniform1f = prototype.uniform1f;
        Object.defineProperty(prototype, 'getUniformLocation', {
          configurable: true,
          value(this: WebGLRenderingContext, program: WebGLProgram, name: string) {
            const location = Reflect.apply(getUniformLocation, this, [
              program,
              name,
            ]) as WebGLUniformLocation | null;
            if (location) uniformNames.set(location, name);
            return location;
          },
        });
        Object.defineProperty(prototype, 'uniform1f', {
          configurable: true,
          value(this: WebGLRenderingContext, location: WebGLUniformLocation | null, value: number) {
            const name = location ? uniformNames.get(location) : undefined;
            if (name === 'uContrastWavePhase') value = state.contrastWavePhaseOverride;
            if (name === 'uTime') value = 42;
            return Reflect.apply(uniform1f, this, [location, value]);
          },
        });
      }
    },
    { ceremonySessionKey: HERO_CEREMONY_SESSION_KEY },
  );

const setContrastWavePhase = (page: Page, phase: number) =>
  page.evaluate((nextPhase) => {
    (window as typeof window & { contrastWavePhaseOverride: number }).contrastWavePhaseOverride =
      nextPhase;
  }, phase);

const compareScreenshots = (
  page: Page,
  first: Uint8Array,
  second: Uint8Array,
): Promise<ContrastWaveMetrics> =>
  page.evaluate(
    async ([firstEncoded, secondEncoded]) => {
      const decode = async (encoded: string) => {
        const response = await fetch(`data:image/png;base64,${encoded}`);
        const bitmap = await createImageBitmap(await response.blob());
        const canvas = document.createElement('canvas');
        canvas.width = bitmap.width;
        canvas.height = bitmap.height;
        const context = canvas.getContext('2d');
        if (!context) throw new Error('Contrast-wave comparison canvas is unavailable.');
        context.drawImage(bitmap, 0, 0);
        bitmap.close();
        return context.getImageData(0, 0, canvas.width, canvas.height).data;
      };
      const [firstPixels, secondPixels] = await Promise.all([
        decode(firstEncoded),
        decode(secondEncoded),
      ]);
      let changed = 0;
      let maximumDelta = 0;
      let totalDelta = 0;
      const pixelCount = firstPixels.length / 4;

      for (let index = 0; index < firstPixels.length; index += 4) {
        const delta =
          (Math.abs(firstPixels[index] - secondPixels[index]) +
            Math.abs(firstPixels[index + 1] - secondPixels[index + 1]) +
            Math.abs(firstPixels[index + 2] - secondPixels[index + 2])) /
          3;
        if (delta >= 2) changed += 1;
        maximumDelta = Math.max(maximumDelta, delta);
        totalDelta += delta;
      }

      return {
        changedPercent: (changed / pixelCount) * 100,
        maximumDelta,
        meanDelta: totalDelta / pixelCount,
      };
    },
    [Buffer.from(first).toString('base64'), Buffer.from(second).toString('base64')],
  );

for (const viewport of [
  { height: 900, minimumMaximumDelta: 8, minimumMeanDelta: 0.08, name: 'desktop', width: 1440 },
  { height: 844, minimumMaximumDelta: 6, minimumMeanDelta: 0.055, name: 'mobile', width: 390 },
]) {
  test(`renders a visible ${viewport.name} contrast crest and recovers to baseline`, async ({
    page,
  }) => {
    await installContrastWaveControl(page);
    await page.setViewportSize(viewport);
    await page.goto('/');

    const hero = page.locator('[data-fluid-hero]');
    const canvas = hero.locator('[data-fluid-canvas]');
    await expect(hero).toHaveAttribute('data-fluid-state', 'live');
    await expect(hero).toHaveAttribute('data-ceremony-state', 'skipped');
    await page.waitForTimeout(100);

    const baseline = await canvas.screenshot();
    await setContrastWavePhase(page, 0.45);
    await page.waitForTimeout(80);
    const crest = await canvas.screenshot();
    await setContrastWavePhase(page, 0.95);
    await page.waitForTimeout(80);
    const recovered = await canvas.screenshot();

    const crestMetrics = await compareScreenshots(page, baseline, crest);
    expect(crestMetrics.maximumDelta).toBeGreaterThan(viewport.minimumMaximumDelta);
    expect(crestMetrics.meanDelta).toBeGreaterThan(viewport.minimumMeanDelta);
    expect(crestMetrics.changedPercent).toBeGreaterThan(1);

    const recoveryMetrics = await compareScreenshots(page, baseline, recovered);
    expect(recoveryMetrics.maximumDelta).toBeLessThan(1);
    expect(recoveryMetrics.meanDelta).toBeLessThan(0.01);
  });
}

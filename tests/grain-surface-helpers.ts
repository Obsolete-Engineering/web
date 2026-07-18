import { expect, type Locator, type Page } from '@playwright/test';

export type GrainSurfaceName = 'capabilities' | 'contact' | 'hero' | 'pricing';
export type GrainFailure = 'shader initialization' | 'unsupported WebGL';

type GrainMetrics = Record<GrainSurfaceName, number>;

export const installGrainDrawTrace = (page: Page) =>
  page.addInitScript(() => {
    const state = window as typeof window & { grainSurfaceDraws: GrainMetrics };
    state.grainSurfaceDraws = { capabilities: 0, contact: 0, hero: 0, pricing: 0 };

    for (const prototype of [WebGLRenderingContext.prototype, WebGL2RenderingContext.prototype]) {
      const drawArrays = prototype.drawArrays;
      Object.defineProperty(prototype, 'drawArrays', {
        configurable: true,
        value(this: WebGLRenderingContext, ...arguments_: unknown[]) {
          const canvas = this.canvas;
          let target: GrainSurfaceName = 'hero';
          if (canvas instanceof HTMLCanvasElement) {
            if (canvas.closest('[data-capabilities-grain]')) target = 'capabilities';
            else if (canvas.closest('.contact-form')) target = 'contact';
            else if (canvas.closest('[data-pricing-grain]')) target = 'pricing';
          }
          state.grainSurfaceDraws[target] += 1;
          return Reflect.apply(drawArrays, this, arguments_);
        },
      });
    }
  });

export const resetGrainDrawTrace = (page: Page) =>
  page.evaluate(() => {
    const state = window as typeof window & { grainSurfaceDraws: GrainMetrics };
    state.grainSurfaceDraws = { capabilities: 0, contact: 0, hero: 0, pricing: 0 };
  });

export const readGrainDrawTrace = (page: Page) =>
  page.evaluate(
    () =>
      (window as typeof window & { grainSurfaceDraws: GrainMetrics }).grainSurfaceDraws ?? {
        capabilities: 0,
        contact: 0,
        hero: 0,
        pricing: 0,
      },
  );

export const installGrainContextRequestTrace = (page: Page) =>
  page.addInitScript(() => {
    const getContext = HTMLCanvasElement.prototype.getContext;
    Object.assign(window, { grainSurfaceContextRequests: 0 });
    Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
      configurable: true,
      value(this: HTMLCanvasElement, type: string, ...attributes: unknown[]) {
        if (this.matches('[data-grain-canvas]') && type.includes('webgl')) {
          (
            window as typeof window & { grainSurfaceContextRequests: number }
          ).grainSurfaceContextRequests += 1;
        }
        return Reflect.apply(getContext, this, [type, ...attributes]);
      },
    });
  });

export const readGrainContextRequests = (page: Page) =>
  page.evaluate(
    () =>
      (window as typeof window & { grainSurfaceContextRequests: number })
        .grainSurfaceContextRequests,
  );

export const installGrainFailure = (page: Page, failure: GrainFailure) =>
  page.addInitScript((selectedFailure) => {
    if (selectedFailure === 'unsupported WebGL') {
      const getContext = HTMLCanvasElement.prototype.getContext;
      Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
        configurable: true,
        value(this: HTMLCanvasElement, type: string, ...attributes: unknown[]) {
          if (this.matches('[data-grain-canvas]') && type.includes('webgl')) return null;
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
          if (
            this.canvas instanceof HTMLCanvasElement &&
            this.canvas.matches('[data-grain-canvas]') &&
            parameter === this.LINK_STATUS
          ) {
            return false;
          }
          return Reflect.apply(getProgramParameter, this, [program, parameter]);
        },
      });
    }
  }, failure);

export const expectCanvasToCoverSurface = async (surface: Locator) => {
  const [surfaceBox, canvasBox] = await Promise.all([
    surface.boundingBox(),
    surface.locator('[data-grain-canvas]').boundingBox(),
  ]);
  if (!surfaceBox || !canvasBox) throw new Error('The grain surface geometry is unavailable.');
  for (const property of ['x', 'y', 'width', 'height'] as const) {
    expect(Math.abs(surfaceBox[property] - canvasBox[property])).toBeLessThanOrEqual(1);
  }
};

export const analyzeGrainFrames = (page: Page, first: Uint8Array, second: Uint8Array) =>
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

export const assertWarmMonochromeGrain = (
  analysis: Awaited<ReturnType<typeof analyzeGrainFrames>>,
) => {
  expect(analysis.difference).toBeGreaterThan(0.4);
  expect(analysis.difference).toBeLessThan(12);
  expect(analysis.spread).toBeGreaterThan(1.5);
  expect(analysis.spread).toBeLessThan(10);
  expect(analysis.channels[0]).toBeGreaterThan(analysis.channels[1]);
  expect(analysis.channels[1]).toBeGreaterThan(analysis.channels[2]);
};

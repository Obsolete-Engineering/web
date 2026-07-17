import {
  Mesh,
  Program,
  Renderer,
  RenderTarget,
  Texture,
  Triangle,
  type OGLRenderingContext,
} from 'ogl';

import {
  advectionFragment,
  displayFragment,
  divergenceFragment,
  fullscreenVertex,
  gradientFragment,
  injectionFragment,
  pressureFragment,
} from './fluid-shaders';

type QualityTier = {
  dprCap: number;
  dyeResolution: number;
  name: 'high' | 'low' | 'medium';
  pressureIterations: number;
  simulationResolution: number;
};

type DoubleTarget = {
  read: RenderTarget;
  swap: () => void;
  write: RenderTarget;
};

type FluidTargets = {
  divergence: RenderTarget;
  dye: DoubleTarget;
  pressure: DoubleTarget;
  velocity: DoubleTarget;
};

type Pass = {
  mesh: Mesh;
  program: Program;
};

type TextureFormat = {
  format: GLenum;
  internalFormat: GLenum;
  type: GLenum;
};

const QUALITY_TIERS: readonly QualityTier[] = [
  {
    name: 'high',
    dprCap: 2,
    simulationResolution: 128,
    dyeResolution: 256,
    pressureIterations: 12,
  },
  {
    name: 'medium',
    dprCap: 1.5,
    simulationResolution: 96,
    dyeResolution: 192,
    pressureIterations: 8,
  },
  {
    name: 'low',
    dprCap: 0.75,
    simulationResolution: 64,
    dyeResolution: 128,
    pressureIterations: 5,
  },
];

const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';
const FINE_POINTER_QUERY = '(hover: hover) and (pointer: fine)';
const MOBILE_QUERY = '(max-width: 700px), (pointer: coarse)';
const MAX_DELTA_SECONDS = 1 / 60;
const QUALITY_SAMPLE_FRAMES = 60;
const QUALITY_COOLDOWN_FRAMES = 120;

const createDoubleTarget = (createTarget: () => RenderTarget): DoubleTarget => {
  const target = {
    read: createTarget(),
    write: createTarget(),
    swap() {
      [target.read, target.write] = [target.write, target.read];
    },
  };
  return target;
};

const hasWebGlContext = (canvas: HTMLCanvasElement) => {
  const attributes: WebGLContextAttributes = {
    alpha: false,
    antialias: false,
    depth: false,
    powerPreference: 'high-performance',
    premultipliedAlpha: false,
    preserveDrawingBuffer: false,
    stencil: false,
  };
  return Boolean(canvas.getContext('webgl2', attributes) ?? canvas.getContext('webgl', attributes));
};

const getTextureFormat = (gl: OGLRenderingContext): TextureFormat => {
  if (gl.renderer.isWebgl2) {
    if (!gl.getExtension('EXT_color_buffer_float')) {
      throw new Error('Floating-point render targets are unavailable.');
    }
    const gl2 = gl as WebGL2RenderingContext;
    return { format: gl.RGBA, internalFormat: gl2.RGBA16F, type: gl2.HALF_FLOAT };
  }

  const halfFloat = gl.getExtension('OES_texture_half_float') as {
    HALF_FLOAT_OES: GLenum;
  } | null;
  if (!halfFloat || !gl.getExtension('EXT_color_buffer_half_float')) {
    throw new Error('Half-floating-point render targets are unavailable.');
  }
  return { format: gl.RGBA, internalFormat: gl.RGBA, type: halfFloat.HALF_FLOAT_OES };
};

const createProgram = (
  gl: OGLRenderingContext,
  fragment: string,
  uniforms: Record<string, { value: unknown }>,
) => {
  const program = new Program(gl, {
    cullFace: false,
    depthTest: false,
    depthWrite: false,
    fragment,
    uniforms,
    vertex: fullscreenVertex,
  });
  if (!gl.getProgramParameter(program.program, gl.LINK_STATUS)) {
    program.remove();
    throw new Error('A fluid shader failed to compile.');
  }
  return program;
};

const createPass = (
  gl: OGLRenderingContext,
  geometry: Triangle,
  fragment: string,
  uniforms: Record<string, { value: unknown }>,
): Pass => {
  const program = createProgram(gl, fragment, uniforms);
  return { mesh: new Mesh(gl, { geometry, program }), program };
};

const setUniform = (pass: Pass, name: string, value: unknown) => {
  pass.program.uniforms[name].value = value;
};

class FluidEngine {
  private readonly canvas: HTMLCanvasElement;
  private readonly geometry: Triangle;
  private readonly gl: OGLRenderingContext;
  private readonly hero: HTMLElement;
  private readonly maskCanvas = document.createElement('canvas');
  private readonly maskTexture: Texture;
  private readonly onReady: () => void;
  private readonly passes: Record<string, Pass>;
  private readonly renderer: Renderer;
  private readonly resizeObserver: ResizeObserver;
  private readonly textSource: HTMLElement;
  private readonly textureFormat: TextureFormat;

  private disposed = false;
  private elapsedTime = 0;
  private frame: number | undefined;
  private frameCount = 0;
  private frameTimeTotal = 0;
  private isDocumentVisible = document.visibilityState === 'visible';
  private isHeroVisible = true;
  private isSharedPaused = false;
  private lastFrameTime = 0;
  private pointer = [0.5, 0.5];
  private pointerActive = 0;
  private qualityCooldown = 0;
  private qualityIndex: number;
  private targets: FluidTargets | undefined;
  private warmupFrames = 0;

  constructor(
    hero: HTMLElement,
    canvas: HTMLCanvasElement,
    textSource: HTMLElement,
    onReady: () => void,
  ) {
    this.hero = hero;
    this.canvas = canvas;
    this.textSource = textSource;
    this.onReady = onReady;
    this.qualityIndex = window.matchMedia(MOBILE_QUERY).matches ? 1 : 0;
    this.renderer = new Renderer({
      alpha: false,
      antialias: false,
      canvas,
      depth: false,
      dpr: Math.min(window.devicePixelRatio || 1, QUALITY_TIERS[this.qualityIndex].dprCap),
      powerPreference: 'high-performance',
      premultipliedAlpha: false,
      stencil: false,
      webgl: 2,
    });
    this.gl = this.renderer.gl;
    this.textureFormat = getTextureFormat(this.gl);
    this.geometry = new Triangle(this.gl);
    this.maskTexture = new Texture(this.gl, {
      flipY: true,
      generateMipmaps: false,
      image: this.maskCanvas,
      magFilter: this.gl.LINEAR,
      minFilter: this.gl.LINEAR,
    });
    this.passes = this.createPasses();
    this.resizeObserver = new ResizeObserver(this.handleResize);
  }

  initialize() {
    this.rebuildTargets();
    this.resizeObserver.observe(this.hero);
    this.hero.dataset.fluidQuality = QUALITY_TIERS[this.qualityIndex].name;
    void document.fonts?.ready.then(this.drawTextMask);
    this.startLoop();
  }

  setDocumentVisible(isVisible: boolean) {
    this.isDocumentVisible = isVisible;
    this.syncLoop();
  }

  setHeroVisible(isVisible: boolean) {
    this.isHeroVisible = isVisible;
    this.syncLoop();
  }

  setPointer(x: number, y: number, active: boolean) {
    this.pointer[0] += (x - this.pointer[0]) * 0.38;
    this.pointer[1] += (y - this.pointer[1]) * 0.38;
    this.pointerActive = active ? 1 : 0;
  }

  setSharedPaused(isPaused: boolean) {
    this.isSharedPaused = isPaused;
    this.syncLoop();
  }

  dispose() {
    if (this.disposed) return;
    this.disposed = true;
    if (this.frame !== undefined) cancelAnimationFrame(this.frame);
    this.frame = undefined;
    this.resizeObserver.disconnect();
    this.disposeTargets();
    for (const pass of Object.values(this.passes)) pass.program.remove();
    this.geometry.remove();
    this.gl.deleteTexture(this.maskTexture.texture);
  }

  private readonly createPasses = () => ({
    advection: createPass(this.gl, this.geometry, advectionFragment, {
      uDelta: { value: 1 },
      uDissipation: { value: 0.99 },
      uSource: { value: null },
      uTexelSize: { value: [1, 1] },
      uVelocity: { value: null },
    }),
    display: createPass(this.gl, this.geometry, displayFragment, {
      uDye: { value: null },
      uPointer: { value: this.pointer },
      uPointerActive: { value: 0 },
      uResolution: { value: [1, 1] },
      uTextMask: { value: this.maskTexture },
      uTime: { value: 0 },
    }),
    divergence: createPass(this.gl, this.geometry, divergenceFragment, {
      uTexelSize: { value: [1, 1] },
      uVelocity: { value: null },
    }),
    gradient: createPass(this.gl, this.geometry, gradientFragment, {
      uPressure: { value: null },
      uTexelSize: { value: [1, 1] },
      uVelocity: { value: null },
    }),
    injection: createPass(this.gl, this.geometry, injectionFragment, {
      uAspect: { value: 1 },
      uPoint: { value: [0.5, 0.5] },
      uRadius: { value: 0.02 },
      uTarget: { value: null },
      uValue: { value: [0, 0, 0] },
    }),
    pressure: createPass(this.gl, this.geometry, pressureFragment, {
      uDivergence: { value: null },
      uPressure: { value: null },
      uTexelSize: { value: [1, 1] },
    }),
  });

  private readonly createTarget = (width: number, height: number) => {
    const target = new RenderTarget(this.gl, {
      depth: false,
      format: this.textureFormat.format,
      height,
      internalFormat: this.textureFormat.internalFormat,
      magFilter: this.gl.NEAREST,
      minFilter: this.gl.NEAREST,
      stencil: false,
      type: this.textureFormat.type,
      width,
    });
    this.renderer.bindFramebuffer(target);
    const status = this.gl.checkFramebufferStatus(this.gl.FRAMEBUFFER);
    this.renderer.bindFramebuffer();
    if (status !== this.gl.FRAMEBUFFER_COMPLETE) {
      this.deleteTarget(target);
      throw new Error('The fluid framebuffer is incomplete.');
    }
    this.clearTarget(target);
    return target;
  };

  private readonly deleteTarget = (target: RenderTarget) => {
    for (const texture of target.textures) this.gl.deleteTexture(texture.texture);
    this.gl.deleteFramebuffer(target.buffer);
  };

  private clearTarget(target: RenderTarget) {
    this.renderer.bindFramebuffer(target);
    this.gl.clearColor(0, 0, 0, 1);
    this.gl.clear(this.gl.COLOR_BUFFER_BIT);
    this.renderer.bindFramebuffer();
  }

  private rebuildTargets() {
    this.disposeTargets();
    const quality = QUALITY_TIERS[this.qualityIndex];
    this.renderer.dpr = Math.min(window.devicePixelRatio || 1, quality.dprCap);
    const aspect = Math.min(Math.max(this.hero.clientWidth / this.hero.clientHeight, 0.7), 2.2);
    const simulationWidth = Math.round(quality.simulationResolution * aspect);
    const dyeWidth = Math.round(quality.dyeResolution * aspect);
    const createSimulationTarget = () =>
      this.createTarget(simulationWidth, quality.simulationResolution);
    const createDyeTarget = () => this.createTarget(dyeWidth, quality.dyeResolution);
    this.targets = {
      divergence: createSimulationTarget(),
      dye: createDoubleTarget(createDyeTarget),
      pressure: createDoubleTarget(createSimulationTarget),
      velocity: createDoubleTarget(createSimulationTarget),
    };
    this.handleResize();
  }

  private disposeTargets() {
    if (!this.targets) return;
    const targets = new Set([
      this.targets.divergence,
      this.targets.dye.read,
      this.targets.dye.write,
      this.targets.pressure.read,
      this.targets.pressure.write,
      this.targets.velocity.read,
      this.targets.velocity.write,
    ]);
    for (const target of targets) this.deleteTarget(target);
    this.targets = undefined;
  }

  private readonly drawTextMask = () => {
    if (this.disposed) return;
    const width = this.canvas.width;
    const height = this.canvas.height;
    if (width < 1 || height < 1) return;
    this.maskCanvas.width = width;
    this.maskCanvas.height = height;
    const context = this.maskCanvas.getContext('2d');
    if (!context) return;

    const heroBounds = this.hero.getBoundingClientRect();
    const scaleX = width / heroBounds.width;
    const scaleY = height / heroBounds.height;
    context.clearRect(0, 0, width, height);
    context.fillStyle = '#ffffff';
    context.textAlign = 'center';
    context.textBaseline = 'middle';

    const lines = this.textSource.querySelectorAll<HTMLElement>('h1 .hero__title-line');
    for (const line of lines) {
      const bounds = line.getBoundingClientRect();
      const style = getComputedStyle(line);
      context.font = `${style.fontWeight} ${Number(style.fontSize.replace('px', '')) * scaleY}px ${style.fontFamily}`;
      context.fillText(
        line.textContent?.trim() ?? '',
        (bounds.left - heroBounds.left + bounds.width / 2) * scaleX,
        (bounds.top - heroBounds.top + bounds.height / 2) * scaleY,
        bounds.width * scaleX,
      );
    }
    this.maskTexture.image = this.maskCanvas;
    this.maskTexture.needsUpdate = true;
  };

  private readonly handleResize = () => {
    if (this.disposed) return;
    const width = Math.max(this.hero.clientWidth, 1);
    const height = Math.max(this.hero.clientHeight, 1);
    this.renderer.setSize(width, height);
    setUniform(this.passes.display, 'uResolution', [this.canvas.width, this.canvas.height]);
    this.drawTextMask();
  };

  private renderPass(pass: Pass, target?: RenderTarget) {
    this.renderer.render({ clear: false, scene: pass.mesh, target });
  }

  private inject(target: DoubleTarget, point: number[], value: number[], radius: number) {
    const pass = this.passes.injection;
    setUniform(pass, 'uAspect', target.read.width / target.read.height);
    setUniform(pass, 'uPoint', point);
    setUniform(pass, 'uRadius', radius);
    setUniform(pass, 'uTarget', target.read.texture);
    setUniform(pass, 'uValue', value);
    this.renderPass(pass, target.write);
    target.swap();
  }

  private step(delta: number, elapsedTime: number) {
    const targets = this.targets;
    if (!targets) return;
    const velocityTexel = [1 / targets.velocity.read.width, 1 / targets.velocity.read.height];
    const dyeTexel = [1 / targets.dye.read.width, 1 / targets.dye.read.height];
    const normalizedDelta = delta / MAX_DELTA_SECONDS;

    const advection = this.passes.advection;
    setUniform(advection, 'uDelta', normalizedDelta);
    setUniform(advection, 'uDissipation', 0.986);
    setUniform(advection, 'uSource', targets.velocity.read.texture);
    setUniform(advection, 'uTexelSize', velocityTexel);
    setUniform(advection, 'uVelocity', targets.velocity.read.texture);
    this.renderPass(advection, targets.velocity.write);
    targets.velocity.swap();

    setUniform(advection, 'uDissipation', 0.994);
    setUniform(advection, 'uSource', targets.dye.read.texture);
    setUniform(advection, 'uTexelSize', dyeTexel);
    setUniform(advection, 'uVelocity', targets.velocity.read.texture);
    this.renderPass(advection, targets.dye.write);
    targets.dye.swap();

    const phase = elapsedTime * 0.11;
    const firstPoint = [0.17 + Math.sin(phase * 0.83) * 0.08, 0.66 + Math.cos(phase) * 0.2];
    const secondPoint = [0.83 + Math.cos(phase * 0.71) * 0.07, 0.34 + Math.sin(phase) * 0.21];
    this.inject(
      targets.velocity,
      firstPoint,
      [Math.cos(phase) * 0.36, Math.sin(phase * 0.87) * 0.28, 0],
      0.018,
    );
    this.inject(
      targets.velocity,
      secondPoint,
      [-Math.sin(phase * 0.9) * 0.32, Math.cos(phase * 0.72) * 0.26, 0],
      0.02,
    );
    this.inject(targets.dye, firstPoint, [0.017, 0.0022, 0.0012], 0.034);
    this.inject(targets.dye, secondPoint, [0.01, 0.0015, 0.0032], 0.038);

    const divergence = this.passes.divergence;
    setUniform(divergence, 'uTexelSize', velocityTexel);
    setUniform(divergence, 'uVelocity', targets.velocity.read.texture);
    this.renderPass(divergence, targets.divergence);

    const pressure = this.passes.pressure;
    setUniform(pressure, 'uDivergence', targets.divergence.texture);
    setUniform(pressure, 'uTexelSize', velocityTexel);
    for (
      let iteration = 0;
      iteration < QUALITY_TIERS[this.qualityIndex].pressureIterations;
      iteration += 1
    ) {
      setUniform(pressure, 'uPressure', targets.pressure.read.texture);
      this.renderPass(pressure, targets.pressure.write);
      targets.pressure.swap();
    }

    const gradient = this.passes.gradient;
    setUniform(gradient, 'uPressure', targets.pressure.read.texture);
    setUniform(gradient, 'uTexelSize', velocityTexel);
    setUniform(gradient, 'uVelocity', targets.velocity.read.texture);
    this.renderPass(gradient, targets.velocity.write);
    targets.velocity.swap();

    const display = this.passes.display;
    setUniform(display, 'uDye', targets.dye.read.texture);
    setUniform(display, 'uPointer', this.pointer);
    setUniform(display, 'uPointerActive', this.pointerActive);
    setUniform(display, 'uTime', elapsedTime);
    this.renderPass(display);
  }

  private adaptQuality(frameDuration: number) {
    this.frameCount += 1;
    this.frameTimeTotal += frameDuration;
    if (this.qualityCooldown > 0) this.qualityCooldown -= 1;
    if (this.frameCount < QUALITY_SAMPLE_FRAMES) return;

    const averageFrameTime = this.frameTimeTotal / this.frameCount;
    const frameBudget = window.matchMedia(MOBILE_QUERY).matches ? 32 : 21;
    this.frameCount = 0;
    this.frameTimeTotal = 0;
    if (
      averageFrameTime <= frameBudget ||
      this.qualityCooldown > 0 ||
      this.qualityIndex >= QUALITY_TIERS.length - 1
    ) {
      return;
    }

    this.qualityIndex += 1;
    this.qualityCooldown = QUALITY_COOLDOWN_FRAMES;
    this.hero.dataset.fluidQuality = QUALITY_TIERS[this.qualityIndex].name;
    this.rebuildTargets();
  }

  private readonly tick = (time: number) => {
    if (this.disposed) return;
    const frameDuration = this.lastFrameTime === 0 ? 16.7 : time - this.lastFrameTime;
    const delta = Math.min(Math.max(frameDuration / 1000, 0), MAX_DELTA_SECONDS);
    this.lastFrameTime = time;
    this.elapsedTime += delta;
    this.step(delta, this.elapsedTime);
    this.adaptQuality(frameDuration);
    if (this.warmupFrames < 3) {
      this.warmupFrames += 1;
      if (this.warmupFrames === 3) this.onReady();
    }
    this.frame = requestAnimationFrame(this.tick);
  };

  private startLoop() {
    if (this.frame !== undefined || this.disposed) return;
    this.lastFrameTime = 0;
    this.frame = requestAnimationFrame(this.tick);
  }

  private syncLoop() {
    if (this.isDocumentVisible && this.isHeroVisible && !this.isSharedPaused) {
      this.startLoop();
      return;
    }
    if (this.frame !== undefined) cancelAnimationFrame(this.frame);
    this.frame = undefined;
    this.lastFrameTime = 0;
  }
}

export const mountFluidHero = (root: HTMLElement) => {
  const canvas = root.querySelector<HTMLCanvasElement>('[data-fluid-canvas]');
  const textSource = root.querySelector<HTMLElement>('[data-fluid-title-source]');
  if (!canvas || !textSource) return () => {};

  const controller = new AbortController();
  const reducedMotion = window.matchMedia(REDUCED_MOTION_QUERY);
  const finePointer = window.matchMedia(FINE_POINTER_QUERY);
  let engine: FluidEngine | undefined;
  let disposed = false;

  const showFallback = (state: 'fallback' | 'static') => {
    root.dataset.fluidState = state;
    root.toggleAttribute('data-fluid-pointer-active', false);
    root.toggleAttribute('data-fluid-pointer-control', false);
    root.toggleAttribute('data-fluid-title-active', false);
  };

  const start = () => {
    if (disposed || reducedMotion.matches || engine) return;
    if (!hasWebGlContext(canvas)) {
      showFallback('fallback');
      return;
    }

    let candidate: FluidEngine | undefined;
    try {
      candidate = new FluidEngine(root, canvas, textSource, () => {
        if (!disposed && !reducedMotion.matches) root.dataset.fluidState = 'live';
      });
      candidate.initialize();
      engine = candidate;
    } catch {
      candidate?.dispose();
      showFallback('fallback');
    }
  };

  const stop = (state: 'fallback' | 'static') => {
    engine?.dispose();
    engine = undefined;
    showFallback(state);
  };

  const handleMotionPreference = () => {
    if (reducedMotion.matches) {
      stop('static');
    } else {
      root.dataset.fluidState = 'poster';
      start();
    }
  };

  const handlePointerMove = (event: PointerEvent) => {
    if (!finePointer.matches || reducedMotion.matches) return;
    const bounds = root.getBoundingClientRect();
    const x = Math.min(Math.max(event.clientX - bounds.left, 0), bounds.width);
    const y = Math.min(Math.max(event.clientY - bounds.top, 0), bounds.height);
    const target = event.target instanceof Element ? event.target : null;
    const overControl = Boolean(
      target?.closest('a, button, input, select, textarea, [role="button"]'),
    );
    root.style.setProperty('--fluid-pointer-x', `${x}px`);
    root.style.setProperty('--fluid-pointer-y', `${y}px`);
    root.toggleAttribute('data-fluid-pointer-active', !overControl);
    root.toggleAttribute('data-fluid-pointer-control', overControl);
    engine?.setPointer(x / bounds.width, 1 - y / bounds.height, !overControl);

    const titleBounds = textSource.getBoundingClientRect();
    const overTitle =
      !overControl &&
      event.clientX >= titleBounds.left &&
      event.clientX <= titleBounds.right &&
      event.clientY >= titleBounds.top &&
      event.clientY <= titleBounds.bottom;
    root.toggleAttribute('data-fluid-title-active', overTitle);
    if (overTitle) {
      root.style.setProperty('--fluid-title-x', `${event.clientX - titleBounds.left}px`);
      root.style.setProperty('--fluid-title-y', `${event.clientY - titleBounds.top}px`);
    }
  };

  const handlePointerLeave = () => {
    root.toggleAttribute('data-fluid-pointer-active', false);
    root.toggleAttribute('data-fluid-pointer-control', false);
    root.toggleAttribute('data-fluid-title-active', false);
    engine?.setPointer(0.5, 0.5, false);
  };

  const handleVisibility = () => engine?.setDocumentVisible(document.visibilityState === 'visible');
  const handleSharedPause = (event: Event) => {
    const detail =
      event instanceof CustomEvent ? (event.detail as { paused?: unknown }) : undefined;
    engine?.setSharedPaused(detail?.paused === true);
  };
  const handleContextLost = (event: Event) => {
    event.preventDefault();
    stop('fallback');
  };
  const handleContextRestored = () => {
    if (!reducedMotion.matches) start();
  };

  const intersectionObserver = new IntersectionObserver(
    ([entry]) => engine?.setHeroVisible(Boolean(entry?.isIntersecting)),
    { rootMargin: '80px 0px', threshold: [0, 0.01] },
  );
  intersectionObserver.observe(root);

  reducedMotion.addEventListener('change', handleMotionPreference, { signal: controller.signal });
  root.addEventListener('pointermove', handlePointerMove, {
    passive: true,
    signal: controller.signal,
  });
  root.addEventListener('pointerleave', handlePointerLeave, { signal: controller.signal });
  canvas.addEventListener('webglcontextlost', handleContextLost, { signal: controller.signal });
  canvas.addEventListener('webglcontextrestored', handleContextRestored, {
    signal: controller.signal,
  });
  document.addEventListener('visibilitychange', handleVisibility, { signal: controller.signal });
  document.addEventListener('home-motion-pause', handleSharedPause, { signal: controller.signal });

  handleMotionPreference();

  return () => {
    if (disposed) return;
    disposed = true;
    controller.abort();
    intersectionObserver.disconnect();
    engine?.dispose();
    engine = undefined;
    root.toggleAttribute('data-fluid-pointer-active', false);
    root.toggleAttribute('data-fluid-pointer-control', false);
    root.toggleAttribute('data-fluid-title-active', false);
  };
};

import { Mesh, Program, Renderer, RenderTarget, Triangle, type OGLRenderingContext } from 'ogl';

import {
  advectionFragment,
  displayFragment,
  divergenceFragment,
  fullscreenVertex,
  gradientFragment,
  injectionFragment,
  pressureFragment,
} from './fluid-shaders';
import { createHeroCeremony, type HeroCeremonyFrame } from './hero-ceremony';

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
  supportsLinearFiltering: boolean;
  type: GLenum;
};

type FluidSplat = {
  point: [number, number];
  radius: number;
  strength: number;
  velocity: [number, number];
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
const INTERACTIVE_SELECTOR = 'a, button, input, select, textarea, [role="button"]';
const MAX_POINTER_SPEED = 1.8;
const TAP_MOVE_TOLERANCE = 12;
const TAP_TIME_LIMIT = 500;

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
    return {
      format: gl.RGBA,
      internalFormat: gl2.RGBA16F,
      supportsLinearFiltering: Boolean(gl.getExtension('OES_texture_float_linear')),
      type: gl2.HALF_FLOAT,
    };
  }

  const halfFloat = gl.getExtension('OES_texture_half_float') as {
    HALF_FLOAT_OES: GLenum;
  } | null;
  if (!halfFloat || !gl.getExtension('EXT_color_buffer_half_float')) {
    throw new Error('Half-floating-point render targets are unavailable.');
  }
  return {
    format: gl.RGBA,
    internalFormat: gl.RGBA,
    supportsLinearFiltering: Boolean(gl.getExtension('OES_texture_half_float_linear')),
    type: halfFloat.HALF_FLOAT_OES,
  };
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
  private readonly geometry: Triangle;
  private readonly gl: OGLRenderingContext;
  private readonly hero: HTMLElement;
  private readonly onReady: () => void;
  private readonly passes: Record<string, Pass>;
  private readonly pointerDot: HTMLElement;
  private readonly renderer: Renderer;
  private readonly resizeObserver: ResizeObserver;
  private readonly textureFormat: TextureFormat;

  private ceremonySettled = true;
  private disposed = false;
  private elapsedTime = Math.random() * 120;
  private frame: number | undefined;
  private frameCount = 0;
  private frameTimeTotal = 0;
  private isDocumentVisible = document.visibilityState === 'visible';
  private isHeroVisible = true;
  private isSharedPaused = false;
  private lastFrameTime = 0;
  private pendingSplats: FluidSplat[] = [];
  private pointerActive = false;
  private pointerDyeEnabled = true;
  private pointerInitialized = false;
  private pointerPoint: [number, number] = [0.5, 0.5];
  private pointerSpeed = 0;
  private pointerTarget: [number, number] = [0.5, 0.5];
  private qualityCooldown = 0;
  private qualityIndex: number;
  private quietPointerStrength = 0;
  private targetAspect = 1;
  private targets: FluidTargets | undefined;
  private warmupFrames = 0;

  constructor(
    hero: HTMLElement,
    canvas: HTMLCanvasElement,
    initialCeremonyFrame: HeroCeremonyFrame,
    onReady: () => void,
  ) {
    const pointerDot = hero.querySelector<HTMLElement>('[data-fluid-pointer-dot]');
    if (!pointerDot) throw new Error('The fluid pointer dot is unavailable.');
    this.hero = hero;
    this.pointerDot = pointerDot;
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
    this.passes = this.createPasses();
    this.setCeremonyFrame(initialCeremonyFrame);
    this.resizeObserver = new ResizeObserver(this.handleResize);
  }

  initialize() {
    this.rebuildTargets();
    this.resizeObserver.observe(this.hero);
    this.hero.dataset.fluidQuality = QUALITY_TIERS[this.qualityIndex].name;
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

  injectSplat(splat: FluidSplat) {
    if (this.pendingSplats.length >= 32) this.pendingSplats.shift();
    this.pendingSplats.push(splat);
  }

  setCeremonyFrame(frame: HeroCeremonyFrame) {
    this.ceremonySettled = frame.progress >= 1;
    setUniform(this.passes.display, 'uCeremonyImpulse', frame.impulse);
    setUniform(this.passes.display, 'uCeremonyIntensity', frame.intensity);
    setUniform(this.passes.display, 'uCeremonyProgress', frame.progress);
  }

  setCeremonyOrigin(point: [number, number]) {
    setUniform(this.passes.display, 'uCeremonyOrigin', point);
  }

  setPointerTarget(point: [number, number], speed: number, allowDye: boolean) {
    if (!this.pointerInitialized) {
      this.pointerPoint = [...point];
      this.pointerInitialized = true;
    }
    this.pointerTarget = [...point];
    this.pointerSpeed = speed;
    this.pointerActive = true;
    this.pointerDyeEnabled = allowDye;
    this.hero.dataset.fluidPointerResponse = allowDye ? 'orange' : 'graphite';
    if (allowDye) {
      this.hero.dataset.fluidPointerActive = 'true';
    } else {
      delete this.hero.dataset.fluidPointerActive;
    }
    this.updatePointerDot();
  }

  clearPointer() {
    this.pointerActive = false;
    this.pointerInitialized = false;
    this.pointerSpeed = 0;
    this.quietPointerStrength = 0;
    setUniform(this.passes.display, 'uQuietPointerStrength', 0);
    delete this.hero.dataset.fluidPointerActive;
    delete this.hero.dataset.fluidPointerResponse;
  }

  setSharedPaused(isPaused: boolean) {
    this.isSharedPaused = isPaused;
    this.syncLoop();
  }

  dispose() {
    if (this.disposed) return;
    this.disposed = true;
    this.clearPointer();
    if (this.frame !== undefined) cancelAnimationFrame(this.frame);
    this.frame = undefined;
    this.resizeObserver.disconnect();
    this.disposeTargets();
    for (const pass of Object.values(this.passes)) pass.program.remove();
    this.geometry.remove();
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
      uCeremonyImpulse: { value: 0 },
      uCeremonyIntensity: { value: 1 },
      uCeremonyOrigin: { value: [0.5, 0.5] },
      uCeremonyProgress: { value: 1 },
      uCssResolution: { value: [1, 1] },
      uDye: { value: null },
      uDyeTexelSize: { value: [1, 1] },
      uQuietPointer: { value: [0.5, 0.5] },
      uQuietPointerStrength: { value: 0 },
      uTime: { value: this.elapsedTime },
      uVelocity: { value: null },
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
      uClamp: { value: 0 },
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

  private readonly createTarget = (
    width: number,
    height: number,
    filter: GLenum = this.gl.NEAREST,
  ) => {
    const target = new RenderTarget(this.gl, {
      depth: false,
      format: this.textureFormat.format,
      height,
      internalFormat: this.textureFormat.internalFormat,
      magFilter: filter,
      minFilter: filter,
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
    this.targetAspect = aspect;
    const simulationWidth = Math.round(quality.simulationResolution * aspect);
    const dyeWidth = Math.round(quality.dyeResolution * aspect);
    const createSimulationTarget = () =>
      this.createTarget(simulationWidth, quality.simulationResolution);
    const createDyeTarget = () =>
      this.createTarget(
        dyeWidth,
        quality.dyeResolution,
        this.textureFormat.supportsLinearFiltering ? this.gl.LINEAR : this.gl.NEAREST,
      );
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

  private readonly handleResize = () => {
    if (this.disposed) return;
    const width = Math.max(this.hero.clientWidth, 1);
    const height = Math.max(this.hero.clientHeight, 1);
    const aspect = Math.min(Math.max(width / height, 0.7), 2.2);
    if (this.targets && Math.abs(aspect - this.targetAspect) > 0.04) {
      this.rebuildTargets();
      return;
    }
    this.renderer.setSize(width, height);
    setUniform(this.passes.display, 'uCssResolution', [width, height]);
  };

  private renderPass(pass: Pass, target?: RenderTarget) {
    this.renderer.render({ clear: false, scene: pass.mesh, target });
  }

  private inject(target: DoubleTarget, point: number[], value: number[], radius: number) {
    const pass = this.passes.injection;
    setUniform(pass, 'uAspect', target.read.width / target.read.height);
    setUniform(pass, 'uClamp', target === this.targets?.dye ? 1 : 0);
    setUniform(pass, 'uPoint', point);
    setUniform(pass, 'uRadius', radius);
    setUniform(pass, 'uTarget', target.read.texture);
    setUniform(pass, 'uValue', value);
    this.renderPass(pass, target.write);
    target.swap();
  }

  private updatePointerDot() {
    this.pointerDot.style.transform = `translate3d(${this.pointerPoint[0] * this.hero.clientWidth}px, ${(1 - this.pointerPoint[1]) * this.hero.clientHeight}px, 0) translate(-50%, -50%)`;
  }

  private advancePointer(delta: number) {
    this.quietPointerStrength *= Math.exp(-delta * 8);
    setUniform(this.passes.display, 'uQuietPointerStrength', this.quietPointerStrength);
    if (!this.pointerActive || !this.pointerInitialized) return;
    const previous: [number, number] = [...this.pointerPoint];
    const follow = 1 - Math.exp(-delta * 9);
    this.pointerPoint = [
      previous[0] + (this.pointerTarget[0] - previous[0]) * follow,
      previous[1] + (this.pointerTarget[1] - previous[1]) * follow,
    ];
    this.updatePointerDot();

    const deltaX = this.pointerPoint[0] - previous[0];
    const deltaY = this.pointerPoint[1] - previous[1];
    const distance = Math.hypot(deltaX * this.hero.clientWidth, deltaY * this.hero.clientHeight);
    if (distance < 0.35) return;

    const response = Math.min(this.pointerSpeed / MAX_POINTER_SPEED, 1);
    if (!this.pointerDyeEnabled) {
      this.quietPointerStrength = Math.max(this.quietPointerStrength, 0.18 + response * 0.32);
      setUniform(this.passes.display, 'uQuietPointer', this.pointerPoint);
      setUniform(this.passes.display, 'uQuietPointerStrength', this.quietPointerStrength);
      return;
    }

    const splatCount = Math.min(Math.max(Math.ceil(distance / 28), 1), 5);
    for (let index = 1; index <= splatCount; index += 1) {
      const progress = index / splatCount;
      this.injectSplat({
        point: [previous[0] + deltaX * progress, previous[1] + deltaY * progress],
        radius: 0.0009 + response * 0.0013,
        strength: 0.045 + response * 0.065,
        velocity: [deltaX * 22, deltaY * 22],
      });
    }
  }

  private step(delta: number, dissipationDelta: number) {
    const targets = this.targets;
    if (!targets) return;
    const velocityTexel = [1 / targets.velocity.read.width, 1 / targets.velocity.read.height];
    const dyeTexel = [1 / targets.dye.read.width, 1 / targets.dye.read.height];
    const normalizedDelta = delta / MAX_DELTA_SECONDS;
    const normalizedDissipation = dissipationDelta / MAX_DELTA_SECONDS;
    this.elapsedTime += dissipationDelta;
    this.advancePointer(delta);

    const advection = this.passes.advection;
    setUniform(advection, 'uDelta', normalizedDelta);
    setUniform(advection, 'uDissipation', Math.pow(0.94, normalizedDissipation));
    setUniform(advection, 'uSource', targets.velocity.read.texture);
    setUniform(advection, 'uTexelSize', velocityTexel);
    setUniform(advection, 'uVelocity', targets.velocity.read.texture);
    this.renderPass(advection, targets.velocity.write);
    targets.velocity.swap();

    setUniform(advection, 'uDissipation', Math.pow(0.965, normalizedDissipation));
    setUniform(advection, 'uSource', targets.dye.read.texture);
    setUniform(advection, 'uTexelSize', dyeTexel);
    setUniform(advection, 'uVelocity', targets.velocity.read.texture);
    this.renderPass(advection, targets.dye.write);
    targets.dye.swap();

    for (const splat of this.pendingSplats.splice(0)) {
      this.inject(
        targets.velocity,
        splat.point,
        [splat.velocity[0], splat.velocity[1], 0],
        splat.radius * 1.4,
      );
      if (splat.strength > 0) {
        this.inject(
          targets.dye,
          splat.point,
          [splat.strength, splat.strength * 0.2, splat.strength * 0.045],
          splat.radius,
        );
      }
    }

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
    setUniform(display, 'uDyeTexelSize', dyeTexel);
    setUniform(display, 'uTime', this.elapsedTime);
    setUniform(display, 'uVelocity', targets.velocity.read.texture);
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
    const dissipationDelta = Math.min(Math.max(frameDuration / 1000, 0), 0.1);
    const simulationDelta = Math.min(dissipationDelta, MAX_DELTA_SECONDS);
    this.lastFrameTime = time;
    this.step(simulationDelta, dissipationDelta);
    if (this.ceremonySettled) this.adaptQuality(frameDuration);
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
  const pointerDot = root.querySelector<HTMLElement>('[data-fluid-pointer-dot]');
  if (!canvas || !pointerDot) return () => {};

  const controller = new AbortController();
  const reducedMotion = window.matchMedia(REDUCED_MOTION_QUERY);
  const finePointer = window.matchMedia(FINE_POINTER_QUERY);
  const ceremony = createHeroCeremony(root, reducedMotion);
  const ceremonyImpulse: Omit<FluidSplat, 'point'> =
    ceremony.variant === 'mobile'
      ? { radius: 0.002, strength: 0.28, velocity: [0.055, -0.014] }
      : { radius: 0.003, strength: 0.5, velocity: [0.1, -0.025] };
  let engine: FluidEngine | undefined;
  let disposed = false;
  let lastPointer: { speed: number; time: number; x: number; y: number } | undefined;
  let touchGesture:
    | { id: number; moved: boolean; multiTouch: boolean; startedAt: number; x: number; y: number }
    | undefined;
  const activeTouchPointers = new Set<number>();

  const showFallback = (state: 'fallback' | 'static') => {
    ceremony.skip(state);
    root.dataset.fluidState = state;
    delete root.dataset.fluidPointerActive;
    lastPointer = undefined;
  };

  const start = () => {
    if (disposed || reducedMotion.matches || engine) return;
    if (!hasWebGlContext(canvas)) {
      showFallback('fallback');
      return;
    }

    let candidate: FluidEngine | undefined;
    try {
      candidate = new FluidEngine(root, canvas, ceremony.initialFrame, () => {
        if (disposed || reducedMotion.matches || !candidate) return;
        ceremony.ready({
          applyFrame: (frame) => candidate?.setCeremonyFrame(frame),
          injectImpulse: (point) => {
            candidate?.setCeremonyOrigin(point);
            candidate?.injectSplat({ ...ceremonyImpulse, point });
          },
        });
        root.dataset.fluidState = 'live';
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

  const isInteractiveTarget = (target: EventTarget | null) =>
    target instanceof Element && Boolean(target.closest(INTERACTIVE_SELECTOR));

  const handlePointerMove = (event: PointerEvent) => {
    if (event.pointerType === 'touch') {
      if (touchGesture?.id === event.pointerId) {
        touchGesture.moved ||=
          Math.hypot(event.clientX - touchGesture.x, event.clientY - touchGesture.y) >
          TAP_MOVE_TOLERANCE;
      }
      return;
    }
    if ((!finePointer.matches && event.pointerType !== 'pen') || reducedMotion.matches) {
      return;
    }
    if (isInteractiveTarget(event.target)) {
      engine?.clearPointer();
      lastPointer = undefined;
      return;
    }

    const bounds = root.getBoundingClientRect();
    if (bounds.width <= 0 || bounds.height <= 0) return;
    const x = Math.min(Math.max(event.clientX - bounds.left, 0), bounds.width);
    const y = Math.min(Math.max(event.clientY - bounds.top, 0), bounds.height);
    const current = { speed: lastPointer?.speed ?? 0, time: event.timeStamp, x, y };

    if (lastPointer) {
      const elapsed = Math.max((event.timeStamp - lastPointer.time) / 1000, 0.008);
      const deltaX = (x - lastPointer.x) / bounds.width;
      const deltaY = (lastPointer.y - y) / bounds.height;
      const measuredSpeed = Math.min(Math.hypot(deltaX, deltaY) / elapsed, MAX_POINTER_SPEED);
      current.speed = lastPointer.speed * 0.58 + measuredSpeed * 0.42;
    }

    engine?.setPointerTarget(
      [x / bounds.width, 1 - y / bounds.height],
      current.speed,
      ceremony.allowsPointerDye(),
    );
    lastPointer = current;
  };

  const handlePointerDown = (event: PointerEvent) => {
    if (event.pointerType !== 'touch' || reducedMotion.matches || !ceremony.allowsPointerDye()) {
      return;
    }
    engine?.clearPointer();
    lastPointer = undefined;
    activeTouchPointers.add(event.pointerId);
    if (activeTouchPointers.size > 1) {
      if (touchGesture) touchGesture.multiTouch = true;
      return;
    }
    if (isInteractiveTarget(event.target)) return;
    touchGesture = {
      id: event.pointerId,
      moved: false,
      multiTouch: false,
      startedAt: event.timeStamp,
      x: event.clientX,
      y: event.clientY,
    };
  };

  const finishTouch = (event: PointerEvent, cancelled: boolean) => {
    if (event.pointerType !== 'touch') return;
    activeTouchPointers.delete(event.pointerId);
    if (touchGesture?.id !== event.pointerId) return;
    const gesture = touchGesture;
    touchGesture = undefined;
    if (
      cancelled ||
      gesture.moved ||
      gesture.multiTouch ||
      reducedMotion.matches ||
      event.timeStamp - gesture.startedAt > TAP_TIME_LIMIT
    ) {
      return;
    }

    const bounds = root.getBoundingClientRect();
    if (bounds.width <= 0 || bounds.height <= 0) return;
    engine?.injectSplat({
      point: [
        Math.min(Math.max(gesture.x - bounds.left, 0), bounds.width) / bounds.width,
        1 - Math.min(Math.max(gesture.y - bounds.top, 0), bounds.height) / bounds.height,
      ],
      radius: 0.0012,
      strength: 0.16,
      velocity: [0, 0],
    });
  };

  const handlePointerLeave = (event: PointerEvent) => {
    if (event.pointerType === 'touch') return;
    engine?.clearPointer();
    lastPointer = undefined;
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
  root.addEventListener('pointerdown', handlePointerDown, {
    passive: true,
    signal: controller.signal,
  });
  root.addEventListener('pointermove', handlePointerMove, {
    passive: true,
    signal: controller.signal,
  });
  root.addEventListener('pointerup', (event) => finishTouch(event, false), {
    passive: true,
    signal: controller.signal,
  });
  root.addEventListener('pointercancel', (event) => finishTouch(event, true), {
    passive: true,
    signal: controller.signal,
  });
  root.addEventListener('pointerleave', handlePointerLeave, {
    passive: true,
    signal: controller.signal,
  });
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
    ceremony.dispose();
    engine?.dispose();
    engine = undefined;
    activeTouchPointers.clear();
    touchGesture = undefined;
  };
};

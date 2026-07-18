import { Mesh, Program, Renderer, Triangle, type OGLRenderingContext } from 'ogl';

type GrainPresentationState = 'fallback' | 'live' | 'paused' | 'static';

type GrainQuality = {
  dprCap: number;
  frameInterval: number;
  name: 'desktop' | 'mobile';
};

const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';
const MOBILE_QUERY = '(max-width: 700px), (pointer: coarse)';

const QUALITY: Record<GrainQuality['name'], GrainQuality> = {
  desktop: { dprCap: 1.5, frameInterval: 1000 / 18, name: 'desktop' },
  mobile: { dprCap: 0.9, frameInterval: 1000 / 12, name: 'mobile' },
};

// glsl
const fullscreenVertex = `
  attribute vec2 position;
  attribute vec2 uv;

  varying vec2 vUv;

  void main() {
    vUv = uv;
    gl_Position = vec4(position, 0.0, 1.0);
  }
`;

// glsl
const grainFragment = `
  precision highp float;

  uniform vec2 uCssResolution;
  uniform float uFrame;
  uniform float uPixelRatio;
  uniform float uTime;

  varying vec2 vUv;

  float hash(vec2 point) {
    vec3 value = fract(vec3(point.xyx) * 0.1031);
    value += dot(value, value.yzx + 33.33);
    return fract((value.x + value.y) * value.z);
  }

  float valueNoise(vec2 point) {
    vec2 cell = floor(point);
    vec2 blend = fract(point);
    blend = blend * blend * (3.0 - 2.0 * blend);

    float bottom = mix(hash(cell), hash(cell + vec2(1.0, 0.0)), blend.x);
    float top = mix(hash(cell + vec2(0.0, 1.0)), hash(cell + 1.0), blend.x);
    return mix(bottom, top, blend.y);
  }

  void main() {
    vec2 cssPoint = gl_FragCoord.xy / max(uPixelRatio, 0.5);
    vec2 frameOffset = vec2(uFrame * 17.0, uFrame * 29.0);
    float fineGrain = hash(floor(cssPoint / 1.35) + frameOffset) - 0.5;
    float clusteredGrain = valueNoise(cssPoint / 3.6 + frameOffset * 0.19) - 0.5;
    vec2 drift = vec2(uTime * 0.018, -uTime * 0.013);
    float broadVariation = valueNoise((vUv * uCssResolution) / 190.0 + drift) - 0.5;
    float luminance = fineGrain * 0.04 + clusteredGrain * 0.016 + broadVariation * 0.012;
    vec3 warmCharcoal = vec3(0.105, 0.098, 0.088);
    vec3 warmLuminance = vec3(1.0, 0.95, 0.88) * luminance;

    gl_FragColor = vec4(warmCharcoal + warmLuminance, 1.0);
  }
`;

const currentQuality = () =>
  QUALITY[window.matchMedia(MOBILE_QUERY).matches ? 'mobile' : 'desktop'];

type GrainSurfaceParticipant = {
  canRender: () => boolean;
  root: HTMLElement;
  setActive: (active: boolean) => void;
};

const grainSurfaces = new Set<GrainSurfaceParticipant>();
let activeGrainSurface: GrainSurfaceParticipant | undefined;

const visibleArea = ({ root }: GrainSurfaceParticipant) => {
  const bounds = root.getBoundingClientRect();
  const width = Math.max(Math.min(bounds.right, window.innerWidth) - Math.max(bounds.left, 0), 0);
  const height = Math.max(Math.min(bounds.bottom, window.innerHeight) - Math.max(bounds.top, 0), 0);
  return width * height;
};

const distanceFromViewportCenter = ({ root }: GrainSurfaceParticipant) => {
  const bounds = root.getBoundingClientRect();
  return Math.abs(bounds.top + bounds.height / 2 - window.innerHeight / 2);
};

const syncGrainSurfaces = () => {
  const candidates = Array.from(grainSurfaces).filter((surface) => surface.canRender());
  candidates.sort(
    (left, right) =>
      visibleArea(right) - visibleArea(left) ||
      distanceFromViewportCenter(left) - distanceFromViewportCenter(right),
  );
  const nextSurface = candidates[0];

  if (activeGrainSurface !== nextSurface) activeGrainSurface?.setActive(false);
  activeGrainSurface = nextSurface;
  activeGrainSurface?.setActive(true);
};

class GrainRenderer {
  private readonly geometry: Triangle;
  private readonly gl: OGLRenderingContext;
  private readonly mesh: Mesh;
  private readonly program: Program;
  private readonly renderer: Renderer;
  private disposed = false;
  private quality = currentQuality();
  private renderedFrames = Math.floor(Math.random() * 2_000);

  constructor(
    private readonly root: HTMLElement,
    canvas: HTMLCanvasElement,
  ) {
    this.renderer = new Renderer({
      alpha: false,
      antialias: false,
      canvas,
      depth: false,
      dpr: Math.min(window.devicePixelRatio || 1, this.quality.dprCap),
      powerPreference: 'low-power',
      premultipliedAlpha: false,
      stencil: false,
      webgl: 2,
    });
    this.gl = this.renderer.gl;
    this.geometry = new Triangle(this.gl);
    this.program = new Program(this.gl, {
      cullFace: false,
      depthTest: false,
      depthWrite: false,
      fragment: grainFragment,
      uniforms: {
        uCssResolution: { value: [1, 1] },
        uFrame: { value: this.renderedFrames },
        uPixelRatio: { value: this.renderer.dpr },
        uTime: { value: Math.random() * 120 },
      },
      vertex: fullscreenVertex,
    });

    if (!this.gl.getProgramParameter(this.program.program, this.gl.LINK_STATUS)) {
      this.program.remove();
      this.geometry.remove();
      throw new Error('The surface grain shader failed to compile.');
    }

    this.mesh = new Mesh(this.gl, { geometry: this.geometry, program: this.program });
    this.resize();
  }

  get frameInterval() {
    return this.quality.frameInterval;
  }

  resize() {
    if (this.disposed) return;
    this.quality = currentQuality();
    this.renderer.dpr = Math.min(window.devicePixelRatio || 1, this.quality.dprCap);
    const width = Math.max(this.root.clientWidth, 1);
    const height = Math.max(this.root.clientHeight, 1);
    this.renderer.setSize(width, height);
    this.program.uniforms.uCssResolution.value = [width, height];
    this.program.uniforms.uPixelRatio.value = this.renderer.dpr;
    this.root.dataset.grainQuality = this.quality.name;
  }

  render(time: number) {
    if (this.disposed) return;
    this.renderedFrames += 1;
    this.program.uniforms.uFrame.value = this.renderedFrames;
    this.program.uniforms.uTime.value = time;
    this.renderer.render({ scene: this.mesh });
  }

  dispose() {
    if (this.disposed) return;
    this.disposed = true;
    this.program.remove();
    this.geometry.remove();
  }
}

export const mountSurfaceGrain = (root: HTMLElement) => {
  const canvas = root.querySelector<HTMLCanvasElement>('[data-grain-canvas]');
  if (!canvas) return () => {};

  const controller = new AbortController();
  const reducedMotion = window.matchMedia(REDUCED_MOTION_QUERY);
  let disposed = false;
  let engine: GrainRenderer | undefined;
  let frame: number | undefined;
  let hasRendered = false;
  let lastRenderTime = 0;
  let isCoordinatorActive = false;
  let isDocumentVisible = document.visibilityState === 'visible';
  let isSectionNearViewport = false;

  const setState = (state: GrainPresentationState) => {
    root.dataset.grainState = state;
  };

  const cancelLoop = () => {
    if (frame !== undefined) cancelAnimationFrame(frame);
    frame = undefined;
    lastRenderTime = 0;
  };

  const tick = (time: number) => {
    if (
      disposed ||
      !engine ||
      !isCoordinatorActive ||
      !isDocumentVisible ||
      !isSectionNearViewport
    ) {
      frame = undefined;
      return;
    }
    const elapsed = time - lastRenderTime;
    if (lastRenderTime === 0 || elapsed >= engine.frameInterval) {
      engine.render(time / 1000);
      hasRendered = true;
      lastRenderTime =
        lastRenderTime === 0
          ? time
          : lastRenderTime + engine.frameInterval * Math.floor(elapsed / engine.frameInterval);
      setState('live');
    }
    frame = requestAnimationFrame(tick);
  };

  const syncLoop = () => {
    if (!engine) return;
    if (isCoordinatorActive && isDocumentVisible && isSectionNearViewport) {
      if (frame === undefined) frame = requestAnimationFrame(tick);
      return;
    }
    cancelLoop();
    setState(hasRendered ? 'paused' : 'static');
  };

  const participant: GrainSurfaceParticipant = {
    canRender: () => Boolean(engine && isDocumentVisible && isSectionNearViewport && !disposed),
    root,
    setActive: (active) => {
      isCoordinatorActive = active;
      syncLoop();
    },
  };
  grainSurfaces.add(participant);

  const stop = (state: Extract<GrainPresentationState, 'fallback' | 'static'>) => {
    cancelLoop();
    engine?.dispose();
    engine = undefined;
    hasRendered = false;
    canvas.width = 1;
    canvas.height = 1;
    delete root.dataset.grainQuality;
    setState(state);
    syncGrainSurfaces();
  };

  const start = () => {
    if (disposed || reducedMotion.matches || engine) return;
    let candidate: GrainRenderer | undefined;
    try {
      candidate = new GrainRenderer(root, canvas);
      engine = candidate;
      syncGrainSurfaces();
    } catch {
      candidate?.dispose();
      canvas.width = 1;
      canvas.height = 1;
      stop('fallback');
    }
  };

  const handleMotionPreference = () => {
    if (reducedMotion.matches) {
      stop('static');
    } else {
      start();
    }
  };
  const handleVisibility = () => {
    isDocumentVisible = document.visibilityState === 'visible';
    syncGrainSurfaces();
  };
  const handleResize = () => {
    if (!engine) return;
    engine.resize();
    hasRendered = false;
    lastRenderTime = 0;
    setState('static');
    syncGrainSurfaces();
  };
  const handleContextLost = (event: Event) => {
    event.preventDefault();
    stop('fallback');
  };
  const handleContextRestored = () => {
    if (!reducedMotion.matches) start();
  };

  const resizeObserver = new ResizeObserver(handleResize);
  resizeObserver.observe(root);
  const intersectionObserver = new IntersectionObserver(
    ([entry]) => {
      isSectionNearViewport = Boolean(entry?.isIntersecting);
      syncGrainSurfaces();
    },
    { threshold: [0, 0.01] },
  );
  intersectionObserver.observe(root);

  reducedMotion.addEventListener('change', handleMotionPreference, { signal: controller.signal });
  canvas.addEventListener('webglcontextlost', handleContextLost, { signal: controller.signal });
  canvas.addEventListener('webglcontextrestored', handleContextRestored, {
    signal: controller.signal,
  });
  document.addEventListener('visibilitychange', handleVisibility, { signal: controller.signal });

  const dispose = () => {
    if (disposed) return;
    disposed = true;
    controller.abort();
    intersectionObserver.disconnect();
    resizeObserver.disconnect();
    grainSurfaces.delete(participant);
    if (activeGrainSurface === participant) activeGrainSurface = undefined;
    stop('static');
  };
  window.addEventListener(
    'pagehide',
    (event) => {
      if (!event.persisted) dispose();
    },
    { signal: controller.signal },
  );

  handleMotionPreference();

  return dispose;
};

import { Mesh, Program, Renderer, Triangle, type OGLRenderingContext } from 'ogl';

import {
  attachContactSculptureInteraction,
  ContactSculptureInteraction,
  type ContactSculpturePoint,
} from './contact-sculpture-interaction';
import {
  CONTACT_TENSION_REVEAL_EVENT,
  getContactTensionRevealProgress,
  readContactTensionReveal,
  settleContactTensionReveal,
  type ContactTensionReveal,
} from './contact-tension-reveal';

export { ContactSculptureInteraction } from './contact-sculpture-interaction';

export type ContactSculptureQualityName = 'balanced' | 'dense' | 'economy';

type ContactSculptureState = 'fallback' | 'forming' | 'live' | 'paused' | 'poster' | 'static';

type ContactSculptureQuality = {
  dprCap: number;
  name: ContactSculptureQualityName;
  strandDensity: number;
};

export const CONTACT_SCULPTURE_QUALITY: readonly ContactSculptureQuality[] = [
  { dprCap: 1.5, name: 'dense', strandDensity: 58 },
  { dprCap: 1.15, name: 'balanced', strandDensity: 42 },
  { dprCap: 0.75, name: 'economy', strandDensity: 30 },
];

const FRAME_BUDGET_MS = 24;
const QUALITY_SAMPLE_FRAMES = 45;
const QUALITY_COOLDOWN_FRAMES = 90;
const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';
const SUPPORTED_DESKTOP_QUERY = '(min-width: 1024px) and (hover: hover) and (pointer: fine)';

export const decideContactSculptureQuality = (
  current: ContactSculptureQualityName,
  averageFrameTime: number,
): ContactSculptureQualityName | 'fallback' => {
  if (averageFrameTime <= FRAME_BUDGET_MS) return current;
  const currentIndex = CONTACT_SCULPTURE_QUALITY.findIndex(({ name }) => name === current);
  return CONTACT_SCULPTURE_QUALITY[currentIndex + 1]?.name ?? 'fallback';
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
const contourFragment = `
  precision highp float;

  uniform float uAspect;
  uniform float uFormationProgress;
  uniform vec2 uPointer;
  uniform float uPointerStrength;
  uniform float uRippleAge;
  uniform float uRippleEnergy;
  uniform vec2 uRippleOrigin;
  uniform float uStrandDensity;
  uniform float uTime;

  varying vec2 vUv;

  float gaussian(float value, float width) {
    return exp(-(value * value) / max(width * width, 0.0001));
  }

  void main() {
    vec2 point = vUv;
    float aspectCorrection = clamp(uAspect / 1.16, 0.82, 1.24);
    point.x = (point.x - 0.5) * aspectCorrection + 0.5;

    float formation = smoothstep(0.0, 1.0, uFormationProgress);
    float looseness = 1.0 - formation;
    point.x = 0.61 + (point.x - 0.61) / mix(0.46, 1.0, formation);
    point.y = 0.51 + (point.y - 0.51) / mix(0.72, 1.0, formation);

    vec2 bodyPoint = vec2((point.x - 0.59) / 0.62, (point.y - 0.51) / 0.48);
    float edgeFold = 0.07 * sin(point.y * 8.0) + 0.025 * sin(point.y * 19.0);
    float silhouetteDistance = bodyPoint.x * bodyPoint.x + bodyPoint.y * bodyPoint.y;
    silhouetteDistance += edgeFold * bodyPoint.x;
    float silhouette = 1.0 - smoothstep(0.9, 1.02, silhouetteDistance);

    float voidDistance = abs(point.y - 0.49);
    float voidBoundary = 0.455 - 1.1 * pow(voidDistance, 1.55);
    float openVoid = 1.0 - smoothstep(voidBoundary - 0.012, voidBoundary + 0.012, point.x);
    openVoid *= smoothstep(0.18, 0.92, formation);

    float foldOne = gaussian(point.x - 0.61 - 0.035 * sin(point.y * 7.0), 0.055);
    float foldTwo = gaussian(point.x - 0.78 + 0.025 * sin(point.y * 5.0), 0.045);
    float tension = 0.052 * sin(point.x * 6.2 + point.y * 2.4);
    tension += 0.021 * sin(point.x * 13.0 - point.y * 4.2);
    tension += (foldOne * 0.028 - foldTwo * 0.022) * sin(point.y * 12.0);
    tension += looseness * 0.085 * sin(point.y * 7.0 + point.x * 3.2);
    tension += looseness * 0.035 * sin(point.y * 16.0 - point.x * 4.6);
    tension += 0.0024 * sin(uTime * 0.62 + point.x * 4.0 + point.y * 2.0);

    vec2 pointer = uPointer;
    pointer.x = (pointer.x - 0.5) * aspectCorrection + 0.5;
    vec2 pointerDelta = point - pointer;
    float pointerDistance = length(pointerDelta);
    float pointerDent = exp(-pointerDistance * pointerDistance * 34.0);
    tension += pointerDent * uPointerStrength * 0.018
      * pointerDelta.y / max(pointerDistance, 0.045);

    vec2 rippleOrigin = uRippleOrigin;
    rippleOrigin.x = (rippleOrigin.x - 0.5) * aspectCorrection + 0.5;
    vec2 rippleDelta = point - rippleOrigin;
    float rippleDistance = length(rippleDelta);
    float ripple = sin(rippleDistance * 58.0 - uRippleAge * 7.0);
    ripple *= exp(-rippleDistance * 5.5) * exp(-uRippleAge * 1.65) * uRippleEnergy;
    tension += ripple * 0.008;

    float strandPosition = (point.y + tension) * uStrandDensity;
    float strandDistance = abs(fract(strandPosition) - 0.5) / uStrandDensity;
    float strand = 1.0 - smoothstep(0.0008, 0.00235, strandDistance);
    float foldInk = smoothstep(0.54, 0.95, foldOne + foldTwo) * 0.36 * formation;
    float edgeSoftness = smoothstep(0.0, 0.075, silhouette);
    float alpha = max(strand, foldInk) * silhouette * edgeSoftness * (1.0 - openVoid);
    alpha *= 0.78 + 0.18 * sin(point.y * uStrandDensity * 0.43 + point.x * 3.0);

    gl_FragColor = vec4(vec3(0.067), clamp(alpha, 0.0, 0.96));
  }
`;

const webGlAttributes: WebGLContextAttributes = {
  alpha: true,
  antialias: false,
  depth: false,
  powerPreference: 'high-performance',
  premultipliedAlpha: false,
  preserveDrawingBuffer: false,
  stencil: false,
};

const detectWebGlVersion = (canvas: HTMLCanvasElement) => {
  if (canvas.getContext('webgl2', webGlAttributes)) return 2 as const;
  if (canvas.getContext('webgl', webGlAttributes)) return 1 as const;
};

class ContactSculptureRenderer {
  private readonly geometry: Triangle;
  private readonly gl: OGLRenderingContext;
  private readonly mesh: Mesh;
  private readonly program: Program;
  private readonly renderer: Renderer;
  private disposed = false;
  private frameCount = 0;
  private frameTimeTotal = 0;
  private readonly interaction = new ContactSculptureInteraction();
  private qualityCooldown = 0;
  private qualityIndex = 0;

  constructor(
    private readonly root: HTMLElement,
    canvas: HTMLCanvasElement,
    webgl: 1 | 2,
  ) {
    const quality = CONTACT_SCULPTURE_QUALITY[this.qualityIndex];
    this.renderer = new Renderer({
      ...webGlAttributes,
      canvas,
      dpr: Math.min(window.devicePixelRatio || 1, quality.dprCap),
      webgl,
    });
    this.gl = this.renderer.gl;
    this.gl.clearColor(0, 0, 0, 0);
    this.geometry = new Triangle(this.gl);
    this.program = new Program(this.gl, {
      cullFace: false,
      depthTest: false,
      depthWrite: false,
      fragment: contourFragment,
      transparent: true,
      uniforms: {
        uAspect: { value: 1 },
        uFormationProgress: { value: 0 },
        uPointer: { value: this.interaction.snapshot().pointer },
        uPointerStrength: { value: 0 },
        uRippleAge: { value: this.interaction.snapshot().rippleAge },
        uRippleEnergy: { value: 0 },
        uRippleOrigin: { value: this.interaction.snapshot().rippleOrigin },
        uStrandDensity: { value: quality.strandDensity },
        uTime: { value: 0 },
      },
      vertex: fullscreenVertex,
    });

    if (!this.gl.getProgramParameter(this.program.program, this.gl.LINK_STATUS)) {
      this.program.remove();
      this.geometry.remove();
      throw new Error('The Contact sculpture shader failed to compile.');
    }

    this.mesh = new Mesh(this.gl, { geometry: this.geometry, program: this.program });
    this.applyQuality();
  }

  clearPointer() {
    this.interaction.leave();
  }

  dispose() {
    if (this.disposed) return;
    this.disposed = true;
    this.program.remove();
    this.geometry.remove();
  }

  cancelPress() {
    this.interaction.cancelPress();
  }

  press(point: ContactSculpturePoint) {
    this.interaction.press(point);
  }

  release(point: ContactSculpturePoint) {
    this.interaction.release(point);
  }

  render(time: number, frameDuration: number, formationProgress: number) {
    if (this.disposed) return false;
    const interaction = this.interaction.advance(frameDuration);

    this.program.uniforms.uFormationProgress.value = formationProgress;
    this.program.uniforms.uPointer.value = interaction.pointer;
    this.program.uniforms.uPointerStrength.value = interaction.pointerStrength;
    this.program.uniforms.uRippleAge.value = interaction.rippleAge;
    this.program.uniforms.uRippleEnergy.value = interaction.rippleEnergy;
    this.program.uniforms.uRippleOrigin.value = interaction.rippleOrigin;
    this.program.uniforms.uTime.value = time / 1000;
    this.renderer.render({ clear: true, scene: this.mesh });
    return this.adaptQuality(frameDuration);
  }

  resize() {
    if (this.disposed) return;
    const quality = CONTACT_SCULPTURE_QUALITY[this.qualityIndex];
    const width = Math.max(this.root.clientWidth, 1);
    const height = Math.max(this.root.clientHeight, 1);
    this.renderer.dpr = Math.min(window.devicePixelRatio || 1, quality.dprCap);
    this.renderer.setSize(width, height);
    this.program.uniforms.uAspect.value = width / height;
  }

  setPointer(point: ContactSculpturePoint) {
    this.interaction.hover(point);
  }

  private adaptQuality(frameDuration: number) {
    if (frameDuration <= 0) return true;
    if (this.qualityCooldown > 0) {
      this.qualityCooldown -= 1;
      return true;
    }

    this.frameCount += 1;
    this.frameTimeTotal += Math.min(frameDuration, 250);
    if (this.frameCount < QUALITY_SAMPLE_FRAMES) return true;

    const averageFrameTime = this.frameTimeTotal / this.frameCount;
    const current = CONTACT_SCULPTURE_QUALITY[this.qualityIndex];
    const decision = decideContactSculptureQuality(current.name, averageFrameTime);
    this.frameCount = 0;
    this.frameTimeTotal = 0;
    if (decision === current.name) return true;
    if (decision === 'fallback') return false;

    this.qualityIndex = CONTACT_SCULPTURE_QUALITY.findIndex(({ name }) => name === decision);
    this.qualityCooldown = QUALITY_COOLDOWN_FRAMES;
    this.applyQuality();
    return true;
  }

  private applyQuality() {
    const quality = CONTACT_SCULPTURE_QUALITY[this.qualityIndex];
    this.root.dataset.contactSculptureQuality = quality.name;
    this.program.uniforms.uStrandDensity.value = quality.strandDensity;
    this.resize();
  }
}

export const mountContactSculpture = (root: HTMLElement) => {
  const canvas = root.querySelector<HTMLCanvasElement>('[data-contact-sculpture-canvas]');
  const interactionArea = root.closest<HTMLElement>('[data-contact-upper-stage]');
  const section = root.closest<HTMLElement>('[data-motion-section="contact"]');
  if (!canvas || !interactionArea || !section) return () => {};

  const controller = new AbortController();
  const reducedMotion = window.matchMedia(REDUCED_MOTION_QUERY);
  const supportedDesktop = window.matchMedia(SUPPORTED_DESKTOP_QUERY);
  let detachInteraction: (() => void) | undefined;
  let disposed = false;
  let engine: ContactSculptureRenderer | undefined;
  let failed = false;
  let frame: number | undefined;
  let hasRendered = false;
  let isDocumentVisible = document.visibilityState === 'visible';
  let isNearViewport = false;
  let lastFrameTime = 0;
  let reveal = readContactTensionReveal(section);

  const setState = (state: ContactSculptureState) => {
    root.dataset.contactSculptureState = state;
  };

  const cancelLoop = () => {
    if (frame !== undefined) cancelAnimationFrame(frame);
    frame = undefined;
    lastFrameTime = 0;
  };

  const deactivateInteraction = () => {
    detachInteraction?.();
    detachInteraction = undefined;
  };

  const activateInteraction = () => {
    if (detachInteraction || !engine || root.dataset.contactSculptureState !== 'live') return;
    detachInteraction = attachContactSculptureInteraction(root, interactionArea, engine);
  };

  const stop = (state: Extract<ContactSculptureState, 'fallback' | 'static'>) => {
    cancelLoop();
    deactivateInteraction();
    engine?.dispose();
    engine = undefined;
    hasRendered = false;
    canvas.width = 1;
    canvas.height = 1;
    delete root.dataset.contactSculptureQuality;
    setState(state);
  };

  const failOpen = () => {
    failed = true;
    if (reveal) settleContactTensionReveal(section);
    stop('fallback');
  };

  const tick = (time: number) => {
    if (
      disposed ||
      !engine ||
      failed ||
      !supportedDesktop.matches ||
      reducedMotion.matches ||
      !isDocumentVisible ||
      !isNearViewport
    ) {
      frame = undefined;
      return;
    }

    const frameDuration = lastFrameTime === 0 ? 1000 / 60 : time - lastFrameTime;
    const formationProgress =
      section.dataset.contactTensionReveal === 'settled'
        ? 1
        : getContactTensionRevealProgress(reveal);
    lastFrameTime = time;
    if (!engine.render(time, frameDuration, formationProgress)) {
      failOpen();
      return;
    }

    hasRendered = true;
    if (!reveal) {
      setState('poster');
    } else if (formationProgress < 1) {
      deactivateInteraction();
      setState('forming');
    } else {
      settleContactTensionReveal(section);
      setState('live');
      activateInteraction();
    }
    frame = requestAnimationFrame(tick);
  };

  const start = () => {
    if (disposed || engine || failed) return;
    const webgl = detectWebGlVersion(canvas);
    if (!webgl) {
      failOpen();
      return;
    }

    let candidate: ContactSculptureRenderer | undefined;
    try {
      candidate = new ContactSculptureRenderer(root, canvas, webgl);
      engine = candidate;
      frame = requestAnimationFrame(tick);
    } catch {
      candidate?.dispose();
      failOpen();
    }
  };

  const sync = () => {
    if (disposed) return;
    if (!supportedDesktop.matches || reducedMotion.matches) {
      failed = false;
      if (reveal) settleContactTensionReveal(section);
      stop('static');
      return;
    }
    if (failed) {
      deactivateInteraction();
      setState('fallback');
      return;
    }
    if (!isDocumentVisible || !isNearViewport) {
      cancelLoop();
      deactivateInteraction();
      setState(hasRendered && reveal ? 'paused' : 'poster');
      return;
    }
    start();
    if (engine && frame === undefined) frame = requestAnimationFrame(tick);
  };

  const handleContextLost = (event: Event) => {
    event.preventDefault();
    failOpen();
  };
  const handleContextRestored = () => {
    if (!supportedDesktop.matches || reducedMotion.matches) return;
    failed = false;
    setState('poster');
    sync();
  };
  const handleEligibilityChange = () => {
    failed = false;
    sync();
  };
  const handleTensionReveal = (event: Event) => {
    reveal =
      (event as CustomEvent<ContactTensionReveal>).detail ?? readContactTensionReveal(section);
    if (failed || !supportedDesktop.matches || reducedMotion.matches) {
      settleContactTensionReveal(section);
      return;
    }
    sync();
  };
  const handleVisibility = () => {
    isDocumentVisible = document.visibilityState === 'visible';
    sync();
  };
  const handleViewportChange = () => {
    const bounds = root.getBoundingClientRect();
    isNearViewport = bounds.bottom >= -80 && bounds.top <= window.innerHeight + 80;
    sync();
  };

  const intersectionObserver = new IntersectionObserver(handleViewportChange, {
    rootMargin: '80px 0px',
    threshold: [0, 0.01],
  });
  intersectionObserver.observe(root);

  const resizeObserver = new ResizeObserver(() => engine?.resize());
  resizeObserver.observe(root);

  section.addEventListener(CONTACT_TENSION_REVEAL_EVENT, handleTensionReveal, {
    signal: controller.signal,
  });
  reducedMotion.addEventListener('change', handleEligibilityChange, { signal: controller.signal });
  supportedDesktop.addEventListener('change', handleEligibilityChange, {
    signal: controller.signal,
  });
  canvas.addEventListener('webglcontextlost', handleContextLost, { signal: controller.signal });
  canvas.addEventListener('webglcontextrestored', handleContextRestored, {
    signal: controller.signal,
  });
  document.addEventListener('visibilitychange', handleVisibility, { signal: controller.signal });
  window.addEventListener('pageshow', handleViewportChange, { signal: controller.signal });
  window.addEventListener('resize', handleViewportChange, {
    passive: true,
    signal: controller.signal,
  });
  window.addEventListener('scroll', handleViewportChange, {
    passive: true,
    signal: controller.signal,
  });

  const dispose = () => {
    if (disposed) return;
    disposed = true;
    controller.abort();
    intersectionObserver.disconnect();
    resizeObserver.disconnect();
    stop('static');
  };

  sync();
  return dispose;
};

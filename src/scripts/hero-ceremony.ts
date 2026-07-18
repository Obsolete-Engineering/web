export const HERO_CEREMONY_SESSION_KEY = 'obsolete:hero-ceremony-complete';

export type HeroCeremonyPart =
  | 'identity'
  | 'masthead'
  | 'eyebrow'
  | 'headline-first'
  | 'headline-rest'
  | 'period'
  | 'clarification'
  | 'actions';

export type HeroCeremonyVariant = 'desktop' | 'mobile';

type HeroCeremonyProfile = {
  durationMs: number;
  impulseMs: number;
  intensity: number;
  pointerDyeMs: number;
  reveals: readonly { atMs: number; part: HeroCeremonyPart }[];
  revealTransitionMs: number;
};

const DESKTOP_REVEALS = [
  { atMs: 420, part: 'identity' },
  { atMs: 560, part: 'masthead' },
  { atMs: 640, part: 'eyebrow' },
  { atMs: 720, part: 'headline-first' },
  { atMs: 880, part: 'headline-rest' },
  { atMs: 1_040, part: 'period' },
  { atMs: 1_120, part: 'clarification' },
  { atMs: 1_220, part: 'actions' },
] as const satisfies HeroCeremonyProfile['reveals'];

const MOBILE_REVEALS = [
  { atMs: 260, part: 'identity' },
  { atMs: 360, part: 'masthead' },
  { atMs: 400, part: 'eyebrow' },
  { atMs: 470, part: 'headline-first' },
  { atMs: 600, part: 'headline-rest' },
  { atMs: 720, part: 'period' },
  { atMs: 820, part: 'clarification' },
  { atMs: 960, part: 'actions' },
] as const satisfies HeroCeremonyProfile['reveals'];

export const HERO_CEREMONY_PROFILES = {
  desktop: {
    durationMs: 2_100,
    impulseMs: 280,
    intensity: 1,
    pointerDyeMs: 1_650,
    reveals: DESKTOP_REVEALS,
    revealTransitionMs: 160,
  },
  mobile: {
    durationMs: 1_600,
    impulseMs: 180,
    intensity: 0.58,
    pointerDyeMs: 1_600,
    reveals: MOBILE_REVEALS,
    revealTransitionMs: 120,
  },
} as const satisfies Record<HeroCeremonyVariant, HeroCeremonyProfile>;

export const CEREMONY_DURATION_MS = HERO_CEREMONY_PROFILES.desktop.durationMs;
export const CEREMONY_IMPULSE_MS = HERO_CEREMONY_PROFILES.desktop.impulseMs;
export const CEREMONY_POINTER_DYE_MS = HERO_CEREMONY_PROFILES.desktop.pointerDyeMs;
export const CEREMONY_REVEAL_TRANSITION_MS = HERO_CEREMONY_PROFILES.desktop.revealTransitionMs;
export const HERO_CEREMONY_REVEALS = HERO_CEREMONY_PROFILES.desktop.reveals;

const CEREMONY_READINESS_TIMEOUT_MS = 800;
const DESKTOP_QUERY = '(min-width: 861px) and (hover: hover) and (pointer: fine)';
const INTERACTIVE_SELECTOR = 'a, button, input, select, textarea, [role="button"]';

export type HeroCeremonyFrame = {
  impulse: number;
  intensity: number;
  progress: number;
};

type HeroCeremonyEligibilityInput = {
  hasCompleted: boolean;
  hasHash: boolean;
  reducedMotion: boolean;
  storageAvailable: boolean;
};

type HeroCeremonyEligibility =
  | { eligible: true; reason: 'eligible' }
  | {
      eligible: false;
      reason: 'hash' | 'reduced-motion' | 'repeat-session' | 'storage';
    };

type HeroCeremonyRuntime = {
  applyFrame: (frame: HeroCeremonyFrame) => void;
  injectImpulse: (point: [number, number]) => void;
};

type HeroCeremonyState = 'disposed' | 'eligible' | 'ready' | 'running' | 'settled' | 'skipped';

export type HeroCeremonyController = {
  allowsPointerDye: () => boolean;
  dispose: () => void;
  initialFrame: HeroCeremonyFrame;
  ready: (runtime: HeroCeremonyRuntime) => void;
  variant: HeroCeremonyVariant;
  skip: (reason: string) => void;
};

const clamp = (value: number) => Math.min(Math.max(value, 0), 1);
const easeOutQuint = (value: number) => 1 - (1 - value) ** 5;

export const decideHeroCeremonyEligibility = (
  input: HeroCeremonyEligibilityInput,
): HeroCeremonyEligibility => {
  if (input.hasCompleted) return { eligible: false, reason: 'repeat-session' };
  if (input.hasHash) return { eligible: false, reason: 'hash' };
  if (input.reducedMotion) return { eligible: false, reason: 'reduced-motion' };
  if (!input.storageAvailable) return { eligible: false, reason: 'storage' };
  return { eligible: true, reason: 'eligible' };
};

export const getRevealedHeroCeremonyParts = (
  elapsedMs: number,
  variant: HeroCeremonyVariant = 'desktop',
): HeroCeremonyPart[] => {
  const revealed: HeroCeremonyPart[] = [];
  for (const { atMs, part } of HERO_CEREMONY_PROFILES[variant].reveals) {
    if (elapsedMs >= atMs) revealed.push(part);
  }
  return revealed;
};

export const isHeroPointerDyeAvailable = (
  elapsedMs: number,
  variant: HeroCeremonyVariant = 'desktop',
) => elapsedMs >= HERO_CEREMONY_PROFILES[variant].pointerDyeMs;

export const getHeroCeremonyFrame = (
  elapsedMs: number,
  variant: HeroCeremonyVariant = 'desktop',
): HeroCeremonyFrame => {
  const profile = HERO_CEREMONY_PROFILES[variant];
  if (elapsedMs <= profile.impulseMs) {
    return { impulse: 0, intensity: profile.intensity, progress: 0 };
  }
  if (elapsedMs >= profile.durationMs) {
    return { impulse: 0, intensity: profile.intensity, progress: 1 };
  }

  const linearProgress = clamp(
    (elapsedMs - profile.impulseMs) / (profile.durationMs - profile.impulseMs),
  );
  const progress = easeOutQuint(linearProgress);
  const impulse =
    Math.sin(Math.PI * linearProgress) * (1 - linearProgress * 0.35) * profile.intensity;
  return { impulse, intensity: profile.intensity, progress };
};

const readSession = () => {
  try {
    const probeKey = `${HERO_CEREMONY_SESSION_KEY}:probe`;
    window.sessionStorage.setItem(probeKey, '1');
    window.sessionStorage.removeItem(probeKey);
    return {
      available: true,
      completed: window.sessionStorage.getItem(HERO_CEREMONY_SESSION_KEY) === 'true',
    };
  } catch {
    return { available: false, completed: false };
  }
};

const measureImpulsePoint = (root: HTMLElement): [number, number] | undefined => {
  const period = root.querySelector<HTMLElement>('.hero__title-period');
  if (!period) return;
  const heroBounds = root.getBoundingClientRect();
  const periodBounds = period.getBoundingClientRect();
  if (heroBounds.width <= 0 || heroBounds.height <= 0 || periodBounds.width <= 0) return;

  const revealTranslation = { x: 0, y: 0 };
  let element: HTMLElement | null = period;
  while (element && element !== root) {
    const style = getComputedStyle(element);
    if (
      Object.hasOwn(element.dataset, 'ceremonyPart') &&
      style.display !== 'inline' &&
      style.transform !== 'none'
    ) {
      const matrix = new DOMMatrixReadOnly(style.transform);
      revealTranslation.x += matrix.m41;
      revealTranslation.y += matrix.m42;
    }
    element = element.parentElement;
  }

  return [
    clamp(
      (periodBounds.left + periodBounds.width / 2 - revealTranslation.x - heroBounds.left) /
        heroBounds.width,
    ),
    1 -
      clamp(
        (periodBounds.top + periodBounds.height / 2 - revealTranslation.y - heroBounds.top) /
          heroBounds.height,
      ),
  ];
};

export const createHeroCeremony = (
  root: HTMLElement,
  reducedMotion: MediaQueryList,
): HeroCeremonyController => {
  const session = readSession();
  const variant: HeroCeremonyVariant = window.matchMedia(DESKTOP_QUERY).matches
    ? 'desktop'
    : 'mobile';
  const profile = HERO_CEREMONY_PROFILES[variant];
  const eligibility = decideHeroCeremonyEligibility({
    hasCompleted: session.completed,
    hasHash: window.location.hash.length > 1,
    reducedMotion: reducedMotion.matches,
    storageAvailable: session.available,
  });
  const controller = new AbortController();
  const settledFrame = getHeroCeremonyFrame(profile.durationMs, variant);
  let currentFrame = eligibility.eligible ? getHeroCeremonyFrame(0, variant) : settledFrame;
  let frame: number | undefined;
  let readinessTimer: number | undefined;
  let runtime: HeroCeremonyRuntime | undefined;
  let startedAt = 0;
  let impulseInjected = false;
  let pointerDyeAvailable = !eligibility.eligible;
  let state: HeroCeremonyState = eligibility.eligible ? 'eligible' : 'skipped';
  const ceremonyParts = new Map(
    profile.reveals.map(({ part }) => [
      part,
      Array.from(document.querySelectorAll<HTMLElement>(`[data-ceremony-part="${part}"]`)),
    ]),
  );

  const revealInterface = (elapsedMs: number) => {
    for (const part of getRevealedHeroCeremonyParts(elapsedMs, variant)) {
      for (const element of ceremonyParts.get(part) ?? []) {
        element.dataset.ceremonyRevealed = 'true';
      }
    }
  };
  const revealCompleteInterface = () => revealInterface(Number.POSITIVE_INFINITY);
  const setPointerDyeAvailable = (available: boolean) => {
    pointerDyeAvailable = available;
    root.dataset.ceremonyPointerDye = available ? 'available' : 'gated';
  };
  const setState = (nextState: HeroCeremonyState) => {
    state = nextState;
    root.dataset.ceremonyState = nextState;
  };
  const clearScheduling = () => {
    if (frame !== undefined) cancelAnimationFrame(frame);
    if (readinessTimer !== undefined) window.clearTimeout(readinessTimer);
    frame = undefined;
    readinessTimer = undefined;
  };
  const rememberCompletion = () => {
    try {
      window.sessionStorage.setItem(HERO_CEREMONY_SESSION_KEY, 'true');
    } catch {
      // The resolved hero remains the fail-open state when storage becomes unavailable.
    }
  };
  const resolve = (nextState: 'settled' | 'skipped', reason?: string) => {
    if (state === 'disposed' || state === 'settled' || state === 'skipped') return;
    clearScheduling();
    currentFrame = settledFrame;
    runtime?.applyFrame(settledFrame);
    root.dataset.ceremonyProgress = '1';
    if (reason) root.dataset.ceremonySkipReason = reason;
    revealCompleteInterface();
    setPointerDyeAvailable(true);
    setState(nextState);
    rememberCompletion();
  };
  const skip = (reason: string) => resolve('skipped', reason);

  const tick = (time: number) => {
    if (state !== 'running' || !runtime) return;
    const elapsed = time - startedAt;
    currentFrame = getHeroCeremonyFrame(elapsed, variant);
    revealInterface(elapsed);
    if (!pointerDyeAvailable && isHeroPointerDyeAvailable(elapsed, variant)) {
      setPointerDyeAvailable(true);
    }

    if (!impulseInjected && elapsed >= profile.impulseMs) {
      const point = measureImpulsePoint(root);
      if (!point) {
        skip('missing-origin');
        return;
      }
      impulseInjected = true;
      root.dataset.ceremonyOrigin = `${point[0].toFixed(4)},${point[1].toFixed(4)}`;
      runtime.injectImpulse(point);
    }

    runtime.applyFrame(currentFrame);
    if (elapsed >= profile.durationMs) {
      resolve('settled');
      return;
    }
    frame = requestAnimationFrame(tick);
  };

  const start = () => {
    if (state !== 'ready' || !runtime) return;
    setState('running');
    root.dataset.ceremonyProgress = '0';
    startedAt = performance.now();
    frame = requestAnimationFrame(tick);
  };

  const ready = (nextRuntime: HeroCeremonyRuntime) => {
    runtime = nextRuntime;
    runtime.applyFrame(currentFrame);
    if (state !== 'eligible') return;
    if (readinessTimer !== undefined) window.clearTimeout(readinessTimer);
    readinessTimer = undefined;
    setState('ready');
    frame = requestAnimationFrame(start);
  };

  const isControlIntent = (target: EventTarget | null) =>
    target instanceof Element && Boolean(target.closest(INTERACTIVE_SELECTOR));
  const handleKeydown = (event: KeyboardEvent) => {
    if (event.key === 'Escape' || event.key === 'Tab' || event.key === 'Enter') {
      skip(`key-${event.key.toLowerCase()}`);
    }
  };
  const handleScrollIntent = () => skip('scroll');
  const handleControlIntent = (event: Event) => {
    if (isControlIntent(event.target)) skip(event.type);
  };
  const handleFocus = (event: FocusEvent) => {
    if (
      isControlIntent(event.target) &&
      event.target instanceof Element &&
      Boolean(event.target.closest('header, [data-fluid-hero]'))
    ) {
      skip('focus');
    }
  };
  const handleVisibility = () => {
    if (document.visibilityState === 'hidden') skip('visibility');
  };

  root.dataset.ceremonyVariant = variant;
  setState(state);
  setPointerDyeAvailable(pointerDyeAvailable);
  if (eligibility.eligible) {
    readinessTimer = window.setTimeout(
      () => skip('readiness-timeout'),
      CEREMONY_READINESS_TIMEOUT_MS,
    );
    document.addEventListener('keydown', handleKeydown, {
      capture: true,
      signal: controller.signal,
    });
    document.addEventListener('focusin', handleFocus, {
      capture: true,
      signal: controller.signal,
    });
    document.addEventListener('visibilitychange', handleVisibility, {
      signal: controller.signal,
    });
    document.addEventListener('click', handleControlIntent, {
      capture: true,
      signal: controller.signal,
    });
    document.addEventListener('pointerdown', handleControlIntent, {
      capture: true,
      signal: controller.signal,
    });
    window.addEventListener('scroll', handleScrollIntent, {
      passive: true,
      signal: controller.signal,
    });
    window.addEventListener('wheel', handleScrollIntent, {
      passive: true,
      signal: controller.signal,
    });
    window.addEventListener('touchmove', handleScrollIntent, {
      passive: true,
      signal: controller.signal,
    });
    window.addEventListener('resize', () => skip('resize'), { signal: controller.signal });
  } else {
    root.dataset.ceremonySkipReason = eligibility.reason;
    root.dataset.ceremonyProgress = '1';
    revealCompleteInterface();
  }

  return {
    allowsPointerDye: () => pointerDyeAvailable,
    dispose: () => {
      if (state === 'disposed') return;
      clearScheduling();
      controller.abort();
      runtime = undefined;
      setState('disposed');
    },
    initialFrame: currentFrame,
    ready,
    skip,
    variant,
  };
};

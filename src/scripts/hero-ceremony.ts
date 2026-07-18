export const CEREMONY_DURATION_MS = 2_100;
export const CEREMONY_IMPULSE_MS = 280;
export const HERO_CEREMONY_SESSION_KEY = 'obsolete:hero-ceremony-complete';

const CEREMONY_READINESS_TIMEOUT_MS = 800;
const DESKTOP_QUERY = '(min-width: 861px) and (hover: hover) and (pointer: fine)';
const INTERACTIVE_SELECTOR = 'a, button, input, select, textarea, [role="button"]';

export type HeroCeremonyFrame = {
  impulse: number;
  progress: number;
};

type HeroCeremonyEligibilityInput = {
  hasCompleted: boolean;
  hasHash: boolean;
  isDesktop: boolean;
  reducedMotion: boolean;
  storageAvailable: boolean;
};

type HeroCeremonyEligibility =
  | { eligible: true; reason: 'eligible' }
  | {
      eligible: false;
      reason: 'hash' | 'reduced-motion' | 'repeat-session' | 'storage' | 'viewport';
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
  skip: (reason: string) => void;
};

const clamp = (value: number) => Math.min(Math.max(value, 0), 1);
const easeOutQuint = (value: number) => 1 - (1 - value) ** 5;

export const decideHeroCeremonyEligibility = (
  input: HeroCeremonyEligibilityInput,
): HeroCeremonyEligibility => {
  if (input.hasCompleted) return { eligible: false, reason: 'repeat-session' };
  if (input.hasHash) return { eligible: false, reason: 'hash' };
  if (!input.isDesktop) return { eligible: false, reason: 'viewport' };
  if (input.reducedMotion) return { eligible: false, reason: 'reduced-motion' };
  if (!input.storageAvailable) return { eligible: false, reason: 'storage' };
  return { eligible: true, reason: 'eligible' };
};

export const getHeroCeremonyFrame = (elapsedMs: number): HeroCeremonyFrame => {
  if (elapsedMs <= CEREMONY_IMPULSE_MS) return { impulse: 0, progress: 0 };
  if (elapsedMs >= CEREMONY_DURATION_MS) return { impulse: 0, progress: 1 };

  const linearProgress = clamp(
    (elapsedMs - CEREMONY_IMPULSE_MS) / (CEREMONY_DURATION_MS - CEREMONY_IMPULSE_MS),
  );
  const progress = easeOutQuint(linearProgress);
  const impulse = Math.sin(Math.PI * linearProgress) * (1 - linearProgress * 0.35);
  return { impulse, progress };
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

  return [
    clamp((periodBounds.left + periodBounds.width / 2 - heroBounds.left) / heroBounds.width),
    1 - clamp((periodBounds.top + periodBounds.height / 2 - heroBounds.top) / heroBounds.height),
  ];
};

export const createHeroCeremony = (
  root: HTMLElement,
  reducedMotion: MediaQueryList,
): HeroCeremonyController => {
  const session = readSession();
  const eligibility = decideHeroCeremonyEligibility({
    hasCompleted: session.completed,
    hasHash: window.location.hash.length > 1,
    isDesktop: window.matchMedia(DESKTOP_QUERY).matches,
    reducedMotion: reducedMotion.matches,
    storageAvailable: session.available,
  });
  const controller = new AbortController();
  const settledFrame: HeroCeremonyFrame = { impulse: 0, progress: 1 };
  let currentFrame: HeroCeremonyFrame = eligibility.eligible
    ? { impulse: 0, progress: 0 }
    : settledFrame;
  let frame: number | undefined;
  let readinessTimer: number | undefined;
  let runtime: HeroCeremonyRuntime | undefined;
  let startedAt = 0;
  let impulseInjected = false;
  let state: HeroCeremonyState = eligibility.eligible ? 'eligible' : 'skipped';

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
    setState(nextState);
    rememberCompletion();
  };
  const skip = (reason: string) => resolve('skipped', reason);

  const tick = (time: number) => {
    if (state !== 'running' || !runtime) return;
    const elapsed = time - startedAt;
    currentFrame = getHeroCeremonyFrame(elapsed);

    if (!impulseInjected && elapsed >= CEREMONY_IMPULSE_MS) {
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
    if (elapsed >= CEREMONY_DURATION_MS) {
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

  setState(state);
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
  }

  return {
    allowsPointerDye: () => state === 'settled' || state === 'skipped',
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
  };
};

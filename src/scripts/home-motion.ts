import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';

const DESKTOP_QUERY = '(min-width: 861px) and (hover: hover) and (pointer: fine)';
const MOBILE_QUERY = '(max-width: 860px), (hover: none), (pointer: coarse)';
const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';

let disposeCurrentRuntime: (() => void) | undefined;

const select = <ElementType extends Element>(root: ParentNode, selector: string) =>
  root.querySelector<ElementType>(selector);

const selectAll = <ElementType extends Element>(root: ParentNode, selector: string) =>
  Array.from(root.querySelectorAll<ElementType>(selector));

const setupLenis = () => {
  const lenis = new Lenis({
    duration: 0.85,
    easing: (time) => Math.min(1, 1.001 - 2 ** (-10 * time)),
    smoothWheel: true,
    syncTouch: false,
    wheelMultiplier: 0.82,
  });
  const updateScrollTrigger = () => ScrollTrigger.update();
  const updateLenis = (time: number) => lenis.raf(time * 1000);
  let restartFrame: number | undefined;
  const handleAnchorClick = (event: MouseEvent) => {
    const anchor =
      event.target instanceof Element
        ? event.target.closest<HTMLAnchorElement>('a[href^="#"]')
        : null;

    if (
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey ||
      !anchor ||
      anchor.classList.contains('skip-link')
    ) {
      return;
    }

    lenis.stop();
    if (restartFrame !== undefined) cancelAnimationFrame(restartFrame);
    restartFrame = requestAnimationFrame(() => {
      lenis.start();
      lenis.resize();
      ScrollTrigger.update();
      restartFrame = undefined;
    });
  };

  document.documentElement.classList.add('home-lenis');
  document.addEventListener('click', handleAnchorClick, true);
  lenis.on('scroll', updateScrollTrigger);
  gsap.ticker.add(updateLenis);
  gsap.ticker.lagSmoothing(0);

  return () => {
    if (restartFrame !== undefined) cancelAnimationFrame(restartFrame);
    document.removeEventListener('click', handleAnchorClick, true);
    gsap.ticker.remove(updateLenis);
    gsap.ticker.lagSmoothing(500, 33);
    lenis.off('scroll', updateScrollTrigger);
    lenis.destroy();
    document.documentElement.classList.remove('home-lenis');
  };
};

const setupHeroEntrance = (root: HTMLElement, isDesktop: boolean, revealed: Set<string>) => {
  const eyebrow = select<HTMLElement>(root, '[data-motion="hero-eyebrow"]');
  const titleLines = selectAll<HTMLElement>(root, '[data-motion="hero-title-line"]');
  const clarification = select<HTMLElement>(root, '[data-motion="hero-clarification"]');
  const visual = select<HTMLElement>(root, '[data-motion="hero-visual"]');
  const targets = [eyebrow, ...titleLines, clarification, visual].filter(
    (target): target is HTMLElement => Boolean(target),
  );

  if (revealed.has('hero') || !eyebrow || titleLines.length === 0 || !clarification || !visual) {
    return;
  }
  revealed.add('hero');

  gsap.set(eyebrow, { opacity: 0, y: isDesktop ? 12 : 8 });
  gsap.set(titleLines, {
    opacity: 0,
    clipPath: 'inset(0 0 100% 0)',
    yPercent: isDesktop ? 34 : 22,
  });
  gsap.set(clarification, { y: isDesktop ? 18 : 12 });
  gsap.set(visual, { opacity: 0, scale: isDesktop ? 0.975 : 0.99, y: isDesktop ? 12 : 8 });

  gsap
    .timeline({
      defaults: { ease: 'power3.out' },
      onComplete: () => gsap.set(targets, { clearProps: 'all' }),
    })
    .to(eyebrow, { duration: 0.28, opacity: 1, y: 0 })
    .to(
      titleLines,
      {
        clipPath: 'inset(0 0 0% 0)',
        opacity: 1,
        duration: isDesktop ? 0.62 : 0.48,
        stagger: isDesktop ? 0.07 : 0.045,
        yPercent: 0,
      },
      0.08,
    )
    .to(clarification, { duration: 0.42, y: 0 }, 0.48)
    .to(visual, { duration: 0.52, opacity: 1, scale: 1, y: 0 }, 0.5);
};

const setupFeaturedWork = (root: HTMLElement, isDesktop: boolean, revealed: Set<string>) => {
  const section = select<HTMLElement>(root, '[data-motion-section="featured-work"]');
  if (!section) return;

  const textTargets = selectAll<HTMLElement>(section, '[data-motion="featured-copy"]');
  const proof = select<HTMLElement>(section, '[data-motion="featured-proof"]');
  const picture = proof?.querySelector<HTMLElement>('picture');
  const image = proof?.querySelector<HTMLElement>('img');
  const ledger = select<HTMLElement>(section, '[data-motion="featured-ledger"]');

  if (textTargets.length > 0 && !revealed.has('featured-copy')) {
    gsap.from(textTargets, {
      opacity: 0,
      clipPath: 'inset(0 0 100% 0)',
      duration: isDesktop ? 0.72 : 0.48,
      ease: 'power3.out',
      stagger: isDesktop ? 0.08 : 0.05,
      y: isDesktop ? 28 : 16,
      scrollTrigger: {
        trigger: section,
        start: isDesktop ? 'top 76%' : 'top 84%',
        once: true,
        onEnter: () => revealed.add('featured-copy'),
      },
      onComplete: () => gsap.set(textTargets, { clearProps: 'all' }),
    });
  }

  if (proof && picture && image && !revealed.has('featured-proof')) {
    const proofTimeline = gsap.timeline({
      scrollTrigger: {
        trigger: proof,
        start: isDesktop ? 'top 82%' : 'top 88%',
        once: true,
        onEnter: () => revealed.add('featured-proof'),
      },
      onComplete: () => gsap.set([picture, image], { clearProps: 'all' }),
    });

    proofTimeline
      .from(picture, {
        clipPath: isDesktop ? 'inset(0 0 100% 0)' : 'inset(0 0 60% 0)',
        duration: isDesktop ? 0.9 : 0.58,
        ease: 'power3.inOut',
      })
      .from(image, { duration: isDesktop ? 1.05 : 0.65, ease: 'power3.out', scale: 1.055 }, 0);
  }

  if (ledger && !revealed.has('featured-ledger')) {
    gsap.from(ledger, {
      duration: 0.55,
      ease: 'power2.out',
      y: isDesktop ? 20 : 12,
      scrollTrigger: {
        trigger: ledger,
        start: 'top 90%',
        once: true,
        onEnter: () => revealed.add('featured-ledger'),
      },
      onComplete: () => gsap.set(ledger, { clearProps: 'all' }),
    });
  }
};

const setupAIProductDelivery = (root: HTMLElement, isDesktop: boolean, revealed: Set<string>) => {
  const section = select<HTMLElement>(root, '[data-motion-section="ai-delivery"]');
  if (!section) return;

  const copyTargets = selectAll<HTMLElement>(section, '[data-motion="ai-delivery-copy"]');
  const field = select<HTMLElement>(section, '[data-motion="ai-delivery-field"]');

  if (copyTargets.length > 0 && !revealed.has('ai-delivery-copy')) {
    gsap.from(copyTargets, {
      opacity: 0,
      clipPath: 'inset(0 0 100% 0)',
      duration: isDesktop ? 0.72 : 0.48,
      ease: 'power3.out',
      stagger: isDesktop ? 0.09 : 0.055,
      y: isDesktop ? 28 : 16,
      scrollTrigger: {
        trigger: section,
        start: isDesktop ? 'top 74%' : 'top 84%',
        once: true,
        onEnter: () => revealed.add('ai-delivery-copy'),
      },
      onComplete: () => gsap.set(copyTargets, { clearProps: 'all' }),
    });
  }

  if (field && !revealed.has('ai-delivery-field')) {
    gsap.from(field, {
      opacity: 0,
      duration: isDesktop ? 0.68 : 0.46,
      ease: 'power2.out',
      y: isDesktop ? 28 : 16,
      scrollTrigger: {
        trigger: field,
        start: isDesktop ? 'top 84%' : 'top 90%',
        once: true,
        onEnter: () => revealed.add('ai-delivery-field'),
      },
      onComplete: () => gsap.set(field, { clearProps: 'all' }),
    });
  }
};

const setupCapabilities = (root: HTMLElement, isDesktop: boolean, revealed: Set<string>) => {
  const section = select<HTMLElement>(root, '[data-motion-section="capabilities"]');
  if (!section) return;

  const headerTargets = selectAll<HTMLElement>(section, '[data-motion="capabilities-copy"]');
  const rows = selectAll<HTMLElement>(section, '[data-motion="capability-row"]');

  if (headerTargets.length > 0 && !revealed.has('capabilities-copy')) {
    gsap.from(headerTargets, {
      opacity: 0,
      clipPath: 'inset(0 0 100% 0)',
      duration: isDesktop ? 0.72 : 0.48,
      ease: 'power3.out',
      stagger: isDesktop ? 0.09 : 0.055,
      y: isDesktop ? 28 : 16,
      scrollTrigger: {
        trigger: section,
        start: isDesktop ? 'top 74%' : 'top 84%',
        once: true,
        onEnter: () => revealed.add('capabilities-copy'),
      },
      onComplete: () => gsap.set(headerTargets, { clearProps: 'all' }),
    });
  }

  if (rows.length > 0 && !revealed.has('capabilities-rows')) {
    gsap.from(rows, {
      opacity: 0,
      duration: isDesktop ? 0.58 : 0.42,
      ease: 'power2.out',
      stagger: isDesktop ? 0.1 : 0.065,
      y: isDesktop ? 24 : 14,
      scrollTrigger: {
        trigger: rows[0],
        start: isDesktop ? 'top 82%' : 'top 88%',
        once: true,
        onEnter: () => revealed.add('capabilities-rows'),
      },
      onComplete: () => gsap.set(rows, { clearProps: 'all' }),
    });
  }
};

const setupContactTakeover = (root: HTMLElement, isDesktop: boolean, revealed: Set<string>) => {
  const section = select<HTMLElement>(root, '[data-motion-section="contact"]');
  const layer = section && select<HTMLElement>(section, '[data-motion="contact-takeover"]');
  const content = section && selectAll<HTMLElement>(section, '[data-motion="contact-copy"]');

  if (!section || !layer || !content) return;

  gsap.set(layer, { scaleY: 0, transformOrigin: 'bottom center' });
  gsap.to(layer, {
    ease: 'none',
    scaleY: 1,
    scrollTrigger: {
      end: isDesktop ? 'top 56%' : 'top 72%',
      scrub: isDesktop ? 0.35 : 0.2,
      start: isDesktop ? 'top 92%' : 'top 94%',
      trigger: section,
    },
  });

  if (content.length > 0 && !revealed.has('contact-copy')) {
    gsap.from(content, {
      opacity: 0,
      clipPath: 'inset(0 0 100% 0)',
      duration: isDesktop ? 0.68 : 0.45,
      ease: 'power3.out',
      stagger: isDesktop ? 0.1 : 0.06,
      y: isDesktop ? 26 : 14,
      scrollTrigger: {
        trigger: section,
        start: isDesktop ? 'top 66%' : 'top 78%',
        once: true,
        onEnter: () => revealed.add('contact-copy'),
      },
      onComplete: () => gsap.set(content, { clearProps: 'all' }),
    });
  }
};

export const initHomeMotion = () => {
  disposeCurrentRuntime?.();

  const root = document.querySelector<HTMLElement>('[data-home-motion]');
  if (!root) return () => {};

  gsap.registerPlugin(ScrollTrigger);
  const matchMedia = gsap.matchMedia();
  const revealed = new Set<string>();
  let disposed = false;

  matchMedia.add(
    {
      desktop: DESKTOP_QUERY,
      mobile: MOBILE_QUERY,
      reducedMotion: REDUCED_MOTION_QUERY,
    },
    (context) => {
      const conditions = context.conditions as {
        desktop: boolean;
        mobile: boolean;
        reducedMotion: boolean;
      };

      if (conditions.reducedMotion) {
        root.toggleAttribute('data-motion-ready', false);
        return;
      }

      const isDesktop = conditions.desktop;
      root.dataset.motionReady = isDesktop ? 'desktop' : 'mobile';
      const animationContext = gsap.context(() => {
        setupHeroEntrance(root, isDesktop, revealed);
        setupFeaturedWork(root, isDesktop, revealed);
        setupCapabilities(root, isDesktop, revealed);
        setupAIProductDelivery(root, isDesktop, revealed);
        setupContactTakeover(root, isDesktop, revealed);
      }, root);
      const cleanupLenis = isDesktop ? setupLenis() : undefined;

      const refreshFrame = requestAnimationFrame(() => ScrollTrigger.refresh());

      return () => {
        cancelAnimationFrame(refreshFrame);
        cleanupLenis?.();
        animationContext.revert();
        root.toggleAttribute('data-motion-ready', false);
      };
    },
  );

  const refresh = () => {
    if (!disposed) ScrollTrigger.refresh();
  };
  window.addEventListener('load', refresh, { once: true });
  void document.fonts?.ready.then(refresh);

  const dispose = () => {
    if (disposed) return;
    disposed = true;
    window.removeEventListener('load', refresh);
    matchMedia.revert();
    root.toggleAttribute('data-motion-ready', false);
    document.documentElement.classList.remove('home-lenis');
    if (disposeCurrentRuntime === dispose) disposeCurrentRuntime = undefined;
  };

  disposeCurrentRuntime = dispose;
  return dispose;
};

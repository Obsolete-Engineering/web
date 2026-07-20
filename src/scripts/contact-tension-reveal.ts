export const CONTACT_TENSION_REVEAL_EVENT = 'contact:tension-reveal';

export type ContactTensionReveal = {
  progress: number;
};

const clampProgress = (progress: number) => Math.min(Math.max(progress, 0), 1);

export const getContactTensionRevealProgress = (reveal?: ContactTensionReveal) =>
  reveal?.progress ?? 0;

export const advanceContactTensionReveal = (
  reveal: ContactTensionReveal | undefined,
  progress: number,
) => ({ progress: Math.max(getContactTensionRevealProgress(reveal), clampProgress(progress)) });

export const readContactTensionReveal = (section: HTMLElement) => {
  const progress = Number(section.dataset.contactTensionRevealProgress);
  if (!Number.isFinite(progress)) return;
  return { progress: clampProgress(progress) } satisfies ContactTensionReveal;
};

export const updateContactTensionReveal = (section: HTMLElement, progress: number) => {
  if (section.dataset.contactTensionReveal === 'settled') return { progress: 1 };

  const reveal = advanceContactTensionReveal(readContactTensionReveal(section), progress);
  section.dataset.contactTensionReveal = 'forming';
  section.dataset.contactTensionRevealProgress = String(reveal.progress);
  section.dispatchEvent(
    new CustomEvent<ContactTensionReveal>(CONTACT_TENSION_REVEAL_EVENT, { detail: reveal }),
  );
  return reveal;
};

export const settleContactTensionReveal = (section: HTMLElement) => {
  section.dataset.contactTensionReveal = 'settled';
  section.dataset.contactTensionRevealProgress = '1';
};

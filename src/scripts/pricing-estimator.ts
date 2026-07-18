import { mountSurfaceGrain } from './surface-grain';

let disposeCurrentRuntime: (() => void) | undefined;

export const initPricingEstimator = () => {
  disposeCurrentRuntime?.();

  const root = document.querySelector<HTMLElement>('[data-pricing-estimator]');
  if (!root) return () => {};

  const options = Array.from(root.querySelectorAll<HTMLButtonElement>('[data-pricing-option]'));
  const result = root.querySelector<HTMLElement>('[data-pricing-result]');
  const resultContent = root.querySelector<HTMLElement>('[data-pricing-result-content]');
  const grainRoot = root.querySelector<HTMLElement>('[data-pricing-grain]');
  const announcement = root.querySelector<HTMLElement>('[role="status"]');
  const estimateLabel = root.dataset.announcementEstimate;
  const vatLabel = root.dataset.announcementVat;

  if (
    options.length === 0 ||
    !result ||
    !resultContent ||
    !grainRoot ||
    !announcement ||
    !estimateLabel ||
    !vatLabel
  ) {
    return () => {};
  }

  const abortController = new AbortController();
  const disposeGrain = mountSurfaceGrain(grainRoot);

  const selectEngagement = (selectedOption: HTMLButtonElement) => {
    const templateId = selectedOption.dataset.pricingOption;
    const template = templateId ? document.querySelector(`#${templateId}`) : null;

    if (!(template instanceof HTMLTemplateElement)) return;

    for (const option of options) {
      option.setAttribute('aria-pressed', String(option === selectedOption));
    }

    resultContent.replaceChildren(template.content.cloneNode(true));

    const label = resultContent.querySelector('h3')?.textContent?.trim();
    const range = resultContent
      .querySelector<HTMLElement>('[data-pricing-range]')
      ?.textContent?.trim();
    if (label && range) {
      announcement.textContent = `${label}. ${estimateLabel} ${range}, ${vatLabel}.`;
    }
  };

  for (const option of options) {
    option.addEventListener('click', () => selectEngagement(option), {
      signal: abortController.signal,
    });
  }

  const dispose = () => {
    abortController.abort();
    disposeGrain();
    if (disposeCurrentRuntime === dispose) disposeCurrentRuntime = undefined;
  };

  disposeCurrentRuntime = dispose;
  return dispose;
};

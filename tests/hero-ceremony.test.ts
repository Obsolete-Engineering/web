import assert from 'node:assert/strict';
import { describe, test } from 'node:test';

import { displayFragment } from '../src/scripts/fluid-shaders';
import {
  CEREMONY_DURATION_MS,
  CEREMONY_IMPULSE_MS,
  decideHeroCeremonyEligibility,
  getHeroCeremonyFrame,
} from '../src/scripts/hero-ceremony.ts';

describe('hero ceremony eligibility', () => {
  test('allows only the first live desktop view with session storage', () => {
    assert.deepEqual(
      decideHeroCeremonyEligibility({
        hasCompleted: false,
        hasHash: false,
        isDesktop: true,
        reducedMotion: false,
        storageAvailable: true,
      }),
      { eligible: true, reason: 'eligible' },
    );
  });

  const ineligibleCases = [
    ['repeat-session', { hasCompleted: true }],
    ['hash', { hasHash: true }],
    ['viewport', { isDesktop: false }],
    ['reduced-motion', { reducedMotion: true }],
    ['storage', { storageAvailable: false }],
  ] as const;

  for (const [reason, override] of ineligibleCases) {
    test(`fails open for ${reason} ineligibility`, () => {
      assert.deepEqual(
        decideHeroCeremonyEligibility({
          hasCompleted: false,
          hasHash: false,
          isDesktop: true,
          reducedMotion: false,
          storageAvailable: true,
          ...override,
        }),
        { eligible: false, reason },
      );
    });
  }
});

describe('hero ceremony field behavior', () => {
  test('keeps authored orange local to the punctuation impulse', () => {
    assert.match(displayFragment, /punctuationOrange = exp\(-dot\(impulseOffset, impulseOffset\)/u);
    assert.match(displayFragment, /punctuationOrange \*= uCeremonyImpulse/u);
    assert.doesNotMatch(displayFragment, /color = mix\(color, orange, pressureResponse\)/u);
  });

  test('uses a broader graphite pressure response to awaken the field', () => {
    assert.match(displayFragment, /pressureFront = mix\(0\.04, 1\.3, uCeremonyProgress\)/u);
    assert.match(displayFragment, /awakening = max\(uCeremonyProgress, pressureResponse/u);
    assert.match(displayFragment, /density = restingDensity \* mix\(0\.46, 1\.0, awakening\)/u);
  });
});

describe('hero ceremony settle', () => {
  test('holds a latent field before the punctuation impulse', () => {
    assert.deepEqual(getHeroCeremonyFrame(0), { impulse: 0, progress: 0 });
    assert.deepEqual(getHeroCeremonyFrame(CEREMONY_IMPULSE_MS - 1), {
      impulse: 0,
      progress: 0,
    });
  });

  test('settles continuously to the exact resting field values', () => {
    const samples = Array.from({ length: 22 }, (_, index) => getHeroCeremonyFrame(index * 100));
    const afterImpulse = getHeroCeremonyFrame(CEREMONY_IMPULSE_MS + 1);
    const middle = getHeroCeremonyFrame(1_200);
    const settled = getHeroCeremonyFrame(CEREMONY_DURATION_MS);

    assert.ok(afterImpulse.progress > 0);
    assert.ok(afterImpulse.impulse > 0);
    assert.ok(middle.progress > afterImpulse.progress);
    assert.ok(middle.progress < 1);
    assert.ok(
      samples.every((frame, index) => index === 0 || frame.progress >= samples[index - 1].progress),
    );
    assert.deepEqual(settled, { impulse: 0, progress: 1 });
    assert.deepEqual(getHeroCeremonyFrame(CEREMONY_DURATION_MS + 500), settled);
  });
});

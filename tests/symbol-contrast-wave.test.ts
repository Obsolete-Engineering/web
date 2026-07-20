import assert from 'node:assert/strict';
import { describe, test } from 'node:test';

import { displayFragment } from '../src/scripts/fluid-shaders';
import {
  SYMBOL_CONTRAST_WAVE_PROFILE,
  advanceSymbolContrastWavePhase,
} from '../src/scripts/symbol-contrast-wave';

describe('symbol contrast wave profile', () => {
  test('keeps the agreed broad asymmetric graphite crest', () => {
    const profile = SYMBOL_CONTRAST_WAVE_PROFILE;

    assert.equal(profile.durationMs, 16_000);
    assert.ok(profile.envelopeWidth >= 0.35 && profile.envelopeWidth <= 0.45);
    assert.ok(profile.coreWidth >= 0.1 && profile.coreWidth <= 0.15);
    assert.equal(
      profile.trailingEdgeWidth + profile.coreWidth + profile.leadingEdgeWidth,
      profile.envelopeWidth,
    );
    assert.ok(profile.trailingEdgeWidth / profile.leadingEdgeWidth >= 1.15);
    assert.ok(profile.trailingEdgeWidth / profile.leadingEdgeWidth <= 1.2);
    assert.ok(profile.desktopLift >= 0.2 && profile.desktopLift <= 0.25);
    assert.ok(profile.mobileLift >= 0.15 && profile.mobileLift <= 0.2);
    assert.ok(profile.travelFraction < 1, 'the cycle includes full baseline recovery');
  });

  test('modulates graphite strength without changing displacement or orange', () => {
    assert.match(displayFragment, /uniform float uContrastWavePhase/u);
    assert.match(
      displayFragment,
      /strength \*= 1\.0 \+ contrastWave \* contrastWaveLift \* graphiteOnlyMask/u,
    );
    assert.match(displayFragment, /contrastWave \*= 1\.0 - step\([\s\S]+uContrastWavePhase/u);

    const orangeAmount = displayFragment.indexOf(
      'float orangeAmount = max(trailAlpha, punctuationOrange);',
    );
    const contrastModulation = displayFragment.indexOf(
      'strength *= 1.0 + contrastWave * contrastWaveLift * graphiteOnlyMask;',
    );
    const graphiteMix = displayFragment.indexOf('vec3 color = mix(paper, graphite');
    const orangeMix = displayFragment.indexOf('color = mix(color, orange');
    assert.ok(orangeAmount > -1 && orangeAmount < contrastModulation);
    assert.match(displayFragment, /graphiteOnlyMask = orangeAmount > 0\.0 \? 0\.0 : 1\.0/u);
    assert.ok(contrastModulation < graphiteMix);
    assert.ok(graphiteMix < orangeMix);
    assert.doesNotMatch(displayFragment, /interactiveOffset[^;]*contrastWave/u);
  });
});

describe('symbol contrast wave lifecycle', () => {
  test('starts offscreen and advances only while rendering is active', () => {
    let phase = 0;

    phase = advanceSymbolContrastWavePhase(phase, 1_600, false);
    assert.equal(phase, 0);

    phase = advanceSymbolContrastWavePhase(phase, 1_600, true);
    assert.equal(phase, 0.1);

    phase = advanceSymbolContrastWavePhase(phase, 4_000, false);
    assert.equal(phase, 0.1);

    phase = advanceSymbolContrastWavePhase(phase, 1_600, true);
    assert.equal(phase, 0.2);
  });

  test('wraps cleanly to the next offscreen-left passage', () => {
    assert.equal(advanceSymbolContrastWavePhase(0.95, 800, true), 0);
    assert.equal(advanceSymbolContrastWavePhase(0.25, 32_000, true), 0.25);
  });
});

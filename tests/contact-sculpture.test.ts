import assert from 'node:assert/strict';
import { describe, test } from 'node:test';

import {
  CONTACT_SCULPTURE_QUALITY,
  ContactSculptureInteraction,
  decideContactSculptureQuality,
} from '../src/scripts/contact-sculpture';
import {
  advanceContactTensionReveal,
  getContactTensionRevealProgress,
} from '../src/scripts/contact-tension-reveal';

describe('contact sculpture interaction', () => {
  test('eases a shallow hover dent in and out', () => {
    const interaction = new ContactSculptureInteraction();

    interaction.hover([0.8, 0.3]);
    interaction.advance(16);
    const entering = interaction.snapshot();

    assert.ok(entering.pointerStrength > 0);
    assert.ok(entering.pointerStrength < 1);
    assert.ok(entering.pointer[0] > 0.5);
    assert.ok(entering.pointer[0] < 0.8);

    interaction.leave();
    interaction.advance(16);
    const leaving = interaction.snapshot();

    assert.ok(leaving.pointerStrength > 0);
    assert.ok(leaving.pointerStrength < entering.pointerStrength);
  });

  test('deepens a press and releases one ripple from that point', () => {
    const interaction = new ContactSculptureInteraction();
    const point: [number, number] = [0.72, 0.44];

    interaction.press(point);
    interaction.advance(200);
    assert.ok(interaction.snapshot().pointerStrength > 1);

    interaction.release(point);
    const released = interaction.snapshot();

    assert.deepEqual(released.rippleOrigin, point);
    assert.equal(released.rippleAge, 0);
    assert.equal(released.rippleEnergy, 0.62);
  });

  test('redirects rapid clicks while keeping their merged ripple energy capped', () => {
    const interaction = new ContactSculptureInteraction();
    const origins: [number, number][] = [
      [0.62, 0.4],
      [0.7, 0.5],
      [0.78, 0.6],
      [0.84, 0.48],
    ];

    for (let index = 0; index < 12; index += 1) {
      const origin = origins[index % origins.length];
      interaction.press(origin);
      interaction.release(origin);
      assert.ok(interaction.snapshot().rippleEnergy <= 1);
    }

    const merged = interaction.snapshot();
    assert.deepEqual(merged.rippleOrigin, origins[3]);
    assert.equal(merged.rippleEnergy, 1);
  });

  test('cancels an interrupted press without releasing a ripple', () => {
    const interaction = new ContactSculptureInteraction();

    interaction.press([0.7, 0.5]);
    interaction.cancelPress();

    assert.equal(interaction.snapshot().rippleEnergy, 0);
    assert.equal(interaction.snapshot().pointerTargetStrength, 0);
  });
});

describe('contact tension reveal', () => {
  test('holds the loose form until the coordinated reveal begins', () => {
    assert.equal(getContactTensionRevealProgress(), 0);
    assert.equal(getContactTensionRevealProgress(advanceContactTensionReveal(undefined, 0)), 0);
  });

  test('advances monotonically as takeover and invitation progress settle', () => {
    const forming = advanceContactTensionReveal(undefined, 0.5);
    const scrolledAway = advanceContactTensionReveal(forming, 0.2);
    const settled = advanceContactTensionReveal(scrolledAway, 1.4);

    assert.equal(getContactTensionRevealProgress(forming), 0.5);
    assert.equal(getContactTensionRevealProgress(scrolledAway), 0.5);
    assert.equal(getContactTensionRevealProgress(settled), 1);
  });
});

describe('contact sculpture adaptive quality', () => {
  test('reduces strand density and render resolution to protect motion', () => {
    const [dense, balanced, economy] = CONTACT_SCULPTURE_QUALITY;

    assert.ok(dense.strandDensity > balanced.strandDensity);
    assert.ok(dense.dprCap > balanced.dprCap);
    assert.ok(balanced.strandDensity > economy.strandDensity);
    assert.ok(balanced.dprCap > economy.dprCap);
  });

  test('steps down one tier at a time before failing open', () => {
    assert.equal(decideContactSculptureQuality('dense', 28), 'balanced');
    assert.equal(decideContactSculptureQuality('balanced', 28), 'economy');
    assert.equal(decideContactSculptureQuality('economy', 28), 'fallback');
  });

  test('holds the current tier while frames remain within budget', () => {
    assert.equal(decideContactSculptureQuality('dense', 18), 'dense');
    assert.equal(decideContactSculptureQuality('balanced', 22), 'balanced');
    assert.equal(decideContactSculptureQuality('economy', 24), 'economy');
  });
});

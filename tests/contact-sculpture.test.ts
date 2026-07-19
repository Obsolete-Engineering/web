import assert from 'node:assert/strict';
import { describe, test } from 'node:test';

import {
  CONTACT_SCULPTURE_QUALITY,
  decideContactSculptureQuality,
} from '../src/scripts/contact-sculpture';

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

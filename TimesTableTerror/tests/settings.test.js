/**
 * Times Table Terror — Settings Tests
 *
 * Tests for clampSettings, applyPreset, and buildPracticeTables.
 */

'use strict';

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');

const { DEFAULT_SETTINGS, PRESETS, clampSettings, applyPreset, buildPracticeTables } =
  require('../src/settings.js');

// ---------- clampSettings ----------

describe('clampSettings', () => {
  it('returns a fresh object (does not mutate input)', () => {
    const input = { range: { min: 1, max: 3 }, questionsPerLevel: 5 };
    const clone = Object.assign({}, input);
    clampSettings(input);
    assert.deepStrictEqual(input, clone, 'input must not be mutated');
  });

  it('clamps range.min >= 1', () => {
    const r = clampSettings({ range: { min: -5, max: 6 } });
    assert.strictEqual(r.range.min, 1);
  });

  it('clamps range.max <= 12', () => {
    const r = clampSettings({ range: { min: 3, max: 99 } });
    assert.strictEqual(r.range.max, 12);
  });

  it('ensures range.min <= range.max', () => {
    const r = clampSettings({ range: { min: 8, max: 3 } });
    assert.ok(r.range.min <= r.range.max, 'min must be ≤ max');
  });

  it('clamps questionsPerLevel to [1,50]', () => {
    assert.strictEqual(clampSettings({ questionsPerLevel: -10 }).questionsPerLevel, 1);
    assert.strictEqual(clampSettings({ questionsPerLevel: 999 }).questionsPerLevel, 50);
    assert.strictEqual(clampSettings({ questionsPerLevel: 25 }).questionsPerLevel, 25);
  });

  it('clamps timeLimitSec to [1,120]', () => {
    assert.strictEqual(clampSettings({ timeLimitSec: -1 }).timeLimitSec, 1);
    assert.strictEqual(clampSettings({ timeLimitSec: 999 }).timeLimitSec, 120);
    assert.strictEqual(clampSettings({ timeLimitSec: 30 }).timeLimitSec, 30);
  });

  it('clamps lives to [1,10]', () => {
    assert.strictEqual(clampSettings({ lives: -5 }).lives, 1);
    assert.strictEqual(clampSettings({ lives: 99 }).lives, 10);
    assert.strictEqual(clampSettings({ lives: 3 }).lives, 3);
  });

  it('fills missing fields from defaults', () => {
    const r = clampSettings({});
    assert.strictEqual(r.range.min, DEFAULT_SETTINGS.range.min);
    assert.strictEqual(r.range.max, DEFAULT_SETTINGS.range.max);
    assert.strictEqual(r.questionsPerLevel, DEFAULT_SETTINGS.questionsPerLevel);
    assert.strictEqual(r.timeLimitSec, DEFAULT_SETTINGS.timeLimitSec);
    assert.strictEqual(r.lives, DEFAULT_SETTINGS.lives);
  });

  it('survives garbage input (null, undefined, non-number)', () => {
    const r = clampSettings({
      range: 'not a number',
      questionsPerLevel: 'hello',
      timeLimitSec: null,
      lives: undefined,
      practiceTables: NaN,
    });
    assert.ok(r.range.min != null);
    assert.ok(r.range.max != null);
  });

  it('survives totally null input', () => {
    const r = clampSettings(null);
    assert.deepStrictEqual(r.range, DEFAULT_SETTINGS.range);
  });

  it('handles practiceTables normalization', () => {
    const r = clampSettings({ practiceTables: [7,3,3,12,1] });
    assert.deepStrictEqual(r.practiceTables, [1, 3, 7, 12]);
  });

  it('filters out-of-range practice tables', () => {
    const r = clampSettings({ practiceTables: [0, -1, 13, 5] });
    assert.deepStrictEqual(r.practiceTables, [5]);
  });

  it('clamps empty preset to Easy name', () => {
    const r = clampSettings({ preset: 'Unknown' });
    assert.strictEqual(r.preset, DEFAULT_SETTINGS.preset);
  });
});

// ---------- applyPreset ----------

describe('applyPreset', () => {
  it('Easy sets range [1,5], qpl=10, timeLimit=15, lives=3', () => {
    const r = applyPreset('Easy', {});
    assert.deepStrictEqual(r.range, { min: 1, max: 5 });
    assert.strictEqual(r.questionsPerLevel, 10);
    assert.strictEqual(r.timeLimitSec, 15);
    assert.strictEqual(r.lives, 3);
  });

  it('Medium sets range [3,7], qpl=12, timeLimit=10, lives=3', () => {
    const r = applyPreset('Medium', {});
    assert.deepStrictEqual(r.range, { min: 3, max: 7 });
    assert.strictEqual(r.questionsPerLevel, 12);
    assert.strictEqual(r.timeLimitSec, 10);
    assert.strictEqual(r.lives, 3);
  });

  it('Hard sets range [5,12], qpl=15, timeLimit=7, lives=2', () => {
    const r = applyPreset('Hard', {});
    assert.deepStrictEqual(r.range, { min: 5, max: 12 });
    assert.strictEqual(r.questionsPerLevel, 15);
    assert.strictEqual(r.timeLimitSec, 7);
    assert.strictEqual(r.lives, 2);
  });

  it('applyPreset returns a fresh clamped object (no mutation)', () => {
    const base = { range: { min: 3, max: 6 }, lives: 5 };
    const clone = Object.assign({}, base);
    clone.range = Object.assign({}, base.range);
    applyPreset('Easy', base);
    assert.deepStrictEqual(base, clone, 'input must not be mutated');
  });

  it('merges preset over existing settings (preserves unset fields)', () => {
    const r = applyPreset('Easy', { lives: 99 }); // lives will be clamped to 10 max
    // Easy doesn't set practiceTables, so it comes from defaults
    assert.deepStrictEqual(r.range, { min: 1, max: 5 });
  });

  it('unknown preset falls back to defaults and clamps', () => {
    const r = applyPreset('SuperMegaUltra', {});
    assert.strictEqual(r.preset, DEFAULT_SETTINGS.preset);
  });
});

// ---------- buildPracticeTables ----------

describe('buildPracticeTables', () => {
  it('empty pick falls back to default range', () => {
    const tables = buildPracticeTables([], { min: 3, max: 7 });
    assert.deepStrictEqual(tables, [3, 4, 5, 6, 7]);
  });

  it('picks deduplicate and sort', () => {
    const tables = buildPracticeTables([7, 3, 7, 1, 3], null);
    assert.deepStrictEqual(tables, [1, 3, 7]);
  });

  it('filters out-of-range (0, -1, 13)', () => {
    const tables = buildPracticeTables([0, -1, 13], null);
    assert.deepStrictEqual(tables, []);
  });

  it('in-range values are kept', () => {
    const tables = buildPracticeTables([5, 8, 12], null);
    assert.deepStrictEqual(tables, [5, 8, 12]);
  });

  it('uses default range when picks is null/undefined', () => {
    const r1 = buildPracticeTables(null, { min: 1, max: 4 });
    assert.deepStrictEqual(r1, [1, 2, 3, 4]);
    const r2 = buildPracticeTables(undefined, { min: 6, max: 8 });
    assert.deepStrictEqual(r2, [6, 7, 8]);
  });

  it('falls back to DEFAULT_SETTINGS when no defaultRange given', () => {
    const tables = buildPracticeTables([], null);
    assert.deepStrictEqual(tables, [1, 2, 3, 4, 5]);
  });
});

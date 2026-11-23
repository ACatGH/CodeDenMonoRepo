/**
 * Times Table Terror — Settings module (DOM-free, ES module)
 *
 * Pure functions for difficulty presets, clamp/normalise helpers,
 * and practice-mode table picking.  No DOM or localStorage here.
 */

'use strict';

/* === TTT SETTINGS MODULE === */

const DEFAULT_SETTINGS = Object.freeze({
  range:             { min: 1, max: 5 },
  questionsPerLevel: 10,
  timeLimitSec:     15,
  lives:              3,
  practiceTables:   [],
  preset:           'Easy',
});

const PRESETS = Object.freeze({
  Easy: {
    range:             { min: 1, max: 5 },
    questionsPerLevel: 10,
    timeLimitSec:     15,
    lives:              3,
  },
  Medium: {
    range:             { min: 3, max: 7 },
    questionsPerLevel: 12,
    timeLimitSec:     10,
    lives:              3,
  },
  Hard: {
    range:             { min: 5, max: 12 },
    questionsPerLevel: 15,
    timeLimitSec:      7,
    lives:              2,
  },
});

/** Clamp a single numeric value to [lo, hi]. Returns null for non-finite. */
function clamp(val, lo, hi) {
  if (typeof val !== 'number' || !Number.isFinite(val)) return null;
  const floored = Math.floor(val);
  if (floored < lo || floored > hi) return null;
  return floored;
}

/** Clamp to [lo, hi] — forces in-bounds even when the value is out of range. */
function clampForced(val, lo, hi) {
  if (typeof val !== 'number' || !Number.isFinite(val)) return null;
  return Math.max(lo, Math.min(hi, Math.floor(val)));
}

/**
 * Clamp all fields of `input` to sensible bounds.
 * Returns a fresh object; never throws on garbage / partial input.
 * Missing or broken fields fall back to `defaults`.
 */
function clampSettings(input, defaults) {
  defaults = Object.assign({}, DEFAULT_SETTINGS, defaults);

  // Extract range values — support both flat and nested forms
  const rangeInput = (input && input.range && typeof input.range === 'object' && !Array.isArray(input.range))
    ? input.range : null;

  let min, max;
  if (rangeInput) {
    min = (typeof rangeInput.min === 'number' && Number.isFinite(rangeInput.min)) ? rangeInput.min : defaults.range.min;
    max = (typeof rangeInput.max === 'number' && Number.isFinite(rangeInput.max)) ? rangeInput.max : defaults.range.max;
  } else if (input) {
    min = (typeof input.min === 'number' && Number.isFinite(input.min)) ? input.min : defaults.range.min;
    max = (typeof input.max === 'number' && Number.isFinite(input.max)) ? input.max : defaults.range.max;
  } else {
    min = defaults.range.min;
    max = defaults.range.max;
  }

  // min >= 1, max <= 12
  if (min < 1) min = 1;
  if (max > 12) max = 12;
  // Ensure min <= max: swap if needed
  if (min > max) {
    const tmp = min;
    min = max;
    max = tmp;
  }

  // --- other numeric fields: check rangeInput first, then top-level input ---
  function getNumeric(topKey, rangeKey) {
    const ri = rangeInput && typeof rangeInput[rangeKey] === 'number' && Number.isFinite(rangeInput[rangeKey])
      ? rangeInput[rangeKey] : null;
    return ri != null ? ri : (input && typeof input[topKey] === 'number' && Number.isFinite(input[topKey])
      ? input[topKey] : undefined);
  }

  let qpl = getNumeric('questionsPerLevel', 'questionsPerLevel');
  qpl = qpl != null ? clampForced(qpl, 1, 50) : defaults.questionsPerLevel;
  let tsec = getNumeric('timeLimitSec', 'timeLimitSec');
  tsec = tsec != null ? clampForced(tsec, 1, 120) : defaults.timeLimitSec;
  let lives = getNumeric('lives', 'lives');
  lives = lives != null ? clampForced(lives, 1, 10) : defaults.lives;

  // practiceTables: normalise unique sorted list in [1..12]
  let practiceTables = [];
  if (input && Array.isArray(input.practiceTables)) {
    const set = new Set();
    for (const t of input.practiceTables) {
      const c = clamp(t, 1, 12);
      if (c != null && !set.has(c)) set.add(c);
    }
    practiceTables = [...set].sort((a, b) => a - b);
  }

  // preset name validation
  const pname = (input && typeof input.preset === 'string' && PRESETS[input.preset])
    ? input.preset : defaults.preset;

  return {
    range:             { min, max },
    questionsPerLevel: qpl,
    timeLimitSec:     tsec,
    lives:             lives,
    practiceTables:   practiceTables,
    preset:           pname,
  };
}

/**
 * Merge a preset's bundled values over `current` settings.
 * Returns a fresh object; does NOT mutate `current`.
 */
function applyPreset(name, current) {
  const base = Object.assign({}, DEFAULT_SETTINGS, current || {});
  const p = PRESETS[name];
  if (p) {
    base.preset            = name;
    base.range             = Object.assign({}, base.range, p.range);
    base.questionsPerLevel = p.questionsPerLevel != null ? p.questionsPerLevel : base.questionsPerLevel;
    base.timeLimitSec      = p.timeLimitSec     != null ? p.timeLimitSec     : base.timeLimitSec;
    base.lives             = p.lives            != null ? p.lives            : base.lives;
  }
  return clampSettings(base);
}

/**
 * Build a normalised practice-tables list from user picks.
 * Empty pick (empty / null / undefined) falls back to the default range.
 */
function buildPracticeTables(picks, defaultRange) {
  if (!Array.isArray(picks) || picks.length === 0) {
    const r = defaultRange || DEFAULT_SETTINGS.range;
    const tables = [];
    for (let i = r.min; i <= Math.min(r.max, 12); i++) {
      tables.push(i);
    }
    return tables;
  }
  const set = new Set();
  for (const t of picks) {
    const c = clamp(t, 1, 12);
    if (c != null && !set.has(c)) set.add(c);
  }
  return [...set].sort((a, b) => a - b);
}

/* ===/TTT SETTINGS MODULE=== */

// Export for Node script tag
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { DEFAULT_SETTINGS, PRESETS, clampSettings, applyPreset, buildPracticeTables };
}

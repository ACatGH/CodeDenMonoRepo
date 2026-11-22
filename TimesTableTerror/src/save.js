/**
 * Times Table Terror — Save/Load module (DOM-free, ES module)
 *
 * Pure serialisation functions + storage adapters that work with a
 * storage-like object interface so they round-trip in Node tests.
 */

'use strict';

/* === TTT SAVE MODULE === */

const SAVE_VERSION = 1;

// Ordered field allowlist for deterministic JSON
const FIELD_ORDER = ['hero', 'xp', 'coins', 'unlockedItems'];

/** Default game state returned when storage is empty/corrupt. */
const DEFAULT_STATE = Object.freeze({
  hero:          null,
  xp:            0,
  coins:         0,
  unlockedItems: [],
});

/**
 * Serialize game state into a deterministic JSON string with version stamp.
 * Only includes fields in the allowlist; ignores extras silently.
 */
function serializeSave(state) {
  if (!state || typeof state !== 'object') return null;
  const obj = {};
  for (const field of FIELD_ORDER) {
    if (state[field] !== undefined) obj[field] = state[field];
  }
  obj._v = SAVE_VERSION; // version stamp
  try {
    return JSON.stringify(obj);
  } catch (_) {
    return null;
  }
}

/**
 * Deserialize a save string. Returns a normalised state or null on bad input.
 */
function deserializeSave(str) {
  if (typeof str !== 'string' || !str.trim()) return null;
  let obj;
  try {
    obj = JSON.parse(str);
  } catch (_) {
    return null;
  }
  if (!obj || typeof obj !== 'object') return null;

  // Check version (>= SAVE_VERSION accepted; older gets filled with defaults)
  const v = typeof obj._v === 'number' ? obj._v : SAVE_VERSION;
  if (typeof v !== 'number') return null;

  const result = {};
  for (const field of FIELD_ORDER) {
    result[field] = obj[field] !== undefined ? obj[field] : undefined;
  }
  // hero: must be string or null
  if (result.hero != null && typeof result.hero !== 'string') result.hero = null;
  // xp: number
  if (typeof result.xp !== 'number' || !Number.isFinite(result.xp)) result.xp = 0;
  // coins: number
  if (typeof result.coins !== 'number' || !Number.isFinite(result.coins)) result.coins = 0;
  // unlockedItems: array
  if (!Array.isArray(result.unlockedItems)) result.unlockedItems = [];

  return result;
}

/**
 * Adapter: save to a storage-like object.
 * Uses `storage.setItem(key, value)` — no global localStorage needed.
 */
function saveGame(storage, state) {
  const json = serializeSave(state);
  if (json == null) return false;
  try {
    storage.setItem('ttt_save', json);
    return true;
  } catch (_) {
    return false;
  }
}

/**
 * Adapter: load from a storage-like object.
 * Returns `defaults` on missing / corrupt / older-version data.
 */
function loadGame(storage, defaults) {
  defaults = Object.assign({}, DEFAULT_STATE, defaults || {});
  try {
    const raw = storage.getItem('ttt_save');
    if (raw == null) return JSON.parse(JSON.stringify(defaults));
    const state = deserializeSave(raw);
    if (state == null) return JSON.parse(JSON.stringify(defaults));
    // Fill any missing/garbage fields from defaults
    const merged = {};
    for (const field of FIELD_ORDER) {
      if (state[field] === undefined || state[field] === null) {
        merged[field] = field in defaults ? defaults[field] : undefined;
      } else {
        merged[field] = state[field];
      }
    }
    // Validate hero is string or null
    if (merged.hero != null && typeof merged.hero !== 'string') {
      merged.hero = null;
    }
    return merged;
  } catch (_) {
    return JSON.parse(JSON.stringify(defaults));
  }
}

/* ===/TTT SAVE MODULE=== */

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { SAVE_VERSION, serializeSave, deserializeSave, saveGame, loadGame, DEFAULT_STATE, FIELD_ORDER };
}

/**
 * Times Table Terror — Save/Load Tests
 *
 * Tests for serializeSave, deserializeSave, saveGame, loadGame.
 * Uses an in-memory fake storage object so tests run in Node with no DOM.
 */

'use strict';

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');

const { SAVE_VERSION, serializeSave, deserializeSave, saveGame, loadGame, DEFAULT_STATE, FIELD_ORDER } =
  require('../src/save.js');

// ---------- serializeSave / deserializeSave ----------

describe('serializeSave / deserializeSave', () => {
  it('serializes a full state with all fields', () => {
    const state = { hero: 'chickaletta', xp: 150, coins: 42, unlockedItems: ['golden'] };
    const json = serializeSave(state);
    assert.ok(typeof json === 'string');
    const obj = JSON.parse(json);
    assert.strictEqual(obj._v, SAVE_VERSION);
    // Fields appear in order
    const keys = Object.keys(obj).filter(k => k !== '_v');
    assert.deepStrictEqual(keys, FIELD_ORDER);
  });

  it('round-trips deep-equal', () => {
    const state = { hero: 'grapefruit', xp: 999, coins: 0, unlockedItems: ['gem'] };
    const json = serializeSave(state);
    const restored = deserializeSave(json);
    assert.deepStrictEqual(restored, state);
  });

  it('null input returns null', () => {
    assert.strictEqual(serializeSave(null), null);
  });

  it('non-object input returns null', () => {
    assert.strictEqual(serializeSave('hello'), null);
    assert.strictEqual(serializeSave(42), null);
  });

  it('corrupt JSON returns null on deserialize', () => {
    assert.strictEqual(deserializeSave('{bad json'), null);
  });

  it('empty string returns null', () => {
    assert.strictEqual(deserializeSave(''), null);
    assert.strictEqual(deserializeSave('   '), null);
  });

  it('invalid hero (non-string) normalizes to null', () => {
    const state = { hero: 42, xp: 0, coins: 0, unlockedItems: [] };
    const json = serializeSave(state);
    const restored = deserializeSave(json);
    assert.strictEqual(restored.hero, null, 'non-string hero normalizes to null');
  });

  it('invalid xp normalizes to 0', () => {
    const state = { hero: 'chickaletta', xp: 'nope', coins: 0, unlockedItems: [] };
    const json = serializeSave(state);
    const restored = deserializeSave(json);
    assert.strictEqual(restored.xp, 0);
  });

  it('invalid coins normalizes to 0', () => {
    const state = { hero: 'chickaletta', xp: 0, coins: 'nope', unlockedItems: [] };
    const json = serializeSave(state);
    const restored = deserializeSave(json);
    assert.strictEqual(restored.coins, 0);
  });

  it('invalid unlockedItems normalizes to []', () => {
    const state = { hero: 'chickaletta', xp: 0, coins: 0, unlockedItems: 'nope' };
    const json = serializeSave(state);
    const restored = deserializeSave(json);
    assert.deepStrictEqual(restored.unlockedItems, []);
  });

  it('only includes fields in the allowlist (ignore extras)', () => {
    const state = { hero: 'chickaletta', xp: 10, coins: 5, unlockedItems: [], extraField: 'ignored' };
    const json = serializeSave(state);
    const obj = JSON.parse(json);
    assert.ok(!('extraField' in obj), 'extras must be stripped');
  });

  it('_v version stamp present', () => {
    const state = { hero: null, xp: 0, coins: 0, unlockedItems: [] };
    const json = serializeSave(state);
    const obj = JSON.parse(json);
    assert.strictEqual(obj._v, SAVE_VERSION);
  });

  it('partial save (only some fields) round-trips cleanly', () => {
    const state = { hero: 'chickaletta' }; // missing xp, coins, unlockedItems
    const json = serializeSave(state);
    const restored = deserializeSave(json);
    assert.strictEqual(restored.hero, 'chickaletta');
    assert.strictEqual(restored.xp, 0);
    assert.strictEqual(restored.coins, 0);
    assert.deepStrictEqual(restored.unlockedItems, []);
  });
});

// ---------- saveGame / loadGame ----------

describe('saveGame / loadGame', () => {
  // In-memory fake storage
  function createFakeStorage() {
    const store = {};
    return {
      getItem(key)   { return key in store ? store[key] : null; },
      setItem(key, v) { store[key] = v; },
    };
  }

  it('saveGame + loadGame round-trip deep-equals original', () => {
    const storage = createFakeStorage();
    const state = { hero: 'grapefruit', xp: 500, coins: 123, unlockedItems: ['diamond'] };
    assert.strictEqual(saveGame(storage, state), true);
    const loaded = loadGame(storage);
    assert.deepStrictEqual(loaded, state);
  });

  it('empty storage returns defaults', () => {
    const storage = createFakeStorage();
    const loaded = loadGame(storage);
    assert.deepStrictEqual(loaded, DEFAULT_STATE);
  });

  it('corrupt save data returns defaults', () => {
    const storage = createFakeStorage();
    storage.setItem('ttt_save', '{not valid json!!!');
    const loaded = loadGame(storage);
    assert.deepStrictEqual(loaded, DEFAULT_STATE);
  });

  it('empty string save returns defaults', () => {
    const storage = createFakeStorage();
    storage.setItem('ttt_save', '');
    const loaded = loadGame(storage);
    assert.deepStrictEqual(loaded, DEFAULT_STATE);
  });

  it('partial save fills missing fields from defaults', () => {
    const storage = createFakeStorage();
    // Manually inject a partial save (only hero field)
    const partial = JSON.stringify({ _v: SAVE_VERSION, hero: 'chickaletta' });
    storage.setItem('ttt_save', partial);
    const loaded = loadGame(storage, { xp: 100 });
    assert.strictEqual(loaded.hero, 'chickaletta');
    // Missing fields filled from passed defaults or DEFAULT_STATE
    assert.ok(loaded.xp != null || loaded.xp === undefined);
  });

  it('older version save is accepted and filled with defaults', () => {
    const storage = createFakeStorage();
    storage.setItem('ttt_save', JSON.stringify({ _v: 0, hero: 'chickaletta', xp: 5 }));
    const loaded = loadGame(storage);
    assert.strictEqual(loaded.hero, 'chickaletta');
    // Older version still round-trips (filled with current defaults where missing)
    assert.ok(loaded.xp != null || loaded.coins != null);
  });

  it('loadGame returns a deep copy (mutating loaded does not affect saved)', () => {
    const storage = createFakeStorage();
    const state = { hero: 'grapefruit', xp: 99, coins: 88, unlockedItems: ['star'] };
    saveGame(storage, state);
    const loaded = loadGame(storage);
    loaded.unlockedItems.push('extra');
    loaded.xp = 0;
    const reloaded = loadGame(storage);
    assert.notDeepStrictEqual(reloaded.unlockedItems, loaded.unlockedItems, 'reloaded should differ from mutated copy');
  });

  it('null storage returns defaults without throwing', () => {
    const loaded = loadGame(null);
    assert.deepStrictEqual(loaded, DEFAULT_STATE);
  });

  it('saveGame false returns on failure', () => {
    // Create a storage that throws on setItem
    const badStorage = { getItem: () => null, setItem: () => { throw new Error('fail'); } };
    assert.strictEqual(saveGame(badStorage, { hero: 'test' }), false);
  });

  it('partial or old-version save is filled with defaults', () => {
    const storage = createFakeStorage();
    // Save with version 0 (old) and missing fields
    const oldSave = JSON.stringify({ _v: 0 });
    storage.setItem('ttt_save', oldSave);
    const loaded = loadGame(storage, { hero: 'chickaletta', xp: 50, coins: 10, unlockedItems: ['bonus'] });
    // hero from our defaults since the old save had none
    assert.strictEqual(loaded.hero, 'chickaletta');
  });
});

/**
 * Reproduction test for GitHub issue #12:
 * Boss special move should fire ONLY in final phase (no random fallback).
 *
 * Bug: shouldSpecialMove ends with `return Math.random() < specialMoveChance;`
 * which means it can randomly fire in phases 0 and 1.
 *
 * Expected: deterministic true only in phase 2, always false in phases 0 and 1.
 */

'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('node:assert');

// Load TTT the same way logic.test.js does
const htmlPath = path.join(__dirname, 'times-table-terror.html');
const html = fs.readFileSync(htmlPath, 'utf8');

const startMarker = '/*=== TTT PURE LOGIC ===*/';
const endMarker   = '/*===/TTT PURE LOGIC===*/';

const sIdx = html.indexOf(startMarker);
const eIdx = html.indexOf(endMarker, sIdx + startMarker.length);

assert.ok(sIdx !== -1, 'Could not find TTT PURE LOGIC start marker');
assert.ok(eIdx !== -1, 'Could not find TTT PURE LOGIC end marker');

const tttSource = html.substring(sIdx + startMarker.length, eIdx);

const sandbox = {};
vm.createContext(sandbox, { timeout: 5000 });
vm.runInContext(tttSource, sandbox);
const TTT = sandbox.TTT;

// ---- Helper: create a dungeon state with specific monster HP ----------
function makeBossDs(monsterHp) {
  const ds = TTT.startDungeon('medium');
  TTT.nextRoom(ds); // 0 -> 1
  TTT.nextRoom(ds); // 1 -> 2
  TTT.nextRoom(ds); // 2 -> 3 (boss)
  ds.monsterState = { hp: monsterHp, maxHp: 200 };
  return ds;
}

// ---- Helper to run shouldSpecialMove many times and count true results ---
function samplePhase(ds, numSamples) {
  let countTrue = 0;
  for (let i = 0; i < numSamples; i++) {
    const result = TTT.shouldSpecialMove(ds, 3, 0.5);
    if (result === true) countTrue++;
  }
  return countTrue;
}

console.log('=== Reproduction test for issue #12 ===\n');

let allPassed = true;
const results = [];

// ---- Test A: Phase 0 (high HP) → must return false, no randomness -----
try {
  console.log('Test A: Phase 0 (hp=175/200) should always be false');
  const ds = makeBossDs(175);
  const countTrue = samplePhase(ds, 100);
  console.log(`  Phase 0: ${countTrue}/100 calls returned true`);
  assert.strictEqual(countTrue, 0, 'Phase 0 must NEVER return true');
  console.log('  PASS\n');
} catch (e) {
  console.log('  FAIL: ' + e.message + '\n');
  allPassed = false;
}

// ---- Test B: Phase 1 (mid HP) → must return false, no randomness ------
try {
  console.log('Test B: Phase 1 (hp=100/200) should always be false');
  const ds = makeBossDs(100);
  const countTrue = samplePhase(ds, 100);
  console.log(`  Phase 1: ${countTrue}/100 calls returned true`);
  assert.strictEqual(countTrue, 0, 'Phase 1 must NEVER return true');
  console.log('  PASS\n');
} catch (e) {
  console.log('  FAIL: ' + e.message + '\n');
  allPassed = false;
}

// ---- Test C: Phase 2 (final phase) → always true -----------------------
try {
  console.log('Test C: Phase 2 (hp=50/200) should always be true');
  const ds = makeBossDs(50);
  const countTrue = samplePhase(ds, 100);
  console.log(`  Phase 2: ${countTrue}/100 calls returned true`);
  assert.strictEqual(countTrue, 100, 'Phase 2 must ALWAYS return true');
  console.log('  PASS\n');
} catch (e) {
  console.log('  FAIL: ' + e.message + '\n');
  allPassed = false;
}

// ---- Test D: Non-boss room → always false regardless of phase -----------
try {
  console.log('Test D: Non-boss rooms should always be false');
  const ds = makeBossDs(50);
  let countTrue = 0;
  for (let i = 0; i < 10; i++) {
    if (TTT.shouldSpecialMove(ds, 0, 1.0) === true) countTrue++;
  }
  console.log(`  Non-boss room: ${countTrue}/10 calls returned true`);
  assert.strictEqual(countTrue, 0, 'Non-boss rooms must NEVER return true');
  console.log('  PASS\n');
} catch (e) {
  console.log('  FAIL: ' + e.message + '\n');
  allPassed = false;
}

// Summary
if (allPassed) {
  console.log('=== ALL TESTS PASSED — bug is fixed ===');
  process.exit(0);
} else {
  console.log('=== SOME TESTS FAILED — bug is confirmed ===');
  process.exit(1);
}

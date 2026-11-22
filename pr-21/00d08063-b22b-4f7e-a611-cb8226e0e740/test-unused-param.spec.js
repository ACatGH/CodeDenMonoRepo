/**
 * Regression test: `shouldSpecialMove` should NOT have a `specialMoveChance` parameter.
 *
 * After PR #14 removed the random fallback, specialMoveChance became unused.
 * This test confirms the cleanup was done correctly:
 *   - Function signature has exactly 2 params (no specialMoveChance)
 *   - Call site no longer passes a third argument
 */

'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('node:assert');

// --- Load TTT namespace from HTML ---
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

console.log('=== Regression test: no unused specialMoveChance parameter ===\n');

let allPassed = true;

// ---- Test A: Function should have exactly 2 parameters -------------------
try {
  console.log('Test A: shouldSpecialMove should have 2 params (specialMoveChance removed)');
  const paramCount = TTT.shouldSpecialMove.length;
  console.log(`  Function parameter count: ${paramCount}`);
  
  assert.strictEqual(paramCount, 2, `Expected 2 params but got ${paramCount}`);
  console.log('  PASS — unused parameter removed\n');
} catch (e) {
  console.log('  FAIL: ' + e.message + '\n');
  allPassed = false;
}

// ---- Test B: Function body does NOT reference specialMoveChance ----------
try {
  console.log('Test B: Function body should not contain "specialMoveChance"');
  
  const funcBody = html.substring(sIdx + startMarker.length, eIdx);
  const funcStart = funcBody.indexOf('function shouldSpecialMove(');
  assert.ok(funcStart !== -1, 'Could not find shouldSpecialMove function definition');
  const funcEnd = funcBody.indexOf('}', funcStart);
  
  let depth = 0;
  let i = funcStart;
  for (; i < funcBody.length; i++) {
    if (funcBody[i] === '{') depth++;
    else if (funcBody[i] === '}') {
      depth--;
      if (depth === 0) break;
    }
  }
  const funcSource = funcBody.substring(funcStart, funcEnd + 1);
  
  // Check body only (after the closing paren of params)
  const firstParamClose = funcSource.indexOf(')', funcSource.indexOf('function'));
  const bodyOnly = funcSource.substring(firstParamClose + 1);
  
  if (bodyOnly.includes('specialMoveChance')) {
    console.log('  FAIL — specialMoveChance still referenced in function body\n');
    allPassed = false;
  } else {
    console.log('  PASS — parameter is not used in the body\n');
  }
} catch (e) {
  console.log('  ERROR: ' + e.message + '\n');
  allPassed = false;
}

// ---- Test C: Call site no longer passes unused argument ------------------
try {
  console.log('Test C: Call site should have exactly 2 arguments (no chance)');
  
  // Find actual call sites in game code
  const allMatches = [...html.matchAll(/shouldSpecialMove\([^)]*\)/g)];
  assert.ok(allMatches.length > 0, 'Could not find shouldSpecialMove call site(s)');
  
  // Filter out the function definition itself
  const callSites = allMatches.filter(m => {
    const before = html.substring(Math.max(0, m.index - 20), m.index);
    return !before.includes('function ');
  });
  
  assert.ok(callSites.length > 0, 'No non-definition call sites found');
  
  for (const match of callSites) {
    const callSite = match[0];
    console.log('  Call site: ' + callSite);
    
    const parenStart = callSite.indexOf('(');
    const parenEnd = callSite.indexOf(')');
    const argsStr = callSite.substring(parenStart + 1, parenEnd);
    const argCount = argsStr.split(',').length;
    console.log(`  Argument count: ${argCount}`);
    
    assert.strictEqual(argCount, 2, `Expected 2 args but got ${argCount}`);
  }
  
  console.log('  PASS — call site cleaned up\n');
} catch (e) {
  console.log('  FAIL: ' + e.message + '\n');
  allPassed = false;
}

// Summary
console.log('---');
if (allPassed) {
  console.log('=== ALL TESTS PASSED — cleanup confirmed ===');
  process.exit(0);
} else {
  console.log('=== SOME TESTS FAILED — bug still present ===');
  process.exit(1);
}

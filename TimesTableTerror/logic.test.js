/**
 * Times Table Terror — Pure Logic Tests
 *
 * Uses Node built-ins only (vm + assert, zero dependencies).
 * Loads the TTT namespace from the marker-delimited block in
 * times-table-terror.html and tests every exported function.
 */

'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('node:assert');

// ------------------------------------------------------------------
// 1. Load the HTML file, extract the TTT block, execute in a sandbox
// ------------------------------------------------------------------

const htmlPath = path.join(__dirname, 'times-table-terror.html');
const html = fs.readFileSync(htmlPath, 'utf8');

// Extract everything between the marker comments (inclusive) and eval it.
// We use vm.createContext with an empty sandbox so nothing leaks out.
const startMarker = '/*=== TTT PURE LOGIC ===*/';
const endMarker   = '/*===/TTT PURE LOGIC===*/';

const sIdx = html.indexOf(startMarker);
const eIdx = html.indexOf(endMarker, sIdx + startMarker.length);

assert.ok(sIdx !== -1, 'Could not find TTT PURE LOGIC start marker');
assert.ok(eIdx !== -1, 'Could not find TTT PURE LOGIC end marker');

const tttSource = html.substring(
  sIdx + startMarker.length,
  eIdx
);

// Create a sandbox, contextify it, then run the TTT code inside.
const sandbox = {};
vm.createContext(sandbox, { timeout: 5000 });
vm.runInContext(tttSource, sandbox);
const TTT = sandbox.TTT;

assert.ok(TTT, 'TTT namespace must be defined after running pure-logic block');

// ------------------------------------------------------------------
// 2. HEROES
// ------------------------------------------------------------------

{
  const group = 'HEROES';
  assert.ok(TTT.HEROES, group + ' must exist');
  assert.ok(TTT.HEROES.chickaletta, 'chickaletta entry must exist');
  assert.ok(TTT.HEROES.grapefruit, 'grapefruit entry must exist');

  const chick = TTT.HEROES.chickaletta;
  assert.strictEqual(chick.name, 'Chickaletta',              'chickaletta name');
  assert.strictEqual(chick.maxHealth, 80,                     'chick maxHealth');
  assert.strictEqual(chick.attackSpeed, 120,                  'chick attackSpeed');
  assert.strictEqual(chick.scorePerHit, 30,                   'chick scorePerHit');
  assert.strictEqual(chick.damage, 25,                        'chick damage');
  assert.strictEqual(chick.ability, 'Flap Burst',             'chick ability');

  const grape = TTT.HEROES.grapefruit;
  assert.strictEqual(grape.name, 'Grapefruit',                'grapefruit name');
  assert.strictEqual(grape.maxHealth, 150,                    'grape maxHealth');
  assert.strictEqual(grape.attackSpeed, 180,                  'grape attackSpeed');
  assert.strictEqual(grape.scorePerHit, 15,                   'grape scorePerHit');
  assert.strictEqual(grape.damage, 20,                        'grape damage');
  assert.strictEqual(grape.ability, 'Chomp!',                 'grape ability');

  // Chick has higher damage and lower maxHP than grape
  assert.ok(chick.damage >= grape.damage, 'chick should deal >= as much damage as grape');
  assert.ok(chick.maxHealth < grape.maxHealth, 'chick should have lower maxHealth');
}

// ------------------------------------------------------------------
// 3. makeQuestion
// ------------------------------------------------------------------

{
  const group = 'makeQuestion';

  // Basic call — answer must equal a × b
  const q = TTT.makeQuestion({ minTable: 2, maxTable: 9 });
  assert.ok(q.a >= 2 && q.a <= 9,       'q.a in range');
  assert.ok(q.b >= 2 && q.b <= 9,       'q.b in range');
  assert.strictEqual(q.answer, q.a * q.b, 'answer == a*b');

  // Exactly 4 choices
  assert.strictEqual(q.choices.length, 4, 'choices length must be 4');

  // All choices are numbers
  q.choices.forEach(c => assert.ok(Number.isInteger(c), 'each choice is integer'));

  // The correct answer appears once in choices
  const occurrences = q.choices.filter(c => c === q.answer);
  assert.strictEqual(occurrences.length, 1, 'correct answer appears exactly once');

  // correctIndex points to the answer
  assert.strictEqual(q.choices[q.correctIndex], q.answer, 'correctIndex leads to answer');

  // All four entries are distinct
  const unique = new Set(q.choices);
  assert.strictEqual(unique.size, 4, 'all 4 choices must be distinct');

  // With a custom RNG the result is deterministic
  let counter = 0;
  const dummyRng = () => { counter++; return (counter % 7) / 7; };
  const q2 = TTT.makeQuestion({ minTable: 3, maxTable: 5 }, dummyRng);
  assert.ok(q2.answer >= 9 && q2.answer <= 25, 'answer within table bounds');

  // Range edge case: single-table (minTable == maxTable)
  const q3 = TTT.makeQuestion({ minTable: 1, maxTable: 1 });
  assert.strictEqual(q3.a, 1, 'a should be 1');
  assert.strictEqual(q3.b, 1, 'b should be 1');
  assert.strictEqual(q3.answer, 1,   'answer == 1');

  // Missing cfg → defaults (minTable=1, maxTable=5)
  const q4 = TTT.makeQuestion();
  assert.ok(q4.a >= 1 && q4.a <= 5, 'default a in [1..5]');
  assert.ok(q4.b >= 1 && q4.b <= 5, 'default b in [1..5]');

  // Distractors are positive integers (no zeros or negatives)
  const manyQs = Array.from({ length: 50 }, () => TTT.makeQuestion());
  manyQs.forEach(qq => {
    qq.choices.forEach(c => {
      assert.ok(c > 0, 'choices must be > 0');
    });
  });
}

// ------------------------------------------------------------------
// 4. isCorrect
// ------------------------------------------------------------------

{
  const group = 'isCorrect';
  const q = TTT.makeQuestion({ minTable: 3, maxTable: 7 });

  assert.strictEqual(TTT.isCorrect(q, q.correctIndex), true, 'correct index returns true');
  assert.strictEqual(TTT.isCorrect(q, (q.correctIndex + 1) % 4), false, 'wrong index returns false');
}

// ------------------------------------------------------------------
// 5. comboMult
// ------------------------------------------------------------------

{
  const group = 'comboMult';
  assert.strictEqual(TTT.comboMult(0),   1,    'combo=0 → x1');
  assert.strictEqual(TTT.comboMult(1),   1,    'combo=1 → x1');
  assert.strictEqual(TTT.comboMult(2),   1,    'combo=2 → x1');
  assert.strictEqual(TTT.comboMult(3),   1.5,  'combo=3 → x1.5');
  assert.strictEqual(TTT.comboMult(4),   1.5,  'combo=4 → x1.5');
  assert.strictEqual(TTT.comboMult(5),   1.5,  'combo=5 → x1.5');
  assert.strictEqual(TTT.comboMult(6),   2,    'combo=6 → x2');
  assert.strictEqual(TTT.comboMult(10),  2,    'combo=10 → x2');
}

// ------------------------------------------------------------------
// 6. xpForCorrect  &  coinsForCorrect
// ------------------------------------------------------------------

{
  const group = 'xpForCorrect';

  // Chick (scorePerHit=30): base 30 at combo 0, 45 at combo 3, 60 at combo 6
  const chick = TTT.HEROES.chickaletta;
  assert.strictEqual(TTT.xpForCorrect(chick, 0), 30,         'chick xp at combo 0');
  assert.strictEqual(TTT.xpForCorrect(chick, 2), 30,         'chick xp at combo 2');
  assert.strictEqual(TTT.xpForCorrect(chick, 3), 45,         'chick xp at combo 3');
  assert.strictEqual(TTT.xpForCorrect(chick, 6), 60,         'chick xp at combo 6');

  // Grape (scorePerHit=15): base 15 at combo 0 → Math.round(15*1)=15
  const grape = TTT.HEROES.grapefruit;
  assert.strictEqual(TTT.xpForCorrect(grape, 0), 15,         'grape xp at combo 0');
  assert.strictEqual(TTT.xpForCorrect(grape, 3), 23,         'grape xp at combo 3 (round)');
}

{
  const group = 'coinsForCorrect';

  // Chick: base = Math.max(1, 30/5 | 0) = 6. Combo 0 → 6*1=6
  const chick = TTT.HEROES.chickaletta;
  assert.strictEqual(TTT.coinsForCorrect(chick, 0), 6,       'chick coins at combo 0');
  assert.strictEqual(TTT.coinsForCorrect(chick, 3), 9,       'chick coins at combo 3 (round)');

  // Grape: base = Math.max(1, 15/5 | 0) = 3. Combo 0 → 3*1=3
  const grape = TTT.HEROES.grapefruit;
  assert.strictEqual(TTT.coinsForCorrect(grape, 0), 3,       'grape coins at combo 0');
  assert.strictEqual(TTT.coinsForCorrect(grape, 3), 5,       'grape coins at combo 3 (round)');
}

// ------------------------------------------------------------------
// 7. applyHitToMonster
// ------------------------------------------------------------------

{
  const group = 'applyHitToMonster';

  // Deal damage — HP decreases, defeated only at 0
  let mon = { hp: 50, maxHp: 50 };
  let r1  = TTT.applyHitToMonster(mon, 20);
  assert.strictEqual(r1.hp, 30,   'hp after 20 dmg');
  assert.strictEqual(r1.defeated, false, 'not defeated at 30 hp');

  // Lethal hit
  let mon2 = { hp: 20, maxHp: 50 };
  let r2   = TTT.applyHitToMonster(mon2, 20);
  assert.strictEqual(r2.hp, 0,    'hp at exactly damage');
  assert.strictEqual(r2.defeated, true, 'defeated at 0 hp');

  // Overkill — capped at 0, not negative
  let mon3 = { hp: 5, maxHp: 50 };
  let r3   = TTT.applyHitToMonster(mon3, 100);
  assert.strictEqual(r3.hp, 0,    'overkill capped at 0');

  // No damage — no change
  let mon4 = { hp: 40, maxHp: 50 };
  let r4   = TTT.applyHitToMonster(mon4, 0);
  assert.strictEqual(r4.hp, 40, 'zero damage preserves hp');
}

// ------------------------------------------------------------------
// 8. applyHitBackToHero (shield absorbs first)
// ------------------------------------------------------------------

{
  const group = 'applyHitBackToHero';

  // Shield fully absorbs — no health loss
  let h1 = { shield: 30, health: 80 };
  let r1 = TTT.applyHitBackToHero(h1, 20);
  assert.strictEqual(r1.shield, 10,    'shield after absorb');
  assert.strictEqual(r1.health, 80,    'health untouched');
  assert.strictEqual(r1.defeated, false, 'not defeated');

  // Partial shield — damage leaks into health
  let h2 = { shield: 10, health: 50 };
  let r2 = TTT.applyHitBackToHero(h2, 30);
  assert.strictEqual(r2.shield, 0,     'shield depleted');
  assert.strictEqual(r2.health, 30,    'health reduced by leak (20)');
  assert.strictEqual(r2.defeated, false, 'not defeated');

  // Overwhelming hit — hero defeated
  let h3 = { shield: 5, health: 10 };
  let r3 = TTT.applyHitBackToHero(h3, 50);
  assert.strictEqual(r3.health, 0,     'health to 0');
  assert.strictEqual(r3.defeated, true, 'defeated at 0 hp');

  // Shield only, no health — exact absorption
  let h4 = { shield: 25, health: 100 };
  let r4 = TTT.applyHitBackToHero(h4, 25);
  assert.strictEqual(r4.shield, 0,     'shield fully consumed');
  assert.strictEqual(r4.health, 100,   'health untouched');

  // No shield at all — damage goes straight to health
  let h5 = { shield: 0, health: 80 };
  let r5 = TTT.applyHitBackToHero(h5, 30);
  assert.strictEqual(r5.health, 50,    'health dropped by full dmg');

  // No shield or health — defeated
  let h6 = { shield: 0, health: 0 };
  let r6 = TTT.applyHitBackToHero(h6, 10);
  assert.strictEqual(r6.defeated, true, 'already at 0 → defeated');
}

// ------------------------------------------------------------------
// 9. timeLimitFor
// ------------------------------------------------------------------

{
  const group = 'timeLimitFor';

  // Known difficulty presets
  assert.strictEqual(TTT.timeLimitFor({ difficulty: 'easy' }),   15, 'easy preset');
  assert.strictEqual(TTT.timeLimitFor({ difficulty: 'medium' }), 12, 'medium preset');
  assert.strictEqual(TTT.timeLimitFor({ difficulty: 'hard' }),    9, 'hard preset');

  // Unknown difficulty falls back to easy
  assert.strictEqual(TTT.timeLimitFor({ difficulty: 'impossible' }), 15, 'unknown → easy default');

  // No cfg → also defaults (undefined → empty obj)
  assert.strictEqual(TTT.timeLimitFor(), 15, 'no arg → easy=15');

  // Custom timeLimit overrides preset
  assert.strictEqual(TTT.timeLimitFor({ difficulty: 'hard', timeLimit: 30 }), 30, 'custom override');
  assert.strictEqual(TTT.timeLimitFor({ timeLimit: 8 }), 8, 'override without difficulty key');
}

// ------------------------------------------------------------------
// 10. nextLevelXp
// ------------------------------------------------------------------

{
  const group = 'nextLevelXp';
  assert.strictEqual(TTT.nextLevelXp(0), 10,   'level 0 → 10');
  assert.strictEqual(TTT.nextLevelXp(1), 25,   'level 1 → 25');
  assert.strictEqual(TTT.nextLevelXp(2), 40,   'level 2 → 40');
  assert.strictEqual(TTT.nextLevelXp(3), 55,   'level 3 → 55');

  // Monotonic increasing
  for (let lvl = 0; lvl < 99; lvl++) {
    const curr = TTT.nextLevelXp(lvl);
    const next = TTT.nextLevelXp(lvl + 1);
    assert.ok(next > curr, `nextLevelXp(${lvl+1}) ${next} > ${curr}`);
  }
}

// ------------------------------------------------------------------
// Done
// ------------------------------------------------------------------

console.log('All ' + Object.keys(TTT).length + ' TTT functions verified successfully.');

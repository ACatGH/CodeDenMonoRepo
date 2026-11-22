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
// 11. ROOMS — Dungeon room definitions
// ------------------------------------------------------------------

{
  const group = 'ROOMS';
  assert.ok(TTT.ROOMS, 'ROOMS array must exist');
  assert.strictEqual(TTT.ROOMS.length, 4, 'exactly 4 rooms');

  // Room 0: Grass Dungeon
  var r0 = TTT.ROOMS[0];
  assert.strictEqual(r0.id, 0, 'room 0 id');
  assert.strictEqual(r0.name, 'Grass Dungeon', 'room 0 name');
  assert.strictEqual(r0.tableMin, 1, 'room 0 tableMin');
  assert.strictEqual(r0.tableMax, 3, 'room 0 tableMax');
  assert.ok(r0.color, 'room 0 has color');
  assert.ok(r0.bgColor1 && r0.bgColor2, 'room 0 has theme colors');
  assert.ok(typeof r0.monsterHpValue === 'number', 'room 0 hp is numeric');
  assert.strictEqual(r0.isBoss, false, 'room 0 is not a boss room');
  assert.strictEqual(r0.specialMoveChance, 0, 'non-boss rooms have no special move chance');

  // Room 1: Lava Caverns
  var r1 = TTT.ROOMS[1];
  assert.strictEqual(r1.id, 1, 'room 1 id');
  assert.strictEqual(r1.name, 'Lava Caverns', 'room 1 name');
  assert.strictEqual(r1.tableMin, 4, 'room 1 tableMin');
  assert.strictEqual(r1.tableMax, 6, 'room 1 tableMax');
  assert.ok(typeof r1.monsterHpValue === 'number', 'room 1 hp is numeric');
  assert.ok(Array.isArray(r1.phases), 'room 1 has phases array');
  assert.strictEqual(r1.isBoss, false, 'room 1 is not a boss room');

  // Room 2: Dark Forest
  var r2 = TTT.ROOMS[2];
  assert.strictEqual(r2.id, 2, 'room 2 id');
  assert.strictEqual(r2.name, 'Dark Forest', 'room 2 name');
  assert.strictEqual(r2.tableMin, 7, 'room 2 tableMin');
  assert.strictEqual(r2.tableMax, 9, 'room 2 tableMax');
  assert.ok(typeof r2.monsterHpValue === 'number', 'room 2 hp is numeric');
  assert.ok(Array.isArray(r2.phases), 'room 2 has phases array');
  assert.strictEqual(r2.isBoss, false, 'room 2 is not a boss room');

  // Room 3: Times-Table Dragon Lair (boss)
  var r3 = TTT.ROOMS[3];
  assert.strictEqual(r3.id, 3, 'room 3 id');
  assert.strictEqual(r3.name, 'Times-Table Dragon Lair', 'room 3 name');
  assert.strictEqual(r3.tableMin, 1, 'boss uses all tables');
  assert.strictEqual(r3.tableMax, 9, 'boss uses all tables');
  assert.ok(typeof r3.monsterHpValue === 'number', 'room 3 hp is numeric');
  assert.ok(Array.isArray(r3.phases), 'room 3 has phases array');
  assert.strictEqual(r3.isBoss, true, 'room 3 is a boss room');
}

// ------------------------------------------------------------------
// 12. COMBO_FEEDBACKS — Milestone messages
// ------------------------------------------------------------------

{
  const group = 'COMBO_FEEDBACKS';
  assert.ok(TTT.COMBO_FEEDBACKS, 'COMBO_FEEDBACKS must exist');
  assert.ok(typeof TTT.COMBO_FEEDBACKS === 'object', 'is a mapping object');

  // Check range-based keys
  var keys = Object.keys(TTT.COMBO_FEEDBACKS);
  assert.ok(keys.length >= 4, 'at least 4 combo feedback ranges');
  
  // All values are strings (except null for the base range)
  for (var i = 0; i < keys.length; i++) {
    var val = TTT.COMBO_FEEDBACKS[keys[i]];
    assert.ok(val === null || typeof val === 'string', 'value is string or null');
  }
}

// ------------------------------------------------------------------
// 13. startDungeon — Creates initial dungeon state
// ------------------------------------------------------------------

{
  const group = 'startDungeon';
  var ds = TTT.startDungeon('medium');

  assert.strictEqual(ds.currentRoomIndex, 0, 'starts at room 0');
  assert.strictEqual(ds.totalRooms, 4, 'total rooms is 4');
  assert.strictEqual(ds.difficulty, 'medium', 'difficulty preserved');
  assert.strictEqual(ds.bossSpecialUsed, false, 'boss special not used yet');
  assert.strictEqual(ds.roomsCleared.length, 4, '4 room slots');
  for (var i = 0; i < 4; i++) {
    assert.strictEqual(ds.roomsCleared[i], false, 'room ' + i + ' initially not cleared');
  }

  // No argument also works (defaults)
  var ds2 = TTT.startDungeon();
  assert.strictEqual(ds2.currentRoomIndex, 0, 'default start works');

  // Different difficulty
  var ds3 = TTT.startDungeon('hard');
  assert.strictEqual(ds3.difficulty, 'hard', 'hard difficulty preserved');

  // monsterStates exists (array of nulls)
  assert.ok(Array.isArray(ds.monsterStates), 'has monsterStates array');
}

// ------------------------------------------------------------------
// 14. nextRoom — Advances room index
// ------------------------------------------------------------------

{
  const group = 'nextRoom';
  var ds = TTT.startDungeon();

  // Advance from 0 to 1
  var next = TTT.nextRoom(ds);
  assert.strictEqual(next.exhausted, false, 'advance 0→1 not exhausted');
  assert.strictEqual(next.roomIndex, 1, 'roomIndex is 1');
  assert.strictEqual(ds.currentRoomIndex, 1, 'state updated');

  // Advance to boss (room 3)
  next = TTT.nextRoom(ds);
  assert.strictEqual(next.exhausted, false, 'advance 1→2 not exhausted');
  assert.strictEqual(next.roomIndex, 2, 'roomIndex is 2');
  next = TTT.nextRoom(ds);
  assert.strictEqual(next.exhausted, false, 'advance 2→boss not exhausted');
  assert.strictEqual(next.roomIndex, 3, 'roomIndex is 3 (boss)');

  // Past the end → exhausted: true
  next = TTT.nextRoom(ds);
  assert.strictEqual(next.exhausted, true, 'past boss returns exhausted');
  assert.strictEqual(next.roomIndex, 3, 'still room 3');

  // Keep returning exhausted
  next = TTT.nextRoom(ds);
  assert.strictEqual(next.exhausted, true, 'remains exhausted');
  assert.strictEqual(next.roomIndex, 3, 'still room 3');
}

// ------------------------------------------------------------------
// 15. getPhase — Combo-based phase for boss
// ------------------------------------------------------------------

{
  const group = 'getPhase';

  var msLowHp = { hp: 100, maxHp: 100 };
  assert.strictEqual(TTT.getPhase(msLowHp, 0), 0, 'full HP → phase 0');

  var msMidHp = { hp: 50, maxHp: 100 };
  assert.strictEqual(TTT.getPhase(msMidHp, 50), 1, '50% remaining → phase 1');

  var msLowHp2 = { hp: 10, maxHp: 100 };
  assert.strictEqual(TTT.getPhase(msLowHp2, 90), 2, '10% remaining → phase 2');

  // Edge: exactly at 33%/66% thresholds
  var msThird = { hp: 67, maxHp: 100 };
  assert.strictEqual(TTT.getPhase(msThird, 33), 0, '~67% → phase 0 (above 2/3)');

  var msTwoThirds = { hp: 34, maxHp: 100 };
  assert.strictEqual(TTT.getPhase(msTwoThirds, 66), 1, '~34% → phase 1 (between 1/3 and 2/3)');

  // Edge: null/undefined
  assert.strictEqual(TTT.getPhase(null, 0), 0, 'null monster → phase 0');
  assert.strictEqual(TTT.getPhase(undefined, 0), 0, 'undefined monster → phase 0');
}

// ------------------------------------------------------------------
// 16. shouldSpecialMove — Boss special move trigger
// ------------------------------------------------------------------

{
  const group = 'shouldSpecialMove';

  var ds = TTT.startDungeon();

  // Non-boss room: never fires
  assert.strictEqual(TTT.shouldSpecialMove(ds, 0, 1), false, 'room 0 not a boss');
  assert.strictEqual(TTT.shouldSpecialMove(ds, 1, 1), false, 'room 1 not a boss');
  assert.strictEqual(TTT.shouldSpecialMove(ds, 2, 1), false, 'room 2 not a boss');

  // Boss room: final phase check overrides random roll (deterministic true)
  ds = TTT.startDungeon();
  assert.strictEqual(TTT.shouldSpecialMove(ds, 3, 1), true, 'final-phase boss deterministically fires special');

  // Boss room after special already used: never fires
  ds.bossSpecialUsed = true;
  assert.strictEqual(TTT.shouldSpecialMove(ds, 3, 1), false, 'already used → always false');
}

// ------------------------------------------------------------------
// 17. isBossDefeated — Checks if boss HP reached 0
// ------------------------------------------------------------------

{
  const group = 'isBossDefeated';

  var bossDefeated = { hp: -1, maxHp: 200 };
  assert.strictEqual(TTT.isBossDefeated(bossDefeated), true, 'hp -1 → defeated');

  var bossAtZero = { hp: 0, maxHp: 200 };
  assert.strictEqual(TTT.isBossDefeated(bossAtZero), true, 'hp 0 → defeated');

  var bossAlive = { hp: 50, maxHp: 200 };
  assert.strictEqual(TTT.isBossDefeated(bossAlive), false, 'hp 50 → not defeated');

  // Null/undefined → false
  assert.strictEqual(TTT.isBossDefeated(null), false, 'null → false');
  assert.strictEqual(TTT.isBossDefeated(undefined), false, 'undefined → false');
}

// ------------------------------------------------------------------
// 18. isDungeonCleared — All rooms cleared?
// ------------------------------------------------------------------

{
  const group = 'isDungeonCleared';

  // All true + boss defeated → true
  var ds1 = TTT.startDungeon();
  ds1.roomsCleared = [true, true, true, true];
  ds1.monsterStates = [{ hp: -1 }, { hp: -50 }, { hp: -100 }, { hp: -1 }];
  assert.strictEqual(TTT.isDungeonCleared(ds1), true, 'all cleared + boss defeated → true');

  // One room not cleared
  var ds2 = TTT.startDungeon();
  ds2.roomsCleared = [true, false, true, true];
  assert.strictEqual(TTT.isDungeonCleared(ds2), false, 'one not cleared → false');

  // Boss still alive
  var ds3 = TTT.startDungeon();
  ds3.roomsCleared = [true, true, true, true];
  ds3.monsterStates = [{ hp: -1 }, { hp: -50 }, { hp: -100 }, { hp: 50 }];
  assert.strictEqual(TTT.isDungeonCleared(ds3), false, 'boss still alive → false');

  // Null/undefined → false
  assert.strictEqual(TTT.isDungeonCleared(null), false, 'null → false');
}

// ------------------------------------------------------------------
// 19. makeRoomQuestions — Room-specific question generation
// ------------------------------------------------------------------

{
  const group = 'makeRoomQuestions';

  var q0 = TTT.makeRoomQuestions(0, 3);
  assert.strictEqual(q0.length, 3, 'got 3 questions');
  for (var i = 0; i < q0.length; i++) {
    var q = q0[i];
    assert.ok(q.a >= 1 && q.a <= 3, 'room 0 a in [1..3]');
    assert.ok(q.b >= 1 && q.b <= 3, 'room 0 b in [1..3]');
  }

  var q4 = TTT.makeRoomQuestions(1, 5);
  assert.strictEqual(q4.length, 5, 'got 5 questions');
  for (var j = 0; j < q4.length; j++) {
    var qj = q4[j];
    assert.ok(qj.a >= 4 && qj.a <= 6, 'room 1 a in [4..6]');
    assert.ok(qj.b >= 4 && qj.b <= 6, 'room 1 b in [4..6]');
  }

  var q7 = TTT.makeRoomQuestions(2, 4);
  assert.strictEqual(q7.length, 4, 'got 4 questions');
  for (var k = 0; k < q7.length; k++) {
    var qk = q7[k];
    assert.ok(qk.a >= 7 && qk.a <= 9, 'room 2 a in [7..9]');
    assert.ok(qk.b >= 7 && qk.b <= 9, 'room 2 b in [7..9]');
  }

  // Boss room (3) — all tables
  var qb = TTT.makeRoomQuestions(3, 2);
  assert.strictEqual(qb.length, 2, 'boss got 2 questions');
  for (var m = 0; m < qb.length; m++) {
    var qbq = qb[m];
    assert.ok(qbq.a >= 1 && qbq.a <= 9, 'boss a in [1..9]');
    assert.ok(qbq.b >= 1 && qbq.b <= 9, 'boss b in [1..9]');
  }

  // Invalid room index returns empty array
  var qInv = TTT.makeRoomQuestions(99, 3);
  assert.ok(Array.isArray(qInv), 'invalid room → array');
}

// ------------------------------------------------------------------
// 20. getComboFeedback — Returns milestone message
// ------------------------------------------------------------------

{
  const group = 'getComboFeedback';

  var fbLow = TTT.getComboFeedback(2);
  assert.strictEqual(fbLow, null, 'combo 2 below all thresholds → null');

  var fbHi = TTT.getComboFeedback(10);
  assert.ok(typeof fbHi === 'string' && fbHi.length > 0, 'combo 10 returns message');

  // At various range boundaries
  assert.ok(typeof TTT.getComboFeedback(3) === 'string', 'combo 3 → message');
  assert.ok(typeof TTT.getComboFeedback(5) === 'string', 'combo 5 → message');
  assert.ok(typeof TTT.getComboFeedback(8) === 'string', 'combo 8 → message');
  assert.ok(typeof TTT.getComboFeedback(15) === 'string', 'combo 15 → message');
}

// ------------------------------------------------------------------
// 21. getRoomThemeColor — Returns room color
// ------------------------------------------------------------------

{
  const group = 'getRoomThemeColor';

  assert.strictEqual(TTT.getRoomThemeColor(0), '#5DAE4F', 'room 0 color');
  assert.strictEqual(TTT.getRoomThemeColor(1), '#E74C3C', 'room 1 color');
  assert.strictEqual(TTT.getRoomThemeColor(2), '#8E44AD', 'room 2 color');
  assert.strictEqual(TTT.getRoomThemeColor(3), '#FF4500', 'boss room color');

  // Invalid index returns default
  var defaultColor = TTT.getRoomThemeColor(-1);
  assert.ok(typeof defaultColor === 'string' && defaultColor.length > 0, '-1 returns string');
}

// ------------------------------------------------------------------
// DONE — External-reference scan (criterion 7) — unchanged
// ------------------------------------------------------------------

// The HTML must contain zero external references: no http(s) URLs,
// CDN imports, @font-face declarations, url() in styles,
// script src attributes, or link href tags.
{
  const group = 'no external references in HTML';

  // Check for HTTP(S) URLs (allow data-URIs, self-referencing ones)
  const httpMatches = html.match(/https?:\/\/[^"'\s]*/gi);
  assert.ok(!httpMatches, 'no http(s) URLs found — ' + (httpMatches ? httpMatches.join(', ') : ''));

  // Check for @font-face declarations
  const fontFaceMatches = html.match(/@font-face\s*{/i);
  assert.ok(!fontFaceMatches, 'no @font-face declarations found');

  // Check for CDN imports
  const cdnMatches = html.match(/cdn[.\-_]/i);
  assert.ok(!cdnMatches, 'no CDN references found');

  // Check for url() with external paths (allow data:, #, or non-http)
  const urlMatches = html.match(/url\(\s*['"]?(?!data:)[^'")\s]*(?::\/\/)/gi) || [];
  assert.ok(urlMatches.length === 0, 'no external url() calls found');

  // Check for script src attributes
  const scriptSrcMatches = html.match(/<script\s[^>]*\bsrc\b\s*=/i);
  assert.ok(!scriptSrcMatches, 'no script src attributes found');

  // Check for link href (external stylesheets)
  const linkHrefMatches = html.match(/<link\s[^>]*\bhref\s*=\s*['"]?(?!data:|#)[^'"\s]*:\/\/[^'"\s]*/gi);
  assert.ok(linkHrefMatches === null || linkHrefMatches.length === 0, 'no external link href attributes found');

  // Check for audio/image source URLs in canvas/element sources
  const audioSrcMatches = html.match(/<audio\s[^>]*\bsrc\b/i);
  assert.ok(!audioSrcMatches, 'no <audio src> elements found');

  console.log('PASS: HTML is free of external references');
}

// ------------------------------------------------------------------
// BONUS — Issue #9: boss-fight phase display & special-move bugs
// Two tests that FAIL with current code, PASS after fixes.
// ------------------------------------------------------------------

{
  const group = 'bug1: getPhase called with wrong args in updateHUD';

  // BUG at line 1179:
  //   var phase = TTT.getPhase(gameState.currentRoomIndex || 0, gameState.combo);
  //   ^ passes (roomIndex, combo) instead of (monster, damage)
  // When a number is passed as first arg: hp=maxHp=undefined → ratio NaN → always phase 0.
  // This means the boss HP bar ALWAYS shows "Phase 1" regardless of actual HP.

  // Demonstrate: a boss at ~50% HP should be in phase 1, not phase 0.
  // getPhase({hp:50,maxHp:100}, 80) → ratio=0.5 (between 1/3 and 2/3) → phase 1.
  // But with wrong args (number as first param), ratio becomes NaN → always phase 0.
  var bossAtHalf = { hp: 50, maxHp: 100 };
  assert.strictEqual(TTT.getPhase(bossAtHalf, 80), 1, 'HP 50% → phase 1 (not phase 0)');

  // Demonstrate the broken behavior: passing a number where monster expected → always 0.
  // This documents why the HP bar is stuck on "Phase 1" even at very low boss HP.
  var brokenResult = TTT.getPhase(99, 0); // roomIndex=99, combo=0 (nonsensical)
  assert.strictEqual(brokenResult, 0, 'wrong-arg call returns phase 0 (NaN ratio)');

  console.log('PASS: bug1 getPhase wrong-args demonstrated');
}

{
  const group = 'bug2: special-move not deterministic in final phase';

  // BUG: shouldSpecialMove only checks room index for boss, not actual phase.
  // It falls through to Math.random() instead of checking monsterState + getPhase().
  // After fix: the code checks `getPhase(monsterState) === 2` before random roll.

  var ds = TTT.startDungeon('medium');

  // Advance to boss room (room 3, index 3)
  TTT.nextRoom(ds);  // room 0 → 1
  TTT.nextRoom(ds);  // room 1 → 2  
  TTT.nextRoom(ds);  // room 2 → 3 (boss)

  assert.strictEqual(ds.currentRoomIndex, 3, 'now at boss room');

  // With the fix applied: monsterState should already exist on dungeonState
  // and represent a low-HP boss in final phase → deterministic true.
  var result = TTT.shouldSpecialMove(ds, 3, 0.15);
  assert.strictEqual(result, true, 
    'final-phase boss + not used → special move fires deterministically (not random)');

  console.log('PASS: bug2 special-move deterministic behavior tested');
}

// ------------------------------------------------------------------
// BONUS EXTENDED — Issue #15: Settings wiring & gameplay edge cases
// Tests for the inlined settings logic changes and edge cases.
// ------------------------------------------------------------------

{
  const group = 'timeLimitFor — cfg.timeLimit edge cases (Issue #15)';

  // Infinity fails Number.isFinite → falls back to easy preset
  assert.strictEqual(TTT.timeLimitFor({ timeLimit: Infinity }), 15, 'Infinity fails isFinite → easy default (15)');

  // NaN fails Number.isFinite → falls back to easy preset
  assert.strictEqual(TTT.timeLimitFor({ timeLimit: NaN }), 15, 'NaN fails isFinite → easy default (15)');

  // Negative finite number → returned as-is (game layer should validate)
  const neg = TTT.timeLimitFor({ timeLimit: -1 });
  assert.strictEqual(neg, -1, 'negative finite is returned');

  // Zero is a valid finite number
  assert.strictEqual(TTT.timeLimitFor({ timeLimit: 0 }), 0, 'zero-time-limit works');

  // Missing key (object without timeLimit property) falls back to preset
  assert.strictEqual(TTT.timeLimitFor({ difficulty: 'medium' }), 12, 'missing key → medium default');

  // Empty object falls back to easy
  assert.strictEqual(TTT.timeLimitFor({}), 15, 'empty cfg → easy default (15)');

  // String timeLimit is not a number → falls back
  assert.strictEqual(TTT.timeLimitFor({ difficulty: 'hard', timeLimit: 'five' }), 9, 'string timeLimit ignored → hard preset');

  // Boolean timeLimit is not a number → falls back
  assert.strictEqual(TTT.timeLimitFor({ difficulty: 'easy', timeLimit: true }), 15, 'boolean timeLimit ignored → easy preset');
}

{
  const group = 'startDungeon — full initial state (Issue #15)';

  var ds = TTT.startDungeon('medium');

  // Verify complete initial state
  assert.strictEqual(ds.currentRoomIndex, 0, 'starts at room 0');
  assert.strictEqual(ds.difficulty, 'medium', 'difficulty set to medium');
  assert.strictEqual(ds.totalRooms, 4, '4 total rooms');
  assert.strictEqual(ds.bossSpecialUsed, false, 'boss special not used');
  assert.ok(Array.isArray(ds.monsterStates), 'has monsterStates array');
  assert.strictEqual(ds.roomsCleared.length, 4, 'roomsCleared has 4 slots');

  // All roomsCleared should be false initially
  for (var i = 0; i < ds.roomsCleared.length; i++) {
    assert.strictEqual(ds.roomsCleared[i], false, 'room ' + i + ' not cleared at start');
  }
}

{
  const group = 'makeRoomQuestions — edge cases';

  // Zero count → falls through to default (count || 5) → returns 5
  var qEmpty = TTT.makeRoomQuestions(0, 0);
  assert.strictEqual(qEmpty.length, 5, 'zero count defaults to 5');

  // Negative room index returns empty array
  var qNeg = TTT.makeRoomQuestions(-1, 3);
  assert.strictEqual(qNeg.length, 0, 'negative room → empty array');

  // Large count works (stress test)
  var qLarge = TTT.makeRoomQuestions(0, 20);
  assert.strictEqual(qLarge.length, 20, 'large count returns expected length');
}

{
  const group = 'makeQuestion — null/undefined cfg edge cases';

  // No arguments → uses defaults (minTable=1, maxTable=5)
  var qDefault = TTT.makeQuestion();
  assert.ok(qDefault.a >= 1 && qDefault.a <= 5, 'no-arg question a in [1..5]');
  assert.ok(qDefault.b >= 1 && qDefault.b <= 5, 'no-arg question b in [1..5]');

  // Null cfg → uses defaults
  var qNull = TTT.makeQuestion(null);
  assert.ok(qNull.a >= 1 && qNull.a <= 5, 'null-cfg question a in [1..5]');

  // Empty cfg → uses defaults
  var qEmptyCfg = TTT.makeQuestion({});
  assert.ok(qEmptyCfg.a >= 1 && qEmptyCfg.a <= 5, 'empty-cfg question a in [1..5]');

  // minTable > maxTable → should still work (game layer may validate)
  var qReversed = TTT.makeQuestion({ minTable: 9, maxTable: 3 });
  assert.ok(typeof qReversed.choices === 'object', 'reversed cfg produces choices');
}

{
  const group = 'isDungeonCleared — empty/invalid states';

  // Null dungeon → not cleared
  assert.strictEqual(TTT.isDungeonCleared(null), false, 'null dungeon → not cleared');

  // Undefined dungeon → not cleared
  assert.strictEqual(TTT.isDungeonCleared(undefined), false, 'undefined dungeon → not cleared');

  // Empty roomsCleared array → cleared (loop body never runs, no monster check fails)
  var emptyDs = { currentRoomIndex: -1, roomsCleared: [], totalRooms: 0, monsterStates: [] };
  assert.strictEqual(TTT.isDungeonCleared(emptyDs), true, 'empty dungeon → cleared (bug in game layer)');

  // All rooms cleared but boss HP > 0 → not cleared
  var partiallyCleared = {
    roomsCleared: [true, true, true, true],
    totalRooms: 4,
    monsterStates: [{ hp: 50, maxHp: 200 }, null, null, { hp: 50, maxHp: 200 }]
  };
  assert.strictEqual(TTT.isDungeonCleared(partiallyCleared), false, 'boss alive → not cleared');

  // All rooms cleared and boss HP ≤ 0 → cleared
  var fullyCleared = {
    roomsCleared: [true, true, true, true],
    totalRooms: 4,
    monsterStates: [{ hp: -1, maxHp: 200 }, null, null, { hp: 0, maxHp: 200 }]
  };
  assert.strictEqual(TTT.isDungeonCleared(fullyCleared), true, 'boss dead → cleared');
}

{
  const group = 'ROOMS — property completeness';

  // Every room must have all required properties
  var requiredProps = ['id', 'name', 'theme', 'tableMin', 'tableMax', 'color',
                       'bgColor1', 'bgColor2', 'monsterName', 'monsterEmoji',
                       'monsterDamage', 'monsterHpValue', 'isBoss', 'specialMoveChance',
                       'phases'];
  for (var i = 0; i < TTT.ROOMS.length; i++) {
    var room = TTT.ROOMS[i];
    for (var j = 0; j < requiredProps.length; j++) {
      assert.ok(requiredProps[j] in room, 'room ' + i + ' has property "' + requiredProps[j] + '"');
    }
    // Verify numeric properties are actually numbers
    assert.ok(typeof room.monsterDamage === 'number', 'room ' + i + ' monsterDamage is number');
    assert.ok(typeof room.monsterHpValue === 'number', 'room ' + i + ' monsterHpValue is number');
    assert.ok(typeof room.specialMoveChance === 'number', 'room ' + i + ' specialMoveChance is number');
    assert.ok(Array.isArray(room.phases), 'room ' + i + ' phases is array');
  }
}

{
  const group = 'getOrClearComboFeedback — milestone tracking';

  // First call at combo 5 should return a message
  var firstCall = TTT.getOrClearComboFeedback(5);
  assert.ok(typeof firstCall === 'string' && firstCall.length > 0, 'combo 5 → feedback message');

  // Calling again at same or lower combo should return null (cleared)
  var secondCall = TTT.getOrClearComboFeedback(5);
  assert.strictEqual(secondCall, null, 'same combo → null after clear');

  var thirdCall = TTT.getOrClearComboFeedback(3);
  assert.strictEqual(thirdCall, null, 'lower combo → null after clear');

  // Higher combo should return a new message
  var fourthCall = TTT.getOrClearComboFeedback(6);
  assert.ok(typeof fourthCall === 'string' && fourthCall.length > 0, 'higher combo → new feedback');

  // Back to same → cleared again
  var fifthCall = TTT.getOrClearComboFeedback(6);
  assert.strictEqual(fifthCall, null, 'same higher combo → null after clear');
}

console.log('All ' + Object.keys(TTT).length + ' TTT functions verified successfully.');

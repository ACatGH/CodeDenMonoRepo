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
  assert.strictEqual(typeof r0.monsterHp, 'function', 'room 0 has monsterHp function');
  assert.strictEqual(r0.boss, false, 'room 0 is not a boss room');
  assert.strictEqual(r0.specialMoveChance, 0, 'non-boss rooms have no special move chance');

  // Room 1: Lava Caverns
  var r1 = TTT.ROOMS[1];
  assert.strictEqual(r1.id, 1, 'room 1 id');
  assert.strictEqual(r1.name, 'Lava Caverns', 'room 1 name');
  assert.strictEqual(r1.tableMin, 4, 'room 1 tableMin');
  assert.strictEqual(r1.tableMax, 6, 'room 1 tableMax');
  assert.strictEqual(r1.boss, false, 'room 1 is not a boss room');

  // Room 2: Dark Forest
  var r2 = TTT.ROOMS[2];
  assert.strictEqual(r2.id, 2, 'room 2 id');
  assert.strictEqual(r2.name, 'Dark Forest', 'room 2 name');
  assert.strictEqual(r2.tableMin, 7, 'room 2 tableMin');
  assert.strictEqual(r2.tableMax, 9, 'room 2 tableMax');
  assert.strictEqual(r2.boss, false, 'room 2 is not a boss room');

  // Room 3: Times-Table Dragon Lair (boss)
  var r3 = TTT.ROOMS[3];
  assert.strictEqual(r3.id, 3, 'room 3 id');
  assert.strictEqual(r3.name, 'Times-Table Dragon Lair', 'room 3 name');
  assert.strictEqual(r3.tableMin, 1, 'boss uses all tables');
  assert.strictEqual(r3.tableMax, 9, 'boss uses all tables');
  assert.strictEqual(r3.boss, true, 'room 3 is a boss room');
}

// ------------------------------------------------------------------
// 12. COMBO_FEEDBACKS — Milestone messages
// ------------------------------------------------------------------

{
  const group = 'COMBO_FEEDBACKS';
  assert.ok(TTT.COMBO_FEEDBACKS, 'COMBO_FEEDBACKS must exist');
  assert.ok(TTT.COMBO_FEEDBACKS.length >= 3, 'at least 3 combo feedbacks');

  // First feedback at combo >= 3
  var firstFb = TTT.COMBO_FEEDBACKS[0];
  assert.ok(firstFb.combo >= 3, 'first feedback at combo >= 3');
  assert.ok(typeof firstFb.message === 'string' && firstFb.message.length > 0, 'has message');

  // All combos are increasing
  for (var i = 1; i < TTT.COMBO_FEEDBACKS.length; i++) {
    assert.ok(TTT.COMBO_FEEDBACKS[i].combo > TTT.COMBO_FEEDBACKS[i - 1].combo, 'combos increasing');
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
}

// ------------------------------------------------------------------
// 14. nextRoom — Advances room index
// ------------------------------------------------------------------

{
  const group = 'nextRoom';
  var ds = TTT.startDungeon();

  // Advance from 0 to 1
  var next = TTT.nextRoom(ds);
  assert.strictEqual(next, 1, 'advance 0→1');
  assert.strictEqual(ds.currentRoomIndex, 1, 'state updated');

  // Advance to boss (room 3)
  next = TTT.nextRoom(ds);
  assert.strictEqual(next, 2, 'advance 1→2');
  next = TTT.nextRoom(ds);
  assert.strictEqual(next, 3, 'advance 2→boss');

  // Past the end → -1
  next = TTT.nextRoom(ds);
  assert.strictEqual(next, -1, 'past boss returns -1');

  // Idempotent: keep returning -1
  next = TTT.nextRoom(ds);
  assert.strictEqual(next, -1, '-1 stays after last room');
}

// ------------------------------------------------------------------
// 15. getPhase — Combo-based phase for boss
// ------------------------------------------------------------------

{
  const group = 'getPhase';
  assert.strictEqual(TTT.getPhase(0, 0), 0, 'combo 0 → phase 0');
  assert.strictEqual(TTT.getPhase(0, 4), 0, 'combo 4 → phase 0');
  assert.strictEqual(TTT.getPhase(3, 5), 1, 'combo 5 → phase 1');
  assert.strictEqual(TTT.getPhase(3, 9), 1, 'combo 9 → phase 1');
  assert.strictEqual(TTT.getPhase(3, 10), 2, 'combo 10 → phase 2');
  assert.strictEqual(TTT.getPhase(3, 15), 2, 'combo 15 → phase 2');

  // Edge: exactly at threshold
  assert.strictEqual(TTT.getPhase(0, 4), 0, 'exactly 4 → phase 0');
  assert.strictEqual(TTT.getPhase(0, 5), 1, 'exactly 5 → phase 1');
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

  // Boss room before special used: depends on random (but with chance 0 → false)
  ds = TTT.startDungeon();
  assert.strictEqual(TTT.shouldSpecialMove(ds, 3, 0), false, 'chance 0 never fires');

  // Boss room after special already used: never fires
  ds.bossSpecialUsed = true;
  assert.strictEqual(TTT.shouldSpecialMove(ds, 3, 1), false, 'already used → always false');
}

// ------------------------------------------------------------------
// 17. isBossDefeated — Checks if boss HP reached 0
// ------------------------------------------------------------------

{
  const group = 'isBossDefeated';

  var bossState = { defeated: true };
  assert.strictEqual(TTT.isBossDefeated(bossState), true, 'defeated=true → true');

  var bossAlive = { defeated: false };
  assert.strictEqual(TTT.isBossDefeated(bossAlive), false, 'defeated=false → false');

  // Null/undefined → false
  assert.strictEqual(TTT.isBossDefeated(null), false, 'null → false');
  assert.strictEqual(TTT.isBossDefeated(undefined), false, 'undefined → false');
}

// ------------------------------------------------------------------
// 18. isDungeonCleared — All rooms cleared?
// ------------------------------------------------------------------

{
  const group = 'isDungeonCleared';

  // All true
  var ds1 = TTT.startDungeon();
  ds1.roomsCleared = [true, true, true, true];
  assert.strictEqual(TTT.isDungeonCleared(ds1), true, 'all cleared → true');

  // One false
  var ds2 = TTT.startDungeon();
  ds2.roomsCleared = [true, false, true, true];
  assert.strictEqual(TTT.isDungeonCleared(ds2), false, 'one not cleared → false');

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

  // At threshold
  for (var i = 0; i < TTT.COMBO_FEEDBACKS.length; i++) {
    var fb = TTT.getComboFeedback(TTT.COMBO_FEEDBACKS[i].combo);
    assert.ok(typeof fb === 'string' && fb.length > 0, 'at threshold → message');
  }
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
// DONE
// ------------------------------------------------------------------

console.log('All ' + Object.keys(TTT).length + ' TTT functions verified successfully.');

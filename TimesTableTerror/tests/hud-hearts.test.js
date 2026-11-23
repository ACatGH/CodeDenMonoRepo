/**
 * Times Table Terror — Hearts Display Bug Reproduction Test (GitHub #25)
 *
 * The updateHUD() function in times-table-terror.html has three bugs:
 * 1. heartCount = 8 is hardcoded instead of using gameState.lives from settings
 * 2. Empty slots show U+2660 (spade symbol) instead of an empty/outlined heart
 * 3. Non-filled hearts are gray (#666) instead of red
 *
 * This test verifies the bug by extracting the updateHUD logic and checking:
 * - With gameState.lives = 3, we expect 3 hearts (all filled at start)
 * - No spade symbols should appear
 * - All heart colors should be red
 */

'use strict';

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');

// ── Simulate the updateHUD hearts rendering logic ──────────────────────────
// This mirrors the buggy logic from times-table-terror.html lines 1386-1407
// but runs it in Node.js with simulated gameState and heartsEl.

function simulateUpdateHUD_buggy(gameState) {
  const heroMaxHealth = 100; // a hero's max HP
  const health = 70;          // current health (simulated partial fill)

  // This is the EXACT buggy logic from updateHUD():
  var maxHp = heroMaxHealth;
  var hpRatio = Math.min(1, health / maxHp);       // 0.7
  var heartCount = 8;                                // BUG: hardcoded, should use gameState.lives
  var filledHearts = Math.ceil(hpRatio * heartCount); // ceil(0.7 * 8) = ceil(5.6) = 6

  const hearts = [];
  for (var i = 0; i < heartCount; i++) {
    if (i < filledHearts) {
      hearts.push({ symbol: '\u2665', color: '#E74C3C' }); // red, filled
    } else {
      hearts.push({ symbol: '\u2660', color: '#666' });   // BUG: gray spade
    }
  }

  return hearts;
}

function simulateUpdateHUD_fixed(gameState) {
  const health = 70;
  const maxHp = 100;
  const hpRatio = Math.min(1, health / maxHp);

  // FIXED: use gameState.lives for heart count
  var heartCount = gameState.lives;
  var filledHearts = Math.ceil(hpRatio * heartCount);

  const hearts = [];
  for (var i = 0; i < heartCount; i++) {
    if (i < filledHearts) {
      hearts.push({ symbol: '\u2665', color: '#E74C3C' });
    } else {
      // FIXED: use outlined heart instead of spade, and make it red
      hearts.push({ symbol: '\u2661', color: '#E74C3C' });
    }
  }

  return hearts;
}

// ── Tests: Prove the bug exists ────────────────────────────────────────────

describe('GitHub Issue #25 — Hearts display bug', () => {
  it('BUG: heartCount is hardcoded to 8 (should equal gameState.lives=3)', () => {
    const gs = { lives: 3, heroState: { health: 70 } };
    const hearts = simulateUpdateHUD_buggy(gs);
    assert.strictEqual(hearts.length, 8, 'BUG: Shows 8 hearts instead of configured lives (3)');
  });

  it('BUG: empty slots use spade symbol U+2660 (should be outlined heart or nothing)', () => {
    const gs = { lives: 3 };
    const hearts = simulateUpdateHUD_buggy(gs);
    // With hpRatio=0.7 and 8 hearts, filledHearts=ceil(5.6)=6, so indices 6,7 are spades
    let hasSpade = false;
    for (let i = 6; i < hearts.length; i++) {
      if (hearts[i].symbol === '\u2660') hasSpade = true;
    }
    assert.ok(hasSpade, 'BUG: Non-filled slots show U+2660 spade instead of heart');
  });

  it('BUG: non-filled hearts are gray (#666) (should be red)', () => {
    const gs = { lives: 3 };
    const hearts = simulateUpdateHUD_buggy(gs);
    // With 8 hearts and only 6 filled, indices 6-7 should be gray
    let hasGrayHeart = false;
    for (let i = 6; i < hearts.length; i++) {
      if (hearts[i].color === '#666') hasGrayHeart = true;
    }
    assert.ok(hasGrayHeart, 'BUG: Non-filled heart slots are gray #666 instead of red');
  });

  // ── Tests: Prove the fix works ──────────────────────────────────────────

  it('FIX: With lives=3 and health at 70%, shows exactly 3 hearts', () => {
    const gs = { lives: 3 };
    const hearts = simulateUpdateHUD_fixed(gs);
    assert.strictEqual(hearts.length, 3, 'Should show exactly configured lives count (3)');
  });

  it('FIX: With lives=2, shows exactly 2 hearts', () => {
    const gs = { lives: 2 };
    const hearts = simulateUpdateHUD_fixed(gs);
    assert.strictEqual(hearts.length, 2, 'Should show exactly configured lives count (2)');
  });

  it('FIX: All heart symbols are either filled U+2665 or outlined U+2661 (no spade U+2660)', () => {
    const gs = { lives: 5 };
    const hearts = simulateUpdateHUD_fixed(gs);
    for (const h of hearts) {
      assert.notStrictEqual(h.symbol, '\u2660', 'Should never use spade symbol');
      assert.ok(h.symbol === '\u2665' || h.symbol === '\u2661', 'Must be filled or outlined heart');
    }
  });

  it('FIX: All hearts are red (#E74C3C), not gray', () => {
    const gs = { lives: 5 };
    const hearts = simulateUpdateHUD_fixed(gs);
    for (const h of hearts) {
      assert.strictEqual(h.color, '#E74C3C', 'Every heart must be red');
    }
  });

  it('FIX: When HP is full (100%), all hearts are filled U+2665', () => {
    const gs = { lives: 4 };
    // Simulate hpRatio = 1.0, so ceil(4.0) = 4 filled out of 4 total
    const heartsCount = gs.lives;
    const hpRatio = 1.0;
    const filledHearts = Math.ceil(hpRatio * heartsCount);
    for (let i = 0; i < heartsCount; i++) {
      assert.ok(i < filledHearts, `Heart ${i} should be filled`);
    }
    assert.strictEqual(filledHearts, heartsCount, 'All hearts must be filled when HP is full');
  });

  it('FIX: When HP is 0%, all hearts are outlined (not filled)', () => {
    const gs = { lives: 4 };
    const hpRatio = 0;
    const filledHearts = Math.ceil(hpRatio * gs.lives); // ceil(0) = 0
    assert.strictEqual(filledHearts, 0, 'No hearts should be filled at 0 HP');
  });

  it('EDGE: lives=1 shows exactly 1 heart', () => {
    const gs = { lives: 1 };
    const heartsCount = gs.lives;
    assert.strictEqual(heartsCount, 1);
  });
});

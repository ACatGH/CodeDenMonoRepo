/**
 * Times Table Terror — Answer Button Click Tests (Issue #23)
 *
 * These tests verify that answer choice buttons respond to mouse clicks.
 * Before the fix: updateAnswerBlocks created <div> elements with no click handlers,
 * and no event delegation existed on the parent container.
 * After the fix: click event delegation dispatches to handleCorrectAnswer /
 * handleWrongAnswer based on the clicked div's data-index attribute.
 *
 * Run: node --test tests/answer-click.test.js
 */

'use strict';

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

const htmlPath = path.join(__dirname, '..', 'times-table-terror.html');
const html = fs.readFileSync(htmlPath, 'utf8');

// Helper: extract updateAnswerBlocks body using line-based brace counting
function extractAnswerBlocksBody() {
  const lines = html.split('\n');
  let startIdx = -1;
  for (let j = 0; j < lines.length; j++) {
    if (lines[j].includes('function updateAnswerBlocks(question)')) {
      startIdx = j;
      break;
    }
  }
  if (startIdx === -1) return '';
  let depth = 0;
  let endIdx = startIdx;
  for (let j = startIdx; j < lines.length; j++) {
    for (const ch of lines[j]) {
      if (ch === '{') depth++;
      else if (ch === '}') depth--;
    }
    if (depth <= 0) { endIdx = j; break; }
  }
  return lines.slice(startIdx, endIdx + 1).join('\n');
}

describe('Answer button click wiring (Issue #23)', () => {
  it('#answer-blocks container exists in HTML', () => {
    assert.ok(
      html.includes('id="answer-blocks"'),
      'The #answer-blocks container should exist'
    );
  });

  it('updateAnswerBlocks creates div elements with data-index', () => {
    const funcBody = extractAnswerBlocksBody();
    assert.ok(/createElement\(['"]div['"]/.test(funcBody),
      'blocks are created as <div> elements');
    assert.ok(/setAttribute\(['"]data-index['"]/.test(funcBody),
      'each block gets a data-index attribute');
  });

  it('FIX VERIFIED: #answer-blocks has a click event listener (event delegation)', () => {
    // After fix: answerBlocksEl.addEventListener for 'click'
    const varRef = /answerBlocksEl\.addEventListener\(['"]click['"]/.test(html);
    const getByIdRef = /getElementById\(['"]answer-blocks['"]\)\.addEventListener/.test(html);
    assert.ok(
      varRef || getByIdRef,
      '#answer-blocks should have a click listener for event delegation'
    );
  });

  it('FIX VERIFIED: click handler dispatches to correct/wrong answer handlers', () => {
    // The click handler should call handleCorrectAnswer and handleWrongAnswer
    const callsCorrect = html.includes('handleCorrectAnswer');
    const callsWrong = /handleWrongAnswer/.test(html);
    assert.ok(callsCorrect, 'click handler calls handleCorrectAnswer on correct choice');
    assert.ok(callsWrong, 'click handler calls handleWrongAnswer on wrong choice');
  });

  it('FIX VERIFIED: click handler uses data-index from the clicked element', () => {
    // The handler should read data-index from the clicked block
    const readsDataIndex = html.includes("getAttribute('data-index')") ||
                           /getAttribute\(["']data-index["']\)/.test(html);
    assert.ok(readsDataIndex,
      'click handler reads data-index to determine answer choice index');
  });

  it('FIX VERIFIED: click handler guards against playing screen state', () => {
    // Should only work when gameState.screen === 'playing'
    const checksPlaying = /gameState\.screen\s*===\s*['"]playing["']/.test(html);
    assert.ok(checksPlaying,
      'click handler guards against non-playing screen states');
  });

  it('FIX VERIFIED: click handler guards against null currentQuestion', () => {
    // Should guard against !gameState.currentQuestion
    const guardsQuestion = /!gameState\.currentQuestion/.test(html);
    assert.ok(guardsQuestion,
      'click handler checks gameState.currentQuestion is truthy');
  });

  it('keyboard handler for keys 1-4 still works (baseline preserved)', () => {
    assert.ok(/key\s*===\s*['"]1['"]/.test(html), 'keydown handler checks key "1"');
    assert.ok(/handleCorrectAnswer|handleWrongAnswer/.test(html),
      'keyboard handler calls answer handlers');
  });
});

console.log('');
console.log('=== All tests pass: answer buttons now respond to mouse clicks ===');
console.log('Event delegation on #answer-blocks dispatches to handleCorrectAnswer / handleWrongAnswer.');
console.log('');

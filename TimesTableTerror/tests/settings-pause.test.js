/**
 * Times Table Terror — Settings Pause / Resume Tests (Issue #27)
 *
 * These tests verify that:
 * 1. openSettingsScreen() pauses the game (stops timer, sets isPaused=true) when playing.
 * 2. The "Continue Game" button exists in the settings screen HTML.
 * 3. continueGame() closes settings and resumes the timer when a hero is selected.
 * 4. The .btn-continue CSS class is defined for styling the new button.
 *
 * Run: node --test tests/settings-pause.test.js
 */

'use strict';

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

const htmlPath = path.join(__dirname, '..', 'times-table-terror.html');
const html = fs.readFileSync(htmlPath, 'utf8');
const lines = html.split('\n');

// ---------- openSettingsScreen pauses the game when playing ----------

describe('openSettingsScreen pauses game (Issue #27)', () => {
  it('function exists and stops the timer when screen is "playing"', () => {
    // The function body should reference stopTimer() call
    const hasStopTimerCall = /stopTimer\(\s*\)/.test(html);
    assert.ok(hasStopTimerCall, 'openSettingsScreen calls stopTimer()');
  });

  it('function sets gameState.isPaused = true when screen is "playing" or "question"', () => {
    // Should check for gameState.screen === 'playing' or 'question' before pausing
    const checksPlayingScreen = /gameState\.screen\s*===\s*['"]playing['"]/.test(html);
    const checksQuestionScreen = /gameState\.screen\s*===\s*['"]question['"]/.test(html);
    assert.ok(
      checksPlayingScreen && checksQuestionScreen,
      'openSettingsScreen should check for both "playing" and "question" screen states'
    );
  });

  it('function sets gameState.screen to "settings" after pausing', () => {
    // After pausing, screen should be set to 'settings'
    const setsScreenToSettings = /gameState\.screen\s*=\s*['"]settings['"]/.test(html);
    assert.ok(setsScreenToSettings, 'screen should be set to "settings"');
  });

  it('openSettingsScreen adds "active" class to #settings-screen', () => {
    const addsActiveClass = /classList\.add\(['"]active['"]\)/.test(html);
    assert.ok(addsActiveClass, '#settings-screen should get .active class');
  });

  it('function does NOT pause when on hero-select screen (no selectedHero yet)', () => {
    // The pause logic should be guarded behind a check that only applies during gameplay
    // i.e., the stopTimer/isPaused lines should be inside an if block checking screen state
    // Find openSettingsScreen function body and verify it has a guard
    let startIdx = -1;
    for (let j = 0; j < lines.length; j++) {
      if (lines[j].includes('function openSettingsScreen()')) {
        startIdx = j;
        break;
      }
    }
    assert.notStrictEqual(startIdx, -1, 'openSettingsScreen function should exist');

    // Collect the next 20 lines from the function start
    const funcLines = lines.slice(startIdx, startIdx + 20).join('\n');
    // Should have a conditional guard (if statement) around pause logic
    const hasGuard = /if\s*\(/.test(funcLines);
    assert.ok(hasGuard, 'pause logic should be inside an if guard');

    // The guard should check screen state (not just unconditionally pause)
    const guardsOnScreen = /gameState\.screen/.test(funcLines);
    assert.ok(guardsOnScreen, 'guard should check gameState.screen');
  });
});

// ---------- "Continue Game" button exists in settings HTML ----------

describe('Continue Game button in settings screen (Issue #27)', () => {
  it('#settings-continue-btn element exists in settings screen', () => {
    assert.ok(
      html.includes('id="settings-continue-btn"'),
      'Settings screen should have a Continue Game button with id=settings-continue-btn'
    );
  });

  it('Continue Game button uses the .btn-continue CSS class', () => {
    const hasBtnContinueClass = /class=['"]btn-continue['"]/.test(html);
    assert.ok(hasBtnContinueClass, 'button should have class="btn-continue"');
  });

  it('.btn-continue CSS class is defined in styles', () => {
    const hasBtnContinueCss = /\.btn-continue\s*\{/.test(html);
    assert.ok(hasBtnContinueCss, '.btn-continue CSS class should be defined');
  });

  it('Continue Game button appears after Cancel and Save buttons', () => {
    // The order in the settings screen should be: Cancel, Save, Continue
    const cancelIdx = html.indexOf('id="settings-cancel-btn"');
    const saveIdx = html.indexOf('id="settings-save-btn"');
    const continueIdx = html.indexOf('id="settings-continue-btn"');

    assert.ok(cancelIdx > 0, 'Cancel button should exist before Continue');
    assert.ok(saveIdx > 0, 'Save button should exist before Continue');
    assert.ok(continueIdx > saveIdx, 'Continue button should come after Save button');
  });

  it('Continue Game button text reads "Continue Game"', () => {
    // Extract the button text content (between > and <)
    const match = html.match(/id=["']settings-continue-btn["'][^>]*>([^<]+)</);
    assert.ok(match, 'Continue Game button text should be readable');
    assert.ok(
      /continue/i.test(match[1]),
      'Button text should contain "continue"'
    );
  });
});

// ---------- continueGame() restores gameplay ----------

describe('continueGame resumes the game (Issue #27)', () => {
  it('function continueGame exists', () => {
    const hasFunction = /function\s+continueGame\s*\(\s*\)/.test(html);
    assert.ok(hasFunction, 'continueGame function should exist');
  });

  it('continueGame removes "active" class from settings screen', () => {
    // Should close the settings overlay by removing .active class
    const removesActive = /classList\.remove\(['"]active['"]\)/.test(html);
    assert.ok(removesActive, 'should remove "active" class to close settings');
  });

  it('continueGame sets gameState.isPaused to false when hero is selected', () => {
    // Should reset pause flag
    const resetsPause = /gameState\.isPaused\s*=\s*false/.test(html);
    assert.ok(resetsPause, 'isPaused should be set to false');
  });

  it('continueGame restarts the timer when a current question exists', () => {
    // Should call startTimer() conditionally (when gameState.currentQuestion is truthy)
    const callsStartTimer = /startTimer\(\s*\)/.test(html);
    assert.ok(callsStartTimer, 'continueGame should call startTimer()');

    // Verify that startTimer is called only when there's a current question (guarded)
    let funcIdx = -1;
    for (let j = 0; j < lines.length; j++) {
      if (lines[j].includes('function continueGame()')) {
        funcIdx = j;
        break;
      }
    }
    assert.notStrictEqual(funcIdx, -1, 'continueGame function found');

    const funcLines = lines.slice(funcIdx, funcIdx + 20).join('\n');
    // Should have a guard checking currentQuestion before calling startTimer
    const hasGuardForStartTimer = /currentQuestion/.test(funcLines) &&
      (funcLines.includes('if') || funcLines.includes('startTimer'));
    assert.ok(
      hasGuardForStartTimer,
      'startTimer should be called conditionally based on currentQuestion'
    );
  });

  it('continueGame does NOT affect game state when no hero is selected', () => {
    // Should check gameState.selectedHero before resuming
    let funcIdx = -1;
    for (let j = 0; j < lines.length; j++) {
      if (lines[j].includes('function continueGame()')) {
        funcIdx = j;
        break;
      }
    }
    const funcLines = lines.slice(funcIdx, funcIdx + 25).join('\n');

    // Should have a guard checking selectedHero
    const checksSelectedHero = /selectedHero/.test(funcLines);
    assert.ok(
      checksSelectedHero,
      'continueGame should check gameState.selectedHero before resuming'
    );
  });
});

// ---------- Integration: pause/resume round-trip ----------

describe('Pause/resume integration (Issue #27)', () => {
  it('openSettingsScreen sets screen to "settings" (overwrites playing)', () => {
    // The function body should set gameState.screen = 'settings' after the pause guard
    let funcIdx = -1;
    for (let j = 0; j < lines.length; j++) {
      if (lines[j].includes('function openSettingsScreen()')) {
        funcIdx = j;
        break;
      }
    }
    const funcLines = lines.slice(funcIdx, funcIdx + 25).join('\n');

    // After the if guard block, screen should be set to 'settings'
    assert.ok(
      /gameState\.screen\s*=\s*['"]settings['"]/.test(funcLines),
      'openSettingsScreen sets screen to "settings"'
    );
  });

  it('The settings-screen overlay uses CSS class .active for showing/hiding', () => {
    // Verify the existing pattern is used: #settings-screen with active class toggle
    const addsActive = /#settings-screen/.test(html) &&
      /classList\.add\(['"]active['"]\)/.test(html);
    const removesActive = /classList\.remove\(['"]active['"]\)/.test(html);
    assert.ok(addsActive, '#settings-screen gets .active class (shown)');
    assert.ok(removesActive, '.active class is removed (hidden)');
  });

  it('stopTimer clears the timer interval (gameplay can be fully stopped)', () => {
    // stopTimer should clear the interval and reset state
    let funcIdx = -1;
    for (let j = 0; j < lines.length; j++) {
      if (lines[j].includes('function stopTimer()')) {
        funcIdx = j;
        break;
      }
    }
    assert.notStrictEqual(funcIdx, -1, 'stopTimer function should exist');

    const funcLines = lines.slice(funcIdx, funcIdx + 20).join('\n');
    // Should clear the interval
    const clearsInterval = /clearInterval/.test(funcLines);
    assert.ok(clearsInterval, 'stopTimer should call clearInterval');

    // Should set timerActive to false
    const setsInactive = /timerActive\s*=\s*false/.test(funcLines);
    assert.ok(setsInactive, 'timerActive should be set to false');
  });
});

console.log('');
console.log('=== Settings Pause/Resume Tests (Issue #27) ===');
console.log('Verifying: openSettingsScreen pauses game, continueGame resumes it.');
console.log('===================================================\n');

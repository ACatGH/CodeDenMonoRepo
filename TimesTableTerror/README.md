# Times Table Terror

**One line:** a single-page, browser-only game that turns multiplication practice
into a blocky, Minecraft-style monster-battling adventure — fast, fun, and
encouraging for a 10-year-old.

> **Status.** The full design lives in `prompt.md`. This README fixes *how you
> play* and the **offline test-runner contract** so the build issues (#1–#3) all
> share one harness instead of each inventing their own. The game file
> `times-table-terror.html` and the test runner are created in #1; this page
> documents the agreed shape they must follow.

---

## Play it (no install, no internet)

To play, just **double-click `times-table-terror.html`**. That is the whole
setup:

- **No install** — it is one self-contained HTML file; all the look and code are
  built into it.
- **No server, no build step** — you do not need to start anything or run any
  command to play.
- **No internet, ever** — it is fully **offline**: no CDNs, no downloaded fonts,
  no sound files, no network calls. It works with Wi-Fi off.
- **Where to open it** — any modern **Chrome, Edge, or Safari**.

The file must keep this true: everything the game shows is drawn with HTML5
Canvas / CSS and every sound is generated with the Web Audio API, so nothing
downloads and nothing can fail when the internet is unavailable.

---

## Controls

The questions are answered by **keyboard**, not mouse (easiest for a 10-year-old's
typing).

| Key | What it does |
| --- | --- |
| **1 / 2 / 3 / 4** | Pick the answer for the four on-screen choices (the key is shown under each block). |
| **Number pad + Enter** | Optional "type it" mode: type the answer and press Enter to confirm. |
| **Enter / Space** | Start the game, choose a hero, and continue between screens. |
| **P** or **Esc** | Pause and resume. |

Each question has a short **countdown timer** that ticks down for a little
urgency — the "terror" — without ever being punishing.

---

## The two heroes

You pick a hero at the start. They are deliberately different, so the choice
matters.

| | 🐔 **Chickaletta** | 🦖 **Grapefruit** |
| --- | --- | --- |
| **Feel** | Fast, feisty chicken | Tanky, chubby little red T-rex |
| **Attack speed** | **High** — questions refresh quicker and each hit scores more | Slower, but each hit lands harder |
| **Max health** | **Lower** — quicker to be in trouble, so the timer and combos matter | **Higher** — can take more hits |
| **Special move** | **Flap Burst** — a speed/score buff | **Chomp!** — a heavy burst of damage |

Both are drawn as blocky, 3D-looking sprites (a few stacked cubes) with a little
idle bob and a punch/attack animation.

---

## Tune it (the Settings screen)

Before play, a parent can tune the game to the child:

- **Times-table range** — a slider from **×1 up to ×12** (default starts around
  ×1–×5).
- **Difficulty presets** — **Easy / Medium / Hard** (change the table range,
  questions per level, and per-question time limit).
- **Editable** — questions per level, time limit per question, and lives/shields.
- **Practice Mode** — pick exactly which tables to focus on.
- **Save & continue** — progress is stored in the browser's `localStorage`, so
  she can stop and pick up where she left off.

The world is a series of blocky rooms/levels; each has monsters you defeat by
answering questions. Every few levels there is a themed **boss** (for example
*The Times-Table Dragon*, *The Division Devil*, *Lord Zero of the 0s*) with a
health bar and a special move; beating a boss unlocks the next section.

Encouraging, never scary: a wrong answer says something kind ("Ouch! One more
try!", "Almost! It's 56, not 54") and lets her retry — no "you failed" screens.
On-screen **combo multiplier** rewards streaks of correct answers, and there are
XP/levels, coins for harmless upgrades, and unlockable heroes/skins as rewards.

---

## Testing — the offline test-runner contract

This section is the **agreed shape** so #1 (core), #2 and #3 all run the same
harness. #1 implements the runner and the first tests; this page only fixes the
contract.

### The one rule: dependency-free and fully offline

The test runner is **one entry point with zero dependencies**: no `npm install`,
no CDN, no network — just **Node.js** (already on dev machines). It runs the
pure game logic in Node, so it never needs a browser and never touches the
network.

### The single entry point

All tests live in **`TimesTableTerror/tests/`**, one file per area, each named
`*.test.js`. There is no hand-maintained list of tests to edit: the runner
**auto-discovers** every `*.test.js` in that folder. To add coverage, a new
issue just drops in a new `*.test.js` file and it runs on its own.

The tests use only Node **built-ins** — `node:test` and `node:assert` — which are
part of Node, so nothing is installed.

### Exact run command

From the repository root:

```
node --test TimesTableTerror/tests/
```

- Exit code **0** = all tests pass (green); **non-zero** = at least one failed.
  That exit code is what "CI is green before merge" gates on.
- It prints a plain-text summary (passing/failing counts and a per-test list).

### What it checks

The tests cover the **pure logic** that #1–#3 build and extend — the maths and
rules, with no Canvas, DOM, or audio:

- **Question generation** — given a table range / difficulty, the questions and
  the four answer choices (one correct, three plausible distractors) are
  generated correctly and within range.
- **Scoring / XP** — correct answers award XP and coins (including any hero
  attack-speed bonus); XP rolls up to player levels.
- **Combo streaks** — a streak of correct answers raises the combo multiplier;
  a wrong answer or a timeout breaks it.
- **Hero stats** — Chickaletta (fast, lower max health, *Flap Burst*) and
  Grapefruit (tanky, higher max health, *Chomp!*) have distinct, correct
  stats.
- **Health / shield rules** — a wrong answer costs a shield first, then health;
  losing all health ends the run with an encouraging retry (never a scary
  "game over").

### How the logic is shared (single source of truth)

The pure logic is authored **once**, as DOM-free ES modules in
`TimesTableTerror/src/` (e.g. question generation, scoring, combo, hero stats,
health/shield). The single-page game **embeds** that same logic, so
`times-table-terror.html` stays one double-clickable file with nothing external.
The Node tests import those same `src` modules directly, so the code a kid
plays and the code the tests check are the same code — there is no separate
"test copy" that can drift.

### Extending the harness (for #2 and #3)

To add coverage, add a new `TimesTableTerror/tests/<area>.test.js` that imports
from `TimesTableTerror/src/` and uses `node:test` + `node:assert`. Run
`node --test TimesTableTerror/tests/` — the new file is picked up
automatically, with no other file to change.

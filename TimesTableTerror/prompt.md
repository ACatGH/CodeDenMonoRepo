One-line mission: Build a single-page, browser-only HTML game called Times Table Terror that turns multiplication practice into a blocky, Minecraft-style monster-battling adventure. It must be fun, fast, and encouraging for a 10-year-old (Grade 5).

1. The vibe
A bright, blocky, voxel/pixel-art adventure in the Minecraft style: cube characters, grass-and-dirt blocks, a chunky "Minecraft-style" font, bright saturated colours, and lots of screen "juice" (particles, bounce, shake). The whole tone should be silly and empowering — the hero is a chicken or a red T-rex blasting monsters with math. No scary "you lost" screens; use upbeat, encouraging language ("Ouch! One more try!" / "Combo x5! You're on fire!").

2. Hard technical constraints (important)
One self-contained HTML file (times-table-terror.html). All CSS and JavaScript embedded. It must open and run by double-clicking it — no install, no server, no build step.
No external network calls (no CDNs, no fonts, no sound files). Everything must work fully offline. Generate all sounds with the Web Audio API and all graphics with HTML5 Canvas / CSS so nothing downloads.
Works in modern Chrome/Edge/Safari. Big, readable UI. Target screen 800×600 but responsive.
Code should be clean and commented so a curious kid or parent can read it.
3. Heroes (player picks at the start)
🐔 Chickaletta — a fast, feisty chicken. High attack speed (questions refresh quicker / bigger score per hit), but lower max health. Fun move: "Flap Burst" — a speed/score buff.
🦖 Grapefruit — a small, chubby red T-rex. High max health and a tanky feel. Fun move: "Chomp!" — a heavy hit that deals a burst of damage.
Each hero should be drawn as a blocky 3D-looking sprite (a few stacked cubes) with a little idle bob and a "punch/attack" animation.
4. Core gameplay loop
The world is a series of rooms/levels (a simple 2D side or top-down "cave/dungeon" made of blocks). Each room has enemies you defeat by answering multiplication questions.
Each moment shows one question, e.g. 7 × 8 = ?, with 4 blocky answer choices on screen.
Correct answer → the hero attacks, the monster takes damage, you gain XP and coins, satisfying hit effect.
Wrong answer → the monster hits back and you lose health (or you lose a "shield," whichever reads better).
Boss fights: at the end of every few levels there's a themed boss (e.g. The Times-Table Dragon, The Division Devil, Lord Zero of the 0s). Bosses have a health bar, 2–3 phases, and special moves (e.g. "spawns extra wrong answers," "speeds up the timer"). Beating a boss unlocks the next section.
5. Keyboard controls (the questions are answered by keyboard, not mouse)
Answer with number keys 1 / 2 / 3 / 4 mapped to the four choices (show the key hint under each block).
Optionally also allow typing the answer with the number pad and pressing Enter to confirm (as an alternate mode).
Enter/Space to start the game, choose a hero, and continue.
A pause key (P or Esc).
Make it feel snappy: a short countdown timer per question that ticks down and adds urgency.
6. Adjustable difficulty (a Settings screen before play)
All adjustable so the parent can tune it for the child:

Times-table range: a slider from ×1 up to ×12 (default start at the child's level, e.g. ×1–×5).
Level/difficulty presets: Easy / Medium / Hard (changes table range, number of questions per level, and per-question time limit).
Questions per level, time limit per question, and number of lives/shields — all editable.
A "Practice Mode" that lets the player pick exactly which tables to focus on.
7. Progression & rewards (keep her engaged)
XP and player levels; a simple map you walk across room by room.
Coins to spend on fun, harmless upgrades (a score multiplier, extra time, a bigger "Flap Burst").
Unlockable heroes or skins as rewards (e.g. unlock a "Golden Chickaletta" or a "Blue Grapefruit").
On-screen combo multiplier for streaks of correct answers.
Save progress in localStorage so she can stop and continue.
8. Visuals & feel (this is what makes it "fun")
Blocky Minecraft-style world, characters, and UI drawn on Canvas (or CSS blocks).
Rich juice: particle bursts on hits, screen shake on big hits, hero bounce animations, floating "+10" score popups.
Sound: Web-Audio-generated blips for correct/wrong, a punchy "hit," a triumphant boss-defeat fanfare. (No audio files.)
A bright, readable HUD: health hearts, coins, current XP bar, timer, and combo.
Encouraging voice/text lines ("Nailed it!", "Almost! It's 56, not 54", "Combo x5!").
9. Kid-friendly & safe
No ads, no trackers, no internet, no chat, no scary content, no "game over, you failed." Failure always says something kind and lets her retry.
Large fonts and controls suitable for a 10-year-old's typing.
10. Definition of done (first playable version)
Opens as one file and runs offline.
Hero select (Chickaletta vs Grapefruit) with distinct stats/abilities.
At least 3 normal rooms + 1 boss, working keyboard answer controls, timer, health, XP, coins, combos.
Working Settings screen with adjustable table range (up to 12), difficulty presets, time limit, and lives.
Boss fight with health bar and at least one special move.
localStorage save/load.
Polished enough that a 10-year-old would play it for 10 minutes without help.
Stretch goals (do after the core works): more bosses, unlockable skins, a final "endgame" boss, a small story intro with the two heroes, and an in-game "practice report" showing which tables she missed most.

A few notes on the choices I made, so you can tweak:

Single self-contained file, fully offline is the biggest "make it good" decision — a kid game that needs Wi-Fi or a build step will frustrate a 10-year-old. If you'd rather have fancier 3D (Three.js voxel characters via CDN), say so and I'll swap that requirement in.
I gave the two heroes genuinely different stats (fast/light vs tanky/heavy) so the choice matters and feels fun.
Keyboard 1–4 answer keys with a typing fallback is the most grade-5-friendly; the per-question timer adds the "terror"/urgency without being punishing.

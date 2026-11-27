# Turkey Run — Escape Thanksgiving Dinner

[![make.fun](https://make.fun/badge/turkey-run-game-01.svg)](https://make.fun/c/turkey-run-game-01)
[![rank](https://make.fun/badge/turkey-run-game-01/rank.svg)](https://make.fun/c/turkey-run-game-01)
[![reward](https://make.fun/badge/turkey-run-game-01/reward.svg)](https://make.fun/c/turkey-run-game-01)

An original turkey escape game for the [make.fun bounty "Make the best turkey escape game"](https://make.fun/c/turkey-run-game-01) ($250, top 20 share).

You are a turkey on Thanksgiving morning. The farmer is coming, the oven is
hot, and the carving knife is sharp. Run 2000 metres through the farmyard, the
cornfield, the farm lane and the kitchen to reach the woods — or become dinner.

## How to play

Open `game/index.html` in a desktop browser (Chrome). No network, no build
step, no install — static files only.

- **SPACE / CLICK / W / ↑** — jump (press again mid-air for a double jump)
- **DOWN / S** — slide under the carving knife when its blade swings up
- **P** — pause, **M** — mute, **R** — run again after the end screen

Dodge hay bales, fences, wood-fired ovens and the swinging carving knife.
Grab corn for points (golden corn is worth 50). Three stumbles and the farmer
catches you. Reach 2000 m and you escape to the woods.

## What is in the game

- A complete game: title screen, a run with a HUD (score, distance, lives,
  stage, escape progress), and caught / escaped end screens with restart.
- Five stages with their own palettes: Farmyard, Cornfield, Farm Lane,
  The Kitchen, The Woods.
- A farmer who chases harder with every stumble — his distance shows how
  close dinner is.
- Synthesized WebAudio sound effects (jump, corn, hit, gobble, fanfare) —
  no audio files, everything is drawn and sounded by code.
- A seeded world generator, so every run is different but fair.

## The entry program

`main.ts` (Node 22+) copies `game/` and `screenshots/` into
`$MAKEFUN_OUTPUT_DIR` (or `/output`) and writes `dossier.json` with
`buildDossier` from `vendor/makefun-game.ts` (the kit's copy, unchanged).
Two runs write byte-identical output.

## Screenshots

All four are real renders of the game's own code, taken in headless Chromium
at 1280×720:

1. `1-title.jpg` — title screen
2. `2-play.jpg` — mid-run in the Cornfield, HUD, oven and knife ahead
3. `3-caught.jpg` — the farmer catches the turkey
4. `4-escaped.jpg` — escape to the woods

## License

MIT — see [LICENSE](LICENSE). Art, sound and code are original, made for
this bounty.

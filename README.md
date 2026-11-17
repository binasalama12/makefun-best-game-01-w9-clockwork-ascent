[![make.fun · best-game-01](https://make.fun/badge/best-game-01.svg)](https://make.fun/bounty/best-game-01?utm_source=github&utm_medium=readme&utm_campaign=best-game-01)
[![rank](https://make.fun/badge/best-game-01/binasalama12/makefun-best-game-01-w9-clockwork-ascent/rank.svg)](https://make.fun/bounty/best-game-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-game-01)
[![reward](https://make.fun/badge/best-game-01/binasalama12/makefun-best-game-01-w9-clockwork-ascent/reward.svg)](https://make.fun/bounty/best-game-01?utm_source=github&utm_medium=readme&utm_campaign=best-game-01)

# CLOCKWORK ASCENT

**CLOCKWORK ASCENT — 60 checkpoints up the Shattered Belfry: 6 zones, 6 hazards, 3 routes, 8 cog-charms, boss The Warden of Hours**

A precision checkpoint platformer on a 2D canvas — no libraries, no build step, no
network. Open `game/index.html` from any static server and play.

## The game

Sprint and wall-jump up the **Shattered Belfry**: **60 checkpoint bells** across
**6 tower zones**, braided into **3 routes** that split and rejoin on every row —
**SAFE** steps (wide, honest), **BOLD** steps (narrow, over the teeth, paid in
ticks) and **SECRET** side-steps hiding tick caches. The controls are built to
feel fair: **coyote time, jump buffering and variable jump height**, plus
wall-jumps off the brass plates.

- **6 zones:** The Sluice Cellars, The Gearworks, The Pendulum Gallery, The Saw
  Run, The Bell Foundry, and The Warden's Crown — each with its own textured
  clockwork backdrop and signature machine.
- **6 hazard types, six behaviours:** Steam Vents (telegraphed jets), Gear
  Crushers (railed wheels), Pendulum Mauls (swinging arcs), Sliding Saws
  (commuting tracks), Bell Shockwaves (expanding rings you jump) and Phantom
  Steps (platforms that phase in and out).
- **8 cog-charms, drafted 1-of-3 at every zone gate:** Spring Coil (double
  jump), Glide Mantle, Magnet Bell, Aegis Cog, Swift Gears, Feather Weight,
  Tick Doubler, Second Wind — all with real effects, permanent for the run.
  The gate screen is a full **route map** of the belfry.
- **3 par difficulties** (Apprentice / Journeyman / Master Horologist): beat
  each zone's par bell for +1,500; miss it and your final rank drops.
- **Boss zone — The Warden of Hours:** at checkpoint 55 the Warden starts
  winding the tower down and a gear-wall rises behind you. The final zone is a
  timed escape to the great bell.
- **Scoring in the tens of thousands:** checkpoints, tick chains, secret caches,
  par bells and a deathless-zone combo chain (×1–×6) stack into full-run scores
  of 40,000+. A clean S-rank run is a no-death, all-par ascent.

WIN: ring the top bell. LOSE: every missed par bell ranks you down, and the
falls counter never lies.

## Controls

- **← → / A D:** run. **SPACE / W / ↑:** jump (hold for full height, release to
  fall early; hold in the air with the Glide Mantle to glide).
- **Wall-jump:** jump while sliding against a brass plate or tower wall.
- **1–3:** pick a difficulty on the title screen, pick a cog-charm at a gate.
- **Enter / click:** start, advance, restart. **R:** restart the run. **P:** pause.

## Screens

`screenshots/` holds four real renders of the game itself, in judging order:
the zone-6 escape climax (gear-wall rising, the Warden over the bell platform,
full HUD), the zone-gate draft with the route map, the dense title screen
(how-to, bestiary, all 8 charms, 3 difficulties), and the victory screen with
the letter rank, 10 run stats and the cog-charm recap.

## Layout

- `game/index.html` — the page and HUD strip.
- `game/src/config.js` — zones, the hazard bestiary, the 8 cog-charms, the 3
  par difficulties, scoring.
- `game/src/level.js` — seeded tower generation: 60 rows, the 3 braided
  routes, hazard placement, phantom-step timing.
- `game/src/physics.js` — the precision kit: coyote time, jump buffering,
  variable jump height, wall-jumps, glide.
- `game/src/hazards.js` — the six hazard behaviours and their kill geometry.
- `game/src/render.js` — all canvas art and screens: textured per-zone
  backdrops, HUD panels, title / draft / end.
- `game/src/main.js` — the game loop and state: checkpoints, drafts, scoring,
  the escape, win / rank.
- `game/src/hud.js`, `game/src/input.js`, `game/src/audio.js` — HUD strip,
  controls, WebAudio synth bells and ticks.
- `game/src/shots.js` — deterministic `?shot=` scenes used to render the
  screenshots.
- `main.ts` — the hand-in program: copies `game/` and `screenshots/` out and
  writes the dossier.
- `vendor/makefun-game.ts` — the kit's dossier library, unchanged.

## Hand in

```
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
node serve.ts        # or any static server over game/, to play it
```

MIT licensed — see `LICENSE`.

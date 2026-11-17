// World generation: the Shattered Belfry, built from a seed.
// 60 checkpoint rows climb 6 zone bands. Every row carries a SAFE main step;
// most rows braid in a BOLD step half a row higher (narrower, over the teeth,
// paid in ticks) and every fourth row hides a SECRET side-step with a tick
// cache. Rows are spaced 104px apart against a ~176px max jump, and the
// horizontal wander is capped well inside one jump's reach — every
// checkpoint is reachable on the SAFE braid alone, by construction.

import { makeRng, randRange, clamp } from './rng.js';
import {
  WORLD_W, WORLD_H, ZONE_COUNT, CPS_PER_ZONE, TOTAL_CPS, ROW_H,
} from './config.js';

export const GROUND_TOP = WORLD_H - 60;

export function rowY(i) { return GROUND_TOP - 46 - (i + 1) * ROW_H; }
export function zoneOfRow(i) { return Math.floor(i / CPS_PER_ZONE); }
export function zoneBand(z) {
  const bottom = rowY(z * CPS_PER_ZONE) + 150;
  const top = rowY(z * CPS_PER_ZONE + CPS_PER_ZONE - 1) - 210;
  return { top, bottom };
}

export function buildWorld(seed) {
  const rng = makeRng(seed * 7919 + 13);
  const platforms = [];
  const checkpoints = [];
  const ticks = [];
  const hazards = [];
  const walls = [];

  // The ground apron.
  platforms.push({ x: 0, y: GROUND_TOP, w: WORLD_W, route: 'safe', kind: 'ground', zone: 0 });

  let cx = 640;
  for (let i = 0; i < TOTAL_CPS; i++) {
    const zone = zoneOfRow(i);
    const y = rowY(i);
    cx = clamp(cx + randRange(rng, -185, 185), 170, WORLD_W - 170);
    const w = randRange(rng, 168, 208);
    const main = {
      x: cx - w / 2, y, w, route: 'safe',
      kind: zone === 5 && i % 3 === 2 ? 'phantom' : 'solid',
      phase: rng() * 3.6, zone, row: i,
    };
    platforms.push(main);

    // The checkpoint bell stands at the heart of the main step.
    checkpoints.push({ index: i, x: cx, y, zone, claimed: false, plat: main });

    // A tick or two on the safe step.
    ticks.push({ x: cx - w / 4, y: y - 26, taken: false, value: 1 });
    if (rng() < 0.6) ticks.push({ x: cx + w / 4, y: y - 26, taken: false, value: 1 });

    // BOLD braid: a narrow step half a row up, offset to one side.
    if (i > 0 && rng() < 0.82) {
      const side = rng() < 0.5 ? -1 : 1;
      const bx = clamp(cx + side * randRange(rng, 185, 250), 90, WORLD_W - 90);
      const bw = randRange(rng, 84, 106);
      platforms.push({
        x: bx - bw / 2, y: y - 52, w: bw, route: 'bold', kind: 'solid', phase: 0, zone, row: i,
      });
      ticks.push({ x: bx - 16, y: y - 78, taken: false, value: 1 });
      ticks.push({ x: bx + 16, y: y - 78, taken: false, value: 1 });
    }

    // SECRET braid: every fourth row, a side-step tucked far off the braid
    // with a three-tick cache. Still inside one jump from the main step.
    if (i % 4 === 2) {
      const side = cx < WORLD_W / 2 ? 1 : -1;
      const sx = clamp(cx + side * 235, 80, WORLD_W - 80);
      platforms.push({
        x: sx - 46, y: y - 30, w: 92, route: 'secret', kind: 'solid', phase: 0, zone, row: i,
      });
      for (let k = -1; k <= 1; k++) {
        ticks.push({ x: sx + k * 26, y: y - 58, taken: false, value: 1, secret: true });
      }
    }

    // Wall-jump flavour: brass wall plates beside some rows in the Gallery
    // and the Foundry. Never required — the braid always works without them.
    if ((zone === 2 || zone === 4) && i % 3 === 1) {
      const wx = clamp(cx + (rng() < 0.5 ? -1 : 1) * 150, 30, WORLD_W - 46);
      walls.push({ x: wx, y: y - 150, w: 16, h: 190, zone });
    }

    // The zone's signature hazard, placed against the main step — plus a
    // light seasoning of earlier zones' hazards from zone 3 upward.
    addHazard(hazards, rng, zone, main, i);
    if (zone >= 3 && i % 4 === 3) addHazard(hazards, rng, zone - 2, main, i, true);
  }

  // The top-bell platform above the last row, and the great bell itself.
  const bellY = rowY(TOTAL_CPS - 1) - 108;
  const bellPlat = { x: WORLD_W / 2 - 190, y: bellY, w: 380, route: 'safe', kind: 'solid', zone: 5, row: 60 };
  platforms.push(bellPlat);
  const topBell = { x: WORLD_W / 2, y: bellY, rung: false };

  return { platforms, checkpoints, ticks, hazards, walls, bellPlat, topBell, seed };
}

function addHazard(hazards, rng, zone, main, row, seasoning = false) {
  const kind = ['vent', 'gear', 'pendulum', 'saw', 'bell', 'phantom'][zone];
  const cxp = main.x + main.w / 2;
  const off = randRange(rng, -60, 60);
  if (kind === 'vent') {
    hazards.push({ kind, x: main.x + randRange(rng, 26, main.w - 26), y: main.y, zone, row, phase: rng() * 2.6, seasoning });
  } else if (kind === 'gear') {
    hazards.push({
      kind, x: clamp(cxp + (rng() < 0.5 ? -1 : 1) * randRange(rng, 120, 165), 60, WORLD_W - 60),
      baseY: main.y - 78, amp: randRange(rng, 34, 52), r: 30, zone, row,
      speed: randRange(rng, 0.9, 1.3), phase: rng() * 6.28, seasoning,
    });
  } else if (kind === 'pendulum') {
    hazards.push({
      kind, pivotX: clamp(cxp + off, 70, WORLD_W - 70), pivotY: main.y - 218,
      len: 128, r: 23, zone, row, speed: randRange(rng, 1.15, 1.45), phase: rng() * 6.28, seasoning,
    });
  } else if (kind === 'saw') {
    hazards.push({
      kind, cx: cxp, y: main.y - 44, range: main.w / 2 + randRange(rng, 26, 60), r: 21,
      zone, row, speed: randRange(rng, 0.8, 1.15), phase: rng() * 6.28, seasoning,
    });
  } else if (kind === 'bell') {
    hazards.push({
      kind, x: main.x + (rng() < 0.5 ? 14 : main.w - 14), y: main.y - 64, zone, row,
      period: randRange(rng, 2.6, 3.4), phase: rng() * 3, seasoning,
    });
  } else if (kind === 'phantom') {
    // In the Crown the hazard IS the floor: extra phantom steps haunt the row.
    hazards.push({ kind: 'phantomstep', x: cxp + off, y: main.y, zone, row, phase: rng() * 3.6, seasoning });
  }
}

// Is a phantom platform solid at time t? Cycle: 2.4s solid, 0.45s fading
// (still solid, visibly blinking), 0.75s gone.
export function phantomSolid(phase, t) {
  const c = ((t + phase) % 3.6 + 3.6) % 3.6;
  return c < 2.85;
}
export function phantomFading(phase, t) {
  const c = ((t + phase) % 3.6 + 3.6) % 3.6;
  return c >= 2.4 && c < 2.85;
}

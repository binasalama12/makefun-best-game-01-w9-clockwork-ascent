// Deterministic screenshot scenes for CLOCKWORK ASCENT, driven by the URL:
//   ?shot=climax&seed=7  zone 6 escape: gear-wall rising, Warden above, full HUD
//   ?shot=meta&seed=7    zone-gate draft: route map + 1-of-3 cog-charm cards
//   ?shot=title&seed=7   dense title: how-to, bestiary, charms, difficulties
//   ?shot=end&seed=7     victory: S rank, 10 stats, cog-charm recap
// Each scene is staged from a real run state with a fixed seed; the main
// loop fixed-steps it, freezes, and raises window.__shotReady.

import { DIFFICULTIES } from './config.js';
import { GROUND_TOP } from './level.js';

function claimUpTo(state, n) {
  for (let i = 0; i < n; i++) state.world.checkpoints[i].claimed = true;
  state.cpCount = n;
  state.lastCp = n > 0 ? state.world.checkpoints[n - 1] : null;
}

export function setupShotScene(state, api) {
  const params = new URLSearchParams(location.search);
  const shot = params.get('shot');
  if (!shot) return false;
  state.shotMode = shot;

  if (shot === 'title') {
    state.mode = 'title';
    state.difficulty = DIFFICULTIES[1];
    return true;
  }

  if (shot === 'climax') {
    api.newRun(7, DIFFICULTIES[1]);
    claimUpTo(state, 57);
    state.zoneIdx = 5;
    state.zoneName = 'THE WARDEN’S CROWN';
    state.zonesCleared = 5;
    for (const id of ['spring', 'glide', 'magnet', 'aegis', 'swift']) {
      state.charms.add(id); state.charmOrder.push(id);
    }
    state.aegisReady = true;
    state.score = 38450; state.deaths = 3; state.falls = 2;
    state.ticksCollected = 96; state.time = 287; state.zoneTime = 31;
    state.streak = 4; state.bestStreak = 5; state.parZonesBeaten = 4;
    const cp = state.world.checkpoints[57];
    state.player.x = cp.plat.x + 30;
    state.player.y = cp.plat.y - 168;
    state.player.vy = -260; state.player.vx = 120; state.player.facing = 1;
    state.escape.active = true;
    state.escape.wallY = state.player.y + 470;
    state.escape.speed = 60;
    state.camY = Math.max(0, state.player.y - 250);
    api.floater(cp.x, cp.y - 190, '+1,000 DEATHLESS ×4', '#ffd873');
    api.floater(cp.x - 90, cp.y - 120, '+100 CHECKPOINT 57/60', '#ffe9b8');
    api.banner('ZONE 6 — THE WARDEN’S CROWN', 'the gear-wall rises — ring the top bell!');
    state.fx.banner.t = 0.4;
    return true;
  }

  if (shot === 'meta') {
    api.newRun(7, DIFFICULTIES[1]);
    claimUpTo(state, 30);
    state.zoneIdx = 3;
    state.zoneName = 'THE SAW RUN';
    state.zonesCleared = 3;
    for (const id of ['spring', 'magnet']) {
      state.charms.add(id); state.charmOrder.push(id);
    }
    state.score = 18230; state.deaths = 2; state.falls = 1;
    state.ticksCollected = 54; state.time = 164;
    state.streak = 2; state.bestStreak = 3; state.parZonesBeaten = 2;
    state.draftOffer = ['glide', 'aegis', 'doubler'];
    const cp = state.world.checkpoints[30];
    state.player.x = cp.plat.x + 40;
    state.player.y = cp.plat.y - state.player.h;
    state.camY = Math.max(0, cp.plat.y - 420);
    state.mode = 'draft';
    return true;
  }

  if (shot === 'end') {
    api.newRun(7, DIFFICULTIES[1]);
    claimUpTo(state, 60);
    state.zoneIdx = 5;
    state.world.topBell.rung = true;
    const bp = state.world.bellPlat;
    state.player.x = bp.x + bp.w / 2 - 40;
    state.player.y = bp.y - state.player.h;
    state.camY = Math.max(0, bp.y - 430);
    state.won = true;
    state.rank = 'S';
    state.endStats = {
      score: 47280, time: 342, deaths: 4, falls: 3, ticks: 121,
      checkpoints: 60, parZones: 5, bestStreak: 5, secretCaches: 9,
      difficulty: 'JOURNEYMAN',
      charms: ['spring', 'glide', 'magnet', 'aegis', 'doubler'],
    };
    state.score = 47280;
    state.mode = 'end';
    const msg = document.getElementById('msg');
    if (msg) msg.textContent = '';
    return true;
  }

  return false;
}

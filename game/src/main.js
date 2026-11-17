// CLOCKWORK ASCENT — game state, loop, scoring, drafts, the escape.
// Modes: title -> play <-> draft -> end. Everything deterministic per seed.

import { buildWorld, rowY, zoneOfRow, GROUND_TOP } from './level.js';
import { makePlayer, stepPlayer } from './physics.js';
import { hazardKills } from './hazards.js';
import { input, initInput, pollInput } from './input.js';
import { updateHud, setMsg, fmtTime } from './hud.js';
import { sfx } from './audio.js';
import { render } from './render.js';
import { setupShotScene } from './shots.js';
import {
  ZONES, CHARMS, DIFFICULTIES, SCORE, TOTAL_CPS, CPS_PER_ZONE, WORLD_H, VIEW_H,
} from './config.js';
import { makeRng } from './rng.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

export const state = {
  mode: 'title',
  shotMode: null,
  world: null,
  player: null,
  camY: WORLD_H - VIEW_H,
  t: 0,
  time: 0,
  zoneTime: 0,
  score: 0,
  deaths: 0,
  falls: 0,
  ticksCollected: 0,
  cpCount: 0,
  lastCp: null,
  zoneIdx: 0,
  zoneName: ZONES[0].name,
  zoneDeaths: 0,
  streak: 0,
  bestStreak: 0,
  charms: new Set(),
  charmOrder: [],
  draftOffer: [],
  difficulty: DIFFICULTIES[1],
  escape: { active: false, wallY: 0, speed: 0 },
  aegisReady: false,
  won: false,
  rank: '—',
  parZonesBeaten: 0,
  secretCaches: 0,
  countedCaches: new Set(),
  zonesCleared: 0,
  paused: false,
  fx: { floaters: [], particles: [], banner: null },
  uiRects: [],
  endStats: null,
  seed: 7,
};

let draftRng = makeRng(99);

export function banner(title, sub = '') {
  state.fx.banner = { title, sub, t: 0 };
  sfx.banner();
}
export function floater(x, y, text, color = '#ffe9b8') {
  state.fx.floaters.push({ x, y, text, color, t: 0, life: 1.15 });
}
export function burst(x, y, n, color = '#e8c268') {
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2;
    const sp = 40 + Math.random() * 150;
    state.fx.particles.push({
      x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 40,
      t: 0, life: 0.5 + Math.random() * 0.5, color, size: 2 + Math.random() * 3,
    });
  }
}

export function newRun(seed, difficulty) {
  state.world = buildWorld(seed);
  state.seed = seed;
  state.difficulty = difficulty;
  draftRng = makeRng(seed * 31 + 7);
  const w = state.world;
  state.player = makePlayer(614, GROUND_TOP - 38);
  state.camY = WORLD_H - VIEW_H;
  state.time = 0; state.zoneTime = 0; state.score = 0;
  state.deaths = 0; state.falls = 0; state.ticksCollected = 0;
  state.cpCount = 0; state.lastCp = null;
  state.zoneIdx = 0; state.zoneName = ZONES[0].name; state.zoneDeaths = 0;
  state.streak = 0; state.bestStreak = 0;
  state.charms = new Set(); state.charmOrder = [];
  state.draftOffer = [];
  state.escape = { active: false, wallY: 0, speed: 0 };
  state.aegisReady = false;
  state.won = false; state.rank = '—';
  state.parZonesBeaten = 0; state.secretCaches = 0; state.countedCaches = new Set(); state.zonesCleared = 0;
  state.paused = false;
  state.fx = { floaters: [], particles: [], banner: null };
  state.endStats = null;
  state.mode = 'play';
  banner('ZONE 1 — ' + ZONES[0].name, ZONES[0].sub + ' · beat the par bell: ' + difficulty.parZone + 's');
  setMsg('Arrows / AD to run · SPACE to jump (buffered, coyote-timed) · wall-jump off brass plates');
}

function openDraft() {
  const unowned = CHARMS.filter((c) => !state.charms.has(c.id));
  const offer = [];
  const pool = [...unowned];
  while (offer.length < 3 && pool.length > 0) {
    offer.push(pool.splice(Math.floor(draftRng() * pool.length), 1)[0].id);
  }
  state.draftOffer = offer;
  state.mode = 'draft';
  sfx.draft();
}

export function chooseCharm(id) {
  if (!state.draftOffer.includes(id)) return;
  state.charms.add(id);
  state.charmOrder.push(id);
  if (id === 'aegis') state.aegisReady = true;
  state.draftOffer = [];
  state.mode = 'play';
  state.zoneTime = 0;
  sfx.charm();
  banner('ZONE ' + (state.zoneIdx + 1) + ' — ' + ZONES[state.zoneIdx].name,
    ZONES[state.zoneIdx].sub + ' · par ' + state.difficulty.parZone + 's');
}

function die(cause) {
  const pl = state.player;
  state.deaths += 1;
  state.zoneDeaths += 1;
  if (cause === 'fall') state.falls += 1;
  burst(pl.x + pl.w / 2, pl.y + pl.h / 2, 22, '#e86a4c');
  sfx.death();
  if (!state.charms.has('secondwind')) {
    // streak only breaks at zone end; the deathless hope for THIS zone dies now
  }
  respawn();
}

function respawn() {
  const pl = state.player;
  const cp = state.lastCp;
  if (cp) {
    pl.x = cp.x - pl.w / 2; pl.y = cp.y - pl.h;
  } else {
    pl.x = 614; pl.y = GROUND_TOP - pl.h;
  }
  pl.vx = 0; pl.vy = 0; pl.jumpsUsed = 0;
  if (state.escape.active) {
    state.escape.wallY = pl.y + 980;
    state.escape.speed = 52;
  }
}

function claimCheckpoint(cp) {
  cp.claimed = true;
  state.cpCount += 1;
  state.lastCp = cp;
  state.score += SCORE.checkpoint;
  floater(cp.x, cp.y - 84, '+100 CHECKPOINT ' + state.cpCount + '/60', '#ffe9b8');
  burst(cp.x, cp.y - 30, 14, '#ffd873');
  sfx.checkpoint();

  if (state.cpCount === 55 && !state.escape.active) {
    state.escape.active = true;
    state.escape.wallY = state.player.y + 1000;
    state.escape.speed = 52;
    banner('THE WARDEN WINDS THE TOWER DOWN', 'the gear-wall rises — climb or be wound away');
  }

  if (state.cpCount % CPS_PER_ZONE === 0 && state.cpCount < TOTAL_CPS) {
    // Zone cleared.
    const z = state.zoneIdx;
    state.zonesCleared += 1;
    if (state.zoneTime <= state.difficulty.parZone) {
      state.score += SCORE.parZoneBonus;
      state.parZonesBeaten += 1;
      floater(cp.x, cp.y - 124, 'PAR BELL BEATEN +1,500', '#8ce8a8');
    } else {
      floater(cp.x, cp.y - 124, 'PAR BELL MISSED — rank down', '#e88a6a');
    }
    if (state.zoneDeaths === 0) {
      state.streak += 1;
      state.bestStreak = Math.max(state.bestStreak, state.streak);
      const bonus = SCORE.deathlessBase * state.streak;
      state.score += bonus;
      floater(cp.x, cp.y - 164, '+' + bonus.toLocaleString('en-US') + ' DEATHLESS ×' + state.streak, '#ffd873');
    } else {
      state.streak = 0;
    }
    state.zoneIdx = z + 1;
    state.zoneName = ZONES[state.zoneIdx].name;
    state.zoneDeaths = 0;
    if (state.charms.has('aegis')) state.aegisReady = true;
    openDraft();
  }
}

function ringTopBell() {
  const pl = state.player;
  state.won = true;
  state.score += SCORE.topBell;
  if (state.escape.active && state.escape.wallY - (pl.y + pl.h) > 520) {
    state.score += SCORE.wardenBonus;
  }
  if (state.time <= state.difficulty.finalPar) state.score += 3000;
  // Final zone bookkeeping for the streak line.
  if (state.zoneDeaths === 0) {
    state.streak += 1;
    state.bestStreak = Math.max(state.bestStreak, state.streak);
    state.score += SCORE.deathlessBase * state.streak;
  }
  state.zonesCleared = 6;
  const s = state.score;
  state.rank = s >= 42000 ? 'S' : s >= 34000 ? 'A' : s >= 26000 ? 'B' : s >= 18000 ? 'C' : 'D';
  state.endStats = {
    score: s, time: state.time, deaths: state.deaths, falls: state.falls,
    ticks: state.ticksCollected, checkpoints: state.cpCount,
    parZones: state.parZonesBeaten, bestStreak: state.bestStreak,
    secretCaches: state.secretCaches, difficulty: state.difficulty.name,
    charms: [...state.charmOrder],
  };
  state.mode = 'end';
  sfx.bell();
  burst(state.world.topBell.x, state.world.topBell.y - 60, 40, '#ffd873');
  setMsg('');
}

function step(dt) {
  state.t += dt;
  const fx = state.fx;
  for (const f of fx.floaters) { f.t += dt; f.y -= 34 * dt; }
  fx.floaters = fx.floaters.filter((f) => f.t < f.life);
  for (const p of fx.particles) {
    p.t += dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 300 * dt;
  }
  fx.particles = fx.particles.filter((p) => p.t < p.life);
  if (fx.banner) { fx.banner.t += dt; if (fx.banner.t > 2.6) fx.banner = null; }

  if (state.mode !== 'play' || state.paused) return;
  state.time += dt;
  state.zoneTime += dt;

  const pl = state.player;
  const w = state.world;
  const inp = pollInput();
  // Two physics substeps for stable one-way landings.
  stepPlayer(pl, w, inp, dt / 2, state.t, state.charms);
  stepPlayer(pl, w, { ...inp, jumpPressed: false }, dt / 2, state.t, state.charms);

  // Camera follows the climb.
  const targetCam = Math.max(0, Math.min(WORLD_H - VIEW_H, pl.y + pl.h / 2 - 400));
  state.camY += (targetCam - state.camY) * Math.min(1, dt * 7);

  // Checkpoints: only the next bell in sequence can be claimed.
  const next = w.checkpoints[state.cpCount];
  if (next) {
    const pcx = pl.x + pl.w / 2;
    if (Math.abs(pcx - next.x) < 54 && pl.y + pl.h > next.y - 74 && pl.y + pl.h <= next.y + 34) {
      claimCheckpoint(next);
    }
  }

  // Ticks: collect on touch; the Magnet Bell reels in the near ones.
  for (const tk of w.ticks) {
    if (tk.taken) continue;
    const dx = tk.x - (pl.x + pl.w / 2);
    const dy = tk.y - (pl.y + pl.h / 2);
    const d2 = dx * dx + dy * dy;
    if (state.charms.has('magnet') && d2 < 150 * 150 && d2 > 30 * 30) {
      tk.x -= dx * dt * 6; tk.y -= dy * dt * 6;
    }
    if (d2 < 34 * 34) {
      tk.taken = true;
      state.ticksCollected += 1;
      const v = SCORE.tick * (state.charms.has('doubler') ? 2 : 1);
      state.score += v;
      floater(tk.x, tk.y - 18, '+' + v, '#ffe9b8');
      sfx.tick();
      // A secret cache pays out once all three of its ticks are taken.
      if (tk.secret && tk.cacheId !== undefined && !state.countedCaches.has(tk.cacheId)) {
        const cache = w.ticks.filter((o) => o.cacheId === tk.cacheId);
        if (cache.every((o) => o.taken)) {
          state.countedCaches.add(tk.cacheId);
          state.secretCaches += 1;
          state.score += SCORE.secretCache;
          floater(tk.x, tk.y - 44, 'SECRET CACHE +' + SCORE.secretCache, '#b48ce8');
          burst(tk.x, tk.y, 12, '#b48ce8');
        }
      }
    }
  }

  // Hazards.
  let killed = false;
  for (const h of w.hazards) {
    if (Math.abs(h.zone - state.zoneIdx) > 1 && Math.abs((h.y ?? h.baseY ?? 0) - pl.y) > 700) continue;
    if (hazardKills(h, pl, state.t)) { killed = true; break; }
  }
  if (killed) {
    if (state.charms.has('aegis') && state.aegisReady) {
      state.aegisReady = false;
      floater(pl.x + pl.w / 2, pl.y - 24, 'AEGIS COG SHATTERS!', '#8cd8e8');
      burst(pl.x + pl.w / 2, pl.y + pl.h / 2, 16, '#8cd8e8');
      sfx.aegis();
      pl.vy = -520; pl.y -= 6;
    } else {
      die('hazard');
      return;
    }
  }

  // Falls: dropping far below the last bell means the tower took you.
  const anchorY = state.lastCp ? state.lastCp.y : GROUND_TOP;
  if (pl.y > anchorY + 620 && pl.y + pl.h < GROUND_TOP) { die('fall'); return; }
  if (pl.y > WORLD_H + 80) { die('fall'); return; }

  // The escape: the Warden's gear-wall rises.
  if (state.escape.active && state.mode === 'play') {
    state.escape.speed = Math.min(132, state.escape.speed + dt * 2.2);
    state.escape.wallY -= state.escape.speed * dt;
    if (pl.y + pl.h > state.escape.wallY) { die('wound'); return; }
  }

  // The top bell.
  const bell = w.topBell;
  if (state.cpCount >= TOTAL_CPS &&
      Math.abs(pl.x + pl.w / 2 - bell.x) < 64 &&
      pl.y + pl.h > bell.y - 120 && pl.y + pl.h <= bell.y + 10) {
    ringTopBell();
  }
}

// ---- input actions -------------------------------------------------------
function action(code) {
  if (state.shotMode) return;
  if (code === 'KeyP' && state.mode === 'play') state.paused = !state.paused;
  if (code === 'KeyR' && (state.mode === 'play' || state.mode === 'end')) {
    newRun(state.seed, state.difficulty);
    return;
  }
  if (state.mode === 'title') {
    if (code === 'Digit1') state.difficulty = DIFFICULTIES[0];
    if (code === 'Digit2') state.difficulty = DIFFICULTIES[1];
    if (code === 'Digit3') state.difficulty = DIFFICULTIES[2];
    if (code === 'Enter' || code === 'Space') newRun(7 + Math.floor(Math.random() * 3), state.difficulty);
  } else if (state.mode === 'draft') {
    const idx = code === 'Digit1' ? 0 : code === 'Digit2' ? 1 : code === 'Digit3' ? 2 : -1;
    if (idx >= 0 && state.draftOffer[idx]) chooseCharm(state.draftOffer[idx]);
  } else if (state.mode === 'end') {
    if (code === 'Enter' || code === 'Space') { state.mode = 'title'; }
  }
}

canvas.addEventListener('click', (e) => {
  if (state.shotMode) return;
  const r = canvas.getBoundingClientRect();
  const x = (e.clientX - r.left) * (1280 / r.width);
  const y = (e.clientY - r.top) * (720 / r.height);
  for (const rc of state.uiRects) {
    if (x >= rc.x && x <= rc.x + rc.w && y >= rc.y && y <= rc.y + rc.h) {
      if (rc.action === 'difficulty') { state.difficulty = DIFFICULTIES[rc.index]; return; }
      if (rc.action === 'start') { newRun(7 + Math.floor(Math.random() * 3), state.difficulty); return; }
      if (rc.action === 'charm') { chooseCharm(rc.id); return; }
      if (rc.action === 'again') { state.mode = 'title'; return; }
    }
  }
  if (state.mode === 'title') newRun(7 + Math.floor(Math.random() * 3), state.difficulty);
});

// ---- boot + loop ---------------------------------------------------------
window.__clockwork = state; // dev/playability hook (used by the shot driver)
state.world = buildWorld(7);
state.player = makePlayer(614, GROUND_TOP - 38);
initInput(action);

const shotActive = setupShotScene(state, { newRun, banner, floater, burst });

let last = performance.now();
let frames = 0;
function frame(now) {
  const rawDt = Math.min(0.05, (now - last) / 1000);
  last = now;
  if (shotActive) {
    // Deterministic: advance a fixed number of steps, then freeze.
    if (frames < 40) { step(1 / 60); }
    render(ctx, state);
    frames += 1;
    if (frames === 42) window.__shotReady = true;
  } else {
    step(rawDt);
    render(ctx, state);
  }
  if (state.mode === 'play' || state.mode === 'draft') updateHud(state);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

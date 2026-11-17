// All canvas art for CLOCKWORK ASCENT: textured clockwork backdrops (a
// different machine-room per zone), the braided steps, six hazard machines,
// the Warden, HUD panels, and the title / draft / end screens.

import {
  ZONES, HAZARDS, CHARMS, CHARM_BY_ID, DIFFICULTIES, ROUTES, WORLD_W, WORLD_H, VIEW_H,
} from './config.js';
import { zoneBand, phantomSolid, phantomFading, rowY } from './level.js';
import { hazardState } from './hazards.js';
import { fmtTime } from './hud.js';

const W = 1280, H = 720;

function rr(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function gear(ctx, x, y, r, teeth, rot, fill, inner) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  ctx.fillStyle = fill;
  ctx.beginPath();
  for (let i = 0; i < teeth; i++) {
    const a = (i / teeth) * Math.PI * 2;
    const a2 = ((i + 0.42) / teeth) * Math.PI * 2;
    const a3 = ((i + 0.58) / teeth) * Math.PI * 2;
    const a4 = ((i + 1) / teeth) * Math.PI * 2;
    ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
    ctx.lineTo(Math.cos(a2) * r * 1.18, Math.sin(a2) * r * 1.18);
    ctx.lineTo(Math.cos(a3) * r * 1.18, Math.sin(a3) * r * 1.18);
    ctx.lineTo(Math.cos(a4) * r, Math.sin(a4) * r);
  }
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = inner;
  ctx.beginPath(); ctx.arc(0, 0, r * 0.45, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}

// Procedural textured backdrop for one zone band: gradient masonry, a slow
// train of giant gears, hanging chains, pipes and rivet seams.
function drawBackground(ctx, state, camY) {
  const t = state.t;
  for (let z = 0; z < ZONES.length; z++) {
    const band = zoneBand(z);
    const top = band.top - camY, bottom = band.bottom - camY;
    if (bottom < -80 || top > H + 80) continue;
    const zone = ZONES[z];
    const g = ctx.createLinearGradient(0, top, 0, bottom);
    g.addColorStop(0, zone.dark);
    g.addColorStop(0.5, shade(zone.dark, 14));
    g.addColorStop(1, zone.dark);
    ctx.fillStyle = g;
    ctx.fillRect(0, Math.max(0, top), W, Math.min(H, bottom) - Math.max(0, top));
    // masonry seams
    ctx.strokeStyle = 'rgba(255,220,150,0.05)';
    ctx.lineWidth = 2;
    for (let yy = Math.floor(top / 64) * 64; yy < bottom; yy += 64) {
      ctx.beginPath(); ctx.moveTo(0, yy); ctx.lineTo(W, yy); ctx.stroke();
    }
    // giant slow gears, seeded per zone
    const seedOff = z * 137;
    for (let i = 0; i < 4; i++) {
      const gx = ((i * 347 + seedOff) % 1200) + 40;
      const gy = band.top + 150 + ((i * 263 + seedOff) % Math.max(60, (band.bottom - band.top - 300)));
      const gr = 90 + ((i * 71 + seedOff) % 90);
      gear(ctx, gx, gy - camY, gr, 9, t * 0.05 * (i % 2 ? -1 : 1) + i,
        `hsla(${zone.hue}, 42%, 26%, 0.5)`, `hsla(${zone.hue}, 45%, 16%, 0.6)`);
    }
    // hanging chains
    ctx.strokeStyle = 'rgba(230,200,140,0.16)';
    ctx.lineWidth = 3;
    for (let i = 0; i < 5; i++) {
      const cxp = ((i * 271 + seedOff * 3) % 1240) + 20;
      ctx.beginPath(); ctx.moveTo(cxp, top); ctx.lineTo(cxp, top + 90 + (i % 3) * 40); ctx.stroke();
      ctx.fillStyle = 'rgba(230,200,140,0.25)';
      ctx.beginPath(); ctx.arc(cxp, top + 96 + (i % 3) * 40, 5, 0, Math.PI * 2); ctx.fill();
    }
    // zone name etched on the wall
    ctx.fillStyle = `hsla(${zone.hue}, 60%, 70%, 0.13)`;
    ctx.font = 'bold 44px Georgia, serif';
    ctx.textAlign = 'left';
    ctx.fillText('ZONE ' + (z + 1) + ' — ' + zone.name, 36, band.top + 74 - camY);
  }
  // Below the cellars: the foundry floor glow.
  const gTop = WORLD_H - 60 - camY;
  if (gTop < H) {
    const g = ctx.createLinearGradient(0, gTop, 0, H);
    g.addColorStop(0, '#2a1c0c'); g.addColorStop(1, '#120b04');
    ctx.fillStyle = g;
    ctx.fillRect(0, Math.max(0, gTop), W, H);
  }
}

function shade(hex, amt) {
  const n = parseInt(hex.slice(1), 16);
  const r = Math.min(255, (n >> 16) + amt);
  const g = Math.min(255, ((n >> 8) & 255) + amt);
  const b = Math.min(255, (n & 255) + amt);
  return `rgb(${r},${g},${b})`;
}

function drawPlatform(ctx, p, camY, t) {
  const y = p.y - camY;
  if (y < -40 || y > H + 40) return;
  let alpha = 1;
  if (p.kind === 'phantom') {
    if (!phantomSolid(p.phase, t)) alpha = 0.13;
    else if (phantomFading(p.phase, t)) alpha = 0.45 + 0.3 * Math.sin(t * 26);
  }
  ctx.save();
  ctx.globalAlpha = alpha;
  const routeColor = p.route === 'bold' ? '#e8a34c' : p.route === 'secret' ? '#b48ce8' : '#c8b088';
  // body
  const g = ctx.createLinearGradient(0, y, 0, y + 16);
  g.addColorStop(0, '#4a3a22'); g.addColorStop(1, '#241a0e');
  ctx.fillStyle = g;
  if (p.kind === 'ground') {
    ctx.fillRect(p.x, y, p.w, 60);
    ctx.fillStyle = '#6a532e';
    ctx.fillRect(p.x, y, p.w, 5);
  } else {
    rr(ctx, p.x, y, p.w, 15, 5);
    ctx.fill();
    ctx.fillStyle = routeColor;
    rr(ctx, p.x, y, p.w, 5, 3);
    ctx.fill();
    // support struts + rivets
    ctx.fillStyle = 'rgba(200,170,110,0.5)';
    for (let rx = p.x + 12; rx < p.x + p.w - 6; rx += 26) {
      ctx.beginPath(); ctx.arc(rx, y + 10, 2, 0, Math.PI * 2); ctx.fill();
    }
    ctx.strokeStyle = 'rgba(0,0,0,0.35)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(p.x + p.w / 2, y + 15); ctx.lineTo(p.x + p.w / 2, y + 34); ctx.stroke();
  }
  ctx.restore();
}

function drawCheckpoint(ctx, cp, camY, t, isNext) {
  const y = cp.y - camY;
  if (y < -90 || y > H + 40) return;
  const x = cp.x;
  // post
  ctx.strokeStyle = cp.claimed ? '#ffd873' : '#8a7648';
  ctx.lineWidth = 4;
  ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y - 52); ctx.stroke();
  // bell
  const sway = Math.sin(t * 2 + cp.index) * (isNext ? 3 : 1);
  ctx.save();
  ctx.translate(x + sway, y - 60);
  ctx.fillStyle = cp.claimed ? '#ffd873' : isNext ? '#e8c268' : '#7a6a44';
  if (isNext) {
    ctx.shadowColor = '#ffd873';
    ctx.shadowBlur = 16 + Math.sin(t * 5) * 6;
  }
  ctx.beginPath();
  ctx.moveTo(-11, 6); ctx.quadraticCurveTo(-11, -10, 0, -12);
  ctx.quadraticCurveTo(11, -10, 11, 6);
  ctx.lineTo(13, 9); ctx.lineTo(-13, 9);
  ctx.closePath(); ctx.fill();
  ctx.restore();
  if (isNext) {
    ctx.fillStyle = '#ffe9b8';
    ctx.font = 'bold 12px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.fillText('NEXT', x, y - 84);
  }
  ctx.fillStyle = 'rgba(255,233,184,0.65)';
  ctx.font = '11px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText(String(cp.index + 1), x, y + 16);
}

function drawTick(ctx, tk, camY, t) {
  if (tk.taken) return;
  const y = tk.y - camY + Math.sin(t * 3 + tk.x) * 3;
  if (y < -30 || y > H + 30) return;
  gear(ctx, tk.x, y, 8, 8, t * 2.4 + tk.x, tk.secret ? '#b48ce8' : '#ffd873', '#7a5c14');
}

function drawHazard(ctx, h, camY, t) {
  const s = hazardState(h, t);
  ctx.save();
  if (h.kind === 'vent') {
    const y = h.y - camY;
    if (y > -160 && y < H + 40) {
      ctx.fillStyle = '#5a4a30';
      rr(ctx, h.x - 14, y - 8, 28, 10, 3); ctx.fill();
      if (s.mode === 'warn') {
        ctx.fillStyle = 'rgba(220,230,235,0.5)';
        ctx.beginPath(); ctx.arc(h.x, y - 16, 6 + Math.sin(t * 30) * 2, 0, Math.PI * 2); ctx.fill();
      } else if (s.mode === 'jet') {
        const g = ctx.createLinearGradient(0, y - s.jetH, 0, y);
        g.addColorStop(0, 'rgba(225,238,244,0)');
        g.addColorStop(1, 'rgba(225,238,244,0.85)');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.moveTo(h.x - 12, y - 6);
        ctx.quadraticCurveTo(h.x - 6, y - s.jetH * 0.6, h.x - 3, y - s.jetH);
        ctx.lineTo(h.x + 3, y - s.jetH);
        ctx.quadraticCurveTo(h.x + 6, y - s.jetH * 0.6, h.x + 12, y - 6);
        ctx.closePath(); ctx.fill();
      }
    }
  } else if (h.kind === 'gear') {
    const y = s.y - camY;
    if (y > -80 && y < H + 80) {
      ctx.strokeStyle = 'rgba(200,170,110,0.35)';
      ctx.lineWidth = 4;
      ctx.beginPath(); ctx.moveTo(s.x, h.baseY - h.amp - 44 - camY); ctx.lineTo(s.x, h.baseY + h.amp + 44 - camY); ctx.stroke();
      gear(ctx, s.x, y, s.r, 10, s.rot, '#8a6a34', '#3a2a12');
      ctx.fillStyle = '#e8c268';
      ctx.beginPath(); ctx.arc(s.x, y, 5, 0, Math.PI * 2); ctx.fill();
    }
  } else if (h.kind === 'pendulum') {
    const py = h.pivotY - camY;
    if (py > -260 && py < H + 120) {
      ctx.strokeStyle = '#9a8a68';
      ctx.lineWidth = 4;
      ctx.beginPath(); ctx.moveTo(h.pivotX, py); ctx.lineTo(s.x, s.y - camY); ctx.stroke();
      ctx.fillStyle = '#6a532e';
      ctx.beginPath(); ctx.arc(h.pivotX, py, 8, 0, Math.PI * 2); ctx.fill();
      gear(ctx, s.x, s.y - camY, s.r, 8, t * 3, '#7a6240', '#2e2110');
      ctx.fillStyle = '#d8d8de';
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2 + t * 3;
        ctx.beginPath();
        ctx.arc(s.x + Math.cos(a) * (s.r + 5), s.y - camY + Math.sin(a) * (s.r + 5), 3.4, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  } else if (h.kind === 'saw') {
    const y = s.y - camY;
    if (y > -60 && y < H + 60) {
      ctx.strokeStyle = 'rgba(200,170,110,0.4)';
      ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(h.cx - h.range, y); ctx.lineTo(h.cx + h.range, y); ctx.stroke();
      gear(ctx, s.x, y, s.r, 12, s.rot, '#c8ccd4', '#5a6068');
    }
  } else if (h.kind === 'bell') {
    const y = h.y - camY;
    if (y > -340 && y < H + 340) {
      ctx.fillStyle = '#a87f2e';
      ctx.beginPath();
      ctx.moveTo(h.x - 13, y + 8); ctx.quadraticCurveTo(h.x - 13, y - 14, h.x, y - 16);
      ctx.quadraticCurveTo(h.x + 13, y - 14, h.x + 13, y + 8);
      ctx.lineTo(h.x + 16, y + 12); ctx.lineTo(h.x - 16, y + 12);
      ctx.closePath(); ctx.fill();
      if (s.ringR > 0) {
        ctx.strokeStyle = `rgba(255,216,115,${0.75 * (1 - s.ringR / 320)})`;
        ctx.lineWidth = 7;
        ctx.beginPath(); ctx.arc(h.x, y, s.ringR, 0, Math.PI * 2); ctx.stroke();
      }
    }
  }
  ctx.restore();
}

// The Warden of Hours: a tall brass figure at the crown, arms turning like
// clock hands, and the great top bell he guards.
function drawWarden(ctx, state, camY) {
  const bell = state.world.topBell;
  const by = bell.y - camY;
  if (by < -420 || by > H + 100) return;
  const t = state.t;
  const x = bell.x + 250;
  const baseY = by;
  ctx.save();
  // body: a long coat of dark brass
  ctx.fillStyle = '#2c2416';
  ctx.beginPath();
  ctx.moveTo(x - 30, baseY);
  ctx.quadraticCurveTo(x - 36, baseY - 130, x - 14, baseY - 168);
  ctx.lineTo(x + 14, baseY - 168);
  ctx.quadraticCurveTo(x + 36, baseY - 130, x + 30, baseY);
  ctx.closePath(); ctx.fill();
  ctx.strokeStyle = '#c8a24c';
  ctx.lineWidth = 2; ctx.stroke();
  // clock face head
  ctx.fillStyle = '#e8d9a8';
  ctx.beginPath(); ctx.arc(x, baseY - 188, 26, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#6a532e'; ctx.lineWidth = 3; ctx.stroke();
  ctx.strokeStyle = '#241a0e'; ctx.lineWidth = 3;
  const ha = t * 0.7, ma = t * 3.1;
  ctx.beginPath(); ctx.moveTo(x, baseY - 188); ctx.lineTo(x + Math.cos(ha) * 15, baseY - 188 + Math.sin(ha) * 15); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(x, baseY - 188); ctx.lineTo(x + Math.cos(ma) * 21, baseY - 188 + Math.sin(ma) * 21); ctx.stroke();
  // long arms, sweeping like hands
  ctx.strokeStyle = '#c8a24c'; ctx.lineWidth = 6;
  const aa = Math.sin(t * 0.9) * 0.7;
  ctx.beginPath(); ctx.moveTo(x - 12, baseY - 150); ctx.lineTo(x - 66, baseY - 118 + aa * 30); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(x + 12, baseY - 150); ctx.lineTo(x + 66, baseY - 118 - aa * 30); ctx.stroke();
  // top hat of gears
  gear(ctx, x, baseY - 222, 17, 8, t * 1.4, '#8a6a34', '#3a2a12');
  ctx.fillStyle = 'rgba(255,216,115,0.9)';
  ctx.font = 'bold 13px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText('THE WARDEN OF HOURS', x, baseY - 252);
  ctx.restore();
  // the great bell
  ctx.save();
  ctx.translate(bell.x, by - 66);
  ctx.fillStyle = bell.rung ? '#ffe9a8' : '#ffd873';
  ctx.shadowColor = '#ffd873';
  ctx.shadowBlur = bell.rung ? 30 : 12;
  ctx.beginPath();
  ctx.moveTo(-30, 16); ctx.quadraticCurveTo(-30, -28, 0, -34);
  ctx.quadraticCurveTo(30, -28, 30, 16);
  ctx.lineTo(36, 22); ctx.lineTo(-36, 22);
  ctx.closePath(); ctx.fill();
  ctx.restore();
  ctx.fillStyle = '#ffe9b8';
  ctx.font = 'bold 12px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText('RING THE TOP BELL', bell.x, by - 116);
}

function drawWindWall(ctx, state, camY) {
  if (!state.escape.active) return;
  const y = state.escape.wallY - camY;
  if (y > H + 200) return;
  ctx.save();
  const g = ctx.createLinearGradient(0, y, 0, H);
  g.addColorStop(0, 'rgba(120,40,20,0.25)');
  g.addColorStop(0.12, 'rgba(60,26,10,0.92)');
  g.addColorStop(1, '#180b04');
  ctx.fillStyle = g;
  ctx.fillRect(0, y, W, H - y);
  for (let x = 20; x < W; x += 56) {
    gear(ctx, x, y + 12, 24, 9, state.t * (2 + (x % 3)) + x, '#7a4a22', '#331c08');
  }
  ctx.fillStyle = '#ffb08a';
  ctx.font = 'bold 15px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText('⚠ THE WARDEN WINDS THE TOWER DOWN ⚠', W / 2, Math.min(H - 14, y + 52));
  ctx.restore();
}

function drawPlayer(ctx, state, camY) {
  const pl = state.player;
  const x = pl.x, y = pl.y - camY;
  if (y < -80 || y > H + 80) return;
  const t = state.t;
  ctx.save();
  ctx.translate(x + pl.w / 2, y + pl.h / 2);
  ctx.scale(pl.facing, 1);
  // glide mantle
  if (pl.glide) {
    ctx.fillStyle = 'rgba(140,216,232,0.55)';
    ctx.beginPath();
    ctx.moveTo(-16, -8); ctx.quadraticCurveTo(0, -22, 18, -8);
    ctx.quadraticCurveTo(0, -13, -16, -8);
    ctx.fill();
  }
  // legs: scissor when running
  const run = pl.grounded && Math.abs(pl.vx) > 30 ? Math.sin(t * 18) * 7 : 0;
  ctx.strokeStyle = '#31435c';
  ctx.lineWidth = 5;
  ctx.beginPath(); ctx.moveTo(0, 6); ctx.lineTo(-5 + run, 18); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(0, 6); ctx.lineTo(5 - run, 18); ctx.stroke();
  // coat
  ctx.fillStyle = '#b0483a';
  rr(ctx, -9, -12, 18, 20, 5); ctx.fill();
  // head + cap
  ctx.fillStyle = '#e8c39a';
  ctx.beginPath(); ctx.arc(1, -19, 8, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#31435c';
  ctx.fillRect(-7, -28, 17, 6);
  ctx.fillRect(4, -28, 10, 3);
  // scarf, trailing against motion
  ctx.strokeStyle = '#ffd873';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(-6, -14);
  ctx.quadraticCurveTo(-16, -12 + Math.sin(t * 9) * 3, -22, -8 + Math.sin(t * 9 + 1) * 4);
  ctx.stroke();
  ctx.restore();
  // Aegis bubble
  if (state.charms.has('aegis') && state.aegisReady) {
    ctx.strokeStyle = 'rgba(140,216,232,0.65)';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(x + pl.w / 2, y + pl.h / 2, 30, 0, Math.PI * 2); ctx.stroke();
  }
}

function drawWorld(ctx, state) {
  const camY = state.camY;
  const t = state.t;
  drawBackground(ctx, state, camY);
  for (const wl of state.world.walls) {
    const y = wl.y - camY;
    if (y < -220 || y > H + 40) continue;
    ctx.fillStyle = '#5a4630';
    ctx.fillRect(wl.x, y, wl.w, wl.h);
    ctx.fillStyle = '#c8a24c';
    for (let ry = y + 12; ry < y + wl.h - 6; ry += 24) ctx.fillRect(wl.x + 4, ry, wl.w - 8, 3);
  }
  for (const p of state.world.platforms) drawPlatform(ctx, p, camY, t);
  for (const tk of state.world.ticks) drawTick(ctx, tk, camY, t);
  const nextCp = state.world.checkpoints[state.cpCount];
  for (const cp of state.world.checkpoints) drawCheckpoint(ctx, cp, camY, t, cp === nextCp);
  for (const h of state.world.hazards) drawHazard(ctx, h, camY, t);
  drawWarden(ctx, state, camY);
  drawWindWall(ctx, state, camY);
  drawPlayer(ctx, state, camY);
  // particles + floaters
  for (const p of state.fx.particles) {
    ctx.globalAlpha = 1 - p.t / p.life;
    ctx.fillStyle = p.color;
    ctx.fillRect(p.x - p.size / 2, p.y - camY - p.size / 2, p.size, p.size);
  }
  ctx.globalAlpha = 1;
  ctx.font = 'bold 17px Georgia, serif';
  ctx.textAlign = 'center';
  for (const f of state.fx.floaters) {
    ctx.globalAlpha = 1 - f.t / f.life;
    ctx.fillStyle = f.color;
    ctx.fillText(f.text, f.x, f.y - camY);
  }
  ctx.globalAlpha = 1;
}

// In-play HUD panels drawn on canvas: WIN/LOSE, two resource bars
// (par clock + deathless streak), incoming hazards, charm collection,
// combo chain and the banner.
function drawPlayHud(ctx, state) {
  const diff = state.difficulty;
  // WIN / LOSE card
  ctx.save();
  ctx.fillStyle = 'rgba(8,5,2,0.72)';
  rr(ctx, 14, 54, 348, 64, 8); ctx.fill();
  ctx.strokeStyle = 'rgba(200,162,76,0.6)'; ctx.lineWidth = 1; ctx.stroke();
  ctx.textAlign = 'left';
  ctx.fillStyle = '#8ce8a8';
  ctx.font = 'bold 13.5px Georgia, serif';
  ctx.fillText('WIN: ring the top bell (60/60 checkpoints)', 26, 76);
  ctx.fillStyle = '#e88a6a';
  ctx.fillText('LOSE: miss a par bell = rank down · falls: ' + state.falls, 26, 96);
  ctx.fillStyle = '#ffe9b8';
  ctx.font = '12.5px Georgia, serif';
  ctx.fillText('Difficulty: ' + diff.name + ' · run par ' + fmtTime(diff.finalPar) + ' · time ' + fmtTime(state.time), 26, 112);
  // Par bar (zone clock vs par) + streak bar
  const parFrac = Math.min(1, state.zoneTime / diff.parZone);
  ctx.fillStyle = 'rgba(255,255,255,0.12)';
  rr(ctx, 14, 126, 348, 12, 6); ctx.fill();
  ctx.fillStyle = parFrac < 0.75 ? '#8ce8a8' : parFrac < 1 ? '#ffd873' : '#e86a4c';
  rr(ctx, 14, 126, 348 * parFrac, 12, 6); ctx.fill();
  ctx.fillStyle = '#ffe9b8';
  ctx.font = '11px Georgia, serif';
  ctx.fillText('ZONE PAR ' + state.zoneTime.toFixed(0) + 's / ' + diff.parZone + 's', 20, 136);
  const streakFrac = Math.min(1, state.streak / 6);
  ctx.fillStyle = 'rgba(255,255,255,0.12)';
  rr(ctx, 14, 144, 348, 12, 6); ctx.fill();
  ctx.fillStyle = '#ffd873';
  rr(ctx, 14, 144, 348 * streakFrac, 12, 6); ctx.fill();
  ctx.fillStyle = '#241a0e';
  ctx.fillText('DEATHLESS CHAIN ×' + state.streak + ' (best ×' + state.bestStreak + ')', 20, 154);
  // Incoming hazards panel (this zone + next)
  const zx = W - 252;
  ctx.fillStyle = 'rgba(8,5,2,0.72)';
  rr(ctx, zx, 54, 238, 118, 8); ctx.fill();
  ctx.strokeStyle = 'rgba(200,162,76,0.6)'; ctx.stroke();
  ctx.fillStyle = '#e8a34c';
  ctx.font = 'bold 12px Georgia, serif';
  ctx.fillText('⚠ INCOMING — ZONE ' + (state.zoneIdx + 1), zx + 12, 74);
  ctx.font = '12px Georgia, serif';
  let yy = 94;
  const here = HAZARDS[state.zoneIdx];
  ctx.fillStyle = '#ffe9b8';
  ctx.fillText('• ' + here.name + ' — live now', zx + 12, yy); yy += 17;
  ctx.fillStyle = 'rgba(255,233,184,0.75)';
  const counts = {};
  for (const h of state.world.hazards) if (h.zone === state.zoneIdx) counts[h.kind] = (counts[h.kind] || 0) + 1;
  for (const [k, n] of Object.entries(counts)) {
    const hz = HAZARDS.find((o) => o.id === (k === 'phantomstep' ? 'phantom' : k));
    if (hz) { ctx.fillText('  ' + hz.name + ' ×' + n, zx + 12, yy); yy += 15; }
  }
  if (state.zoneIdx < 5) {
    ctx.fillStyle = '#e8a34c';
    ctx.fillText('Next: ' + HAZARDS[state.zoneIdx + 1].name + ' — ' + ZONES[state.zoneIdx + 1].name, zx + 12, yy + 4);
  } else {
    ctx.fillStyle = '#e86a4c';
    ctx.fillText(state.escape.active ? 'ESCAPE: the gear-wall is rising!' : 'Final zone — the Warden waits', zx + 12, yy + 4);
  }
  // Charm collection panel
  const cy = H - 56;
  ctx.fillStyle = 'rgba(8,5,2,0.72)';
  rr(ctx, 14, cy, 470, 44, 8); ctx.fill();
  ctx.strokeStyle = 'rgba(200,162,76,0.6)'; ctx.stroke();
  ctx.fillStyle = '#d8a860';
  ctx.font = 'bold 11px Georgia, serif';
  ctx.fillText('COG-CHARMS ' + state.charmOrder.length + '/8', 24, cy + 16);
  ctx.font = '12.5px Georgia, serif';
  let cxp = 24;
  if (state.charmOrder.length === 0) {
    ctx.fillStyle = 'rgba(255,233,184,0.6)';
    ctx.fillText('draft 1-of-3 at each zone gate', 24, cy + 34);
  }
  for (const id of state.charmOrder) {
    const c = CHARM_BY_ID[id];
    ctx.fillStyle = '#ffd873';
    ctx.fillText(c.icon + ' ' + c.name, cxp, cy + 34);
    cxp += ctx.measureText(c.icon + ' ' + c.name).width + 16;
    if (cxp > 440) break;
  }
  // Route legend
  ctx.fillStyle = 'rgba(8,5,2,0.6)';
  rr(ctx, W - 252, H - 40, 238, 28, 8); ctx.fill();
  ctx.font = '11.5px Georgia, serif';
  let rx = W - 240;
  for (const r of ROUTES) {
    ctx.fillStyle = r.color;
    ctx.fillText('■ ' + r.name, rx, H - 21);
    rx += ctx.measureText('■ ' + r.name).width + 14;
  }
  // Banner
  if (state.fx.banner) {
    const b = state.fx.banner;
    const a = b.t < 0.25 ? b.t / 0.25 : b.t > 2.2 ? Math.max(0, (2.6 - b.t) / 0.4) : 1;
    ctx.globalAlpha = a;
    ctx.fillStyle = 'rgba(8,5,2,0.78)';
    rr(ctx, W / 2 - 330, 168, 660, 74, 10); ctx.fill();
    ctx.strokeStyle = '#c8a24c'; ctx.lineWidth = 2; ctx.stroke();
    ctx.fillStyle = '#ffd873';
    ctx.font = 'bold 27px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.fillText(b.title, W / 2, 202);
    ctx.fillStyle = '#ffe9b8';
    ctx.font = '15px Georgia, serif';
    ctx.fillText(b.sub, W / 2, 228);
    ctx.globalAlpha = 1;
    ctx.textAlign = 'left';
  }
  if (state.paused) {
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#ffe9b8';
    ctx.font = 'bold 40px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.fillText('PAUSED — P to resume', W / 2, H / 2);
  }
  ctx.restore();
}

// ---- Title: dense. How-to, the full bestiary, the charms, difficulties. --
function drawTitle(ctx, state) {
  state.camY = WORLD_H - VIEW_H - 2350 + Math.sin(state.t * 0.11) * 160;
  drawWorld(ctx, state);
  ctx.fillStyle = 'rgba(5,3,1,0.66)';
  ctx.fillRect(0, 0, W, H);
  state.uiRects = [];
  ctx.textAlign = 'center';
  ctx.fillStyle = '#ffd873';
  ctx.font = 'bold 54px Georgia, serif';
  ctx.fillText('CLOCKWORK ASCENT', W / 2, 78);
  ctx.fillStyle = '#ffe9b8';
  ctx.font = '17px Georgia, serif';
  ctx.fillText('Sprint and wall-jump up the Shattered Belfry — 60 checkpoints, 6 zones, 3 braided routes.', W / 2, 106);
  ctx.fillText('Draft a cog-charm at every gate, beat the par bell, ring the top bell past the Warden of Hours.', W / 2, 128);

  // Left column: how to play + routes
  ctx.textAlign = 'left';
  ctx.fillStyle = 'rgba(10,6,2,0.85)';
  rr(ctx, 30, 150, 380, 318, 10); ctx.fill();
  ctx.strokeStyle = '#c8a24c'; ctx.lineWidth = 1.5; ctx.stroke();
  ctx.fillStyle = '#ffd873';
  ctx.font = 'bold 16px Georgia, serif';
  ctx.fillText('HOW TO ASCEND', 48, 178);
  ctx.fillStyle = '#ffe9b8';
  ctx.font = '13.5px Georgia, serif';
  const how = [
    '←→ / AD — run · SPACE / W — jump',
    'Coyote time + jump buffering: late jumps count.',
    'Release SPACE early to fall early (variable height).',
    'Wall-jump off brass plates and tower walls.',
    'Claim bells in order: 60 checkpoints to the crown.',
    'Falling far below your last bell costs a life-count',
    'and breaks the zone deathless streak.',
    '',
    'WIN: ring the top bell. LOSE: every par bell you',
    'miss ranks you down; the falls counter never lies.',
  ];
  how.forEach((s, i) => ctx.fillText(s, 48, 204 + i * 19));
  ctx.fillStyle = '#ffd873';
  ctx.font = 'bold 14px Georgia, serif';
  ctx.fillText('THE 3 BRAIDED ROUTES', 48, 396);
  ctx.font = '13px Georgia, serif';
  ROUTES.forEach((r, i) => {
    ctx.fillStyle = r.color;
    ctx.fillText('■ ' + r.name + ' — ' + r.desc, 48, 418 + i * 17);
  });

  // Middle column: bestiary
  ctx.fillStyle = 'rgba(10,6,2,0.85)';
  rr(ctx, 428, 150, 424, 318, 10); ctx.fill();
  ctx.strokeStyle = '#c8a24c'; ctx.stroke();
  ctx.fillStyle = '#ffd873';
  ctx.font = 'bold 16px Georgia, serif';
  ctx.fillText('BESTIARY — THE WARDEN’S SIX MACHINES', 446, 178);
  ctx.font = '12.8px Georgia, serif';
  HAZARDS.forEach((hz, i) => {
    const y = 204 + i * 41;
    ctx.fillStyle = '#e8a34c';
    ctx.font = 'bold 13.5px Georgia, serif';
    ctx.fillText((i + 1) + '. ' + hz.name, 446, y);
    ctx.fillStyle = 'rgba(255,233,184,0.88)';
    ctx.font = '12.3px Georgia, serif';
    wrapText(ctx, hz.desc, 446, y + 16, 390, 14);
  });

  // Right column: the eight cog-charms
  ctx.fillStyle = 'rgba(10,6,2,0.85)';
  rr(ctx, 870, 150, 380, 318, 10); ctx.fill();
  ctx.strokeStyle = '#c8a24c'; ctx.stroke();
  ctx.fillStyle = '#ffd873';
  ctx.font = 'bold 16px Georgia, serif';
  ctx.fillText('8 COG-CHARMS — DRAFT 1-OF-3 PER GATE', 888, 178);
  ctx.font = '12.8px Georgia, serif';
  CHARMS.forEach((c, i) => {
    const y = 202 + i * 31;
    ctx.fillStyle = '#ffd873';
    ctx.fillText(c.icon + ' ' + c.name, 888, y);
    ctx.fillStyle = 'rgba(255,233,184,0.8)';
    ctx.font = '11.8px Georgia, serif';
    ctx.fillText(c.desc, 888, y + 14);
    ctx.font = '12.8px Georgia, serif';
  });

  // Difficulty cards (clickable) + start
  ctx.font = 'bold 15px Georgia, serif';
  DIFFICULTIES.forEach((d, i) => {
    const x = 190 + i * 300, y = 478, w = 280, h = 96;
    const sel = state.difficulty.id === d.id;
    ctx.fillStyle = sel ? 'rgba(90,64,20,0.92)' : 'rgba(10,6,2,0.85)';
    rr(ctx, x, y, w, h, 10); ctx.fill();
    ctx.strokeStyle = sel ? '#ffd873' : '#8a7648';
    ctx.lineWidth = sel ? 3 : 1.5; ctx.stroke();
    ctx.fillStyle = '#ffd873';
    ctx.textAlign = 'center';
    ctx.fillText((i + 1) + ' · ' + d.name, x + w / 2, y + 26);
    ctx.fillStyle = '#ffe9b8';
    ctx.font = '12.5px Georgia, serif';
    ctx.fillText('zone par ' + d.parZone + 's · run par ' + fmtTime(d.finalPar), x + w / 2, y + 48);
    ctx.fillStyle = 'rgba(255,233,184,0.8)';
    ctx.font = '11.8px Georgia, serif';
    ctx.fillText(d.desc, x + w / 2, y + 68);
    ctx.font = 'bold 15px Georgia, serif';
    state.uiRects.push({ x, y, w, h, action: 'difficulty', index: i });
  });
  ctx.fillStyle = '#ffd873';
  ctx.font = 'bold 22px Georgia, serif';
  ctx.textAlign = 'center';
  const pulse = 0.75 + Math.sin(state.t * 4) * 0.25;
  ctx.globalAlpha = pulse;
  ctx.fillText('▶  CLICK OR PRESS ENTER TO CLIMB  ◀', W / 2, 622);
  ctx.globalAlpha = 1;
  ctx.fillStyle = 'rgba(255,233,184,0.75)';
  ctx.font = '13px Georgia, serif';
  ctx.fillText('Full run scores in the tens of thousands: deathless chains × par bells × secret caches. R restarts · P pauses.', W / 2, 652);
  ctx.fillText('Final zone is a timed escape — at checkpoint 55 the Warden starts winding the tower down.', W / 2, 674);
}

function wrapText(ctx, text, x, y, maxW, lh) {
  const words = text.split(' ');
  let line = '', yy = y;
  for (const word of words) {
    const test = line ? line + ' ' + word : word;
    if (ctx.measureText(test).width > maxW && line) {
      ctx.fillText(line, x, yy);
      line = word; yy += lh;
    } else line = test;
  }
  if (line) ctx.fillText(line, x, yy);
  return yy;
}

// ---- Draft / route-map (meta) screen --------------------------------------
function drawDraft(ctx, state) {
  drawWorld(ctx, state);
  ctx.fillStyle = 'rgba(5,3,1,0.78)';
  ctx.fillRect(0, 0, W, H);
  state.uiRects = [];
  ctx.textAlign = 'center';
  ctx.fillStyle = '#ffd873';
  ctx.font = 'bold 34px Georgia, serif';
  ctx.fillText('ZONE GATE — DRAFT A COG-CHARM', W / 2, 62);
  ctx.fillStyle = '#ffe9b8';
  ctx.font = '15.5px Georgia, serif';
  ctx.fillText('Zone ' + state.zonesCleared + ' of 6 cleared · score ' + state.score.toLocaleString('en-US') +
    ' · deathless chain ×' + state.streak + ' · choose 1 of 3 (keys 1–3 or click)', W / 2, 88);

  // Route map: the tower as a vertical schematic, zones stacked, braid lines.
  const mx = 56, my = 118, mw = 380, mh = 540;
  ctx.fillStyle = 'rgba(10,6,2,0.9)';
  rr(ctx, mx, my, mw, mh, 10); ctx.fill();
  ctx.strokeStyle = '#c8a24c'; ctx.lineWidth = 1.5; ctx.stroke();
  ctx.fillStyle = '#ffd873';
  ctx.font = 'bold 15px Georgia, serif';
  ctx.textAlign = 'left';
  ctx.fillText('ROUTE MAP — THE SHATTERED BELFRY', mx + 18, my + 28);
  const bandH = (mh - 70) / 6;
  for (let z = 5; z >= 0; z--) {
    const row = 5 - z;
    const y = my + 44 + row * bandH;
    const done = z < state.zonesCleared;
    const current = z === state.zonesCleared;
    ctx.fillStyle = done ? 'rgba(140,232,168,0.13)' : current ? 'rgba(255,216,115,0.16)' : 'rgba(255,255,255,0.04)';
    rr(ctx, mx + 14, y, mw - 28, bandH - 8, 6); ctx.fill();
    ctx.fillStyle = done ? '#8ce8a8' : current ? '#ffd873' : 'rgba(255,233,184,0.65)';
    ctx.font = 'bold 13px Georgia, serif';
    ctx.fillText((done ? '✓ ' : current ? '▶ ' : '· ') + 'ZONE ' + (z + 1) + ' — ' + ZONES[z].name, mx + 24, y + 20);
    ctx.font = '11.5px Georgia, serif';
    ctx.fillStyle = 'rgba(255,233,184,0.75)';
    ctx.fillText('checkpoints ' + (z * 10 + 1) + '–' + (z * 10 + 10) + ' · hazard: ' + HAZARDS[z].name, mx + 24, y + 38);
    // braid glyphs
    ctx.font = '12px Georgia, serif';
    let bx = mx + 24;
    for (const r of ROUTES) {
      ctx.fillStyle = r.color;
      ctx.fillText('╱' + r.name[0], bx, y + 56);
      bx += 30;
    }
    ctx.fillStyle = 'rgba(255,233,184,0.6)';
    ctx.fillText('routes split & rejoin every row', bx + 4, y + 56);
  }
  ctx.fillStyle = '#e86a4c';
  ctx.font = 'bold 12px Georgia, serif';
  ctx.fillText('♛ CROWN: THE WARDEN OF HOURS — escape at checkpoint 55', mx + 24, my + mh - 12);

  // Charm cards
  const offers = state.draftOffer.map((id) => CHARM_BY_ID[id]).filter(Boolean);
  offers.forEach((c, i) => {
    const x = 486 + i * 258, y = 150, w = 238, h = 300;
    ctx.fillStyle = 'rgba(24,16,6,0.95)';
    rr(ctx, x, y, w, h, 12); ctx.fill();
    ctx.strokeStyle = '#ffd873'; ctx.lineWidth = 2.5; ctx.stroke();
    ctx.textAlign = 'center';
    gear(ctx, x + w / 2, y + 74, 34, 9, state.t * 0.8 + i, '#8a6a34', '#3a2a12');
    ctx.fillStyle = '#ffd873';
    ctx.font = 'bold 26px Georgia, serif';
    ctx.fillText(c.icon, x + w / 2, y + 84);
    ctx.font = 'bold 19px Georgia, serif';
    ctx.fillText(c.name, x + w / 2, y + 138);
    ctx.fillStyle = '#ffe9b8';
    ctx.font = '13.5px Georgia, serif';
    wrapTextCenter(ctx, c.desc, x + w / 2, y + 168, w - 36, 19);
    ctx.fillStyle = '#8ce8a8';
    ctx.font = 'bold 14px Georgia, serif';
    ctx.fillText('PRESS ' + (i + 1) + ' OR CLICK', x + w / 2, y + h - 24);
    state.uiRects.push({ x, y, w, h, action: 'charm', id: c.id });
  });
  // Owned charms recap under the cards
  ctx.textAlign = 'left';
  ctx.fillStyle = '#d8a860';
  ctx.font = 'bold 13px Georgia, serif';
  ctx.fillText('CARRYING (' + state.charmOrder.length + '/8):', 486, 496);
  ctx.font = '13.5px Georgia, serif';
  let ox = 486;
  if (state.charmOrder.length === 0) {
    ctx.fillStyle = 'rgba(255,233,184,0.6)';
    ctx.fillText('nothing yet — this is your first draft', 486, 520);
  }
  state.charmOrder.forEach((id, i) => {
    const c = CHARM_BY_ID[id];
    if (i % 2 === 0) ox = 486;
    const oy = 520 + Math.floor(i / 2) * 22;
    ctx.fillStyle = '#ffd873';
    ctx.fillText(c.icon + ' ' + c.name, ox, oy);
    ox += 250;
  });
  ctx.fillStyle = 'rgba(255,233,184,0.7)';
  ctx.font = '12.5px Georgia, serif';
  ctx.fillText('Charms are permanent for the run. Five gates, five drafts — three charms stay in the tower.', 486, 640);
}

function wrapTextCenter(ctx, text, cx, y, maxW, lh) {
  const words = text.split(' ');
  let line = '', yy = y;
  for (const word of words) {
    const test = line ? line + ' ' + word : word;
    if (ctx.measureText(test).width > maxW && line) {
      ctx.fillText(line, cx, yy);
      line = word; yy += lh;
    } else line = test;
  }
  if (line) ctx.fillText(line, cx, yy);
  return yy;
}

// ---- End screen -------------------------------------------------------------
function drawEnd(ctx, state) {
  drawWorld(ctx, state);
  ctx.fillStyle = 'rgba(5,3,1,0.8)';
  ctx.fillRect(0, 0, W, H);
  state.uiRects = [];
  const st = state.endStats;
  ctx.textAlign = 'center';
  ctx.fillStyle = '#ffd873';
  ctx.font = 'bold 40px Georgia, serif';
  ctx.fillText('THE TOP BELL RINGS', W / 2, 84);
  ctx.fillStyle = '#ffe9b8';
  ctx.font = '16px Georgia, serif';
  ctx.fillText('The Warden bows. The tower keeps your time.', W / 2, 112);
  // Rank medallion
  gear(ctx, W / 2 - 330, 210, 74, 10, state.t * 0.4, '#8a6a34', '#3a2a12');
  ctx.fillStyle = '#ffd873';
  ctx.font = 'bold 84px Georgia, serif';
  ctx.fillText(state.rank, W / 2 - 330, 240);
  ctx.font = 'bold 15px Georgia, serif';
  ctx.fillText('RANK', W / 2 - 330, 292);
  ctx.font = '13px Georgia, serif';
  ctx.fillStyle = '#ffe9b8';
  ctx.fillText(st.difficulty, W / 2 - 330, 314);
  ctx.fillText('par ' + fmtTime(state.difficulty.finalPar) + ' · you: ' + fmtTime(st.time), W / 2 - 330, 334);
  // Final score
  ctx.fillStyle = '#ffd873';
  ctx.font = 'bold 54px Georgia, serif';
  ctx.fillText(st.score.toLocaleString('en-US'), W / 2 + 60, 208);
  ctx.font = '14px Georgia, serif';
  ctx.fillStyle = '#ffe9b8';
  ctx.fillText('FINAL SCORE', W / 2 + 60, 232);
  // Stats grid: 10 stats
  const stats = [
    ['Time', fmtTime(st.time)], ['Deaths', String(st.deaths)],
    ['Falls', String(st.falls)], ['Checkpoints', st.checkpoints + ' / 60'],
    ['Ticks collected', String(st.ticks)], ['Par bells beaten', st.parZones + ' / 6'],
    ['Best deathless chain', '×' + st.bestStreak], ['Secret caches', String(st.secretCaches)],
    ['Zones cleared', '6 / 6'], ['Difficulty', st.difficulty],
  ];
  ctx.textAlign = 'left';
  stats.forEach((s2, i) => {
    const col = i % 2, row = Math.floor(i / 2);
    const x = W / 2 - 130 + col * 300, y = 282 + row * 40;
    ctx.fillStyle = 'rgba(255,233,184,0.6)';
    ctx.font = '12px Georgia, serif';
    ctx.fillText(s2[0].toUpperCase(), x, y);
    ctx.fillStyle = '#ffe9b8';
    ctx.font = 'bold 19px Georgia, serif';
    ctx.fillText(s2[1], x, y + 22);
  });
  // Charm recap
  ctx.fillStyle = '#d8a860';
  ctx.font = 'bold 14px Georgia, serif';
  ctx.fillText('COG-CHARMS CARRIED (' + st.charms.length + '/8)', W / 2 - 130, 516);
  ctx.font = '14px Georgia, serif';
  let cxp = W / 2 - 130;
  let cyy = 542;
  st.charms.forEach((id, i) => {
    const c = CHARM_BY_ID[id];
    ctx.fillStyle = '#ffd873';
    const label = c.icon + ' ' + c.name;
    if (cxp + ctx.measureText(label).width > W - 60) { cxp = W / 2 - 130; cyy += 24; }
    ctx.fillText(label, cxp, cyy);
    cxp += ctx.measureText(label).width + 22;
  });
  if (st.charms.length === 0) {
    ctx.fillStyle = 'rgba(255,233,184,0.6)';
    ctx.fillText('none — a bare-handed ascent', cxp, cyy);
  }
  // Again
  const bx = W / 2 - 150, by = 596, bw = 300, bh = 52;
  ctx.fillStyle = 'rgba(90,64,20,0.92)';
  rr(ctx, bx, by, bw, bh, 10); ctx.fill();
  ctx.strokeStyle = '#ffd873'; ctx.lineWidth = 2; ctx.stroke();
  ctx.fillStyle = '#ffe9b8';
  ctx.font = 'bold 18px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText('↺  CLIMB AGAIN (ENTER)', W / 2, by + 33);
  state.uiRects.push({ x: bx, y: by, w: bw, h: bh, action: 'again' });
}

export function render(ctx, state) {
  ctx.clearRect(0, 0, W, H);
  if (state.mode === 'title') { drawTitle(ctx, state); return; }
  if (state.mode === 'draft') { drawDraft(ctx, state); return; }
  if (state.mode === 'end') { drawEnd(ctx, state); return; }
  state.uiRects = [];
  drawWorld(ctx, state);
  drawPlayHud(ctx, state);
}

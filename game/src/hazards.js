// Hazard behaviours: six machines, six rhythms. Each hazard exposes its
// live geometry at time t so render and collision read the same truth.

export function hazardState(h, t) {
  switch (h.kind) {
    case 'vent': {
      // Cycle 2.6s: 1.5s idle, 0.4s warning puff, 0.7s lethal jet.
      const c = ((t + h.phase) % 2.6 + 2.6) % 2.6;
      return { mode: c < 1.5 ? 'idle' : c < 1.9 ? 'warn' : 'jet', x: h.x, y: h.y, jetH: 118 };
    }
    case 'gear': {
      const y = h.baseY + Math.sin(t * h.speed + h.phase) * h.amp;
      return { mode: 'spin', x: h.x, y, r: h.r, rot: t * 2.4 + h.phase };
    }
    case 'pendulum': {
      const a = Math.sin(t * h.speed + h.phase) * 0.92;
      return {
        mode: 'swing', a,
        x: h.pivotX + Math.sin(a) * h.len,
        y: h.pivotY + Math.cos(a) * h.len, r: h.r,
      };
    }
    case 'saw': {
      const x = h.cx + Math.sin(t * h.speed + h.phase) * h.range;
      return { mode: 'slide', x, y: h.y, r: h.r, rot: t * 9 + h.phase };
    }
    case 'bell': {
      // Rings toll out every period: radius grows 0 -> 300 over 1.5s.
      const c = ((t + h.phase) % h.period + h.period) % h.period;
      const r = c < 1.5 ? (c / 1.5) * 300 : -1;
      return { mode: 'toll', x: h.x, y: h.y, ringR: r };
    }
    default:
      return { mode: 'none' };
  }
}

function circleHitsPlayer(cx, cy, r, pl) {
  const nx = Math.max(pl.x, Math.min(cx, pl.x + pl.w));
  const ny = Math.max(pl.y, Math.min(cy, pl.y + pl.h));
  const dx = cx - nx, dy = cy - ny;
  return dx * dx + dy * dy < r * r;
}

// True when hazard h kills the player at time t. The Aegis Cog is handled
// by the caller (it converts one kill per zone into a shatter + knockback).
export function hazardKills(h, pl, t) {
  const s = hazardState(h, t);
  switch (h.kind) {
    case 'vent': {
      if (s.mode !== 'jet') return false;
      // The steam column above the vent mouth.
      return pl.x + pl.w > s.x - 13 && pl.x < s.x + 13 &&
             pl.y + pl.h > s.y - s.jetH && pl.y + pl.h <= s.y + 4;
    }
    case 'gear':
      return circleHitsPlayer(s.x, s.y, s.r - 4, pl);
    case 'pendulum':
      return circleHitsPlayer(s.x, s.y, s.r - 3, pl);
    case 'saw':
      return circleHitsPlayer(s.x, s.y, s.r - 4, pl);
    case 'bell': {
      if (s.ringR < 20) return false;
      if (!pl.grounded) return false; // jump the ring: it runs at head height
      const pcx = pl.x + pl.w / 2;
      const pcy = pl.y + pl.h - 10;
      const d = Math.hypot(pcx - s.x, pcy - s.y);
      return Math.abs(d - s.ringR) < 17;
    }
    default:
      return false;
  }
}

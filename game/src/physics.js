// Player physics: the precision kit. Coyote time, jump buffering and
// variable jump height make the tower strict but fair; wall-jumps off the
// brass plates are a shortcut tool, never a requirement.

import {
  GRAVITY, MOVE_SPEED, JUMP_V, WALLJUMP_VX, WALLJUMP_VY,
  COYOTE_TIME, JUMP_BUFFER, PLAYER_W, PLAYER_H,
} from './config.js';
import { phantomSolid } from './level.js';

export function makePlayer(x, y) {
  return {
    x, y, vx: 0, vy: 0, w: PLAYER_W, h: PLAYER_H,
    grounded: false, coyote: 0, buffer: 0, jumpsUsed: 0,
    wallDir: 0, facing: 1, glide: false, dead: false, standingOn: null,
  };
}

function platSolidAt(p, t) {
  return p.kind !== 'phantom' || phantomSolid(p.phase, t);
}

// Step the player one fixed dt. input: {left, right, jumpHeld, jumpPressed}
// charms: Set of owned charm ids. Returns events {landed, jumped, wallJumped}.
export function stepPlayer(pl, world, input, dt, t, charms) {
  const ev = { landed: false, jumped: false, wallJumped: false };
  const speedMul = charms.has('swift') ? 1.18 : 1;
  const jumpMul = charms.has('feather') ? 1.12 : 1;
  const maxJumps = charms.has('spring') ? 2 : 1;

  if (input.jumpPressed) pl.buffer = JUMP_BUFFER; else pl.buffer = Math.max(0, pl.buffer - dt);
  if (pl.grounded) { pl.coyote = COYOTE_TIME; pl.jumpsUsed = 0; }
  else {
    pl.coyote = Math.max(0, pl.coyote - dt);
    // Walking off a ledge forfeits the ground jump once coyote expires.
    if (pl.coyote <= 0 && pl.jumpsUsed === 0) pl.jumpsUsed = 1;
  }

  // Horizontal: snappy accel both on ground and in air.
  const target = (input.right ? 1 : 0) - (input.left ? 1 : 0);
  const accel = pl.grounded ? 2600 : 1900;
  const maxV = MOVE_SPEED * speedMul;
  if (target !== 0) {
    pl.vx += target * accel * dt;
    if (pl.vx > maxV) pl.vx = maxV;
    if (pl.vx < -maxV) pl.vx = -maxV;
    pl.facing = target;
  } else if (pl.grounded) {
    const f = 2400 * dt;
    pl.vx = Math.abs(pl.vx) <= f ? 0 : pl.vx - Math.sign(pl.vx) * f;
  } else {
    pl.vx *= Math.pow(0.35, dt); // gentle air drag when no input
  }

  // Jumping: buffered and coyote-backed. Priority: ground/coyote jump,
  // then a wall-jump off last frame's wall contact, then the Spring
  // Coil's extra air jump.
  if (pl.buffer > 0) {
    if (pl.coyote > 0) {
      pl.vy = -JUMP_V * jumpMul;
      pl.jumpsUsed = 1;
      pl.buffer = 0; pl.coyote = 0; pl.grounded = false;
      ev.jumped = true;
    } else if (pl.wallDir !== 0 && !pl.grounded) {
      pl.vy = -WALLJUMP_VY * jumpMul;
      pl.vx = -pl.wallDir * WALLJUMP_VX;
      pl.jumpsUsed = 1;
      pl.buffer = 0;
      ev.wallJumped = true; ev.jumped = true;
    } else if (pl.jumpsUsed < maxJumps) {
      pl.vy = -JUMP_V * jumpMul;
      pl.jumpsUsed += 1;
      pl.buffer = 0;
      ev.jumped = true;
    }
  }

  // Gravity with variable jump height: release early, fall sooner.
  let g = GRAVITY;
  if (pl.vy < 0 && !input.jumpHeld) g *= 1.9;
  pl.vy += g * dt;

  // Glide Mantle: hold jump while falling to cap the fall and drift.
  pl.glide = false;
  if (charms.has('glide') && input.jumpHeld && pl.vy > 120 && !pl.grounded) {
    pl.vy = 120;
    pl.glide = true;
  }
  if (pl.vy > 1150) pl.vy = 1150;

  // Integrate X, resolve walls.
  pl.x += pl.vx * dt;
  pl.wallDir = 0;
  for (const wl of world.walls) {
    if (pl.x + pl.w > wl.x && pl.x < wl.x + wl.w && pl.y + pl.h > wl.y && pl.y < wl.y + wl.h) {
      if (pl.vx > 0) { pl.x = wl.x - pl.w; pl.wallDir = 1; }
      else if (pl.vx < 0) { pl.x = wl.x + wl.w; pl.wallDir = -1; }
      pl.vx = 0;
    }
  }
  if (pl.x < 2) { pl.x = 2; pl.wallDir = -1; }
  if (pl.x + pl.w > 1278) { pl.x = 1278 - pl.w; pl.wallDir = 1; }
  // Wall slide: cling and drip down slowly against a wall.
  if (pl.wallDir !== 0 && !pl.grounded && pl.vy > 150) pl.vy = 150;

  // Integrate Y, resolve one-way platforms.
  const prevBottom = pl.y + pl.h;
  pl.y += pl.vy * dt;
  const wasGrounded = pl.grounded;
  pl.grounded = false;
  pl.standingOn = null;
  if (pl.vy >= 0) {
    for (const p of world.platforms) {
      if (!platSolidAt(p, t)) continue;
      const top = p.y;
      if (pl.x + pl.w > p.x + 4 && pl.x < p.x + p.w - 4 &&
          prevBottom <= top + 1 && pl.y + pl.h >= top) {
        pl.y = top - pl.h;
        pl.vy = 0;
        pl.grounded = true;
        pl.standingOn = p;
      }
    }
  }
  if (pl.grounded && !wasGrounded) ev.landed = true;
  return ev;
}

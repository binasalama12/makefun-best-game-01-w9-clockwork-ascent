// CLOCKWORK ASCENT — the tower, its hazards, its charms, its pars.
// One verb: ASCEND. Sprint and wall-jump up the Shattered Belfry, draft a
// cog-charm at every zone gate, beat the par bell, ring the top bell before
// the Warden of Hours winds the tower down.

export const GAME_TITLE =
  'CLOCKWORK ASCENT — 60 checkpoints up the Shattered Belfry: 6 zones, 6 hazards, 3 routes, 8 cog-charms, boss The Warden of Hours';

export const WORLD_W = 1280;
export const VIEW_H = 720;
export const ZONE_COUNT = 6;
export const CPS_PER_ZONE = 10;
export const TOTAL_CPS = ZONE_COUNT * CPS_PER_ZONE; // 60
export const ROW_H = 104;                 // vertical pitch between checkpoint rows
export const ZONE_H = CPS_PER_ZONE * ROW_H + 160; // 1200 px per zone band
export const WORLD_H = ZONE_COUNT * ZONE_H + 240; // ground apron at the bottom

// Physics (px, seconds). Max jump height = JUMP_V^2 / (2*GRAVITY) ≈ 176px,
// comfortably above the 104px row pitch — precision that feels fair.
export const GRAVITY = 2200;
export const MOVE_SPEED = 345;
export const JUMP_V = 880;
export const WALLJUMP_VX = 330;
export const WALLJUMP_VY = 820;
export const COYOTE_TIME = 0.10;
export const JUMP_BUFFER = 0.12;
export const PLAYER_W = 26;
export const PLAYER_H = 38;

// The six tower zones, ground floor first (zone 0) to the crown (zone 5).
// hue drives the procedural clockwork backdrop of each band.
export const ZONES = [
  { name: 'THE SLUICE CELLARS',  sub: 'steam and standing water',   hue: 96,  dark: '#101408', hazard: 'vent' },
  { name: 'THE GEARWORKS',       sub: 'teeth the size of doors',    hue: 36,  dark: '#171006', hazard: 'gear' },
  { name: 'THE PENDULUM GALLERY', sub: 'mauls on long chains',      hue: 262, dark: '#120e1c', hazard: 'pendulum' },
  { name: 'THE SAW RUN',         sub: 'the floor itself commutes',  hue: 8,   dark: '#180b08', hazard: 'saw' },
  { name: 'THE BELL FOUNDRY',    sub: 'every bell is a weapon',     hue: 48,  dark: '#171204', hazard: 'bell' },
  { name: "THE WARDEN'S CROWN",  sub: 'he is already winding down', hue: 200, dark: '#0a1018', hazard: 'phantom' },
];

// The bestiary: six hazard types, six distinct behaviours.
export const HAZARDS = [
  { id: 'vent',     name: 'Steam Vent',     desc: 'Hisses a warning puff, then jets a lethal steam column. Cross on the hiss.' },
  { id: 'gear',     name: 'Gear Crusher',   desc: 'A toothed wheel riding a vertical rail. Its rim kills; time the gap between teeth.' },
  { id: 'pendulum', name: 'Pendulum Maul',  desc: 'A spiked maul swinging on a chain. It owns the middle of its arc — pass at the extremes.' },
  { id: 'saw',      name: 'Sliding Saw',    desc: 'A buzzsaw commuting along its track, back and forth forever. Ride its rhythm, never chase it.' },
  { id: 'bell',     name: 'Bell Shockwave', desc: 'Foundry bells toll expanding rings. A ring kills at head height — jump it or duck under a ledge.' },
  { id: 'phantom',  name: 'Phantom Step',   desc: 'Clockwork platforms that phase in and out on a 3.6s cycle. A fading step drops you: keep moving.' },
];

// The collectible layer: eight cog-charms, drafted 1-of-3 at each zone gate.
export const CHARMS = [
  { id: 'spring',  name: 'Spring Coil',      icon: '⌇', desc: 'Double jump. A second leap, anywhere in the air.' },
  { id: 'glide',   name: 'Glide Mantle',     icon: '≋', desc: 'Hold JUMP while falling to glide — fall speed capped, drift far.' },
  { id: 'magnet',  name: 'Magnet Bell',      icon: 'Ω', desc: 'Ticks within 150px ring and fly to you.' },
  { id: 'aegis',   name: 'Aegis Cog',        icon: '⛨', desc: 'Survive one hazard hit per zone; the cog shatters, then re-forges at the gate.' },
  { id: 'swift',   name: 'Swift Gears',      icon: '»', desc: '+18% run speed, on the ground and in the air.' },
  { id: 'feather', name: 'Feather Weight',   icon: '↑', desc: '+12% jump height. Rows that felt tall feel honest.' },
  { id: 'doubler', name: 'Tick Doubler',     icon: '×2', desc: 'Every tick you collect is worth double score and coin.' },
  { id: 'secondwind', name: 'Second Wind',   icon: '↺', desc: 'Falling no longer breaks your deathless zone streak.' },
];
export const CHARM_BY_ID = Object.fromEntries(CHARMS.map((c) => [c.id, c]));

// Three par difficulties. parZone = seconds per zone for the par bell;
// finalPar = whole-run par. Missing the par bell ranks you down.
export const DIFFICULTIES = [
  { id: 'apprentice', name: 'APPRENTICE',       parZone: 75, finalPar: 450, desc: 'Generous pars. Learn the tower, keep the streak.' },
  { id: 'journeyman', name: 'JOURNEYMAN',       parZone: 55, finalPar: 330, desc: 'The intended climb. Bold routes pay for themselves.' },
  { id: 'master',     name: 'MASTER HOROLOGIST', parZone: 40, finalPar: 240, desc: 'Pars set by the Warden himself. Secret routes or nothing.' },
];

// Scoring — a clean full run lands in the tens of thousands.
export const SCORE = {
  checkpoint: 100,
  tick: 10,
  deathlessBase: 250,   // × current deathless streak when a zone is cleared clean
  parZoneBonus: 1500,   // per zone beaten under its par
  secretCache: 150,     // per secret-route tick cache cleared
  topBell: 5000,        // ringing the top bell
  wardenBonus: 2500,    // finishing the escape with the wind-wall far below
};

export const ROUTES = [
  { id: 'safe',   name: 'SAFE',   color: '#7fd08a', desc: 'Wide steps, no teeth. The honest road.' },
  { id: 'bold',   name: 'BOLD',   color: '#e8a34c', desc: 'Narrow steps over the hazards. Ticks and time.' },
  { id: 'secret', name: 'SECRET', color: '#b48ce8', desc: 'Hidden side-steps. Tick caches for the curious.' },
];

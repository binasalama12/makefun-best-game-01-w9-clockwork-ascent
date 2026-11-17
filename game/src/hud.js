// DOM HUD strip above the canvas.

const el = (id) => document.getElementById(id);

export function fmtTime(sec) {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return m + ':' + String(s).padStart(2, '0');
}

export function updateHud(state) {
  el('h-zone').textContent = state.zoneName;
  el('h-cp').textContent = state.cpCount + '/60';
  el('h-time').textContent = fmtTime(state.time);
  el('h-deaths').textContent = state.deaths;
  el('h-ticks').textContent = state.ticksCollected;
  el('h-score').textContent = state.score.toLocaleString('en-US');
}

export function setMsg(text) {
  el('msg').textContent = text;
}

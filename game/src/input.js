// Keyboard state: held keys plus an edge-triggered jump press.

export const input = {
  left: false, right: false, jumpHeld: false, jumpPressed: false,
  _jumpQueued: false,
};

const DOWN = {
  ArrowLeft: 'left', KeyA: 'left',
  ArrowRight: 'right', KeyD: 'right',
  ArrowUp: 'jump', KeyW: 'jump', Space: 'jump',
};

export function initInput(onAction) {
  addEventListener('keydown', (e) => {
    const k = DOWN[e.code];
    if (k === 'left') input.left = true;
    if (k === 'right') input.right = true;
    if (k === 'jump') {
      if (!input.jumpHeld) input._jumpQueued = true;
      input.jumpHeld = true;
      e.preventDefault();
    }
    if (e.code === 'ArrowLeft' || e.code === 'ArrowRight' || e.code === 'ArrowDown') e.preventDefault();
    if (onAction) onAction(e.code);
  });
  addEventListener('keyup', (e) => {
    const k = DOWN[e.code];
    if (k === 'left') input.left = false;
    if (k === 'right') input.right = false;
    if (k === 'jump') input.jumpHeld = false;
  });
}

// Called once per fixed step: converts the queued press into a one-step edge.
export function pollInput() {
  input.jumpPressed = input._jumpQueued;
  input._jumpQueued = false;
  return input;
}

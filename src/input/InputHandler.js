export class InputHandler {
  constructor(canvas) {
    this.canvas = canvas;
    this.keys = {};
    this.mouseButtons = {};
    this.mouseDX = 0;
    this.mouseDY = 0;
    this.scrollDelta = 0;
    this.locked = false;

    // Sensitivity
    this.sensitivity = 0.002;
    this.invertY = false;

    // Callbacks
    this.onLockChange = null;

    this._setupEventListeners();
  }

  _setupEventListeners() {
    // Keyboard
    document.addEventListener('keydown', (e) => {
      this.keys[e.code] = true;
      // Prevent default for game keys
      if (['KeyW', 'KeyA', 'KeyS', 'KeyD', 'Space', 'ShiftLeft', 'ControlLeft',
           'KeyE', 'KeyQ', 'KeyF', 'KeyT', 'Digit1', 'Digit2', 'Digit3',
           'Digit4', 'Digit5', 'Digit6', 'Digit7', 'Digit8', 'Digit9',
           'F5', 'F3', 'F11'].includes(e.code)) {
        e.preventDefault();
      }
    });

    document.addEventListener('keyup', (e) => {
      this.keys[e.code] = false;
    });

    // Mouse
    document.addEventListener('mousedown', (e) => {
      this.mouseButtons[e.button] = true;
      if (!this.locked) {
        this.canvas.requestPointerLock();
      }
    });

    document.addEventListener('mouseup', (e) => {
      this.mouseButtons[e.button] = false;
    });

    document.addEventListener('mousemove', (e) => {
      if (this.locked) {
        this.mouseDX += e.movementX;
        this.mouseDY += e.movementY;
      }
    });

    document.addEventListener('wheel', (e) => {
      this.scrollDelta += e.deltaY;
      e.preventDefault();
    }, { passive: false });

    // Pointer lock
    document.addEventListener('pointerlockchange', () => {
      this.locked = document.pointerLockElement === this.canvas;
      if (this.onLockChange) this.onLockChange(this.locked);
    });

    // Context menu
    this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());
  }

  getMovement() {
    return {
      forward: this.keys['KeyW'] || false,
      backward: this.keys['KeyS'] || false,
      left: this.keys['KeyA'] || false,
      right: this.keys['KeyD'] || false,
      jump: this.keys['Space'] || false,
      sneak: this.keys['ShiftLeft'] || false,
      sprint: this.keys['ControlLeft'] || false,
    };
  }

  getMouseDelta() {
    const dx = this.mouseDX * this.sensitivity;
    const dy = this.mouseDY * this.sensitivity * (this.invertY ? -1 : 1);
    this.mouseDX = 0;
    this.mouseDY = 0;
    return { dx, dy };
  }

  getScrollDelta() {
    const d = this.scrollDelta;
    this.scrollDelta = 0;
    return d;
  }

  isLeftMouseDown() {
    return this.mouseButtons[0] || false;
  }

  isRightMouseDown() {
    return this.mouseButtons[2] || false;
  }

  isMiddleMouseDown() {
    return this.mouseButtons[1] || false;
  }

  isKeyPressed(code) {
    return this.keys[code] || false;
  }

  consumeKeyPress(code) {
    if (this.keys[code]) {
      this.keys[code] = false;
      return true;
    }
    return false;
  }
}

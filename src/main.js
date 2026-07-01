import { Game } from './Game.js';

// Loading progress helper
function updateLoading(progress, status) {
  const fill = document.getElementById('progress-fill');
  const statusEl = document.getElementById('loading-status');
  const errorEl = document.getElementById('loading-error');

  if (fill) fill.style.width = `${progress * 100}%`;
  if (statusEl) statusEl.textContent = status;
  if (errorEl) errorEl.style.display = 'none';
}

function showError(message) {
  const errorEl = document.getElementById('loading-error');
  const statusEl = document.getElementById('loading-status');
  if (errorEl) {
    errorEl.textContent = message;
    errorEl.style.display = 'block';
  }
  if (statusEl) statusEl.textContent = 'Error';
}

// Check browser support
function checkBrowserSupport() {
  const errors = [];

  const canvas = document.createElement('canvas');
  const gl = canvas.getContext('webgl2');
  if (!gl) errors.push('WebGL2 is not supported. Please use a modern browser.');

  if (!window.indexedDB) errors.push('IndexedDB is not supported. World saves will not work.');

  if (!window.AudioContext && !window.webkitAudioContext) {
    errors.push('Web Audio API is not supported. Sound will not play.');
  }

  if (!('pointerLockElement' in document)) {
    errors.push('Pointer Lock API is not supported. Mouse look may not work properly.');
  }

  if (typeof Worker === 'undefined') {
    errors.push('Web Workers are not supported. Game performance may be limited.');
  }

  return errors;
}

// Main entry point
async function main() {
  updateLoading(0.05, 'Checking browser support...');

  const errors = checkBrowserSupport();
  if (errors.length > 0) {
    showError('Browser not supported: ' + errors.join(' '));
    return;
  }

  updateLoading(0.05, 'Initializing VoxelCraft...');

  try {
    const game = new Game();

    // Override loading progress callback
    const origInit = game.init.bind(game);
    await origInit();

    // Game is running!
    console.log('[VoxelCraft] Game started successfully');

    // Handle page visibility (pause when tab is hidden)
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        game.paused = true;
      }
    });

    // Handle beforeunload (save warning)
    window.addEventListener('beforeunload', (e) => {
      if (game.running) {
        e.preventDefault();
        e.returnValue = '';
      }
    });

    // Expose game instance for debugging
    if (__DEBUG__) {
      window.voxelcraft = game;
    }
  } catch (err) {
    console.error('[VoxelCraft] Fatal error:', err);
    showError(`Failed to start: ${err.message}`);
  }
}

// Start the game
main();

import * as THREE from 'three';
import { World } from './core/World.js';
import { WorldGenerator } from './worldgen/WorldGenerator.js';
import { TextureAtlas } from './render/TextureAtlas.js';
import { Renderer } from './render/Renderer.js';
import { Player } from './player/Player.js';
import { InputHandler } from './input/InputHandler.js';
import { CHUNK_SIZE, CHUNK_MIN_Y, SEA_LEVEL } from './core/Chunk.js';
import { BLOCKS } from './core/BlockRegistry.js';

const RENDER_DISTANCE = 8;
const UNLOAD_DISTANCE = 12;

export class Game {
  constructor() {
    this.running = false;
    this.lastTime = 0;
    this.world = null;
    this.player = null;
    this.renderer = null;
    this.input = null;
    this.textureAtlas = null;
    this.worldGen = null;

    // Chunk management
    this.loadedChunks = new Set();
    this.genQueue = [];

    // UI state
    this.showDebug = false;
    this.showInventory = false;
    this.paused = false;
    this.inMenu = true;

    // Mining state
    this.miningTarget = null;
    this.miningProgress = 0;
    this.miningTime = 0;

    // FPS tracking
    this.fps = 0;
    this.frameCount = 0;
    this.fpsTimer = 0;

    // Loading progress
    this.loadingProgress = 0;
    this.loadingStatus = '';
  }

  async init() {
    this.loadingStatus = 'Generating texture atlas...';
    this.loadingProgress = 0.1;

    // Create texture atlas
    this.textureAtlas = new TextureAtlas(16, 16);
    this.textureAtlas.generateAll();

    this.loadingStatus = 'Initializing renderer...';
    this.loadingProgress = 0.2;

    // Create world
    this.world = new World();
    this.world.seed = Math.floor(Math.random() * 2147483647);

    // Create world generator
    this.worldGen = new WorldGenerator(this.world.seed);

    // Create renderer
    const canvas = document.getElementById('app');
    canvas.innerHTML = '';
    const gameCanvas = document.createElement('canvas');
    gameCanvas.style.width = '100%';
    gameCanvas.style.height = '100%';
    gameCanvas.style.display = 'block';
    canvas.appendChild(gameCanvas);

    this.renderer = new Renderer(gameCanvas, this.world, this.textureAtlas);

    // Create player
    this.player = new Player(this.world);
    this.player.setGameMode('creative'); // Start in creative for MVP

    // Create input handler
    this.input = new InputHandler(gameCanvas);
    this.input.onLockChange = (locked) => {
      if (!locked && !this.inMenu) {
        this.paused = true;
      }
    };

    this.loadingStatus = 'Generating spawn area...';
    this.loadingProgress = 0.3;

    // Generate initial chunks around spawn
    await this._generateSpawnArea();

    this.loadingStatus = 'Finding spawn point...';
    this.loadingProgress = 0.9;

    // Find safe spawn point
    this._findSpawnPoint();

    this.loadingProgress = 1.0;
    this.loadingStatus = 'Ready!';

    // Hide loading screen
    const loading = document.getElementById('loading');
    if (loading) loading.style.display = 'none';
    const app = document.getElementById('app');
    if (app) app.style.display = 'block';

    // Request pointer lock on click
    gameCanvas.addEventListener('click', () => {
      if (!this.input.locked && !this.inMenu) {
        gameCanvas.requestPointerLock();
      }
    });

    this.inMenu = false;
    this.running = true;
    this.lastTime = performance.now();

    // Start game loop
    requestAnimationFrame((t) => this.gameLoop(t));
  }

  async _generateSpawnArea() {
    const total = (RENDER_DISTANCE * 2 + 1) ** 2;
    let generated = 0;

    for (let cx = -RENDER_DISTANCE; cx <= RENDER_DISTANCE; cx++) {
      for (let cz = -RENDER_DISTANCE; cz <= RENDER_DISTANCE; cz++) {
        const chunk = this.worldGen.generateChunk(cx, cz);
        this.world.setChunk(cx, cz, chunk);
        generated++;

        this.loadingProgress = 0.3 + (generated / total) * 0.5;
        this.loadingStatus = `Generating terrain... ${generated}/${total}`;

        // Yield every 10 chunks to keep UI responsive
        if (generated % 10 === 0) {
          await new Promise(r => setTimeout(r, 0));
        }
      }
    }
  }

  _findSpawnPoint() {
    // Find surface at (0, 0)
    const height = this.world.getHeight(0, 0);
    this.player.position.set(0.5, height + 2, 0.5);
    this.world.spawnPoint = { x: 0.5, y: height + 2, z: 0.5 };
  }

  gameLoop(time) {
    if (!this.running) return;

    const dt = Math.min((time - this.lastTime) / 1000, 0.1); // cap at 100ms
    this.lastTime = time;

    // FPS counter
    this.frameCount++;
    this.fpsTimer += dt;
    if (this.fpsTimer >= 1.0) {
      this.fps = this.frameCount;
      this.frameCount = 0;
      this.fpsTimer = 0;
    }

    if (!this.paused && !this.inMenu) {
      this.update(dt);
    }

    this.render();
    requestAnimationFrame((t) => this.gameLoop(t));
  }

  update(dt) {
    // Handle key presses
    this._handleInput();

    // Update player
    const movement = this.input.getMovement();
    this.player.update(dt, movement);

    // Update camera
    const mouseDelta = this.input.getMouseDelta();
    this.player.rotation.yaw -= mouseDelta.dx;
    this.player.rotation.pitch -= mouseDelta.dy;
    this.player.rotation.pitch = Math.max(-Math.PI / 2 + 0.01, Math.min(Math.PI / 2 - 0.01, this.player.rotation.pitch));

    // Update renderer camera
    this._updateCamera();

    // Mining / placing
    this._handleBlockInteraction(dt);

    // Hotbar scroll
    const scroll = this.input.getScrollDelta();
    if (scroll > 0) this.player.selectedSlot = (this.player.selectedSlot + 1) % 9;
    if (scroll < 0) this.player.selectedSlot = (this.player.selectedSlot + 8) % 9;

    // Chunk management
    this._manageChunks();

    // Update world time
    this.world.time += dt * 20; // 20 TPS

    // Update sky
    this.renderer.updateSky();

    // Update chunk meshes
    this.renderer.updateMeshes();
  }

  _handleInput() {
    // F5 - camera toggle
    if (this.input.consumeKeyPress('F5')) {
      this.player.toggleCamera();
    }

    // F3 - debug overlay
    if (this.input.consumeKeyPress('F3')) {
      this.showDebug = !this.showDebug;
    }

    // Escape - pause
    if (this.input.consumeKeyPress('Escape')) {
      if (this.input.locked) {
        document.exitPointerLock();
      }
      this.paused = !this.paused;
    }

    // Number keys for hotbar
    for (let i = 1; i <= 9; i++) {
      if (this.input.consumeKeyPress(`Digit${i}`)) {
        this.player.selectedSlot = i - 1;
      }
    }

    // E - inventory (placeholder)
    if (this.input.consumeKeyPress('KeyE')) {
      this.showInventory = !this.showInventory;
    }

    // Double-tap space for flying (creative)
    if (this.input.consumeKeyPress('Space')) {
      if (this.player.gameMode === 'creative') {
        const now = performance.now();
        if (this._lastSpacePress && now - this._lastSpacePress < 300) {
          this.player.flying = !this.player.flying;
        }
        this._lastSpacePress = now;
      }
    }
  }

  _updateCamera() {
    const eyePos = this.player.getEyePosition();

    if (this.player.cameraMode === 'first') {
      this.renderer.setCameraPosition(eyePos.x, eyePos.y, eyePos.z);
      this.renderer.setCameraRotation(this.player.rotation.yaw, this.player.rotation.pitch);
    } else {
      // Third person
      const dir = this.player.getLookDirection();
      const dist = this.player.thirdPersonDistance;
      const sign = this.player.cameraMode === 'third-back' ? 1 : -1;

      const camPos = new THREE.Vector3(
        eyePos.x + dir.x * dist * sign,
        eyePos.y + dir.y * dist * sign,
        eyePos.z + dir.z * dist * sign
      );

      this.renderer.setCameraPosition(camPos.x, camPos.y, camPos.z);

      // Look at player
      const lookTarget = eyePos.clone();
      this.renderer.camera.lookAt(lookTarget);
    }
  }

  _handleBlockInteraction(dt) {
    // Raycast from eye position
    const eyePos = this.player.getEyePosition();
    const lookDir = this.player.getLookDirection();
    const hit = this.world.raycast(eyePos, lookDir, 8);

    if (hit.hit) {
      // Show block highlight
      this.renderer.setHighlight(hit.block);

      // Left click - break
      if (this.input.isLeftMouseDown()) {
        if (this.player.gameMode === 'creative') {
          // Instant break in creative
          this.player.breakBlock(hit.block.x, hit.block.y, hit.block.z);
        } else {
          // Mining progress
          if (!this.miningTarget ||
              this.miningTarget.x !== hit.block.x ||
              this.miningTarget.y !== hit.block.y ||
              this.miningTarget.z !== hit.block.z) {
            this.miningTarget = { x: hit.block.x, y: hit.block.y, z: hit.block.z };
            this.miningProgress = 0;
            const hardness = this.world.getBlock(hit.block.x, hit.block.y, hit.block.z).hardness || 1;
            this.miningTime = hardness * 0.5; // simplified mining time
          }
          this.miningProgress += dt;
          if (this.miningProgress >= this.miningTime) {
            this.player.breakBlock(hit.block.x, hit.block.y, hit.block.z);
            this.miningTarget = null;
            this.miningProgress = 0;
          }
        }
      } else {
        this.miningTarget = null;
        this.miningProgress = 0;
      }

      // Right click - place
      if (this.input.isRightMouseDown()) {
        if (!this._rightClickUsed) {
          const face = hit.face;
          // Place block at the face position
          const placeBlock = BLOCKS.STONE; // Default for creative
          this.player.placeBlock(face.x, face.y, face.z, placeBlock);
          this._rightClickUsed = true;
        }
      } else {
        this._rightClickUsed = false;
      }
    } else {
      this.renderer.setHighlight(null);
      this.miningTarget = null;
      this.miningProgress = 0;
    }
  }

  _manageChunks() {
    const pcx = Math.floor(this.player.position.x / CHUNK_SIZE);
    const pcz = Math.floor(this.player.position.z / CHUNK_SIZE);

    // Load new chunks
    for (let dx = -RENDER_DISTANCE; dx <= RENDER_DISTANCE; dx++) {
      for (let dz = -RENDER_DISTANCE; dz <= RENDER_DISTANCE; dz++) {
        const cx = pcx + dx;
        const cz = pcz + dz;
        const key = `${cx},${cz}`;

        if (!this.loadedChunks.has(key)) {
          this.loadedChunks.add(key);
          const chunk = this.worldGen.generateChunk(cx, cz);
          this.world.setChunk(cx, cz, chunk);
        }
      }
    }

    // Unload distant chunks
    for (const key of this.loadedChunks) {
      const [cx, cz] = key.split(',').map(Number);
      if (Math.abs(cx - pcx) > UNLOAD_DISTANCE || Math.abs(cz - pcz) > UNLOAD_DISTANCE) {
        this.loadedChunks.delete(key);
        this.world.removeChunk(cx, cz);
      }
    }
  }

  render() {
    this.renderer.render();

    // Draw HUD overlay
    this._drawHUD();
  }

  _drawHUD() {
    // Use a 2D canvas overlay for HUD
    if (!this._hudCanvas) {
      this._hudCanvas = document.createElement('canvas');
      this._hudCanvas.style.position = 'fixed';
      this._hudCanvas.style.top = '0';
      this._hudCanvas.style.left = '0';
      this._hudCanvas.style.width = '100%';
      this._hudCanvas.style.height = '100%';
      this._hudCanvas.style.pointerEvents = 'none';
      this._hudCanvas.style.zIndex = '10';
      document.body.appendChild(this._hudCanvas);
    }

    const canvas = this._hudCanvas;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    const ctx = canvas.getContext('2d');

    // Crosshair
    if (!this.showInventory) {
      const cx = canvas.width / 2;
      const cy = canvas.height / 2;
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(cx - 10, cy);
      ctx.lineTo(cx + 10, cy);
      ctx.moveTo(cx, cy - 10);
      ctx.lineTo(cx, cy + 10);
      ctx.stroke();
    }

    // Hotbar
    const slotSize = 40;
    const hotbarWidth = slotSize * 9;
    const hotbarX = (canvas.width - hotbarWidth) / 2;
    const hotbarY = canvas.height - slotSize - 10;

    for (let i = 0; i < 9; i++) {
      const x = hotbarX + i * slotSize;
      ctx.fillStyle = i === this.player.selectedSlot ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.5)';
      ctx.fillRect(x, hotbarY, slotSize - 2, slotSize - 2);
      ctx.strokeStyle = '#555';
      ctx.strokeRect(x, hotbarY, slotSize - 2, slotSize - 2);
    }

    // Health bar (survival)
    if (this.player.gameMode !== 'creative' && this.player.gameMode !== 'spectator') {
      const heartSize = 12;
      const heartsX = (canvas.width - heartSize * 10 * 1.2) / 2;
      const heartsY = hotbarY - 20;

      for (let i = 0; i < 10; i++) {
        const x = heartsX + i * heartSize * 1.2;
        const filled = this.player.health > i * 2;
        const half = this.player.health === i * 2 + 1;
        ctx.fillStyle = filled ? '#ff0000' : '#333';
        ctx.font = `${heartSize}px serif`;
        ctx.fillText('\u2764', x, heartsY + heartSize);
      }
    }

    // Debug overlay
    if (this.showDebug) {
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(4, 4, 300, 140);
      ctx.fillStyle = '#ffffff';
      ctx.font = '12px monospace';
      const p = this.player.position;
      const lines = [
        `VoxelCraft ${__VERSION__ || '0.1.0'}`,
        `FPS: ${this.fps}`,
        `XYZ: ${p.x.toFixed(1)} / ${p.y.toFixed(1)} / ${p.z.toFixed(1)}`,
        `Chunk: ${Math.floor(p.x / 16)} ${Math.floor(p.z / 16)}`,
        `Facing: ${this._getCardinalDirection()}`,
        `Loaded chunks: ${this.world.getChunkCount()}`,
        `Game mode: ${this.player.gameMode}${this.player.flying ? ' (flying)' : ''}`,
        `Seed: ${this.world.seed}`,
        `Time: ${Math.floor(this.world.getTimeOfDay())}`,
      ];
      lines.forEach((line, i) => {
        ctx.fillText(line, 10, 20 + i * 15);
      });
    }

    // Pause overlay
    if (this.paused) {
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#ffffff';
      ctx.font = '32px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('Game Paused', canvas.width / 2, canvas.height / 2 - 20);
      ctx.font = '16px monospace';
      ctx.fillText('Click to resume', canvas.width / 2, canvas.height / 2 + 20);
      ctx.textAlign = 'left';
    }
  }

  _getCardinalDirection() {
    const yaw = ((this.player.rotation.yaw % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
    if (yaw < Math.PI / 4 || yaw >= Math.PI * 7 / 4) return 'South';
    if (yaw < Math.PI * 3 / 4) return 'West';
    if (yaw < Math.PI * 5 / 4) return 'North';
    return 'East';
  }

  destroy() {
    this.running = false;
    if (this.renderer) this.renderer.dispose();
  }
}

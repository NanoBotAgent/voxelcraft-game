import * as THREE from 'three';
import { CHUNK_SIZE, CHUNK_MIN_Y, CHUNK_HEIGHT } from '../core/Chunk.js';
import { BlockRegistry } from '../core/BlockRegistry.js';

// Block color palette for procedural textures
const BLOCK_COLORS = {
  0: null, // AIR
  1: { top: '#888888', side: '#888888', bottom: '#888888' }, // STONE
  5: { top: '#444444', side: '#444444', bottom: '#444444' }, // DEEPSLATE
  10: { top: '#8B6240', side: '#8B6240', bottom: '#8B6240' }, // DIRT
  12: { top: '#7FB238', side: '#8B6240', bottom: '#8B6240' }, // GRASS
  20: { top: '#E6D9A5', side: '#E6D9A5', bottom: '#E6D9A5' }, // SAND
  23: { top: '#E6D9A5', side: '#E0CEA4', bottom: '#E0CEA4' }, // SANDSTONE
  30: { top: '#B5A071', side: '#6E5431', bottom: '#B5A071' }, // OAK_LOG
  31: { top: '#B5905A', side: '#B5905A', bottom: '#B5905A' }, // OAK_PLANKS
  32: { top: '#4A6B2A', side: '#4A6B2A', bottom: '#4A6B2A' }, // OAK_LEAVES
  35: { top: '#6B5030', side: '#3A2510', bottom: '#6B5030' }, // SPRUCE_LOG
  36: { top: '#8B6A40', side: '#8B6A40', bottom: '#8B6A40' }, // SPRUCE_PLANKS
  37: { top: '#2A4A1A', side: '#2A4A1A', bottom: '#2A4A1A' }, // SPRUCE_LEAVES
  38: { top: '#D4CBA0', side: '#C8C0A0', bottom: '#D4CBA0' }, // BIRCH_LOG
  39: { top: '#C8B890', side: '#C8B890', bottom: '#C8B890' }, // BIRCH_PLANKS
  40: { top: '#5A8A30', side: '#5A8A30', bottom: '#5A8A30' }, // BIRCH_LEAVES
  50: { top: '#7A7A7A', side: '#7A7A7A', bottom: '#7A7A7A' }, // COBBLESTONE
  52: { top: '#7A7A7A', side: '#7A7A7A', bottom: '#7A7A7A' }, // STONE_BRICKS
  60: { top: '#444444', side: '#444444', bottom: '#444444' }, // BEDROCK
  70: { top: '#888888', side: '#888888', bottom: '#888888' }, // COAL_ORE
  71: { top: '#888888', side: '#888888', bottom: '#888888' }, // IRON_ORE
  74: { top: '#888888', side: '#888888', bottom: '#888888' }, // DIAMOND_ORE
  90: { top: '#3F6FC0', side: '#3F6FC0', bottom: '#3F6FC0' }, // WATER
  91: { top: '#CF4B00', side: '#CF4B00', bottom: '#CF4B00' }, // LAVA
  100: { top: '#DDDDDD', side: '#DDDDDD', bottom: '#DDDDDD' }, // GLASS
  101: { top: '#8E4F2E', side: '#8E4F2E', bottom: '#8E4F2E' }, // BRICK
  103: { top: '#14121F', side: '#14121F', bottom: '#14121F' }, // OBSIDIAN
  104: { top: '#A88245', side: '#9A7A4A', bottom: '#9A7A4A' }, // GLOWSTONE
  105: { top: '#9AC0E8', side: '#9AC0E8', bottom: '#9AC0E8' }, // ICE
  106: { top: '#F4F4F4', side: '#F4F4F4', bottom: '#F4F4F4' }, // SNOW
  107: { top: '#E8E8E8', side: '#E8E8E8', bottom: '#E8E8E8' }, // SNOW_BLOCK
  108: { top: '#5B7E3F', side: '#5B7E3F', bottom: '#5B7E3F' }, // CACTUS
  110: { top: '#C2702A', side: '#C2702A', bottom: '#C2702A' }, // PUMPKIN
  120: { top: '#6E2E2E', side: '#6E2E2E', bottom: '#6E2E2E' }, // NETHERRACK
  121: { top: '#4A3F35', side: '#4A3F35', bottom: '#4A3F35' }, // SOUL_SAND
  130: { top: '#DBD8A5', side: '#DBD8A5', bottom: '#DBD8A5' }, // END_STONE
  140: { top: '#8B6A40', side: '#B5905A', bottom: '#B5905A' }, // CRAFTING_TABLE
  141: { top: '#888888', side: '#888888', bottom: '#888888' }, // FURNACE
  142: { top: '#8B6A40', side: '#8B6A40', bottom: '#8B6A40' }, // CHEST
  150: { top: '#FFD080', side: '#FFD080', bottom: '#FFD080' }, // TORCH
  160: { top: '#D8D8D8', side: '#D8D8D8', bottom: '#D8D8D8' }, // IRON_BLOCK
  161: { top: '#F5D040', side: '#F5D040', bottom: '#F5D040' }, // GOLD_BLOCK
  162: { top: '#4AE8E8', side: '#4AE8E8', bottom: '#4AE8E8' }, // DIAMOND_BLOCK
  170: { top: '#E04040', side: '#E04040', bottom: '#E04040' }, // TNT
  190: { top: '#FF3030', side: '#FF3030', bottom: '#FF3030' }, // POPPY
  191: { top: '#FFFF30', side: '#FFFF30', bottom: '#FFFF30' }, // DANDELION
  200: { top: '#5A8A30', side: '#5A8A30', bottom: '#5A8A30' }, // TALL_GRASS
  210: { top: '#CC2020', side: '#CC2020', bottom: '#CC2020' }, // MUSHROOM_RED
  211: { top: '#8B6240', side: '#8B6240', bottom: '#8B6240' }, // MUSHROOM_BROWN
};

export class TextureAtlas {
  constructor(tileSize = 16, tilesPerRow = 16) {
    this.tileSize = tileSize;
    this.tilesPerRow = tilesPerRow;
    this.atlasSize = tileSize * tilesPerRow;
    this.canvas = document.createElement('canvas');
    this.canvas.width = this.atlasSize;
    this.canvas.height = this.atlasSize;
    this.ctx = this.canvas.getContext('2d');
    this.tileMap = new Map();
    this.nextIndex = 0;
  }

  generateAll() {
    // Generate textures for all known blocks
    for (const [blockId, colors] of Object.entries(BLOCK_COLORS)) {
      if (!colors) continue;
      const id = parseInt(blockId);
      this._generateBlockTexture(id, colors);
    }
    return this.toTexture();
  }

  _generateBlockTexture(blockId, colors) {
    const size = this.tileSize;
    const rng = this._seededRandom(blockId * 12345);

    // Generate top, side, bottom textures
    const topIdx = this._addTile(blockId, 'top', colors.top, rng, size);
    const sideIdx = this._addTile(blockId, 'side', colors.side, rng, size);
    const bottomIdx = colors.bottom !== colors.side
      ? this._addTile(blockId, 'bottom', colors.bottom, rng, size)
      : sideIdx;

    // Store UV mapping for mesher
    const tilesPerRow = this.tilesPerRow;
    const tileSize = 1 / tilesPerRow;

    this.tileMap[blockId] = {
      top: this._idxToUV(topIdx, tilesPerRow, tileSize),
      side: this._idxToUV(sideIdx, tilesPerRow, tileSize),
      bottom: this._idxToUV(bottomIdx, tilesPerRow, tileSize),
    };
  }

  _addTile(blockId, face, colorHex, rng, size) {
    const idx = this.nextIndex++;
    const x = (idx % this.tilesPerRow) * size;
    const y = Math.floor(idx / this.tilesPerRow) * size;

    // Parse color
    const r = parseInt(colorHex.slice(1, 3), 16);
    const g = parseInt(colorHex.slice(3, 5), 16);
    const b = parseInt(colorHex.slice(5, 7), 16);

    // Draw base color with noise variation
    const imageData = this.ctx.createImageData(size, size);
    for (let py = 0; py < size; py++) {
      for (let px = 0; px < size; px++) {
        const variation = (rng() - 0.5) * 30;
        const pr = Math.max(0, Math.min(255, r + variation));
        const pg = Math.max(0, Math.min(255, g + variation));
        const pb = Math.max(0, Math.min(255, b + variation));

        const i = (py * size + px) * 4;
        imageData.data[i] = pr;
        imageData.data[i + 1] = pg;
        imageData.data[i + 2] = pb;
        imageData.data[i + 3] = 255;
      }
    }

    // Add special patterns
    this._addPattern(blockId, face, imageData, rng, size);

    this.ctx.putImageData(imageData, x, y);
    return idx;
  }

  _addPattern(blockId, face, imageData, rng, size) {
    const id = parseInt(blockId);

    // Ore spots
    if ([70, 71, 72, 73, 74, 75, 76, 77, 78, 79, 80, 81, 82, 83, 84, 85].includes(id)) {
      const oreColors = {
        70: [30, 30, 30],     // coal
        71: [200, 170, 130],  // iron
        72: [180, 130, 80],   // copper
        73: [255, 215, 0],    // gold
        74: [0, 220, 220],    // diamond
        75: [30, 30, 180],    // lapis
        76: [200, 0, 0],      // redstone
        77: [0, 200, 60],     // emerald
      };
      const oreColor = oreColors[id] || oreColors[id - 8] || [200, 200, 200];
      // Add 4-6 ore spots
      const spots = 4 + Math.floor(rng() * 3);
      for (let s = 0; s < spots; s++) {
        const sx = Math.floor(rng() * (size - 2)) + 1;
        const sy = Math.floor(rng() * (size - 2)) + 1;
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            if (rng() > 0.6) continue;
            const px = sx + dx;
            const py = sy + dy;
            if (px < 0 || px >= size || py < 0 || py >= size) continue;
            const i = (py * size + px) * 4;
            imageData.data[i] = oreColor[0];
            imageData.data[i + 1] = oreColor[1];
            imageData.data[i + 2] = oreColor[2];
          }
        }
      }
    }

    // Log ring pattern on top
    if ([30, 35, 38].includes(id) && face === 'top') {
      const cx = size / 2;
      const cy = size / 2;
      for (let py = 0; py < size; py++) {
        for (let px = 0; px < size; px++) {
          const dist = Math.sqrt((px - cx) ** 2 + (py - cy) ** 2);
          const ring = Math.sin(dist * 1.5) * 20;
          const i = (py * size + px) * 4;
          imageData.data[i] = Math.max(0, Math.min(255, imageData.data[i] + ring));
          imageData.data[i + 1] = Math.max(0, Math.min(255, imageData.data[i + 1] + ring));
          imageData.data[i + 2] = Math.max(0, Math.min(255, imageData.data[i + 2] + ring));
        }
      }
    }

    // Brick pattern
    if (id === 101) {
      for (let py = 0; py < size; py++) {
        for (let px = 0; px < size; px++) {
          const row = Math.floor(py / 4);
          const offset = (row % 2) * 4;
          if (py % 4 === 0 || (px + offset) % 8 === 0) {
            const i = (py * size + px) * 4;
            imageData.data[i] = 200;
            imageData.data[i + 1] = 200;
            imageData.data[i + 2] = 200;
          }
        }
      }
    }

    // Leaves: random holes for transparency
    if ([32, 37, 40].includes(id)) {
      for (let py = 0; py < size; py++) {
        for (let px = 0; px < size; px++) {
          if (rng() > 0.85) {
            const i = (py * size + px) * 4;
            imageData.data[i + 3] = 0; // transparent
          }
        }
      }
    }

    // Glass: mostly transparent with border
    if (id === 100) {
      for (let py = 0; py < size; py++) {
        for (let px = 0; px < size; px++) {
          const i = (py * size + px) * 4;
          if (px === 0 || px === size - 1 || py === 0 || py === size - 1) {
            imageData.data[i] = 200;
            imageData.data[i + 1] = 200;
            imageData.data[i + 2] = 200;
            imageData.data[i + 3] = 200;
          } else {
            imageData.data[i + 3] = 20; // very transparent
          }
        }
      }
    }
  }

  _idxToUV(idx, tilesPerRow, tileSize) {
    const x = idx % tilesPerRow;
    const y = Math.floor(idx / tilesPerRow);
    return {
      u0: x * tileSize,
      v0: y * tileSize,
      u1: (x + 1) * tileSize,
      v1: (y + 1) * tileSize,
    };
  }

  _seededRandom(seed) {
    let s = seed;
    return () => {
      s = (s * 1103515245 + 12345) & 0x7fffffff;
      return s / 0x7fffffff;
    };
  }

  getUV(blockId) {
    return this.tileMap[blockId] || null;
  }

  toTexture() {
    const tex = new THREE.CanvasTexture(this.canvas);
    tex.magFilter = THREE.NearestFilter;
    tex.minFilter = THREE.NearestMipmapNearestFilter;
    tex.generateMipmaps = true;
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }
}

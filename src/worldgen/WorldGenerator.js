import { createNoise2D, createNoise3D } from 'simplex-noise';
import { Chunk, CHUNK_SIZE, CHUNK_HEIGHT, CHUNK_MIN_Y, SEA_LEVEL } from '../core/Chunk.js';
import { BLOCKS } from '../core/BlockRegistry.js';

// Biome IDs
const BIOMES = {
  OCEAN: 0,
  PLAINS: 1,
  FOREST: 2,
  DESERT: 3,
  MOUNTAINS: 4,
  TAIGA: 5,
  SWAMP: 6,
  JUNGLE: 7,
  SAVANNA: 8,
  SNOWY_TUNDRA: 9,
  MUSHROOM_FIELDS: 10,
  BADLANDS: 11,
};

const BIOME_COLORS = {
  [BIOMES.OCEAN]: { grass: '#2D6E2D', water: '#3F6FC0' },
  [BIOMES.PLAINS]: { grass: '#7FB238', water: '#3F6FC0' },
  [BIOMES.FOREST]: { grass: '#5B8A2A', water: '#3F6FC0' },
  [BIOMES.DESERT]: { grass: '#E6D9A5', water: '#3F6FC0' },
  [BIOMES.MOUNTAINS]: { grass: '#6A8A4A', water: '#3F6FC0' },
  [BIOMES.TAIGA]: { grass: '#5B7A3A', water: '#3F6FC0' },
  [BIOMES.SWAMP]: { grass: '#5B7A3A', water: '#3F6FC0' },
  [BIOMES.JUNGLE]: { grass: '#2D8A2D', water: '#3F6FC0' },
  [BIOMES.SAVANNA]: { grass: '#A0A040', water: '#3F6FC0' },
  [BIOMES.SNOWY_TUNDRA]: { grass: '#E0E0E0', water: '#3F6FC0' },
  [BIOMES.MUSHROOM_FIELDS]: { grass: '#6A4A6A', water: '#3F6FC0' },
  [BIOMES.BADLANDS]: { grass: '#C07040', water: '#3F6FC0' },
};

export class WorldGenerator {
  constructor(seed = 0) {
    this.seed = seed;
    // Create noise functions with seed-based RNG
    const rng = this._seededRandom(seed);
    this.noise2D = createNoise2D(rng);
    this.noise3D = createNoise3D(rng);
    this.noise2D_biome = createNoise2D(rng);
    this.noise2D_temp = createNoise2D(rng);
    this.noise2D_moist = createNoise2D(rng);
  }

  _seededRandom(seed) {
    let s = seed;
    return () => {
      s = (s * 1103515245 + 12345) & 0x7fffffff;
      return s / 0x7fffffff;
    };
  }

  generateChunk(cx, cz) {
    const chunk = new Chunk(cx, cz);
    chunk.status = 'generating';

    // Stage 1: Noise terrain
    this._generateTerrain(chunk);
    // Stage 2: Biome assignment
    this._assignBiomes(chunk);
    // Stage 3: Surface decoration
    this._decorateSurface(chunk);
    // Stage 4: Caves
    this._carveCaves(chunk);
    // Stage 5: Trees and features
    this._placeFeatures(chunk);
    // Stage 6: Sky light
    this._computeSkyLight(chunk);

    chunk.status = 'generated';
    chunk.meshDirty = true;
    return chunk;
  }

  _generateTerrain(chunk) {
    const scale = 0.005;
    const baseHeight = 64;
    const amplitude = 30;

    for (let x = 0; x < CHUNK_SIZE; x++) {
      for (let z = 0; z < CHUNK_SIZE; z++) {
        const wx = chunk.cx * CHUNK_SIZE + x;
        const wz = chunk.cz * CHUNK_SIZE + z;

        // Multi-octave noise for terrain height
        const n1 = this.noise2D(wx * scale, wz * scale) * amplitude;
        const n2 = this.noise2D(wx * scale * 2, wz * scale * 2) * (amplitude * 0.5);
        const n3 = this.noise2D(wx * scale * 4, wz * scale * 4) * (amplitude * 0.25);
        const n4 = this.noise2D(wx * scale * 8, wz * scale * 8) * (amplitude * 0.125);

        const height = Math.floor(baseHeight + n1 + n2 + n3 + n4);

        for (let y = CHUNK_MIN_Y; y < CHUNK_MIN_Y + CHUNK_HEIGHT; y++) {
          const idx = chunk.getIndex(x, y, z);

          if (y < -60) {
            // Bedrock layer
            chunk.blockIds[idx] = y === CHUNK_MIN_Y ? BLOCKS.BEDROCK : BLOCKS.DEEPSLATE;
          } else if (y < -16) {
            // Deepslate layer
            chunk.blockIds[idx] = BLOCKS.DEEPSLATE;
          } else if (y < height - 4) {
            // Stone layer
            chunk.blockIds[idx] = BLOCKS.STONE;
          } else if (y < height) {
            // Dirt layer
            chunk.blockIds[idx] = BLOCKS.DIRT;
          } else if (y === height) {
            // Surface block (depends on biome, set in decorateSurface)
            chunk.blockIds[idx] = BLOCKS.GRASS_BLOCK;
          } else if (y <= SEA_LEVEL && y > height) {
            // Water
            chunk.blockIds[idx] = BLOCKS.WATER;
          }
          // Above surface = air (already 0)
        }

        // Update height map
        chunk.heightMap[z * CHUNK_SIZE + x] = height;
      }
    }
  }

  _assignBiomes(chunk) {
    // Biome is determined by temperature + moisture noise
    // For now, just store biome per-column (simplified)
    chunk.biomes = new Uint8Array(CHUNK_SIZE * CHUNK_SIZE);
    for (let x = 0; x < CHUNK_SIZE; x++) {
      for (let z = 0; z < CHUNK_SIZE; z++) {
        const wx = chunk.cx * CHUNK_SIZE + x;
        const wz = chunk.cz * CHUNK_SIZE + z;
        const temp = this.noise2D_temp(wx * 0.002, wz * 0.002);
        const moist = this.noise2D_moist(wx * 0.002, wz * 0.002);
        const height = chunk.getHeight(x, z);

        let biome;
        if (height < SEA_LEVEL - 3) {
          biome = BIOMES.OCEAN;
        } else if (temp < -0.3) {
          biome = moist > 0 ? BIOMES.SNOWY_TUNDRA : BIOMES.TAIGA;
        } else if (temp > 0.5) {
          biome = moist < -0.2 ? BIOMES.DESERT : (moist > 0.3 ? BIOMES.JUNGLE : BIOMES.SAVANNA);
        } else if (moist > 0.2) {
          biome = height > 80 ? BIOMES.MOUNTAINS : BIOMES.FOREST;
        } else {
          biome = height > 80 ? BIOMES.MOUNTAINS : BIOMES.PLAINS;
        }

        chunk.biomes[z * CHUNK_SIZE + x] = biome;
      }
    }
  }

  _decorateSurface(chunk) {
    for (let x = 0; x < CHUNK_SIZE; x++) {
      for (let z = 0; z < CHUNK_SIZE; z++) {
        const biome = chunk.biomes[z * CHUNK_SIZE + x];
        const height = chunk.getHeight(x, z);
        if (height < CHUNK_MIN_Y) continue;

        const surfIdx = chunk.getIndex(x, height, z);

        switch (biome) {
          case BIOMES.DESERT:
            chunk.blockIds[surfIdx] = BLOCKS.SAND;
            if (height > 0) {
              const below = chunk.getIndex(x, height - 1, z);
              chunk.blockIds[below] = BLOCKS.SAND;
              if (height > 1) {
                const below2 = chunk.getIndex(x, height - 2, z);
                chunk.blockIds[below2] = BLOCKS.SANDSTONE;
              }
            }
            break;
          case BIOMES.SNOWY_TUNDRA:
            chunk.blockIds[surfIdx] = BLOCKS.SNOW_BLOCK;
            break;
          case BIOMES.BADLANDS:
            chunk.blockIds[surfIdx] = BLOCKS.RED_SAND;
            break;
          case BIOMES.MUSHROOM_FIELDS:
            chunk.blockIds[surfIdx] = BLOCKS.MYCELIUM || BLOCKS.DIRT;
            break;
          case BIOMES.OCEAN:
            // Already water, surface stays dirt/gravel
            if (height >= CHUNK_MIN_Y) {
              chunk.blockIds[surfIdx] = BLOCKS.GRAVEL;
            }
            break;
          default:
            chunk.blockIds[surfIdx] = BLOCKS.GRASS_BLOCK;
            break;
        }
      }
    }
  }

  _carveCaves(chunk) {
    const scale = 0.03;
    const threshold = 0.55;

    for (let x = 0; x < CHUNK_SIZE; x++) {
      for (let z = 0; z < CHUNK_SIZE; z++) {
        const wx = chunk.cx * CHUNK_SIZE + x;
        const wz = chunk.cz * CHUNK_SIZE + z;

        for (let y = CHUNK_MIN_Y + 1; y < 60; y++) {
          const idx = chunk.getIndex(x, y, z);
          if (chunk.blockIds[idx] === BLOCKS.BEDROCK) continue;

          const n = this.noise3D(wx * scale, y * scale, wz * scale);
          const n2 = this.noise3D(wx * scale * 0.5, y * scale * 0.5, wz * scale * 0.5) * 0.5;

          if (n + n2 > threshold) {
            chunk.blockIds[idx] = BLOCKS.AIR;
            // Update height map if needed
            if (y === chunk.getHeight(x, z)) {
              for (let ny = y - 1; ny >= CHUNK_MIN_Y; ny--) {
                if (chunk.blockIds[chunk.getIndex(x, ny, z)] !== 0) {
                  chunk.heightMap[z * CHUNK_SIZE + x] = ny;
                  break;
                }
              }
            }
          }
        }
      }
    }
  }

  _placeFeatures(chunk) {
    const rng = this._seededRandom(this.seed + chunk.cx * 31337 + chunk.cz * 7919);

    for (let x = 2; x < CHUNK_SIZE - 2; x++) {
      for (let z = 2; z < CHUNK_SIZE - 2; z++) {
        const biome = chunk.biomes[z * CHUNK_SIZE + x];
        const height = chunk.getHeight(x, z);
        if (height < CHUNK_MIN_Y || height > 120) continue;

        const surfaceBlock = chunk.blockIds[chunk.getIndex(x, height, z)];
        if (surfaceBlock === BLOCKS.WATER) continue;

        // Trees
        if (rng() < 0.008) {
          if (biome === BIOMES.FOREST || biome === BIOMES.TAIGA || biome === BIOMES.JUNGLE) {
            this._placeTree(chunk, x, height + 1, z, biome, rng);
          } else if (biome === BIOMES.PLAINS && rng() < 0.15) {
            this._placeTree(chunk, x, height + 1, z, biome, rng);
          }
        }

        // Flowers and grass
        if (rng() < 0.05 && height > SEA_LEVEL) {
          const aboveIdx = chunk.getIndex(x, height + 1, z);
          if (chunk.blockIds[aboveIdx] === BLOCKS.AIR) {
            if (biome === BIOMES.PLAINS) {
              chunk.blockIds[aboveIdx] = rng() > 0.5 ? BLOCKS.POPPY : BLOCKS.DANDELION;
            } else if (biome === BIOMES.FOREST) {
              chunk.blockIds[aboveIdx] = BLOCKS.TALL_GRASS;
            }
          }
        }
      }
    }
  }

  _placeTree(chunk, x, y, z, biome, rng) {
    const treeHeight = 4 + Math.floor(rng() * 3);
    const logBlock = biome === BIOMES.TAIGA ? BLOCKS.SPRUCE_LOG : BLOCKS.OAK_LOG;
    const leafBlock = biome === BIOMES.TAIGA ? BLOCKS.SPRUCE_LEAVES : BLOCKS.OAK_LEAVES;

    // Trunk
    for (let dy = 0; dy < treeHeight; dy++) {
      const ty = y + dy;
      if (ty >= CHUNK_MIN_Y + CHUNK_HEIGHT) break;
      const idx = chunk.getIndex(x, ty, z);
      chunk.blockIds[idx] = logBlock;
    }

    // Leaves (sphere around top of trunk)
    const leafStart = treeHeight - 3;
    for (let dy = leafStart; dy <= treeHeight + 1; dy++) {
      const radius = dy <= treeHeight - 1 ? 2 : 1;
      for (let dx = -radius; dx <= radius; dx++) {
        for (let dz = -radius; dz <= radius; dz++) {
          if (dx === 0 && dz === 0 && dy < treeHeight) continue; // trunk position
          if (Math.abs(dx) === radius && Math.abs(dz) === radius && rng() > 0.6) continue; // corners
          const lx = x + dx;
          const lz = z + dz;
          const ly = y + dy;
          if (lx < 0 || lx >= CHUNK_SIZE || lz < 0 || lz >= CHUNK_SIZE) continue;
          if (ly >= CHUNK_MIN_Y + CHUNK_HEIGHT) continue;
          const idx = chunk.getIndex(lx, ly, lz);
          if (chunk.blockIds[idx] === BLOCKS.AIR) {
            chunk.blockIds[idx] = leafBlock;
          }
        }
      }
    }

    // Update height map
    const topY = y + treeHeight;
    if (topY > chunk.heightMap[z * CHUNK_SIZE + x]) {
      chunk.heightMap[z * CHUNK_SIZE + x] = topY;
    }
  }

  _computeSkyLight(chunk) {
    for (let x = 0; x < CHUNK_SIZE; x++) {
      for (let z = 0; z < CHUNK_SIZE; z++) {
        let light = 15;
        for (let y = CHUNK_HEIGHT - 1; y >= 0; y--) {
          const idx = chunk.getIndex(x, y, z);
          const blockId = chunk.blockIds[idx];
          if (blockId !== BLOCKS.AIR && blockId !== BLOCKS.WATER &&
              blockId !== BLOCKS.OAK_LEAVES && blockId !== BLOCKS.SPRUCE_LEAVES &&
              blockId !== BLOCKS.BIRCH_LEAVES && blockId !== BLOCKS.GLASS &&
              blockId !== BLOCKS.TORCH && blockId !== BLOCKS.POPPY &&
              blockId !== BLOCKS.DANDELION && blockId !== BLOCKS.TALL_GRASS) {
            light = 0;
          }
          chunk.light[idx] = (light << 4) | (chunk.light[idx] & 0x0F);
        }
      }
    }
  }
}

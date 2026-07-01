import { CHUNK_SIZE, CHUNK_HEIGHT, CHUNK_MIN_Y } from './Chunk.js';
import { BlockRegistry } from './BlockRegistry.js';

export class World {
  constructor() {
    this.chunks = new Map();
    this.entities = [];
    this.seed = 0;
    this.time = 6000; // noon
    this.difficulty = 2; // normal
    this.gameMode = 'survival';
    this.spawnPoint = { x: 0, y: 64, z: 0 };
  }

  chunkKey(cx, cz) {
    return `${cx},${cz}`;
  }

  getChunk(cx, cz) {
    return this.chunks.get(this.chunkKey(cx, cz));
  }

  setChunk(cx, cz, chunk) {
    this.chunks.set(this.chunkKey(cx, cz), chunk);
  }

  removeChunk(cx, cz) {
    const key = this.chunkKey(cx, cz);
    const chunk = this.chunks.get(key);
    if (chunk && chunk.mesh) {
      chunk.mesh.geometry.dispose();
      chunk.mesh.material.dispose();
    }
    this.chunks.delete(key);
  }

  // World-coordinate block access
  getBlock(wx, wy, wz) {
    const cx = Math.floor(wx / CHUNK_SIZE);
    const cz = Math.floor(wz / CHUNK_SIZE);
    const chunk = this.getChunk(cx, cz);
    if (!chunk) return { id: 0, state: 0 };
    const lx = ((wx % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE;
    const lz = ((wz % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE;
    return chunk.getBlock(lx, wy, lz);
  }

  setBlock(wx, wy, wz, id, state = 0) {
    const cx = Math.floor(wx / CHUNK_SIZE);
    const cz = Math.floor(wz / CHUNK_SIZE);
    const chunk = this.getChunk(cx, cz);
    if (!chunk) return;
    const lx = ((wx % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE;
    const lz = ((wz % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE;
    chunk.setBlock(lx, wy, lz, id, state);

    // Mark neighbor chunks dirty if on edge
    if (lx === 0) this._markDirty(cx - 1, cz);
    if (lx === CHUNK_SIZE - 1) this._markDirty(cx + 1, cz);
    if (lz === 0) this._markDirty(cx, cz - 1);
    if (lz === CHUNK_SIZE - 1) this._markDirty(cx, cz + 1);
  }

  _markDirty(cx, cz) {
    const chunk = this.getChunk(cx, cz);
    if (chunk) chunk.meshDirty = true;
  }

  // Get the highest non-air block at (wx, wz)
  getHeight(wx, wz) {
    const cx = Math.floor(wx / CHUNK_SIZE);
    const cz = Math.floor(wz / CHUNK_SIZE);
    const chunk = this.getChunk(cx, cz);
    if (!chunk) return CHUNK_MIN_Y - 1;
    const lx = ((wx % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE;
    const lz = ((wz % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE;
    return chunk.getHeight(lx, lz);
  }

  // Get all blocks overlapping an AABB (for collision)
  getOverlappingBlocks(aabb) {
    const blocks = [];
    const minX = Math.floor(aabb.minX);
    const maxX = Math.floor(aabb.maxX);
    const minY = Math.floor(aabb.minY);
    const maxY = Math.floor(aabb.maxY);
    const minZ = Math.floor(aabb.minZ);
    const maxZ = Math.floor(aabb.maxZ);

    for (let x = minX; x <= maxX; x++) {
      for (let y = minY; y <= maxY; y++) {
        for (let z = minZ; z <= maxZ; z++) {
          const block = this.getBlock(x, y, z);
          if (BlockRegistry.isSolid(block.id)) {
            blocks.push({ x, y, z, ...block });
          }
        }
      }
    }
    return blocks;
  }

  // Raycast for block picking
  raycast(origin, direction, maxDist = 8) {
    const step = 0.05;
    let prevX, prevY, prevZ;
    for (let d = 0; d < maxDist; d += step) {
      const x = Math.floor(origin.x + direction.x * d);
      const y = Math.floor(origin.y + direction.y * d);
      const z = Math.floor(origin.z + direction.z * d);

      if (x !== prevX || y !== prevY || z !== prevZ) {
        const block = this.getBlock(x, y, z);
        if (BlockRegistry.isSolid(block.id)) {
          return {
            hit: true,
            block: { x, y, z, ...block },
            // Previous position = the face we hit from
            face: { x: prevX ?? x, y: prevY ?? y, z: prevZ ?? z },
            distance: d,
          };
        }
        prevX = x;
        prevY = y;
        prevZ = z;
      }
    }
    return { hit: false };
  }

  // Get loaded chunk count
  getChunkCount() {
    return this.chunks.size;
  }

  // Get all dirty chunks that need re-meshing
  getDirtyChunks() {
    const dirty = [];
    for (const chunk of this.chunks.values()) {
      if (chunk.meshDirty && chunk.status === 'ready') {
        dirty.push(chunk);
      }
    }
    return dirty;
  }

  // Time management
  getTimeOfDay() {
    return this.time % 24000;
  }

  isDaytime() {
    const t = this.getTimeOfDay();
    return t >= 0 && t < 12000;
  }

  getSunAngle() {
    const t = this.getTimeOfDay();
    return (t / 24000) * Math.PI * 2 - Math.PI / 2;
  }

  getSkyColor() {
    const t = this.getTimeOfDay();
    // Day: 0.6,0.8,1.0  Night: 0.01,0.01,0.05  Dawn/dusk: blend
    if (t < 6000) {
      // Morning to noon
      return { r: 0.6, g: 0.8, b: 1.0 };
    } else if (t < 12000) {
      // Noon to sunset
      const f = (t - 6000) / 6000;
      return {
        r: 0.6 + f * 0.4,
        g: 0.8 - f * 0.5,
        b: 1.0 - f * 0.7,
      };
    } else if (t < 14000) {
      // Sunset to night
      const f = (t - 12000) / 2000;
      return {
        r: 1.0 - f * 0.99,
        g: 0.3 - f * 0.29,
        b: 0.3 - f * 0.25,
      };
    } else if (t < 22000) {
      // Night
      return { r: 0.01, g: 0.01, b: 0.05 };
    } else {
      // Night to dawn
      const f = (t - 22000) / 2000;
      return {
        r: 0.01 + f * 0.59,
        g: 0.01 + f * 0.79,
        b: 0.05 + f * 0.95,
      };
    }
  }
}

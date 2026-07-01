export const CHUNK_SIZE = 16;
export const CHUNK_HEIGHT = 384;
export const CHUNK_MIN_Y = -64;
export const SEA_LEVEL = 63;

export class Chunk {
  constructor(cx, cz, dimension = 'overworld') {
    this.cx = cx;
    this.cz = cz;
    this.dimension = dimension;

    // Block storage: 16*16*384 = 98,304 blocks per chunk
    this.blockIds = new Uint8Array(CHUNK_SIZE * CHUNK_SIZE * CHUNK_HEIGHT);
    this.blockStates = new Uint8Array(CHUNK_SIZE * CHUNK_SIZE * CHUNK_HEIGHT);

    // Light storage: 4 bits sky + 4 bits block = 1 byte per block
    this.light = new Uint8Array(CHUNK_SIZE * CHUNK_SIZE * CHUNK_HEIGHT);

    // Mesh reference
    this.mesh = null;
    this.meshDirty = true;
    this.lightDirty = true;

    // Status: 'empty' | 'generating' | 'generated' | 'meshing' | 'ready'
    this.status = 'empty';

    // Modification tracking
    this.modified = false;

    // Height map for quick surface lookups
    this.heightMap = new Int32Array(CHUNK_SIZE * CHUNK_SIZE);
    this.heightMap.fill(CHUNK_MIN_Y - 1);
  }

  getIndex(x, y, z) {
    const yo = y - CHUNK_MIN_Y;
    return (yo * CHUNK_SIZE * CHUNK_SIZE) + (z * CHUNK_SIZE) + x;
  }

  getBlock(x, y, z) {
    if (x < 0 || x >= CHUNK_SIZE || z < 0 || z >= CHUNK_SIZE ||
        y < CHUNK_MIN_Y || y >= CHUNK_MIN_Y + CHUNK_HEIGHT) {
      return { id: 0, state: 0 };
    }
    const idx = this.getIndex(x, y, z);
    return { id: this.blockIds[idx], state: this.blockStates[idx] };
  }

  setBlock(x, y, z, id, state = 0) {
    if (x < 0 || x >= CHUNK_SIZE || z < 0 || z >= CHUNK_SIZE ||
        y < CHUNK_MIN_Y || y >= CHUNK_MIN_Y + CHUNK_HEIGHT) {
      return;
    }
    const idx = this.getIndex(x, y, z);
    this.blockIds[idx] = id;
    this.blockStates[idx] = state;
    this.meshDirty = true;
    this.lightDirty = true;
    this.modified = true;

    // Update height map
    const hIdx = z * CHUNK_SIZE + x;
    if (id !== 0 && y > this.heightMap[hIdx]) {
      this.heightMap[hIdx] = y;
    } else if (id === 0 && y === this.heightMap[hIdx]) {
      // Recalculate height for this column
      for (let ny = y - 1; ny >= CHUNK_MIN_Y; ny--) {
        if (this.blockIds[this.getIndex(x, ny, z)] !== 0) {
          this.heightMap[hIdx] = ny;
          break;
        }
      }
    }

    // Mark neighbors dirty if on edge
    if (x === 0 || x === CHUNK_SIZE - 1 || z === 0 || z === CHUNK_SIZE - 1) {
      this._neighborDirty = true;
    }
  }

  getHeight(x, z) {
    if (x < 0 || x >= CHUNK_SIZE || z < 0 || z >= CHUNK_SIZE) return CHUNK_MIN_Y - 1;
    return this.heightMap[z * CHUNK_SIZE + x];
  }

  getSkyLight(x, y, z) {
    const idx = this.getIndex(x, y, z);
    return (this.light[idx] >> 4) & 0x0F;
  }

  getBlockLight(x, y, z) {
    const idx = this.getIndex(x, y, z);
    return this.light[idx] & 0x0F;
  }

  setLight(x, y, z, sky, block) {
    const idx = this.getIndex(x, y, z);
    this.light[idx] = (sky << 4) | block;
  }

  // Serialize chunk for worker transfer or save
  serialize() {
    return {
      cx: this.cx,
      cz: this.cz,
      dimension: this.dimension,
      blockIds: this.blockIds.slice(),
      blockStates: this.blockStates.slice(),
      light: this.light.slice(),
      heightMap: this.heightMap.slice(),
      modified: this.modified,
    };
  }

  // Deserialize from worker or save data
  static deserialize(data) {
    const chunk = new Chunk(data.cx, data.cz, data.dimension);
    chunk.blockIds.set(data.blockIds);
    chunk.blockStates.set(data.blockStates);
    chunk.light.set(data.light);
    chunk.heightMap.set(data.heightMap);
    chunk.modified = data.modified;
    chunk.status = 'generated';
    chunk.meshDirty = true;
    return chunk;
  }
}

import { CHUNK_SIZE, CHUNK_HEIGHT, CHUNK_MIN_Y } from '../core/Chunk.js';
import { BlockRegistry } from '../core/BlockRegistry.js';

// Face definitions: [axis, direction, normal, tangent1, tangent2]
const FACES = [
  { name: 'north', dir: [0, 0, -1], corners: [[0,0,0],[1,0,0],[1,1,0],[0,1,0]] },
  { name: 'south', dir: [0, 0, 1],  corners: [[1,0,1],[0,0,1],[0,1,1],[1,1,1]] },
  { name: 'east',  dir: [1, 0, 0],  corners: [[1,0,1],[1,0,0],[1,1,0],[1,1,1]] },
  { name: 'west',  dir: [-1,0, 0],  corners: [[0,0,0],[0,0,1],[0,1,1],[0,1,0]] },
  { name: 'top',   dir: [0, 1, 0],  corners: [[0,1,1],[1,1,1],[1,1,0],[0,1,0]] },
  { name: 'bottom',dir: [0,-1, 0],  corners: [[0,0,0],[1,0,0],[1,0,1],[0,0,1]] },
];

export class ChunkMesher {
  constructor(blockTextureMap) {
    this.blockTextureMap = blockTextureMap; // blockId -> { top, side, bottom } UV coords
  }

  meshChunk(chunk, world) {
    const positions = [];
    const normals = [];
    const uvs = [];
    const colors = [];
    const indices = [];
    let vertexCount = 0;

    for (let y = 0; y < CHUNK_HEIGHT; y++) {
      const wy = y + CHUNK_MIN_Y;
      for (let z = 0; z < CHUNK_SIZE; z++) {
        for (let x = 0; x < CHUNK_SIZE; x++) {
          const idx = chunk.getIndex(x, y, z);
          const blockId = chunk.blockIds[idx];
          if (blockId === 0) continue; // air

          const wx = chunk.cx * CHUNK_SIZE + x;
          const wz = chunk.cz * CHUNK_SIZE + z;

          for (const face of FACES) {
            // Get neighbor block
            const nx = x + face.dir[0];
            const ny = y + face.dir[1];
            const nz = z + face.dir[2];

            let neighborId;
            if (nx >= 0 && nx < CHUNK_SIZE && nz >= 0 && nz < CHUNK_SIZE &&
                ny >= 0 && ny < CHUNK_HEIGHT) {
              neighborId = chunk.blockIds[chunk.getIndex(nx, ny, nz)];
            } else if (ny >= 0 && ny < CHUNK_HEIGHT) {
              // Cross-chunk neighbor lookup
              const nwx = wx + face.dir[0];
              const nwz = wz + face.dir[2];
              const neighbor = world.getBlock(nwx, wy, nwz);
              neighborId = neighbor.id;
            } else {
              neighborId = 0;
            }

            // Only render face if neighbor is transparent/air
            if (neighborId !== 0 && BlockRegistry.isOpaque(neighborId)) continue;
            if (neighborId === blockId && BlockRegistry.isTransparent(blockId)) continue;

            // Get UV coords for this face
            const uv = this._getUV(blockId, face.name);

            // Get lighting
            const skyLight = chunk.getSkyLight(x, wy, z) / 15;
            const blockLight = chunk.getBlockLight(x, wy, z) / 15;
            const light = Math.min(1.0, skyLight * 0.8 + blockLight * 0.6 + 0.1);

            // Ambient occlusion
            const ao = this._computeAO(chunk, x, y, z, face);

            // Add 4 vertices for this face
            for (let i = 0; i < 4; i++) {
              const corner = face.corners[i];
              positions.push(
                wx + corner[0],
                wy + corner[1],
                wz + corner[2]
              );
              normals.push(face.dir[0], face.dir[1], face.dir[2]);

              // UV mapping
              const cu = i === 0 || i === 3 ? uv.u0 : uv.u1;
              const cv = i === 0 || i === 1 ? uv.v0 : uv.v1;
              uvs.push(cu, cv);

              // Color = light * AO
              const aoFactor = ao[i] / 3.0;
              const finalLight = light * (0.35 + 0.65 * aoFactor);
              colors.push(finalLight, finalLight, finalLight);
            }

            // Two triangles per face
            indices.push(
              vertexCount, vertexCount + 1, vertexCount + 2,
              vertexCount, vertexCount + 2, vertexCount + 3
            );
            vertexCount += 4;
          }
        }
      }
    }

    return { positions, normals, uvs, colors, indices, vertexCount };
  }

  _getUV(blockId, faceName) {
    const tex = this.blockTextureMap[blockId];
    if (!tex) {
      // Default: use blockId as texture index
      const idx = blockId;
      const tilesPerRow = 16;
      const tileSize = 1 / tilesPerRow;
      const tx = (idx % tilesPerRow) * tileSize;
      const ty = Math.floor(idx / tilesPerRow) * tileSize;
      return { u0: tx, v0: ty, u1: tx + tileSize, v1: ty + tileSize };
    }

    // Use face-specific texture
    const faceTex = faceName === 'top' ? tex.top : (faceName === 'bottom' ? tex.bottom : tex.side);
    return faceTex || tex.side || tex.top;
  }

  _computeAO(chunk, x, y, z, face) {
    const ao = [3, 3, 3, 3]; // 0=darkest, 3=brightest
    // Simplified AO: check 3 neighbors per vertex
    // Full AO would check side1, side2, corner for each vertex
    // For MVP, use a simpler approach
    const dx = face.dir[0];
    const dy = face.dir[1];
    const dz = face.dir[2];

    for (let i = 0; i < 4; i++) {
      const corner = face.corners[i];
      let count = 0;
      // Check 2 side neighbors + corner
      const cx = x + dx + (corner[0] - 0.5) * (1 - Math.abs(dx));
      const cy = y + dy + (corner[1] - 0.5) * (1 - Math.abs(dy));
      const cz = z + dz + (corner[2] - 0.5) * (1 - Math.abs(dz));

      // Simplified: just use the face light level
      ao[i] = 3;
    }

    return ao;
  }
}

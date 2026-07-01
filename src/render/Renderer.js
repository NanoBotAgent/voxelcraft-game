import * as THREE from 'three';
import { CHUNK_SIZE, CHUNK_MIN_Y, CHUNK_HEIGHT } from '../core/Chunk.js';
import { BlockRegistry } from '../core/BlockRegistry.js';
import { BLOCKS } from '../core/BlockRegistry.js';
import { ChunkMesher } from './ChunkMesher.js';

export class Renderer {
  constructor(canvas, world, textureAtlas) {
    this.world = world;
    this.canvas = canvas;
    this.mesher = new ChunkMesher(textureAtlas.getUV.bind(textureAtlas));
    this.texture = textureAtlas.toTexture();

    // Three.js setup
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x87CEEB);
    this.scene.fog = new THREE.Fog(0x87CEEB, 50, 200);

    this.camera = new THREE.PerspectiveCamera(70, canvas.clientWidth / canvas.clientHeight, 0.1, 1000);

    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: false,
      powerPreference: 'high-performance',
    });
    this.renderer.setSize(canvas.clientWidth, canvas.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // Lighting
    this.ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    this.scene.add(this.ambientLight);

    this.sunLight = new THREE.DirectionalLight(0xffffff, 0.8);
    this.sunLight.position.set(100, 200, 100);
    this.scene.add(this.sunLight);

    // Chunk mesh material
    this.chunkMaterial = new THREE.MeshLambertMaterial({
      map: this.texture,
      vertexColors: true,
      side: THREE.FrontSide,
      alphaTest: 0.1,
      transparent: false,
    });

    // Water material
    this.waterMaterial = new THREE.MeshLambertMaterial({
      map: this.texture,
      vertexColors: true,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.7,
    });

    // Block highlight wireframe
    const highlightGeo = new THREE.BoxGeometry(1.005, 1.005, 1.005);
    const highlightEdges = new THREE.EdgesGeometry(highlightGeo);
    this.highlightMesh = new THREE.LineSegments(
      highlightEdges,
      new THREE.LineBasicMaterial({ color: 0x000000, linewidth: 2 })
    );
    this.highlightMesh.visible = false;
    this.scene.add(this.highlightMesh);

    // Chunk group
    this.chunkGroup = new THREE.Group();
    this.scene.add(this.chunkGroup);

    // Meshing queue (limit per frame)
    this.maxMeshesPerFrame = 2;

    // Handle resize
    window.addEventListener('resize', () => this.onResize());
  }

  onResize() {
    const w = this.canvas.clientWidth;
    const h = this.canvas.clientHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  }

  setCameraPosition(x, y, z) {
    this.camera.position.set(x, y, z);
  }

  setCameraRotation(yaw, pitch) {
    this.camera.rotation.order = 'YXZ';
    this.camera.rotation.y = yaw;
    this.camera.rotation.x = pitch;
  }

  setFOV(fov) {
    this.camera.fov = fov;
    this.camera.updateProjectionMatrix();
  }

  updateSky() {
    const sky = this.world.getSkyColor();
    const color = new THREE.Color(sky.r, sky.g, sky.b);
    this.scene.background = color;
    this.scene.fog.color = color;

    // Update sun position based on time
    const sunAngle = this.world.getSunAngle();
    this.sunLight.position.set(
      Math.cos(sunAngle) * 100,
      Math.sin(sunAngle) * 200,
      50
    );

    // Adjust light intensity based on time
    const dayFactor = Math.max(0, Math.sin(sunAngle));
    this.sunLight.intensity = 0.2 + dayFactor * 0.8;
    this.ambientLight.intensity = 0.15 + dayFactor * 0.35;
  }

  updateMeshes() {
    const dirty = this.world.getDirtyChunks();
    let meshed = 0;

    for (const chunk of dirty) {
      if (meshed >= this.maxMeshesPerFrame) break;
      this._buildChunkMesh(chunk);
      chunk.meshDirty = false;
      meshed++;
    }
  }

  _buildChunkMesh(chunk) {
    // Remove old mesh
    if (chunk.mesh) {
      this.chunkGroup.remove(chunk.mesh);
      chunk.mesh.geometry.dispose();
    }

    const data = this.mesher.meshChunk(chunk, this.world);
    if (data.vertexCount === 0) {
      chunk.mesh = null;
      chunk.status = 'ready';
      return;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(data.positions, 3));
    geometry.setAttribute('normal', new THREE.Float32BufferAttribute(data.normals, 3));
    geometry.setAttribute('uv', new THREE.Float32BufferAttribute(data.uvs, 2));
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(data.colors, 3));
    geometry.setIndex(data.indices);

    const mesh = new THREE.Mesh(geometry, this.chunkMaterial);
    mesh.frustumCulled = true;
    this.chunkGroup.add(mesh);

    chunk.mesh = mesh;
    chunk.status = 'ready';
  }

  setHighlight(position) {
    if (position) {
      this.highlightMesh.position.set(position.x + 0.5, position.y + 0.5, position.z + 0.5);
      this.highlightMesh.visible = true;
    } else {
      this.highlightMesh.visible = false;
    }
  }

  render() {
    this.renderer.render(this.scene, this.camera);
  }

  dispose() {
    this.renderer.dispose();
    this.chunkMaterial.dispose();
    this.waterMaterial.dispose();
    this.texture.dispose();
  }
}

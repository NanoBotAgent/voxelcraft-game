import * as THREE from 'three';
import { BlockRegistry } from '../core/BlockRegistry.js';

export class Player {
  constructor(world) {
    this.world = world;

    // Position and physics
    this.position = new THREE.Vector3(0, 80, 0);
    this.velocity = new THREE.Vector3(0, 0, 0);
    this.rotation = { yaw: 0, pitch: 0 };

    // Dimensions (AABB)
    this.width = 0.6;
    this.height = 1.8;
    this.eyeHeight = 1.62;

    // State
    this.onGround = false;
    this.flying = false;
    this.sneaking = false;
    this.sprinting = false;

    // Health and hunger
    this.health = 20;
    this.maxHealth = 20;
    this.hunger = 20;
    this.maxHunger = 20;
    this.saturation = 5.0;
    this.exhaustion = 0;
    this.air = 300;

    // Inventory
    this.hotbar = new Array(9).fill(null);
    this.selectedSlot = 0;
    this.inventory = new Array(36).fill(null);

    // Movement speeds (blocks/sec)
    this.walkSpeed = 4.317;
    this.sprintSpeed = 5.612;
    this.sneakSpeed = 1.3;
    this.flySpeed = 11.0;
    this.sprintFlySpeed = 22.0;
    this.sneakFlySpeed = 2.2;

    // Physics constants
    this.gravity = -32;
    this.terminalVelocity = -78;
    this.jumpVelocity = 8.4;

    // Camera
    this.cameraMode = 'first'; // 'first' | 'third-back' | 'third-front'
    this.thirdPersonDistance = 3.0;

    // Game mode
    this.gameMode = 'survival'; // 'survival' | 'creative' | 'adventure' | 'spectator'

    // Mining
    this.miningProgress = 0;
    this.miningTarget = null;
    this.miningTime = 0;
  }

  getAABB() {
    const hw = this.width / 2;
    return {
      minX: this.position.x - hw,
      minY: this.position.y,
      minZ: this.position.z - hw,
      maxX: this.position.x + hw,
      maxY: this.position.y + this.height,
      maxZ: this.position.z + hw,
    };
  }

  getEyePosition() {
    return new THREE.Vector3(
      this.position.x,
      this.position.y + this.eyeHeight,
      this.position.z
    );
  }

  getLookDirection() {
    const dir = new THREE.Vector3(
      -Math.sin(this.rotation.yaw) * Math.cos(this.rotation.pitch),
      Math.sin(this.rotation.pitch),
      -Math.cos(this.rotation.yaw) * Math.cos(this.rotation.pitch)
    );
    return dir.normalize();
  }

  update(dt, input) {
    // Movement input
    const moveDir = new THREE.Vector3(0, 0, 0);
    const forward = new THREE.Vector3(
      -Math.sin(this.rotation.yaw),
      0,
      -Math.cos(this.rotation.yaw)
    );
    const right = new THREE.Vector3(
      Math.cos(this.rotation.yaw),
      0,
      -Math.sin(this.rotation.yaw)
    );

    if (input.forward) moveDir.add(forward);
    if (input.backward) moveDir.sub(forward);
    if (input.left) moveDir.sub(right);
    if (input.right) moveDir.add(right);

    if (moveDir.lengthSq() > 0) moveDir.normalize();

    // Speed
    let speed = this.walkSpeed;
    if (this.flying) {
      speed = this.sprinting ? this.sprintFlySpeed : (this.sneaking ? this.sneakFlySpeed : this.flySpeed);
    } else if (this.sprinting) {
      speed = this.sprintSpeed;
    } else if (this.sneaking) {
      speed = this.sneakSpeed;
    }

    // Apply movement
    this.velocity.x = moveDir.x * speed;
    this.velocity.z = moveDir.z * speed;

    // Flying
    if (this.flying) {
      this.velocity.y = 0;
      if (input.jump) this.velocity.y = this.flySpeed;
      if (input.sneak) this.velocity.y = -this.flySpeed;
    } else {
      // Gravity
      this.velocity.y += this.gravity * dt;
      if (this.velocity.y < this.terminalVelocity) {
        this.velocity.y = this.terminalVelocity;
      }

      // Jump
      if (input.jump && this.onGround) {
        this.velocity.y = this.jumpVelocity;
        this.onGround = false;
      }
    }

    // Move with collision
    this._moveWithCollision(dt);
  }

  _moveWithCollision(dt) {
    // Move on each axis separately
    this.onGround = false;

    // X axis
    this.position.x += this.velocity.x * dt;
    if (this._checkCollision()) {
      this.position.x -= this.velocity.x * dt;
      this.velocity.x = 0;
    }

    // Y axis
    this.position.y += this.velocity.y * dt;
    if (this._checkCollision()) {
      if (this.velocity.y < 0) {
        this.onGround = true;
        // Snap to block top
        this.position.y = Math.floor(this.position.y) + 0.001;
      }
      this.position.y -= this.velocity.y * dt;
      this.velocity.y = 0;
    }

    // Z axis
    this.position.z += this.velocity.z * dt;
    if (this._checkCollision()) {
      this.position.z -= this.velocity.z * dt;
      this.velocity.z = 0;
    }
  }

  _checkCollision() {
    const aabb = this.getAABB();
    const blocks = this.world.getOverlappingBlocks(aabb);
    return blocks.length > 0;
  }

  // Break a block at world coordinates
  breakBlock(x, y, z) {
    const block = this.world.getBlock(x, y, z);
    if (block.id === 0) return null;
    if (block.id === 60) return null; // bedrock

    this.world.setBlock(x, y, z, 0);
    return block;
  }

  // Place a block at world coordinates on the given face
  placeBlock(x, y, z, blockId) {
    if (!BlockRegistry.isSolid(blockId)) return false;

    // Check the block doesn't overlap the player
    const aabb = this.getAABB();
    const blockAABB = {
      minX: x, minY: y, minZ: z,
      maxX: x + 1, maxY: y + 1, maxZ: z + 1,
    };

    // AABB overlap check
    if (aabb.minX < blockAABB.maxX && aabb.maxX > blockAABB.minX &&
        aabb.minY < blockAABB.maxY && aabb.maxY > blockAABB.minY &&
        aabb.minZ < blockAABB.maxZ && aabb.maxZ > blockAABB.minZ) {
      return false; // would overlap player
    }

    this.world.setBlock(x, y, z, blockId);
    return true;
  }

  toggleCamera() {
    if (this.cameraMode === 'first') this.cameraMode = 'third-back';
    else if (this.cameraMode === 'third-back') this.cameraMode = 'third-front';
    else this.cameraMode = 'first';
  }

  setGameMode(mode) {
    this.gameMode = mode;
    if (mode === 'creative') {
      this.flying = true;
      this.health = 20;
      this.hunger = 20;
    } else {
      this.flying = false;
    }
  }
}

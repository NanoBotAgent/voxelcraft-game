// Block ID constants - top 50 blocks for MVP
export const BLOCKS = {
  AIR: 0,
  STONE: 1,
  GRANITE: 2,
  DIORITE: 3,
  ANDESITE: 4,
  DEEPSLATE: 5,
  DIRT: 10,
  COARSE_DIRT: 11,
  GRASS_BLOCK: 12,
  SAND: 20,
  GRAVEL: 21,
  CLAY: 22,
  SANDSTONE: 23,
  RED_SAND: 24,
  RED_SANDSTONE: 25,
  OAK_LOG: 30,
  OAK_PLANKS: 31,
  OAK_LEAVES: 32,
  OAK_SLAB: 33,
  OAK_STAIRS: 34,
  SPRUCE_LOG: 35,
  SPRUCE_PLANKS: 36,
  SPRUCE_LEAVES: 37,
  BIRCH_LOG: 38,
  BIRCH_PLANKS: 39,
  BIRCH_LEAVES: 40,
  COBBLESTONE: 50,
  MOSSY_COBBLESTONE: 51,
  STONE_BRICKS: 52,
  MOSSY_STONE_BRICKS: 53,
  CRACKED_STONE_BRICKS: 54,
  CHISELED_STONE_BRICKS: 55,
  BEDROCK: 60,
  COAL_ORE: 70,
  IRON_ORE: 71,
  COPPER_ORE: 72,
  GOLD_ORE: 73,
  DIAMOND_ORE: 74,
  LAPIS_ORE: 75,
  REDSTONE_ORE: 76,
  EMERALD_ORE: 77,
  DEEPSLATE_COAL_ORE: 78,
  DEEPSLATE_IRON_ORE: 79,
  DEEPSLATE_COPPER_ORE: 80,
  DEEPSLATE_GOLD_ORE: 81,
  DEEPSLATE_DIAMOND_ORE: 82,
  DEEPSLATE_LAPIS_ORE: 83,
  DEEPSLATE_REDSTONE_ORE: 84,
  DEEPSLATE_EMERALD_ORE: 85,
  WATER: 90,
  LAVA: 91,
  GLASS: 100,
  BRICK: 101,
  BOOKSHELF: 102,
  OBSIDIAN: 103,
  GLOWSTONE: 104,
  ICE: 105,
  SNOW: 106,
  SNOW_BLOCK: 107,
  CACTUS: 108,
  SUGAR_CANE: 109,
  PUMPKIN: 110,
  NETHERRACK: 120,
  SOUL_SAND: 121,
  NETHER_BRICKS: 122,
  END_STONE: 130,
  CRAFTING_TABLE: 140,
  FURNACE: 141,
  CHEST: 142,
  TORCH: 150,
  LADDER: 151,
  IRON_BLOCK: 160,
  GOLD_BLOCK: 161,
  DIAMOND_BLOCK: 162,
  TNT: 170,
  FLOWER_POT: 180,
  POPPY: 190,
  DANDELION: 191,
  BLUE_ORCHID: 192,
  ALLIUM: 193,
  TALL_GRASS: 200,
  FERN: 201,
  MUSHROOM_RED: 210,
  MUSHROOM_BROWN: 211,
};

// Block properties registry
const blockData = {};

function defineBlock(id, name, props = {}) {
  blockData[id] = {
    id,
    name,
    solid: props.solid !== undefined ? props.solid : true,
    opaque: props.opaque !== undefined ? props.opaque : true,
    transparent: props.transparent || false,
    lightEmission: props.lightEmission || 0,
    hardness: props.hardness || 1.0,
    toolType: props.toolType || 'hand',
    stackSize: props.stackSize || 64,
    flameable: props.flameable || false,
    ...props,
  };
}

// Define all blocks
defineBlock(BLOCKS.AIR, 'Air', { solid: false, opaque: false, transparent: true, hardness: 0 });
defineBlock(BLOCKS.STONE, 'Stone', { hardness: 1.5, toolType: 'pickaxe' });
defineBlock(BLOCKS.GRANITE, 'Granite', { hardness: 1.5, toolType: 'pickaxe' });
defineBlock(BLOCKS.DIORITE, 'Diorite', { hardness: 1.5, toolType: 'pickaxe' });
defineBlock(BLOCKS.ANDESITE, 'Andesite', { hardness: 1.5, toolType: 'pickaxe' });
defineBlock(BLOCKS.DEEPSLATE, 'Deepslate', { hardness: 3.0, toolType: 'pickaxe' });
defineBlock(BLOCKS.DIRT, 'Dirt', { hardness: 0.5, toolType: 'shovel' });
defineBlock(BLOCKS.COARSE_DIRT, 'Coarse Dirt', { hardness: 0.5, toolType: 'shovel' });
defineBlock(BLOCKS.GRASS_BLOCK, 'Grass Block', { hardness: 0.6, toolType: 'shovel' });
defineBlock(BLOCKS.SAND, 'Sand', { hardness: 0.5, toolType: 'shovel' });
defineBlock(BLOCKS.GRAVEL, 'Gravel', { hardness: 0.6, toolType: 'shovel' });
defineBlock(BLOCKS.CLAY, 'Clay', { hardness: 0.6, toolType: 'shovel' });
defineBlock(BLOCKS.SANDSTONE, 'Sandstone', { hardness: 0.8, toolType: 'pickaxe' });
defineBlock(BLOCKS.RED_SAND, 'Red Sand', { hardness: 0.5, toolType: 'shovel' });
defineBlock(BLOCKS.RED_SANDSTONE, 'Red Sandstone', { hardness: 0.8, toolType: 'pickaxe' });
defineBlock(BLOCKS.OAK_LOG, 'Oak Log', { hardness: 2.0, toolType: 'axe', flameable: true });
defineBlock(BLOCKS.OAK_PLANKS, 'Oak Planks', { hardness: 2.0, toolType: 'axe', flameable: true });
defineBlock(BLOCKS.OAK_LEAVES, 'Oak Leaves', { hardness: 0.2, toolType: 'hoe', transparent: true, opaque: false, flameable: true });
defineBlock(BLOCKS.SPRUCE_LOG, 'Spruce Log', { hardness: 2.0, toolType: 'axe', flameable: true });
defineBlock(BLOCKS.SPRUCE_PLANKS, 'Spruce Planks', { hardness: 2.0, toolType: 'axe', flameable: true });
defineBlock(BLOCKS.SPRUCE_LEAVES, 'Spruce Leaves', { hardness: 0.2, toolType: 'hoe', transparent: true, opaque: false, flameable: true });
defineBlock(BLOCKS.BIRCH_LOG, 'Birch Log', { hardness: 2.0, toolType: 'axe', flameable: true });
defineBlock(BLOCKS.BIRCH_PLANKS, 'Birch Planks', { hardness: 2.0, toolType: 'axe', flameable: true });
defineBlock(BLOCKS.BIRCH_LEAVES, 'Birch Leaves', { hardness: 0.2, toolType: 'hoe', transparent: true, opaque: false, flameable: true });
defineBlock(BLOCKS.COBBLESTONE, 'Cobblestone', { hardness: 2.0, toolType: 'pickaxe' });
defineBlock(BLOCKS.MOSSY_COBBLESTONE, 'Mossy Cobblestone', { hardness: 2.0, toolType: 'pickaxe' });
defineBlock(BLOCKS.STONE_BRICKS, 'Stone Bricks', { hardness: 1.5, toolType: 'pickaxe' });
defineBlock(BLOCKS.BEDROCK, 'Bedrock', { hardness: -1, toolType: 'none' });
defineBlock(BLOCKS.COAL_ORE, 'Coal Ore', { hardness: 3.0, toolType: 'pickaxe' });
defineBlock(BLOCKS.IRON_ORE, 'Iron Ore', { hardness: 3.0, toolType: 'pickaxe' });
defineBlock(BLOCKS.COPPER_ORE, 'Copper Ore', { hardness: 3.0, toolType: 'pickaxe' });
defineBlock(BLOCKS.GOLD_ORE, 'Gold Ore', { hardness: 3.0, toolType: 'pickaxe' });
defineBlock(BLOCKS.DIAMOND_ORE, 'Diamond Ore', { hardness: 3.0, toolType: 'pickaxe' });
defineBlock(BLOCKS.LAPIS_ORE, 'Lapis Ore', { hardness: 3.0, toolType: 'pickaxe' });
defineBlock(BLOCKS.REDSTONE_ORE, 'Redstone Ore', { hardness: 3.0, toolType: 'pickaxe', lightEmission: 7 });
defineBlock(BLOCKS.EMERALD_ORE, 'Emerald Ore', { hardness: 3.0, toolType: 'pickaxe' });
defineBlock(BLOCKS.DEEPSLATE_COAL_ORE, 'Deepslate Coal Ore', { hardness: 4.5, toolType: 'pickaxe' });
defineBlock(BLOCKS.DEEPSLATE_IRON_ORE, 'Deepslate Iron Ore', { hardness: 4.5, toolType: 'pickaxe' });
defineBlock(BLOCKS.DEEPSLATE_DIAMOND_ORE, 'Deepslate Diamond Ore', { hardness: 4.5, toolType: 'pickaxe' });
defineBlock(BLOCKS.WATER, 'Water', { solid: false, opaque: false, transparent: true, hardness: 100 });
defineBlock(BLOCKS.LAVA, 'Lava', { solid: false, opaque: false, transparent: true, hardness: 100, lightEmission: 15 });
defineBlock(BLOCKS.GLASS, 'Glass', { opaque: false, transparent: true, hardness: 0.3 });
defineBlock(BLOCKS.BRICK, 'Brick', { hardness: 2.0, toolType: 'pickaxe' });
defineBlock(BLOCKS.OBSIDIAN, 'Obsidian', { hardness: 50.0, toolType: 'pickaxe' });
defineBlock(BLOCKS.GLOWSTONE, 'Glowstone', { hardness: 0.3, toolType: 'pickaxe', lightEmission: 15 });
defineBlock(BLOCKS.ICE, 'Ice', { opaque: false, transparent: true, hardness: 0.5, toolType: 'pickaxe' });
defineBlock(BLOCKS.SNOW, 'Snow', { opaque: false, hardness: 0.2, toolType: 'shovel' });
defineBlock(BLOCKS.SNOW_BLOCK, 'Snow Block', { hardness: 0.2, toolType: 'shovel' });
defineBlock(BLOCKS.CACTUS, 'Cactus', { opaque: false, transparent: true, hardness: 0.4 });
defineBlock(BLOCKS.PUMPKIN, 'Pumpkin', { hardness: 1.0, toolType: 'axe' });
defineBlock(BLOCKS.NETHERRACK, 'Netherrack', { hardness: 0.4, toolType: 'pickaxe' });
defineBlock(BLOCKS.SOUL_SAND, 'Soul Sand', { hardness: 0.5, toolType: 'shovel' });
defineBlock(BLOCKS.END_STONE, 'End Stone', { hardness: 3.0, toolType: 'pickaxe' });
defineBlock(BLOCKS.CRAFTING_TABLE, 'Crafting Table', { hardness: 2.5, toolType: 'axe', flameable: true });
defineBlock(BLOCKS.FURNACE, 'Furnace', { hardness: 3.5, toolType: 'pickaxe', lightEmission: 13 });
defineBlock(BLOCKS.CHEST, 'Chest', { hardness: 2.5, toolType: 'axe', flameable: true });
defineBlock(BLOCKS.TORCH, 'Torch', { solid: false, opaque: false, transparent: true, hardness: 0, lightEmission: 14 });
defineBlock(BLOCKS.IRON_BLOCK, 'Iron Block', { hardness: 5.0, toolType: 'pickaxe' });
defineBlock(BLOCKS.GOLD_BLOCK, 'Gold Block', { hardness: 3.0, toolType: 'pickaxe' });
defineBlock(BLOCKS.DIAMOND_BLOCK, 'Diamond Block', { hardness: 5.0, toolType: 'pickaxe' });
defineBlock(BLOCKS.TNT, 'TNT', { hardness: 0, solid: true, opaque: true });
defineBlock(BLOCKS.POPPY, 'Poppy', { solid: false, opaque: false, transparent: true, hardness: 0 });
defineBlock(BLOCKS.DANDELION, 'Dandelion', { solid: false, opaque: false, transparent: true, hardness: 0 });
defineBlock(BLOCKS.TALL_GRASS, 'Tall Grass', { solid: false, opaque: false, transparent: true, hardness: 0 });
defineBlock(BLOCKS.MUSHROOM_RED, 'Red Mushroom', { solid: false, opaque: false, transparent: true, hardness: 0 });
defineBlock(BLOCKS.MUSHROOM_BROWN, 'Brown Mushroom', { solid: false, opaque: false, transparent: true, hardness: 0 });

export class BlockRegistry {
  static getBlock(id) {
    return blockData[id] || blockData[BLOCKS.AIR];
  }

  static isSolid(id) {
    const b = blockData[id];
    return b ? b.solid : false;
  }

  static isOpaque(id) {
    const b = blockData[id];
    return b ? b.opaque : false;
  }

  static isTransparent(id) {
    const b = blockData[id];
    return b ? b.transparent : true;
  }

  static getLightEmission(id) {
    const b = blockData[id];
    return b ? b.lightEmission : 0;
  }

  static getHardness(id) {
    const b = blockData[id];
    return b ? b.hardness : 0;
  }

  static getName(id) {
    const b = blockData[id];
    return b ? b.name : 'Unknown';
  }

  static getAllBlocks() {
    return Object.values(blockData);
  }
}

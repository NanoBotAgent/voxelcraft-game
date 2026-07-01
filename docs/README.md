# VoxelCraft — Minecraft Clone Prompt Kit

A comprehensive, research-backed prompt kit for an AI coding agent to build a vanilla-faithful Minecraft clone deployable on Vercel. Every block, item, mob, biome, dimension, mechanic, recipe, structure, and setting has been researched and documented.

## How to Use This Kit

1. **Read** `00-master-prompt.md` first — it's the actual prompt you'll paste into your AI coding agent (Claude, GPT-5, Cursor, etc.).
2. **Provide** the AI with all 12 files in this folder (the master prompt instructs it to read every reference file).
3. **Deploy** the resulting project on Vercel using the guide in `12-deployment.md`.

## File Index

### Primary Deliverable

| File | Purpose |
|---|---|
| **`00-master-prompt.md`** | **THE PROMPT.** Copy-paste this into your AI agent. Sets mission, stack, structure, features, acceptance criteria. |

### Reference Research (9 files, ~127K words total)

These files are referenced by the master prompt. The AI must read them all before coding.

| File | Contents | Approx. Size |
|---|---|---|
| `01-research-blocks.md` | All ~800 blocks with hardness, light, drops, properties, block states, model format, special behaviors | ~15K words |
| `02-research-items.md` | All ~1,580 items: tools, weapons, armor, food, materials, redstone, potions, enchantments, effects, fuel values | ~15K words |
| `03-research-mobs.md` | All mobs with HP, damage, AI behavior, goals, pathfinding, breeding, drops, sounds, special mechanics | ~19K words |
| `04-research-biomes.md` | All ~60 biomes, multi-noise generation algorithm, structure placement, mob spawn rules, seed system pseudocode | ~18K words |
| `05-research-dimensions.md` | Overworld, Nether, End: dimension properties, portal mechanics, Ender Dragon fight phases | ~8K words |
| `06-research-mechanics.md` | Player movement, hunger, combat, redstone, enchanting, brewing, crafting, mining, light, weather, time, tick system, gamerules, commands, status effects | ~15K words |
| `07-research-recipes.md` | All ~880 crafting/smelting/blasting/smoking/campfire/stonecutter/smithing recipes with JSON format | ~14K words |
| `08-research-structures.md` | All structures: villages, fortresses, end cities, ancient cities, trial chambers, loot tables, jigsaw system, archaeology | ~14K words |
| `09-research-settings.md` | Every vanilla options menu setting (video, controls, audio, language, chat, accessibility, skin, world creation, gamerules) | ~9K words |

### Technical Specifications

| File | Purpose |
|---|---|
| `10-architecture.md` | Tech architecture: Three.js + Vanilla JS, project structure, chunk system, greedy meshing, lighting, mob AI, pathfinding, world gen pipeline, performance budgets, Web Worker strategy |
| `11-features.md` | Detailed feature specs with acceptance criteria: world creation, game modes, difficulty, camera modes, movement, inventory, crafting, mobs, dimensions, redstone, enchanting, brewing, save/load, options menu, commands |
| `12-deployment.md` | Vercel deployment guide: vercel.json, vite.config.js, package.json, step-by-step deploy, troubleshooting, post-deploy verification |

## What the AI Will Build

A browser-based voxel sandbox game with:

- **Tech**: Three.js + Vanilla JS + Vite, 100% client-side, no backend
- **Visuals**: Pixel-perfect vanilla-faithful 16×16 procedurally-generated textures
- **World**: Modular seed-based generation with multi-noise biomes (~60 biomes), 3 dimensions (Overworld, Nether, End)
- **Gameplay**: All 4 game modes (Survival, Creative, Adventure, Spectator) + all 5 difficulty levels (Peaceful → Hardcore)
- **Camera**: First-person + third-person (back/front), F5 to cycle
- **Mobs**: All 60+ mobs with proper AI (Goals + Brain systems), pathfinding, breeding, sounds
- **Mechanics**: Redstone, enchanting, brewing, full crafting system (880 recipes), combat, hunger, weather, day/night
- **Persistence**: World saves in IndexedDB, instant load on revisit
- **Audio**: Full sound effects + ambient music (royalty-free)
- **Settings**: All vanilla options (video, controls, audio, language, chat, accessibility, skin, resource packs)
- **Performance**: Auto-detects device tier (Ultra / High / Mid / Low) and applies appropriate presets; user can override
- **Deployment**: Vercel static site, ~2-3MB bundle, global CDN

## Suggested Implementation Roadmap

(From `00-master-prompt.md` §11)

- **Phase 1** (2-3 weeks): MVP — single biome, basic blocks, player controller, world gen, Vercel deploy
- **Phase 2** (3-4 weeks): Survival core — crafting, mobs, combat, difficulty
- **Phase 3** (4-5 weeks): Depth — all biomes, all mobs, enchanting, brewing, redstone, Nether
- **Phase 4** (3-4 weeks): End game — End dimension, dragon fight, elytra, commands, trial chambers
- **Phase 5** (2-3 weeks): Polish — third-person camera, resource packs, accessibility, performance tuning

Total estimate: **14-17 weeks** for a full-featured clone. AI agents (Claude, GPT-5) can compress this significantly.

## Tech Stack Summary

| Layer | Choice | Rationale |
|---|---|---|
| Engine | Three.js 0.160+ | Industry-standard, smallest bundle, simplest Vercel deploy |
| Language | Vanilla ES2022+ JS | No framework overhead, fastest cold start |
| Bundler | Vite 5 | Best DX, fast HMR, optimized production builds |
| Physics | Custom AABB | Voxel collision is simpler & faster than full physics engines |
| Audio | Web Audio API direct | Minimal dependencies, full control |
| Storage | IndexedDB (via `idb`) | Persistent, large capacity (GBs), no server |
| Noise | `simplex-noise` npm | Stable, well-tested, small |
| Hosting | Vercel static | Free, global CDN, auto-HTTPS, Git-based |

**Forbidden**: React, Vue, Svelte, Angular, jQuery, lodash, cannon.js, Babylon.js (all unnecessary overhead).

## Critical User Requirements (from clarification)

These are explicitly required and have dedicated acceptance criteria in the master prompt:

1. **Game modes**: Survival + Creative + Adventure + Spectator (all 4)
2. **Difficulty modes**: Peaceful + Easy + Normal + Hard + Hardcore (all 5)
3. **Mobs**: Must walk and behave properly (full AI system)
4. **Camera**: First-person ↔ Third-person toggle (F5)
5. **Nether dimension**: With portal mechanics, nether mobs, nether biomes
6. **End dimension**: With Ender Dragon fight (multi-phase boss AI)
7. **Random seed world generation**: Modular, extensible, deterministic from seed
8. **Full options menu**: All vanilla settings, performance configurable for low/mid/high-end devices
9. **Crafting system**: All ~880 recipes, all crafting stations
10. **Enchanting + Brewing**: Full enchantment table + anvil + brewing stand
11. **Redstone**: Dust, repeater, comparator, piston, hopper, dispenser, observer, etc.
12. **Sound + Music**: All sound effects + ambient music
13. **Save/load worlds**: IndexedDB, persistent across sessions
14. **Vercel deployment**: Static site, step-by-step guide

## Anti-Requirements (Explicitly Excluded)

- ❌ **Multiplayer** (single-player only — keeps complexity manageable)
- ❌ **Vercel Serverless Functions** for game logic (100% client-side)
- ❌ **Mojang copyrighted assets** (textures/sounds procedurally generated or CC0/CC-BY)
- ❌ **Mobile-first design** (desktop-first; basic mobile support is nice-to-have)
- ❌ **TypeScript / React / Vue** (vanilla JS only)

## How to Verify the Build Worked

The master prompt's §12 "Definition of Done" lists ~30 acceptance criteria. Key ones:

- [ ] Create world with custom seed → world generates deterministically
- [ ] All 4 gamemodes work
- [ ] All 5 difficulty levels work
- [ ] F5 cycles camera modes
- [ ] Can break/place all ~800 blocks
- [ ] Crafting works for all ~880 recipes
- [ ] All 60+ mobs spawn, walk, attack, breed
- [ ] Nether accessible via portal
- [ ] End accessible via stronghold portal; dragon fight works
- [ ] Redstone circuits work
- [ ] Enchanting works (table + anvil + 35+ enchantments)
- [ ] Brewing works (all potions)
- [ ] World saves to IndexedDB; can reload
- [ ] Options menu has all vanilla settings
- [ ] 60+ FPS on mid-range laptop at render distance 12
- [ ] Deploys to Vercel as static site

## Provenance

- **Research files**: Generated by parallel research agents using deep Minecraft knowledge (Java Edition 1.21.4 reference).
- **Architecture & features**: Authored by the orchestrator based on user clarifications.
- **User clarifications** (selected via AskUserQuestion):
  - Tech stack: Three.js + Vanilla JS
  - Format: Multi-file prompt kit
  - Scope: Maximalist
  - Must-include: Redstone, End dimension, Crafting, Enchanting+Brewing, Sound, Save/load
  - Visuals: Pixel-perfect vanilla
  - World gen: Modular, seed-based
  - Performance: High-end default + mid/low-end configurable (like vanilla)
  - Deployment: Step-by-step Vercel

## License

This prompt kit is provided as-is for personal use. The implementing AI must generate all textures, sounds, and other assets procedurally or use CC0/CC-BY alternatives — do NOT redistribute Mojang's copyrighted assets.

---

**Ready to build.** Open `00-master-prompt.md`, copy its full contents, paste into your AI coding agent of choice, and start shipping. Good luck!

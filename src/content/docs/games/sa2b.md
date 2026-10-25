---
title: "Sonic Adventure 2: Battle (GameCube)"
description: Sonic Team's 2001 GameCube port of Sonic Adventure 2, the USA disc recorded here, where its data lives on the disc, and the community tools that read it.
games: [sa2b]
sources:
  - title: X-Hax SA Tools
    url: https://github.com/X-Hax/sa_tools
    note: formats, loaders and the SA2B (GameCube, USA) data mappings; no licence file
  - title: YAGCD
    url: https://hitmen.c02.at/files/yagcd/yagcd/
    note: GameCube disc header and file system table
  - title: Dolphin
    url: https://github.com/dolphin-emu/dolphin
    note: documents the disc header and FST
---

Sonic Adventure 2: Battle (Sonic Team, 2001) is the GameCube release of Sonic Adventure 2. It is built on SEGA's Ninja data formats ([SEGA Ninja (SA2)](/engines/ninja/)). :sourced[SA Tools]
The pages here record **only the GameCube USA disc image, game id `GSNE8P`**; the PC (Steam) release was not read. :observed

All observations come from one recorded census of that disc image. The census cannot be re-run now, so the counts are marked :observed with their scope and nothing for this game is
marked as proven. :observed

## Where the data lives

A GameCube disc: header at `0x000`, `main.dol` at `0x1E700`, the file system table at `0x1FD100` with 2,819 files in the root and one subdirectory, `event/`. :observed

| Files | Holds |
|---|---|
| `stgNND.rel`, `boss_*D.rel`, `ChaoStg*.prs` | the 79 stage data files: landtables (101), object lists, texture and light file names |
| `landtxNN.prs`, `bgtexNN.prs`, other `.prs` | PRS-compressed GVM texture archives |
| `setNNNN_s.bin` and the `_u`, `_2P`, `_HD` variants | object placement (225 files, 58,781 placements) |
| `stgNN_light.bin`, `stgNN_light_gc.bin`, `stgNN_fog*.bin` | light and fog (104 files) |
| `main.dol` | the executable, with the start and end position tables |

All :observed. Details: [The GameCube disc](/engines/ninja/archives/gamecube-disc/), [Stage modules](/engines/ninja/archives/stage-modules/).

## The stages

79 stage data files with landtables: story stages (`stg` plus two digits; `stg13` is City Escape), 2P stages, bosses and Chao World; all load. :observed Each is a Ninja landtable of COL entries
([Landtables and models](/engines/ninja/geometry/landtables-and-models/)), with its textures bound by name ([GVM textures](/engines/ninja/textures/gvm-textures/)), objects placed from SET files
([Object placement](/engines/ninja/world/set-files/)) and lights and fog in separate files ([Light and fog](/engines/ninja/lighting/light-and-fog/)). :observed

## What is special about this game

- **A stage is code and data in one module**: its landtables, object list and the names of its textures and light files are inside a relocatable REL. :observed
- **Textures are bound by name**, through a field and a list in the landtable; six landtables have no archive field and nine name archives that are not on the disc. :observed
- **Visible geometry and collision are separate COL entries**; the visible meshes never carry the `Solid` flag, and tall invisible barrier walls surround the paths. :observed
- **Winding is GX's**: front faces are clockwise. :observed
- **Named light and fog files need not exist** (City Escape names `stg13_fog.bin` and has none). :observed

:::open[How does the engine set up GX lighting and environment maps in a stage?]
The GX lighting channel setup, the environment-map texture matrix and the fog variant per area are engine state, not data (see the linked pages).
:::

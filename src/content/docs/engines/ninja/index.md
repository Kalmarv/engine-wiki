---
title: SEGA Ninja (SA2)
description: "The SEGA Ninja library's data as Sonic Adventure 2: Battle ships it on GameCube: file system, REL stage modules, landtables, Ginja models, GVM textures, SET placement and lighting files."
sources:
  - title: X-Hax SA Tools
    url: https://github.com/X-Hax/sa_tools
    note: formats, loaders and the SA2B data mappings (SAModel, SplitTools, ArchiveLib, TextureLib); no licence file
  - title: YAGCD
    url: https://hitmen.c02.at/files/yagcd/yagcd/
    note: GameCube disc header and file system table
---

Sonic Adventure 2 (Sonic Team, 2001) draws and collides its stages with data structured by **SEGA's Ninja library**: the tools that read it call the structures `NJS_OBJECT`, `NJS_TEXLIST`, `NJS_TEXNAME`
and `NJS_MATERIAL`, with Chunk and Basic models and (on GameCube) GX-state "Ginja" models. :sourced[SA Tools] This wiki records the GameCube release, *Sonic Adventure 2: Battle*, read from the USA disc
image (`GSNE8P`), not the PC version. :observed

The disc is a plain GameCube file system. A stage is a [REL module](/engines/ninja/archives/stage-modules/) that carries the stage's landtables, object list and strings; its picture is a
[PRS-compressed GVM archive](/engines/ninja/textures/gvm-textures/) named by the landtable; its geometry is a [landtable of COL entries](/engines/ninja/geometry/landtables-and-models/); its
objects are in separate [SET files](/engines/ninja/world/set-files/); its lights and fog are in [binary files](/engines/ninja/lighting/light-and-fog/) the module names. :observed

## How sure the pages are

The decoding is a recorded census of the whole USA disc (79 stage data files, 101 landtables, 27,919 COL entries, 225 SET files); the figures cannot be re-run now, so they are marked :observed with their
scope, and nothing here is marked as proven. The container and model formats come from the community tool SA Tools and are :sourced; what was measured on the disc beyond them is :observed. :observed

## What is known and what is not

| Area | State | Confidence |
|---|---|---|
| Disc layout and stage modules | complete for the USA disc | :observed |
| Landtables, COL entries and Ginja material words | every COL entry builds; lighting channel setup is engine code | :observed |
| Texture binding | a name rule consistent with 3,118 of 3,121 texlist entries; the game's own loader not read | :observed |
| SET placement | layout known; per-object meaning of rotation and parameters not decoded | :observed |
| Light and fog files | layouts known; which slot or fog applies is engine code | :sourced[SA Tools] |
| Object models, sky models, animation, Chao | not read | :unknown |

Games: [Sonic Adventure 2: Battle](/games/sa2b/).

:::open[Does the Dreamcast, PC or Steam release store its stages the same way?]
Only the GameCube USA disc was read. SA Tools covers the other releases with their own data mappings, but their layouts were not compared here.
:::

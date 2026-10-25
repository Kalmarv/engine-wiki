---
title: Stage modules (REL and PRS)
description: "How Sonic Adventure 2: Battle packs each stage as a relocatable REL module, the PRS compression, the load address, and what a census of the disc's 79 stage data files found."
sources:
  - title: X-Hax SA Tools
    url: https://github.com/X-Hax/sa_tools
    note: GameConfig "GC - SA2B (US).xml" and the GC_SA2B/*.ini data mappings give each module's file, load address and item offsets; SaCompGC, SplitTools DecompressREL and FixRELPointers load the module
---

The data of a stage lives in a **REL module** (`stgNND.rel` for stages, `boss_*D.rel` for bosses) and, for Chao World, a PRS-wrapped REL (`ChaoStg*.prs`). A module is both the
stage's code and its data: it holds the stage's landtables, its object list, and the names of the texture archives and light files it uses. :observed

Counts here are from a recorded census of the USA disc `GSNE8P`; they cannot be re-checked now. :observed

## Loading a module

SA Tools' game configuration lists each module's file, its load address (`key`, for example `C900000`) and the offsets of its items (landtables, object list). :sourced[SA Tools]
A module is loaded as: decompress with PRS where the file is flagged, then with SaCompGC (the GameCube REL compression), then relocate with the REL fixups (SplitTools'
`DecompressREL` and `FixRELPointers`). :sourced[SA Tools] After loading, pointers are absolute, and a file offset is `pointer − key`. :observed

**PRS** is a byte-oriented LZ77 compression used by the SEGA Ninja games on stage modules and on the GVM texture archives (`.prs`). :sourced[SA Tools]

## Census of the disc

Of the 79 stage data files with landtables (story stages, 2P stages, bosses and Chao World), all load: they hold 101 landtables and 27,919 COL entries, with 10,006 distinct
attaches, and building them gave 0 errors. :observed

- 17,597 visible COL entries use Ginja (GameCube) models, and 1,482 visible entries use Chunk models (the landtables with `format=SA2`). :observed
- 8,816 invisible COL entries use Basic (collision) models, plus 24 that use Ginja models. :observed

The model formats and the COL structure are on [Landtables and models](/engines/ninja/geometry/landtables-and-models/). The stage ids are `stg` plus two digits (`stg13` is City Escape),
the data file name adds `D`; a stage may have more than one landtable, named by suffix (`_uv`, `_poison`, `_light`, `_ani`, `_tani`, `_x`). :observed

## Strings of a module

A module carries its texture-archive names as strings (for example `landtx03` and `landtx03_suimen` in stg03's REL) and its light and fog file names (`stg13_light.bin`,
`stg13_fog.bin`, `stg24_fogA.bin` in `stg24D.rel`), including some that are not on the disc (`stg13_fog.bin`). :observed How the game binds them is on
[Textures](/engines/ninja/textures/gvm-textures/) and [Light and fog](/engines/ninja/lighting/light-and-fog/). The module also contains path records for the stage's routes
([Object placement](/engines/ninja/world/set-files/)). :observed

:::open[How does the game's own loader walk a module?]
Everything above follows SA Tools' loader; the game's code that binds a module's data was not read.
:::

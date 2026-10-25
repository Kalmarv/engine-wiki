---
title: Forza Horizon 6
description: Playground Games' 2026 open-world racer on ForzaTech, the Tokyo track Brio, where its data lives in the install, and the community tools that read it.
games: [fh6]
sources:
  - title: ForzaTools (Nenkai)
    url: https://github.com/Nenkai/ForzaTools
    note: Grub bundle and PlaygroundMiniZip readers for Forza Horizon 5
  - title: ForzaTech-extraction-tools (Doliman100)
    url: https://github.com/Doliman100/ForzaTech-extraction-tools
    note: modelbin extraction and FH5 constants
  - title: ForzaTechStudio (D3FEKT)
    url: https://github.com/D3FEKT/ForzaTechStudio
    note: platform zip methods 21 and 22
  - title: ForzaDesigner6
    url: https://github.com/tokyubevoxelverse/ForzaDesigner6
    note: livery layers and shape ids; MIT
  - title: forza-painter-fh6
    url: https://github.com/bvzrays/forza-painter-fh6
    note: livery research credited by ForzaDesigner6; MIT
  - title: Forza-Crypto-Tool (DVS-code)
    url: https://github.com/DVS-code
    note: decrypts FH6 data server-side; a decrypted data mirror exists, no key
---

Forza Horizon 6 (Playground Games, 2026) is an open-world driving game set in Japan, with the map centred on Tokyo. It runs on
[ForzaTech](/engines/forzatech/). The track is named `Brio` in the install. :observed

All observations on the FH6 pages come from one recorded census of a Steam install of the game, which is no longer
installed (about 158 GB), so the figures cannot be re-checked today. The counts are measurements over every file of the stated kind and are
marked :observed; no FH6 statement is marked as proven. :observed

## Where the data lives

```
<game folder>\media\
  Tracks\Brio\            GeoChunk0..3.minizip, ChunkMap*.dat, ChunkContentsMiniZip*.txt, bin.zip, Ribbon_00\, trackroutes\, triggerzones\
  Cars\                   one zip per car (682) and _library\ (materials, textures, shaders, wheels, tyres)
  Livery\, UI\, Stripped\ livery shapes, menu art and map tiles, string tables, the encrypted database
  ShadersDXIL.zip, Rendering.zip, Water.zip, ...   engine shaders and settings
  _library\TexturesPG\    shared engine textures
```

The layout is described on [PGZP archives](/engines/forzatech/archives/pgzp-minizip/); the cars on [Cars](/engines/forzatech/gameplay/carbin/).
:observed Player saves are in a platform game-save folder, not in the install ([Saves and tunes](/engines/forzatech/gameplay/saves-and-tunes/)). :observed

## The Tokyo track

The world is one very large map (22,035 m square on the pause map) whose Tokyo city lies in the south; the Shibuya scramble crossing is
around x −2,050..−850, z −5,390..−4,190. :observed It is stored as 512 m terrain cells and as placement cells of several sizes
([Coordinates and cells](/engines/forzatech/world/coordinates-and-cells/)). The map has four seasons, and the same data selects spring, summer,
autumn or winter content ([Seasons](/engines/forzatech/world/seasons/)). :observed

The data volume of the track is on [Data volume](/engines/forzatech/runtime/data-volume/): 113,868 models, 14.4 million placements, 169,351 textures,
the downtown core at 46 million triangles per 700 m box at LOD1. :observed

## Pages for this game

- Archives and keys: [PGZP archives](/engines/forzatech/archives/pgzp-minizip/), [Encrypted files](/engines/forzatech/archives/encrypted-files/).
- Data model: [Grub bundles](/engines/forzatech/data-model/grub-bundle/), [String tables](/engines/forzatech/data-model/string-tables/).
- Geometry: [Models](/engines/forzatech/geometry/modelbin/), [LODs and clusters](/engines/forzatech/geometry/lods-and-clusters/).
- World: [Placement files](/engines/forzatech/world/pgeo-placements/), [Template libraries](/engines/forzatech/world/plib-templates/),
  [Hand-placed instances](/engines/forzatech/world/pvs-ribbon/), [Coordinates and cells](/engines/forzatech/world/coordinates-and-cells/),
  [Seasons](/engines/forzatech/world/seasons/).
- Materials, shaders, textures: [Materials](/engines/forzatech/materials/materialbin/), [Shader containers](/engines/forzatech/shaders/shaderbin/),
  [Environment](/engines/forzatech/shaders/environment/), [Other world families](/engines/forzatech/shaders/world-families/),
  [Rocks and animated props](/engines/forzatech/shaders/rock-and-animated/), [Spline deform](/engines/forzatech/shaders/spline-deform/),
  [Swatch textures](/engines/forzatech/textures/pb-swatch/).
- Terrain, water, decals: [Terrain clusters](/engines/forzatech/terrain/heightfield-clusters/), [Far-field colour](/engines/forzatech/terrain/far-field-colour/),
  [Near-field ground](/engines/forzatech/terrain/near-field-megatexture/), [Water](/engines/forzatech/water/water/), [Decals](/engines/forzatech/effects/decals/).
- Cars: [Cars](/engines/forzatech/gameplay/carbin/), [Factory paints](/engines/forzatech/gameplay/car-paint/), [Wheels and tyres](/engines/forzatech/gameplay/car-wheels/),
  [Liveries](/engines/forzatech/gameplay/liveries/), [Saves and tunes](/engines/forzatech/gameplay/saves-and-tunes/), [Car materials](/engines/forzatech/shaders/car-materials/).
- Limits: [Values only the running game holds](/engines/forzatech/runtime/runtime-only-values/), [Data volume](/engines/forzatech/runtime/data-volume/).

## What is special about this game

- **FH6's mesh record (version 1.13) breaks the published FH5 readers.** The record has a material-group count, four season material ids
  per group, a 32-bit morph count and more fields than FH5's. :sourced[ForzaTools]
- **One track in four seasons.** Material ids, placement files, terrain clusters and parent materials all select by season
  ([Seasons](/engines/forzatech/world/seasons/)). :observed
- **Much of the look is computed at run time from data no file holds**: the near-field ground clipmap, decals' blend state, ambient-occlusion
  strength, wetness. ([Values only the running game holds](/engines/forzatech/runtime/runtime-only-values/)) :observed
- **The game database, settings and profile are encrypted** with Arxan TransformIT; no key is public. :observed
- **Placeholder textures ship in the data** (saturated flat images and default maps); a decoder that takes every texture at face value will show them
  ([Swatch textures](/engines/forzatech/textures/pb-swatch/)). :observed
- **Name-based guesses mislead.** Water, decal and road surfaces must be classed by shader family, never by material name; some names that suggest
  water or foliage are metal ([Materials](/engines/forzatech/materials/materialbin/)). :observed

:::open[Which build of the game do the observations come from?]
The census recorded the install's Tokyo track but not the game's build number. The install is gone and the figures cannot be matched to a
specific update.
:::

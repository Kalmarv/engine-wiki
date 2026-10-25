---
title: STUNTBOOST
description: "STUNTBOOST's MonoGame data: XNB files with glTF levels, QOI bake atlases, MGFX effects, derived collision and ledges, a node-name grammar, and the custom-map route."
games: [stuntboost]
sources:
  - title: StuntboostTools
    url: https://github.com/bytinggames/StuntboostTools
    note: the Blender exporter, add-ons and documentation, shipped in the install and on GitHub
  - title: MonoGame
    url: https://github.com/MonoGame/MonoGame
    note: the framework the game's fork is based on (3.8.1)
---

STUNTBOOST (Byting Games) is a fingerboard racer on .NET 8 and BytingGames' fork of [MonoGame](/engines/monogame/) 3.8.1 for
DesktopGL, with the BytingLib and BytingPipeline libraries (`SE.Pipeline` and `STUNTBOOST.dll` hold the game). The observations are
of Steam app 2999500, build 25832744. :observed{games="stuntboost"}

## Data in the install

`Content` holds 1,873 XNB files (4,953,823,117 bytes) in `Models`, `Textures`, `Effects`, `Fonts` and `Audio`, plus `Loca.loca`
for localization; `libraries/` has the managed assemblies and `StuntboostTools/` the level exporter
([XNB containers](/engines/monogame/archives/xnb-containers/)). :proven{games="stuntboost"} There are 56 levels in 159 parts
([levels](/engines/monogame/world/levels/)): glTF documents in XNB, their buffers, derived collision and shortcut files, and QOI
bake atlases ([textures](/engines/monogame/textures/xnb-textures/)). :proven{games="stuntboost"}

## What is special

- **Gameplay in node names**: `_` invisible, `<` solid, `#` trigger, and a code chain such as `#=Booster(speed)` or `=Spawn(start)`
  ([node names](/engines/monogame/gameplay/node-names/)). All 23,799 names parse identically under an independent reader and
  the game's own parser. :proven{games="stuntboost"}
- **Baked lighting.** A baked level is drawn unlit from its atlas, with dynamic shadows gated by a direct-light mask
  ([baked lighting](/engines/monogame/lighting/baked-lighting/)). :observed{games="stuntboost"}
- **Inverted-hull outlines** with a distance-dependent thickness ([outlines](/engines/monogame/effects/outlines/)).
  :observed{games="stuntboost"}
- **Derived collision**: 3,022,926 triangles and 293,944 grind ledges across the levels, with per-edge grippable bits and ramp ids
  ([collision](/engines/monogame/collision/collision-model/)). :proven{games="stuntboost"}
- **Effects** are MGFX version 12 with GLSL from MojoShader ([MGFX effects](/engines/monogame/shaders/mgfx-effects/)).
  :proven{games="stuntboost"}
- **Units.** Props are real-world centimetres, the board's deck is 0.967 units long; a unit is about 0.83 m if the board is a
  0.80 m deck ([levels](/engines/monogame/world/levels/#units)). :observed{games="stuntboost"}
- **Transparent nodes** and their alpha rule ([level materials](/engines/monogame/materials/level-materials/)).
  :observed{games="stuntboost"}

## Community and custom maps

Custom levels are made with the Blender exporter in `StuntboostTools` and loaded from `custom_maps` in the save folder
([custom maps](/engines/monogame/mod-loading/custom-maps/)). :sourced[StuntboostTools] The game's dotnet content tool is `bytinggames-dotnet-mgcb` 3.8.1.49 (`mgcb-byting`).
:observed{games="stuntboost"}

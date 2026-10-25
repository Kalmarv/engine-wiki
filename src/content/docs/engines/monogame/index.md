---
title: MonoGame / XNA
description: "The XNA 4.0 content format (XNB) as MonoGame and FNA games ship it, and STUNTBOOST, whose levels are XNB-wrapped glTF."
sources:
  - title: MonoGame
    url: https://github.com/MonoGame/MonoGame
    note: the framework, content pipeline and the XNB and MGFX formats
  - title: FNA
    url: https://github.com/FNA-XNA/FNA
    note: reads the same XNA 4.0 content files
  - title: StuntboostTools
    url: https://github.com/bytinggames/StuntboostTools
    note: the Blender exporter and documentation for STUNTBOOST's levels
---

MonoGame is an open-source reimplementation of Microsoft's XNA 4.0 framework; FNA is another. Their games build content
(textures, models, effects, fonts) offline into **XNB** files, and the game's `ContentManager` loads each with a *type reader*
named in the file ([XNB containers](/engines/monogame/archives/xnb-containers/)). The one game documented here is
**STUNTBOOST** (Byting Games, a fingerboard racer), a .NET 8 game on BytingGames' fork of MonoGame 3.8.1 for DesktopGL, with
BytingLib and BytingPipeline libraries. :observed{games="stuntboost"}

## What the format gives and what the game adds

| Layer | What | Page | Confidence |
|---|---|---|---|
| container | XNB version 5, uncompressed, with a table of type readers | [XNB containers](/engines/monogame/archives/xnb-containers/) | :proven{games="stuntboost"} |
| built-in content | `Texture2D` as a raw 8-bit surface, strings, byte arrays, sprite fonts | [textures](/engines/monogame/textures/xnb-textures/) | :proven{games="stuntboost"} |
| effects | MGFX version 12, OpenGL profile: GLSL written by MojoShader | [MGFX effects](/engines/monogame/shaders/mgfx-effects/) | :proven{games="stuntboost"} |
| game readers | a glTF reader, a QOI image reader, a collision reader, shortcut and animation readers | [levels](/engines/monogame/world/levels/) | :proven{games="stuntboost"} |
| game rules | node names that carry gameplay, baked lighting, outlines | [node names](/engines/monogame/gameplay/node-names/), [baked lighting](/engines/monogame/lighting/baked-lighting/), [outlines](/engines/monogame/effects/outlines/) | :observed{games="stuntboost"} |
| derived data | collision triangles, ledges and shortcuts, written by the content pipeline | [collision](/engines/monogame/collision/collision-model/) | :proven{games="stuntboost"} |
| custom content | player-made maps loaded from the save folder | [custom maps](/engines/monogame/mod-loading/custom-maps/) | :sourced[StuntboostTools] |

## Verification

The collision files, node names and ledges of STUNTBOOST's 159 level parts were checked against the game's own code: a harness
runs the game's parsers (`SE.Pipeline.ParsedName`, `SE.CollisionModel.Load`) over every part and compares what they return with
what an independent reading of the files gives. All 23,799 node names, all 3,022,926 collision triangles and all 293,944
ledges agree. :proven{games="stuntboost"} Every XNB file of the install parses by the container rules, and every effect parses
to its last byte. :proven{games="stuntboost"}

## Traps

- A reader needs the game's own readers to be named: the container only hands over bytes (`GLTFReader` and `QoiReader` are not
  MonoGame types). :proven{games="stuntboost"}
- The MGFX version differs between forks: upstream releases write 10 and 11; STUNTBOOST's fork writes 12. :observed{games="stuntboost"}
- Texture sampling is nearest in the levels; a consumer that filters linearly changes the look. :observed{games="stuntboost"}
- The collision file stores grippable-edge bits only for solid triangles; the game's loader reports zeros for triggers.
  :proven{games="stuntboost"}

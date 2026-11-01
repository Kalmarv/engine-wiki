---
title: TrackMania Nations Forever
description: "Nadeo's 2008 racing game on its GameBox engine: what the wiki records of its install and map files and where the evidence comes from."
games: [tmnf]
sources:
  - title: GBX.NET
    url: https://github.com/BigBang1112/gbx-net
    note: the reference GBX reader (version 2.5.0)
---

TrackMania Nations Forever (Nadeo, 2008) is a racing game built on Nadeo's [GameBox engine](/engines/gamebox/). Its tracks are
map files in the engine's GBX format. :sourced[GBX.NET]

The facts recorded for it come from the Steam install (`Nadeo.ini` version 2.11.16): the 2,572 GBX files of its packs and its
65 campaign maps, read with a strict reader and compared with the reference reader GBX.NET; and from map files downloaded from
TrackMania Exchange (the 100 most downloaded of all time, the 100 most downloaded of 2026 and the 100 newest). Some of those maps were made with
TMUnlimiter, a community extension, and carry data the stock game does not write. :observed

| Topic | Page |
|---|---|
| Node references, nodes stored in place, collector idents | [Nodes, references and collector idents](/engines/gamebox/data-model/nodes/) |
| The world frame, the block grid and block placement | [Map blocks and block models](/engines/gamebox/world/blocks/) |
| TMUnlimiter's extension chunks | [TMUnlimiter map data](/engines/gamebox/world/tmunlimiter/) |
| Solids, visuals and vertex layouts | [Solids, trees and visuals](/engines/gamebox/geometry/visuals/) |
| Materials, shaders, bitmaps and images | [Materials, shaders and bitmaps](/engines/gamebox/materials/materials/) |
| Lights, decorations and moods | [Lights, decorations and moods](/engines/gamebox/lighting/lights-and-moods/) |
| Collision surfaces | [Collision surfaces](/engines/gamebox/collision/surfaces/) |
| MediaTracker triangle blocks and key functions | [MediaTracker triangles and key functions](/engines/gamebox/animation/mediatracker/) |
| Recorded runs | [Ghosts](/engines/gamebox/gameplay/ghosts/) |

Of the all-time top 100 maps, 93 read completely and 7 in part, TMUnlimiter maps with blocks or items outside the stock game;
the maps that fail embed TMUnlimiter's AngelScript bytecode. All 65 campaign maps read with a model for every block.
:observed[the 300 downloaded maps and the campaign]

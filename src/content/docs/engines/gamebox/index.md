---
title: GameBox (Nadeo)
description: "Nadeo's engine as TrackMania Nations Forever ships it: GBX files made of nodes of numbered classes, each read as a run of numbered chunks."
sources:
  - title: GBX.NET
    url: https://github.com/BigBang1112/gbx-net
    note: the reference GBX reader (version 2.5.0); its class and chunk tables and generated readers
---

Nadeo's games keep their data in GBX files. A file holds nodes, each an object of a class named by a 32-bit class ID, and a
node is read as a run of chunks whose IDs are the class ID with a chunk number in the low bits; a class also reads the chunks
of the classes it derives from. :sourced[GBX.NET] The wiki records one game on it, [TrackMania Nations Forever](/games/tmnf/),
from its install's packs and its maps.

A map is a grid of blocks, each naming a block model by its collector ident; a model is a solid, a tree of visuals, collision
surfaces and lights, drawn with materials that name template shaders; the map's decoration leads to a mood that sets the
latitude and the day. :observed[the install's packs and the 65 campaign maps]

| System | Page |
|---|---|
| Data model | [Nodes, references and collector idents](/engines/gamebox/data-model/nodes/) |
| World | [Map blocks and block models](/engines/gamebox/world/blocks/), [TMUnlimiter map data](/engines/gamebox/world/tmunlimiter/) |
| Geometry | [Solids, trees and visuals](/engines/gamebox/geometry/visuals/) |
| Materials | [Materials, shaders and bitmaps](/engines/gamebox/materials/materials/) |
| Lighting | [Lights, decorations and moods](/engines/gamebox/lighting/lights-and-moods/) |
| Collision | [Collision surfaces](/engines/gamebox/collision/surfaces/) |
| Animation | [MediaTracker triangles and key functions](/engines/gamebox/animation/mediatracker/) |
| Gameplay | [Ghosts](/engines/gamebox/gameplay/ghosts/) |

:::open[What else does a map file hold?]
The GBX header and body layout, the reference table's own layout and the map's other chunks are not described here yet.
:::

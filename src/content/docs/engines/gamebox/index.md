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
from its map files.

So far only a few classes are written down here, all of them keyed data of maps:
[MediaTracker triangles and key functions](/engines/gamebox/animation/mediatracker/).

:::open[What else does a map file hold?]
The GBX header and body, reference tables, the block list and the map's other chunks are not described here yet.
:::

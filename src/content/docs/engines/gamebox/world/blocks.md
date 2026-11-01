---
title: Map blocks and block models
description: "How a Stadium map places its blocks: the world frame, the block grid, a block's direction, coordinate and flags, how the flags choose the model's mobils, and the block models' units and mobil lists."
games: [tmnf]
sources:
  - title: GBX.NET
    url: https://github.com/BigBang1112/gbx-net
    note: version 2.5.0; the block data chunk, Id.GetBlockSize and the block-info classes
---

A map is a list of blocks on a grid of squares. Each block names a block model, the square it stands on, which way it
faces and a word of flags; the flags pick which of the model's prepared shapes is drawn, so the map stores the road's
connection shape and the game needs no neighbour logic to draw it. :observed[the 65 campaign maps, every block placed]

## The world frame

Positions are metres in a right-handed frame with +Y up, the grid along X and Z, stored as they are with no axis negated.
Read as left-handed (Z negated), the world is mirrored: the start banner's lettering reads backwards; read as stored it reads
the right way. Triangles wind counter-clockwise seen from the front in this frame. :observed[renders of campaign map A01]

## The grid

The square size comes from the collection's zones (`CollectionZones`): Stadium's squares are 32 m wide and 8 m high.
:observed[the Stadium collection] GBX.NET's block size for Stadium is the same, 32 × 8 × 32. :sourced[GBX.NET]

A block model is built in a block-local frame that spans 0 to 32 m in X and Z per square, with the Stadium grass ground at
local height 1.0; ground blocks stand at map height 1. :observed[the stock and downloaded maps]

## A block

| Field | Meaning | Confidence |
|---|---|---|
| Name | The block model's [collector ident](/engines/gamebox/data-model/nodes/#collector-idents) | :observed[the 65 campaign maps] |
| Direction | 0 to 3, quarter turns about +Y; each step takes +X to +Z, so (x, y, z) becomes (−z, y, x) | :observed |
| Coordinate | The square of the turned footprint's least corner; block data version 6 and later store the coordinate plus (1, 0, 1) | :observed |
| Flags | Below | :observed |

The sense of the turn is measured on road: over the stock maps and the 2026 and all-time top downloads, the open sides of
neighbouring `StadiumRoadMain` blocks meet 4,400 times with 11 mismatches when a step takes +X to +Z, against 2,578 and 765 the
other way. :observed[the stock maps and 200 downloaded maps] With the least corner of the turned footprint at the coordinate,
300 squares of the stock maps are claimed twice, mostly the dirt-hill terrain under the dirt-hill road blocks; with the
model's first unit as the pivot, 1,682 are. :observed[the stock maps] The turned footprint's least corner is at the
coordinate times (32, 8, 32) m. :observed[the 65 campaign maps]

### Flags

| Bits | Meaning | Confidence |
|---|---|---|
| 0–5 | Variant: the outer index of the model's mobil lists | :observed |
| 6–11 | Sub-variant: the inner index | :observed |
| 12 | Ground: use the model's ground mobils; otherwise its air mobils | :observed |
| 13 | Clip: the sub-variant is always 63 | :observed |
| 14 | Pillar: the pillar is a block stored in the map; the game generates none | :observed |

Over the 65 campaign maps every block resolves this way; a block whose list is empty draws nothing. :observed[the 65
campaign maps] A clip shows the first mobil of its variant's list; this is reasoned from Stadium's clip models, which have one mobil per
ground list and empty air lists. :inferred

`StadiumRoadMain`'s variants 0 to 5 are Base, Deadend, Corner, Straight, TShaped and Cross; the ground Straight has four
sub-variants (Straight, A, B and C). :observed[the Stadium block model]

### Ground and empty squares

A ground block draws the terrain of only the squares of its units at relative height 0 (a unit's offset y of 0), not of its
whole footprint: a bridge arch stands on 2 of the 6 squares it spans, and the others show the zone's grass. Filling the whole
footprint leaves visible holes in the grass. :observed[campaign map A01] A square of the map area that no ground block covers
shows the collection's default zone's flat block (`StadiumGrass`, the first block info of `ZoneFlat`) at height 0.
:observed[the 65 campaign maps]

### Start blocks

A spawn faces its local +Z. Of the 25 campaign start blocks (way point 0 or 4) with road on one side only, 23 have it ahead
along local +Z; 36 have road on both sides and 4 on neither. :observed[the start blocks of the 65 campaign maps]

## Block models

The block-info files (`CGameCtnBlockInfoClassic`, `Flat`, `RectAsym`, `Road`, `Clip`, `Frontier` and `Pylon`) keep their units
and mobils in the legacy chunk `0x0304E005`, never in `0x0304E01D` or `0x0304E01E`. :proven[every block-info file of the
install's packs]

| Order | Field | Type | Confidence |
|---|---|---|---|
| 1 | Name | ident | :observed |
| 2 | Size | three `i32` | :observed |
| 3 | Is pillar | bool | :observed |
| 4 | Selection | `i32` | :unknown |
| 5 | Unknown | `i32` | :unknown |
| 6 | Pillar | node reference | :observed |
| 7 | Ground units | counted node references | :observed |
| 8 | Air units | counted node references | :observed |
| 9 | Ground mobils | counted lists of counted node references | :observed |
| 10 | Air mobils | counted lists of counted node references | :observed |
| 11 | Unknown | `u8` | :unknown |
| 12 | Unknown | `i32` | :unknown |
| 13 | Unknown | two `i16` | :unknown |

The layout reads every block-info file of the packs to its end. :proven[every block-info file of the install's packs] A real
block has no ground units: all its units are in the air list. The mobils are one list per variant, holding the variant's
sub-variants, not one list per unit. :observed[every block-info file of the install's packs]

A unit (`CGameCtnBlockUnitInfo`, `0x03036000`) holds its offset within the block, four clips and a surface ID.
:observed[every block-info file of the install's packs]

A mobil's solid places its parts through `CPlugTree` locations; see [solids and visuals](/engines/gamebox/geometry/visuals/).

## The map's thumbnail

The thumbnail of header chunk `0x03043007` is a JPEG stored bottom row first. :observed[campaign map A01]

:::open[What do the block-info fields 4, 5 and 11 to 13 mean?]
They are read and accounted for, but nothing yet ties them to the game's behaviour.
:::

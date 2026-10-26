---
title: Map areas and parent tiles
description: Sekiro area names and Elden Ring's nested open-world tile coordinates.
implementations:
  - name: primase Elden Ring rules
    url: https://github.com/Kalmarv/primase/blob/main/worlds/fromsoft/src/elden/mod.rs
---

Maps have names such as `m11_01_00_00`; layout files live at `map/mapstudio/<map>.msb.dcx`, with resources under
`map/<map>/`. :observed

## Sekiro

### Map areas

| Sekiro map prefix | Area | PlaceName ID | Confidence |
|---|---|---|---|
| `m11_00` | Ashina Outskirts | 1100 | :observed{games="sekiro"} |
| `m11_01` | Ashina Castle | 1110 | :observed{games="sekiro"} |
| `m11_02` | Ashina Reservoir | 1120 | :observed{games="sekiro"} |
| `m13_00` | Abandoned Dungeon | 1300 | :observed{games="sekiro"} |

These names are matched through collision map-name IDs and location-message entries. :observed{games="sekiro"}

### Map contents

| Map | Map pieces | Objects | Enemies | Collision parts | Confidence |
|---|---:|---:|---:|---:|---|
| `m11_00` Outskirts | 4,498 | 1,509 | 144 | 166 | :observed{games="sekiro"} |
| `m11_01` Castle | 3,636 | 1,674 | 284 | 221 | :observed{games="sekiro"} |
| `m11_02` Reservoir | 1,689 | 801 | 64 | 72 | :observed{games="sekiro"} |
| `m13_00` Dungeon | 1,812 | 277 | 58 | 46 | :observed{games="sekiro"} |

Ashina Castle's layout also has 10 dummy objects, 298 connecting-collision parts and 11 player parts, with 1,192
regions and 311 events. :observed{games="sekiro"} Its map pieces place 569 FLVER models: 23,389,107 triangles at the finest
LOD, 22,843,568 without the `m9` far-backdrop models. Its objects (223 models) place 6,700,935 triangles and its
world collision has 1,671,788. The playable collision footprint is 478 × 425 m, and the castle references 989
distinct textures, 1,052 with the far models. :observed{games="sekiro"} The Outskirts place 38,629,495 map-piece triangles,
the Reservoir 16,258,177 and the Dungeon 8,430,632. :observed{games="sekiro"}

Each map-piece binder holds the drawn FLVER and an `_S` FLVER, a shadow-caster stand-in whose meshes use
`M[Shadow]`; in the castle 963 meshes use it, and the placed `_S` models total 9.41 million triangles. The far view
is drawn by `m9` models listed in `farmodel.param`, and 284 of the castle's FLVERs are not placed by its own layout.
:observed{games="sekiro"} By model ID, `m0` models are detail, `m1`–`m5` large unique pieces, `m6` and `m7` mountainside out
of reach, and `m9` the far backdrop. :inferred{games="sekiro"}

## Elden Ring

### Map areas

| Elden Ring map | Area | Confidence |
|---|---|---|
| `m11_00_00_00` | Leyndell, Royal Capital | :sourced[Smithbox]{games="elden-ring"} |
| `m14_00_00_00` | Academy of Raya Lucaria | :sourced[Smithbox]{games="elden-ring"} |
| `m60_39_54_00` | Shaded Castle, an Altus Plateau tile | :sourced[Smithbox]{games="elden-ring"} |

### Open-world grid

:only[elden-ring] `m60` and `m61` use 256 m level-0 tiles. A tile `mAA_XX_ZZ_00` has parents at levels 1 and 2,
with indices `(XX >> L, ZZ >> L)` and side lengths 512 m and 1,024 m. Larger assets belonging to a small tile can
be placed in a parent layout, with names prefixed by the small tile's name. :observed{games="elden-ring"}

The small tile centre's coordinate in a level-`L` parent's frame, independently for X and Z, is
`(i - (p << L)) × 256 + 128 - (256 << L)/2`, where `i` is the small index and `p = i >> L`.
:observed{games="elden-ring"}

For `m60_39_54_00`, the level-1 parent is `m60_19_27_01`, with centre offset `(128,-128)` m in X/Z. The level-2
parent is `m60_09_13_02`, with offset `(384,128)` m. :observed{games="elden-ring"}

Parent tiles need not contain collision: `m60_22_22_01` has three map pieces, no collision part and no corresponding
high-resolution map collision binder. :observed{games="elden-ring"}

Leyndell's own layout `m11_00_00_00` places 133.2 million triangles from 29.8 million distinct ones. :observed{games="elden-ring"}
Of the open-world tiles around it (X 42–45, Z 50–53), `m60_44_50_00` places nothing. :observed{games="elden-ring"}

:::open[When does each tile become resident or visible?]
Nested layout coordinates establish placement relationships. They do not establish streaming radii, hysteresis,
parent-child draw overlap or the runtime residency budget.
:::

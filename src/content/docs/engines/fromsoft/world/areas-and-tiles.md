---
title: Map areas and parent tiles
description: Sekiro area names and Elden Ring's nested open-world tile coordinates.
implementations:
  - name: fromsoft-formats Elden Ring rules
    url: https://github.com/Kalmarv/fromsoft-formats/blob/main/src/elden.rs
---

Maps have names such as `m11_01_00_00`; layout files live at `map/mapstudio/<map>.msb.dcx`, with resources under
`map/<map>/`. :observed

The Sekiro install holds 10 layouts: `m10_00`, `m11_00`, `m11_01`, `m11_02`, `m13_00`, `m15_00`, `m17_00`, `m20_00`,
`m25_00` and the overlay `m89_00_00_99`. :proven{games="sekiro"} The Elden Ring install (the base game; the expansion's
archive is not installed) holds 935 layouts, in areas 10 to 16, 18, 19, 30, 31, 32, 34, 35, 39, 45 and 60, with 829 of
them in area 60 and none in areas 50 to 59 or 62 to 89 (the dictionary of archive paths names no layout that the
archives lack). :proven{games="elden-ring"}

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

Every one of the 581 `_00` tiles has both its `_01` and its `_02` parent in the install, and the `_01` and `_02` tiles
host the prefixed parts: 22,800 parts named `<_00 tile>-<part>` in `_01` tiles and 48,757 in `_02` tiles, each prefix
naming a tile of the install. :proven{games="elden-ring"}

### Alternate tiles

Besides the 581 `_00`, 153 `_01` and 48 `_02` tiles, `m60` holds 46 tiles whose last block is 10, 11 or 12: 32 `_10`,
10 `_11` and 4 `_12`. :proven{games="elden-ring"} Each is a second version of the tile at the same coordinates and level
(`m60_44_36_10` beside `m60_44_36_00`): all 46 have that base-numbered tile in the install, 30 of the 32 `_10` tiles
hold as many parts as theirs, and 31 share at least half of its part names. :observed{games="elden-ring"} The `_10`
tiles lie at X 44 to 47 with Z 36 to 39 and Z 52 to 55 (all 32 positions of those two squares); the `_11` and `_12`
tiles are their parents. :proven{games="elden-ring"}

The tens digit survives the nesting: the parents of `mAA_XX_ZZ_10` are `mAA_{XX>>1}_{ZZ>>1}_11` and
`mAA_{XX>>2}_{ZZ>>2}_12`, with the same offset formula as above. All 32 `_10` tiles have both parents in the install, and
all 10 `_11` tiles have their `_12` parent. :proven{games="elden-ring"} The `_11` and `_12` layouts name their small tiles'
far assets by prefix just as `_01` and `_02` do: 1,190 and 2,388 parts carry the prefix of an existing `_10` tile, and
85 more carry the prefix of `m60_42_40_10` or `m60_47_42_10`, two `_10` tiles that the install does not hold.
:proven{games="elden-ring"} A reader that looks for parents only from tiles ending in `_00` finds none for the 32
`_10` tiles. 28 of the 32 `_10` tiles have an EMEVD script of their own, none of the 14 `_11` and `_12` tiles has one,
and neither has any `_01` or `_02` tile; 342 of the 581 `_00` tiles do. :proven{games="elden-ring"}

### Overlay layouts ending in `_99`

One Sekiro layout (`m89_00_00_99`) and 25 Elden Ring layouts end in `_99`: the `_99` layout of each of `m10_00`,
`m10_01`, `m11_00`, `m11_05`, `m11_10`, `m11_71`, `m12_01`, `m12_02`, `m12_03`, `m13_00`, `m14_00`, `m15_00`, `m16_00`,
`m19_00`, `m34_10` to `m34_15`, `m39_20`, `m45_00` to `m45_02` and `m60_00`. None has an EMEVD script. :proven They hold
models and parts and no events; regions occur only in `m60_00_00_99` (977). Their parts are map pieces and assets
(Elden Ring: 239 map pieces and 9,849 assets; Sekiro: 27 map pieces, one object and one player start), with no
enemy, collision or connecting-collision parts, and every entity ID that `m10_00_00_99` gives is 0. :proven They reach
far beyond the map they accompany: `m10_00_00_99` places 1,998 parts over x −2,547 to 5,253 m and z −2,150 to
5,274 m, where `m10_00_00_00` spans x −587 to 38 m and z −88 to 498 m. :observed{games="elden-ring"} Smithbox treats
`m60_00_00_99` as a sky map drawn at the base map's origin. :sourced[Smithbox]{games="elden-ring"} That the game draws
these layouts as a far-scenery overlay, and from where, is not established by the files. :inferred

The running game (1.17.2, offline) loads the `_99` layout together with its base map. A scan of its committed memory
after the player respawned at the Stormveil main gate found the names `m10_00_00_99.msb` and
`m10_00_00_99_NNNNNN.mapbnd` for 25 of the 46 map-piece models that the layout's MSB lists (the same scan finds 94 of
the 309 map-piece models of `m10_00_00_00`; every name found is a model of its MSB), and names of `.flver` members of
three of those bundles, so their contents were read. None of the other 24 `_99` layouts is named, and a scan at the
title screen finds no `_99` name. :observed{games="elden-ring"} The same scan finds the base map's and the `_99`
layout's names in the same forms, and the names of `m34_10_00_00` and `m34_10_00_99` as well. :observed{games="elden-ring"}
Whether the loaded pieces are drawn, and where they sit relative to the base map's origin, was not observed.
:unknown{games="elden-ring"}

### Map words

A map name's four numbers are stored in layouts and scripts in two byte orders, in addition to the name itself:

| Where | Bytes in file order | Little-endian u32 | Covered |
|---|---|---|---|
| Part tile-load configuration (`+152` slot), region and event extra block (Elden Ring) | `DD`, `Z`, `X`, area | area in the top byte | 77,026 + 625 + 131 words, every one that is not `0xffffffff` |
| Connecting-collision type data (4 bytes after a part index) | area, `X`, `Z`, `DD` | area in the low byte | all 800 connecting collisions |
| EMEVD instruction arguments that name a map | area, `X`, `Z`, `DD` | area in the low byte | see [EMEVD](/engines/fromsoft/gameplay/emevd/#map-ids-in-arguments) |

Read with the area in the top byte, 76,935 of the 77,026 tile-load words, all 625 region words and all 131 event words
name a map of the install; the other 91 tile-load words name `m60_42_40_10` and `m60_47_42_10`, the two alternate tiles
the install does not hold. Read with the area in the low byte, none of the 77,782 words names a map. :proven{games="elden-ring"} In
these words the last number of an alternate tile is stored as the byte `0x10` (16) for `_10`: the byte is 0 in 73,917 of
the words and 0x10 in the other 3,865. :proven{games="elden-ring"}

A connecting collision's last byte is `0xff` in 749 of the 800 (any variant and level of that tile), 0 in 50 and 1 in
one. 795 of the 800 name a tile family or map of the install, none names the map that holds it, and the other five
(`22 10 00 ff` in four tiles and `20 00 00 01` in one) name no map of the install. :proven{games="elden-ring"}

Parent tiles need not contain collision: `m60_22_22_01` has three map pieces, no collision part and no corresponding
high-resolution map collision binder. :observed{games="elden-ring"}

Leyndell's own layout `m11_00_00_00` places 133.2 million triangles from 29.8 million distinct ones. :observed{games="elden-ring"}
Of the open-world tiles around it (X 42–45, Z 50–53), `m60_44_50_00` places nothing. :observed{games="elden-ring"}

:::open[When does each tile become resident or visible?]
Nested layout coordinates establish placement relationships. They do not establish streaming radii, hysteresis,
parent-child draw overlap or the runtime residency budget.
:::

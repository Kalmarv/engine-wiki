---
title: Map areas and parent tiles
description: Sekiro area names, Elden Ring's nested open-world tile coordinates and the places of its legacy maps among the tiles.
sources:
  - title: Smithbox
    url: https://github.com/vawser/Smithbox
    note: "MapConnections_ER: the placement rules for legacy maps from WorldMapLegacyConvParam and the hand-placed cases"
  - title: soulstruct-blender
    url: https://github.com/Grimrukh/soulstruct-blender
    note: A table of legacy maps' places in the overworld, compared against here
implementations:
  - name: fromsoft-formats Elden Ring rules
    url: https://github.com/Kalmarv/fromsoft-formats/blob/main/src/elden.rs
  - name: fromsoft-formats legacy-map placement
    url: https://github.com/Kalmarv/fromsoft-formats/blob/main/src/overworld.rs
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

A tile's own frame has its origin at the tile's centre. Of the 133,099 assets that the 262 `_00` tiles with at least five
assets of their own place, 129,174 (97.05 %) lie within 128 m of the origin in X and Z, against 26.0 % inside the square
from (0, 0) to (256, 256). :observed{games="elden-ring"} The ground collision of a full tile spans -128 to 128 m in X and Z.
:observed{games="elden-ring"} Taking the centre of tile `m60_X_Z_00` as (256 X, 256 Z) in one frame for the area, a tile of
level L is at the centre of the 2^L by 2^L small tiles it covers, which is the parent formula above;
the `m60` and `m61` grids are separate frames. :inferred{games="elden-ring"}

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
`m60_00_00_99` as a sky map drawn at the base map's origin. :sourced[Smithbox]{games="elden-ring"} The sky map's own
map pieces are named `mCCXXZZ_9900` and 83 of its 86 sit at ((XX - 10) x 1,024, 0, (ZZ - 8) x 1,024) m to within 8 m, so
its origin is the centre of the level-2 tile `m60_10_08_02`, the point (10,624, 8,576) in the area's frame. :observed{games="elden-ring"}
The other three, of class 92, sit at places of legacy maps: `m920811` exactly at the Academy of Raya Lucaria's place
(below; 0.000 m), `m921112` 0.016 m from Leyndell's, `m920912` 7 m from `m39_20_00_00`'s. :observed{games="elden-ring"} That the game
draws these layouts as a far-scenery overlay, and from where, is not established by the files. :inferred

The running game (1.17.2, offline) loads the `_99` layout together with its base map. A scan of its committed memory
after the player respawned at the Stormveil main gate found the names `m10_00_00_99.msb` and
`m10_00_00_99_NNNNNN.mapbnd` for 25 of the 46 map-piece models that the layout's MSB lists (the same scan finds 94 of
the 309 map-piece models of `m10_00_00_00`; every name found is a model of its MSB), and names of `.flver` members of
three of those bundles, so their contents were read. None of the other 24 `_99` layouts is named, and a scan at the
title screen finds no `_99` name. :observed{games="elden-ring"} The same scan finds the base map's and the `_99`
layout's names in the same forms, and the names of `m34_10_00_00` and `m34_10_00_99` as well. :observed{games="elden-ring"}
With the `m10_00_00_99` layout's 1,998 parts moved 300 m up in a test run (the base layout's parts hidden so that the view is
open), the scaffolded house and the grass cliff on one side of the spawn view disappear, and the structures on the other
side stay. So parts of the `_99` layout are drawn, at the positions the layout stores, in the base map's coordinate frame.
:observed{games="elden-ring"} Which of its 28 map pieces and 1,970 assets are the house and the cliff, whether every part
draws, and what the remaining structures belong to, was not established. :unknown{games="elden-ring"}

### Map words

A map name's four numbers are stored in layouts and scripts in two byte orders and, in one Elden Ring instruction, as one decimal number, in addition to the name itself:

| Where | Bytes in file order | Little-endian u32 | Covered |
|---|---|---|---|
| Part tile-load configuration (`+152` slot), region and event extra block (Elden Ring) | `DD`, `Z`, `X`, area | area in the top byte | 77,026 + 625 + 131 words, every one that is not `0xffffffff` |
| Connecting-collision type data (4 bytes after a part index) | area, `X`, `Z`, `DD` | area in the low byte | all 800 connecting collisions |
| EMEVD instruction arguments that name a map | area, `X`, `Z`, `DD` | area in the low byte | see [EMEVD](/engines/fromsoft/gameplay/emevd/#map-ids-in-arguments) |
| Elden Ring's `Map ID` argument of `2002:11` to `2002:13` | one decimal number `AABBCCDD` (`11050000` is `m11_05_00_00`) | not a byte order | 64 of 65 literal values name a map of the install; see [EMEVD](/engines/fromsoft/gameplay/emevd/#map-ids-in-arguments) |

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

### Legacy maps in the overworld

:only[elden-ring] A legacy map is any map that is not an `m60` or `m61` tile: the dungeons (`m10` to `m16`, `m18`, `m19`),
the catacombs, caves and tunnels (`m30` to `m32`), the divine towers and the sewers (`m34`, `m35`), `m39_20` and the
colosseums (`m45`). Each is authored in a frame of its own. The rows of `WorldMapLegacyConvParam` (see
[PARAM tables](/engines/fromsoft/data-model/params/#worldmaplegacyconvparam)) say that a reference point of the map is a
point of an overworld tile or of another legacy map, and carry no rotation, so a map's origin lies at
`destination point - source point` in the destination tile's frame. :observed{games="elden-ring"}

The param holds 196 rows from regulation 1.12.1 on and 146 in the 16 releases from 1.00.0 to 1.10; the rows read in one layout
in all 29 regulations examined. :observed{games="elden-ring"} The 196 rows of the installed regulation place 95 legacy maps by
the rules below, and five more are placed by hand. :observed{games="elden-ring"}

1. A row between two legacy maps whose two reference points are the same numbers makes them share an origin. There are 16
   such rows. They join Leyndell `m11_00` with `m11_05`, `m19_00`, `m34_14` and `m35_00`; `m10_00` with `m34_10`; `m12_02`
   with `m12_07`, `m12_08` and `m12_09`; `m21_00` with `m21_01` and `m21_02`; and `m37_00` with `m37_01` and `m37_02`.
2. The first row in file order that has the base-point flag and a tile as its destination places its source, and every map
   that shares the source's origin, in that tile. 89 of the 98 source maps have such a row.
3. A row whose destination is another legacy map places that map from its source's place:
   `origin(destination) = origin(source) + source point - destination point`. The rows are swept in file order until none
   places a map; one sweep suffices.
4. `m13_00_00_00` (Crumbling Farum Azula) takes only its rows to `m60_51_43_00` and `m15_00_00_00` (Miquella's Haligtree)
   only its rows to `m60_48_57_00`. Farum Azula has a base row to `m60_54_53_00` too, 1,892 m from the first, and the
   layout of that tile holds a connection region to the map that its name gives as for the cutscene background-read
   settings, with the origin as the reference point on both sides. Neither map has a connecting collision, so the choice
   has no collision to be tested against. :observed{games="elden-ring"}

By these rules 83 maps are placed by a base row of their own, 10 by sharing an origin, 2 by chaining and 5 by hand: 100 maps.
79 are in the base game's install; the others are 19 Shadow of the Erdtree maps, `m34_16_00_00` and the sky map
`m60_00_00_00`. :observed{games="elden-ring"} 15 maps that rows name have no place, because their rows end in area 70 or
between areas 37, 38 and 39, and none is in the install: `m37_00` to `m37_03`, `m38_10` to `m38_12`, `m39_00` and seven
`m70` tiles. :observed{games="elden-ring"} All 25 `_99` layouts of the install belong to a placed map and take its place.
:observed{games="elden-ring"}

The five maps placed by hand are: the ending cutscenes' map `m11_71_00_00`, which takes `m11_05_00_00`'s origin; the sky map
`m60_00_00_00`, in `m60_40_32_00` at (384, 0, 384), the centre of `m60_10_08_02`; the Royal Colosseum `m45_00_00_00`, at
(-359.44, 32.74, -492.72) from Leyndell's origin; `m45_01_00_00`, in `m60_47_42_00` at (-2.34, 150.4, -43.36); and
`m45_02_00_00`, in `m60_42_40_00` at (-24.47, 208.82, -66.69). :sourced[Smithbox]{games="elden-ring"} No row names the
colosseums or `m11_71` and the colosseums' layouts have no connection region. Each tile holds assets
(`AEG400_658` and `AEG400_659`) 0.69 m (`m45_01`) and 1.90 m (`m45_02`) from the stated origin in X and Z and 3.8 m below it,
and one asset (`AEG226_000_2000` in `m60_43_50_00`) is 1.69 m in X and Z and 3.6 m below the Royal Colosseum's.
:observed{games="elden-ring"} The sky map is checked below.

#### Checks on the places

- **A second decoder.** Paramdex's definition of the param, laid out by the container rule, reads the same fields of every
  row in all 29 regulations examined. :observed{games="elden-ring"}
- **The rows against the places.** A row says `origin(source) + source point = origin(destination) + destination point`.
  Of the 184 rows whose two ends are both placed (a tile counts as placed), 169 hold to within 5 cm. The other 15 are rows
  10 and 17 (`m13` to `m60_51_43_00` as a non-base row, 3,178 m, and to `m34_15`, 350 m), 132 and 136 (the second tiles of `m13`
  and `m15`: 1,892 and 627 m), 127 (`m12_03` to `m35`, 220 m), 130 and 131 (`m12_07`'s own rows, 11.2 m), 222 (`m34_14`,
  2.0 m), 223 (`m34_15`, 1.2 m), 139 and 1133 (0.13 and 0.1 m), and rows 1113 to 1116 (`m25_00` to four tiles, 822 m).
  :observed{games="elden-ring"}
- **A community table.** soulstruct-blender's table of 99 maps, made from an earlier regulation, agrees with these places to
  1 cm for 93 of them and to 2 cm for 97 (`m11_05`, `m11_71`, `m19_00` and `m34_14` are 1.7 cm apart, because the table gives
  the first its own row and the others its place, where here the four take the row of `m11_00`). The two others are `m34_15_00_00`
  (350 m) and `m35_00_00_00` (220 m), which the table places through `m13` and `m12_03`. The place of `m12_07_00_00` and
  `m34_14_00_00` in the table is that of the map they share an origin with, as here, and not their own base row's. :observed{games="elden-ring"}
- **The layouts' own connection regions.** 132 of the 196 rows have a connection region (type 21) at their reference point
  in the destination's layout that names the source, or in the source's that names the destination. Of the other 64 rows,
  59 name a map that is not in the install, and rows 5, 10, 11, 16 and 17 name installed maps and have no region.
  :observed{games="elden-ring"}

#### Where the maps meet

A connecting collision (part kind 11) of a map names a map to load while the player stands on it, and the other map holds
one that names the first. Placing both maps by the rules and reading the two sets of collision triangles:

| Pair | What the collision shows | Confidence |
|---|---|---|
| `m14_00_00_00` and `m60_35_46_00` | The Academy's three trigger quads (`h901008` to `h901010`, 27.936 m squares at heights 27, 36 and 44 m) are centred on the tile's `h354690` (a 30.73 m square at 337.577 m) to within 0.001 m in X and Z, and the lowest is at the tile quad's height. The Academy's `h000800` has its floor at 321.577 m on the top (321.639 m) of the tile's `h354603`, with the same edges in X (-96.516 m) and Z (-46.114 m). 25 vertices of the Academy's connecting collision are within 2 cm of the tile's, and none is under any of 14 other placements (shifted by 0.5 m, 1 m, 4 m, 64 m, 128 m or 256 m). | :observed{games="elden-ring"} |
| `m10_00_00_00` and `m60_39_40_00` | 229 vertices of Stormveil's connecting collision are within 2 cm of the tile's, and the offsets between near vertex pairs have one peak, at (0, 0, 0), with 1,107 of them. | :observed{games="elden-ring"} |
| `m11_00_00_00` and `m60_45_52_00` | 15 vertices coincide within 2 cm; the near pairs' offsets peak 0.6 m away. | :observed{games="elden-ring"} |
| `m12_02_00_00` and `m12_07_00_00` | With the shared origin 229 and 276 vertices coincide and the pairs' offsets peak at (0, 0, 0). Placed by `m12_07`'s own base row, 11.2 m away, no vertex coincides and the closest are 0.49 m apart. | :observed{games="elden-ring"} |
| `m35_00_00_00` and `m11_05_00_00` | The closest vertices are 0.83 m apart at Leyndell's origin and 131 m apart at the community table's place for `m35`. | :observed{games="elden-ring"} |

The sky map's `m920811_9900` lies at the Academy's place to 1 mm and `m921112_9900` at Leyndell's to 0.016 m, in the sky map's
own frame (above). :observed{games="elden-ring"}

#### Catacombs, caves and tunnels

The 48 catacombs, caves and tunnels (`m30` to `m32`) of the install are placed at zero offset in 39 cases and at whole tiles
(256 m) in 9. :observed{games="elden-ring"} They are authored in their entrance tile's own coordinates: 31 of the 48 have at
least half of their assets inside the square of a tile their rows link them to, and all 48 have their median asset within
128 m of one. :observed{games="elden-ring"} Their collision parts are placeholders: `m30_00_00_00` holds seven whose files hold
one triangle at the origin, and its geometry is its 1,198 assets; the four maps examined (`m30_00`, `m30_18`, `m31_22`,
`m32_00`) have 21 to 1,503 collision vertices where a full tile has tens of thousands. Their connecting collisions in the four are
quads of 1 m at the origin, so no collision of such a map meets its tile's, and the placement of these maps stands on the
rows and on the containment. :observed{games="elden-ring"}

:::open[When does each tile become resident or visible?]
Nested layout coordinates establish placement relationships. They do not establish streaming radii, hysteresis,
parent-child draw overlap or the runtime residency budget.
:::

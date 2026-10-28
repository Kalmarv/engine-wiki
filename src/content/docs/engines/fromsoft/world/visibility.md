---
title: Visibility and shadow controls
description: MSB visibility arrays, independent shadow flags and their unresolved runtime joins.
sources:
  - title: SoulsFormatsNEXT MSB parts
    url: https://github.com/soulsmods/SoulsFormatsNEXT/tree/master/SoulsFormats/Formats/MSB
implementations:
  - name: fromsoft-formats MSB reader
    url: https://github.com/Kalmarv/fromsoft-formats/blob/main/src/msb.rs
---

MSB stores several controls that affect what can draw: part shadow bytes, visibility-related arrays and
event-addressable entity IDs. Character display masks and event-flag world presence add separate state systems.
:sourced[SoulsFormatsNEXT]

## Visibility arrays

The reference reader names Elden Ring part arrays `DisplayGroups`, `DrawGroups` and `CollisionMask`, but leaves their
semantics unknown. Sekiro's corresponding structure is named `CollisionMask` with 48 words.
:sourced[SoulsFormatsNEXT]

Elden Ring's structure is laid out in its section below. Sekiro stores the same block (388 bytes against 392) and its
first 192 bytes hold the same three arrays in the same order: 8 display-group words at `+0`, 8 draw-group words at `+32`
and 32 collision-mask words at `+64`. :proven{games="sekiro"} The block is present on map pieces, objects, enemies and
collisions in Sekiro, and on every part in Elden Ring.

Parts with a non-zero array, over every part of both installs:

| Game and kind | Parts | Display groups non-zero | Draw groups non-zero | Collision mask non-zero |
|---|---:|---:|---:|---:|
| Sekiro map piece | 40,970 | 28,522 | 40,741 | 40,879 |
| Sekiro object | 10,538 | 5,840 | 10,113 | 8,561 |
| Sekiro enemy | 1,557 | 1 | 2 | 5 |
| Sekiro collision | 1,304 | 999 | 1,185 | 1,060 |
| Elden Ring map piece | 4,522 | 2,886 | 1,444 | 1,341 |
| Elden Ring asset | 421,253 | 281,090 | 106,461 | 80,643 |
| Elden Ring enemy | 16,776 | 11,849 | 1 | 6 |
| Elden Ring collision | 3,266 | 906 | 1,053 | 883 |
| Elden Ring connecting collision | 800 | 130 | 110 | 161 |

Elden Ring's dummy enemies store non-zero display groups on 3,028 of 7,108 parts and its dummy assets on 53 of 2,661;
its player starts on 203 of 722. :proven{games="elden-ring"}

If a part is taken as drawn when its draw groups share a bit with the display groups of some collision of its map (an
assumption, not an established rule), 5,217 of the 5,310 map pieces and objects of Sekiro's `m11_01` qualify, 92 store
draw groups that are all zero, and one qualifies for no collision; over all of Sekiro's maps 49,433 of 51,508 qualify,
654 store zeros and 1,421 qualify for none (1,130 of them in `m20_00`). The same count over Elden Ring's map pieces and
assets gives 70,713 qualifying, 317,870 with zero draw groups and 37,192 qualifying for none, in 29 of the 935
layouts. :observed So the arrays alone do not hide whole interiors of Ashina Castle.

Elden Ring's `_99` overlay layouts ([overlays](/engines/fromsoft/world/areas-and-tiles/)) hold no collision of their own,
and the draw groups of their parts are met by the display groups of the collisions of the base map they overlay, as the
intersection reading predicts:

| Overlay | Parts with draw groups | Met by the overlay's own collisions | Met by the base map's collisions |
|---|---:|---:|---:|
| `m10_00_00_99` | 1,298 | 0 | 1,279 |
| `m11_00_00_99` | 1,240 | 0 | 1,203 |
| `m11_05_00_99` | 668 | 0 | 644 |
| `m12_02_00_99` | 31 | 0 | 30 |
| `m13_00_00_99` | 80 | 0 | 80 |
| `m14_00_00_99` | 734 | 0 | 732 |
| `m15_00_00_99` | 109 | 0 | 109 |
| `m16_00_00_99` | 555 | 0 | 112 |
| `m39_20_00_99` | 787 | 0 | 787 |
| `m45_00_00_99`, `m45_01_00_99`, `m45_02_00_99` | 750, 107, 106 | 0 | 0 |

The other 12 `_99` layouts that have a base layout store no non-zero draw group. :observed{games="elden-ring"} That the groups of a part are
compared with those of the collision the player stands on is the community's reading (soulstruct's field notes: a part is
drawn while its draw group is among the active display groups, and display groups function on collisions)
:sourced[soulstruct]{games="elden-ring"}; that most parts of the largest underground maps (`m12_01`: 8,205 of 10,297 parts
with draw groups, `m12_02`: 5,096 of 8,069) meet no display group of their own map's collisions even when the second block's
groups and the connecting collisions' are added (8,049 and 5,063 remain) is not explained by it. :observed{games="elden-ring"}

The draw groups of the collisions relate to the parts' too. Over the map pieces, objects and assets with draw groups (the
collisions of the base map standing for an overlay's), 107,130 of Elden Ring's 107,905 have every set bit among the draw
groups of some collision of their map, against 29,325 among the display groups of some; Sekiro's figures are 32,731 and
14,090 of 50,854. Elden Ring's 3,266 collisions store draw groups on 1,053 (none stores all 256 bits), Sekiro's 1,304 on 1,185.
:observed Which of the two sets a collision contributes when the player stands on it, or whether both, is not established.
:unknown

In the running game (1.17.2, offline, the layout `m10_00_00_00` replaced by a test file), a part whose draw groups are set to
all zero is not drawn: setting the draw groups of every map piece and asset to zero (7,773 of the 8,065 stored a non-zero
array; display groups left as stored) removes the walls, floor and props around the Stormveil spawn, as moving all of them
300 m up does. What stays on screen is not made of this layout's parts: lifting the 292 parts that store zero draw groups
and zeroing the rest gives the same picture. :observed{games="elden-ring"} Whether parts that already store zero draw groups
(27 map pieces, all at the origin, and 265 assets in this layout) are drawn by another rule was not seen: none of them is in
view at the spawn. :unknown{games="elden-ring"}

```layout
title: Part draw block (payload slot +80)
size: "388 in Sekiro, 392 in Elden Ring"
note: The block of every part that stores one; the sizes are the distance to the next block.
fields:
  - {at: 0, size: 32, type: "u32[8]", name: display groups, level: sourced, note: "Named by SoulsFormatsNEXT; what a group does is the game's"}
  - {at: 32, size: 32, type: "u32[8]", name: draw groups, level: sourced}
  - {at: 64, size: 128, type: "u32[32]", name: collision mask, level: sourced}
  - {at: 192, size: 4, type: "u8[4]", name: condition bytes, level: unknown, note: "The first two are 0 or 1 in both games; Elden Ring's third is 0 or 2 and its fourth 0, 1 or 2; Sekiro's third and fourth are 0"}
  - {at: 196, size: 2, type: i16, name: unknown, level: unknown, games: [elden-ring], note: "-1 on all 457,108 parts"}
  - {at: 198, size: 1, type: u8, name: unknown, level: unknown, games: [elden-ring], note: "0, or 1 on 177 map pieces"}
  - {at: 196, size: 4, type: "u8[4]", name: unknown, level: unknown, games: [sekiro], note: "0"}
  - {at: 200, size: variable, type: bytes, name: reserved, level: proven, value: 0, note: "Zero to the end of the block in both games"}
```

```layout
title: Part second display block (payload slot +88)
size: 72
note: Collisions and connecting collisions in both games, assets in Elden Ring.
fields:
  - {at: 0, size: 4, type: i32, name: condition, level: unknown, note: "-1 on every Elden Ring asset, on 1,887 of the 3,266 Elden Ring collisions and on 108 of the 1,304 Sekiro collisions; otherwise a non-negative number"}
  - {at: 4, size: 32, type: "u32[8]", name: display groups, level: sourced, note: "Zero except on 341 Elden Ring collisions, 322 connecting collisions and 3 assets, and on 11 Sekiro collisions and 73 of its connecting collisions"}
  - {at: 36, size: 4, type: "u8[4]", name: unknown, level: unknown, note: "00 00 ff ff (a signed -1 in the last two bytes) on all but 15 connecting collisions (12 in Sekiro, 3 in Elden Ring), which store a 16-bit number there and, on 14 of them, a 1 in the first byte"}
  - {at: 40, size: 32, type: bytes, name: reserved, level: proven, value: 0}
```

Both blocks read with no refusals on every part of both installs (Sekiro 55,352 parts, Elden Ring 457,108), their sizes
and zero bytes as stated. :proven

## Shadow bytes

Offsets below are relative to the part's entity-data block, not its header. The cast, receive and shadow-only flags
are independent stored bytes.
:observed{games="sekiro"} :proven[all 457,108 parts]{games="elden-ring"}

| Offset | Meaning | Stored encoding | Confidence |
|---|---|---|---|
| `0x0a` | Point-light shadow cast | MSBS: `0/1`; MSBE: `0/0xff` | :observed{games="sekiro"} :proven[all parts]{games="elden-ring"} |
| `0x0c` | Cast shadow | `0/1` | :observed{games="sekiro"} :proven[all parts]{games="elden-ring"} |
| `0x0d` | Static shadow control | Raw byte; renderer meaning unresolved | :unknown |
| `0x0e` | Cascade-3 shadow control | Raw byte; renderer meaning unresolved | :unknown |
| `0x11` | Receive shadow | `0/1` | :observed{games="sekiro"} :proven[all parts]{games="elden-ring"} |
| `0x12` | Shadow only | `0/1` | :observed{games="sekiro"} :proven[all parts]{games="elden-ring"} |

Sekiro's bytes agree with SoulsFormats on all 5,310 map-piece and object parts of `m11_01` for the eight shadow
and draw flags compared. Among them, `m400090_6000`, a flat ground piece in the spawn courtyard, is shadow-only.
:observed{games="sekiro"}

The Elden Ring shadow-byte comparison covers every part of all 935 installed MSBs with no refusals.
:proven{games="elden-ring"}

### Other entity-data bytes

The other bytes of the entity-data block that carry values in the installs, over every part:

| Game and offset | Meaning (community name) | Values | Confidence |
|---|---|---|---|
| Elden Ring `+0x04` | Uses a draw-parameter row (`isUsePartsDrawParamID`) | 1 on 11,583 parts (3,905 of 4,522 map pieces, 7,656 assets, 22 other), else 0 | :proven{games="elden-ring"} :sourced[Smithbox]{games="elden-ring"} |
| Elden Ring `+0x08` | Draw-parameter row ID (`PartsDrawParamID`), a u16 | On all 11,583 parts with `+0x04` set, a `PartsDrawParam` row of that ID exists in the regulation (385 rows); the other parts store 0 (445,086) or a value (439, of which 34 are 0xffff) | :proven{games="elden-ring"} |
| Elden Ring `+0x13` | Draw by reflection camera | 0 on all 457,108 parts | :proven{games="elden-ring"} :sourced[Smithbox]{games="elden-ring"} |
| Elden Ring `+0x14` | Draw only in the reflection camera | 1 on 156 parts (138 map pieces, 17 assets, 1 connecting collision) | :proven{games="elden-ring"} :sourced[Smithbox]{games="elden-ring"} |
| Elden Ring `+0x15` | Enable on above shadow | 1 on 198 parts (176 map pieces, 19 assets, 2 collisions, 1 connecting collision) | :proven{games="elden-ring"} :sourced[Smithbox]{games="elden-ring"} |
| Elden Ring `+0x16` | Disable point-light effect | 1 on 97 parts (96 assets, 1 map piece) | :proven{games="elden-ring"} :sourced[Smithbox]{games="elden-ring"} |
| Elden Ring `+0x3f` | Disable ray-traced ambient occlusion | 1 on 6,655 parts (6,428 assets, 227 map pieces) | :proven{games="elden-ring"} :sourced[Smithbox]{games="elden-ring"} |
| Sekiro `+0x07` | Lantern ID | 0 on all 55,352 parts | :proven{games="sekiro"} :sourced[Smithbox]{games="sekiro"} |
| Sekiro `+0x08` | Level-of-detail parameter row (`LodParamID`), a byte | 255 on 53,724 parts; 3, 31, 40, 41, 42, 60, 61 or 63 on 1,628 parts (1,616 map pieces, 12 objects), each with a row of that ID in the 64-row `LodParam` | :proven{games="sekiro"} |

What the draw-parameter row and the level-of-detail row set is not read here. A reader that takes Elden Ring's `+0x08`
as a signed byte "level of detail" with a second byte beside it splits what is one u16 row ID (2046 is bytes 0xfe and
0x07; on map pieces the IDs are 1000 on 2,481, 2046 on 247, 2060 on 173 and 2048 on 131). :proven{games="elden-ring"}

:::open[What is the exact visibility predicate?]
The presence of arrays and their community names do not establish bit intersections, collision activation,
occlusion, camera dependence or LOD handoff. Nor is precedence established when shadow-only and cast-shadow
controls appear contradictory. These bytes must not be collapsed into a single unconditional visibility flag.
:::

## Sekiro

### Black boxes around the keep

:only[sekiro] Around Ashina Castle's keep, objects `m015091` to `m015098` and one submesh of `m015051` draw
near-black boxes with the texture `m11_black_a` and the program `GXFlver_ColDif`. :observed{games="sekiro"} That they are
blocker or occluder cards rather than scenery is a guess. :inferred{games="sekiro"}

## Elden Ring

### Part visibility-related structure

```layout
title: Elden Ring part visibility-related structure
size: 392
games: [elden-ring]
fields:
  - {at: 0, size: 32, type: "u32[8]", name: DisplayGroups, level: unknown, note: Community field name; meaning unresolved}
  - {at: 32, size: 32, type: "u32[8]", name: DrawGroups, level: unknown, note: Community field name; meaning unresolved}
  - {at: 64, size: 128, type: "u32[32]", name: CollisionMask, level: unknown, note: Community field name; meaning unresolved}
  - {at: 192, size: 4, type: "u8[4]", name: conditions and unknown bytes, level: unknown, note: Named Condition1; Condition2; UnkC2; UnkC3 by the reference}
  - {at: 196, size: 2, type: i16, name: unknown, level: unknown, note: Reference reports -1 in retail}
  - {at: 198, size: 2, type: i16, name: unknown, level: unknown, note: Reference reports 0 or 1 in retail}
  - {at: 200, size: 192, type: "u8[192]", name: padding, level: sourced, value: 0}
```

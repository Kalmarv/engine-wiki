---
title: MSB map layouts
description: MSBS and MSBE section chains, models, placements, regions and events.
sources:
  - title: SoulsFormatsNEXT MSB
    url: https://github.com/soulsmods/SoulsFormatsNEXT/tree/master/SoulsFormats/Formats/MSB
implementations:
  - name: fromsoft-formats MSB reader
    url: https://github.com/Kalmarv/fromsoft-formats/blob/main/src/msb.rs
---

An **MSB** describes a map's models and their occurrences, regions and events. A model entry names a resource; a
part places it, so several parts can share one model. Parts also carry entity IDs used by
[event scripts](/engines/fromsoft/gameplay/emevd/). :observed

Sekiro uses the MSBS generation and Elden Ring uses MSBE. The ordered section names identify the generation;
section revision numbers alone do not, because revisions can differ while the record layout stays the same.
:observed

## Sections

| Order | MSBS | MSBE | Confidence |
|---|---|---|---|
| 1 | `MODEL_PARAM_ST` | Same | :observed{games="sekiro"} :proven{games="elden-ring"} |
| 2 | `EVENT_PARAM_ST` | Same | :observed{games="sekiro"} :proven{games="elden-ring"} |
| 3 | `POINT_PARAM_ST` (regions) | Same | :observed{games="sekiro"} :proven{games="elden-ring"} |
| 4 | `ROUTE_PARAM_ST` | Same | :observed{games="sekiro"} :proven{games="elden-ring"} |
| 5 | `LAYER_PARAM_ST` (empty in the examined layouts) | Same | :observed{games="sekiro"} :proven{games="elden-ring"} |
| 6 | `PARTS_PARAM_ST` | Same | :observed{games="sekiro"} :proven{games="elden-ring"} |
| 7 | `MAPSTUDIO_PARTS_POSE_ST` (empty in the examined layouts) | Absent | :observed{games="sekiro"} :proven{games="elden-ring"} |
| 8 | `MAPSTUDIO_BONE_NAME_STRING` (empty in the examined layouts) | Absent | :observed{games="sekiro"} :proven{games="elden-ring"} |

The file begins with `MSB ` and a 16-byte header; the first section starts at 16. Section pointers are absolute,
whereas pointers inside a part or model record are relative to that record. Strings are NUL-terminated UTF-16.
:observed

### Section revisions

A file stores one revision, repeated in every section header of its chain; the two empty trailing sections of a
Sekiro file store 0. This holds in all 10 Sekiro and all 935 Elden Ring MSBs of the installs examined (the Elden Ring
install is the base game without the expansion archive). :proven

| Game | Revisions stored (files) | Confidence |
|---|---|---|
| Sekiro | 35 (9 maps), 33 (`m89_00_00_99`) | :proven{games="sekiro"} |
| Elden Ring | 73 (547), 74 (160), 57 (46), 51 (39), 69 (30), 64 (30), 71 (22), 65 (21), 63 (20), 66 (18), 46 (1), 70 (1) | :proven{games="elden-ring"} |

Every Elden Ring file reads with the one six-section layout whatever its revision, so a reader that accepts only 73
refuses 388 of the 935 files. :proven{games="elden-ring"} Within `m60` the revision varies from tile to tile (73 on 460
tiles, 74 on 153, and eight further revisions on 18 to 46 tiles each). :proven{games="elden-ring"}

```layout
title: Section header and pointer table (Sekiro)
size: variable
games: [sekiro]
note: Little-endian; offsets are absolute from the MSB start.
fields:
  - {at: 0, size: 4, type: u32, name: section revision, level: observed}
  - {at: 4, size: 4, type: u32, name: pointer count, level: observed, note: Record count plus one}
  - {at: 8, size: 8, type: u64, name: section name offset, level: observed}
  - {at: 16, size: "8 × record count", type: "u64[]", name: record offsets, level: observed}
  - {at: after record offsets, size: 8, type: u64, name: next section offset, level: observed, note: Zero terminates the chain}
```

```layout
title: Section header and pointer table (Elden Ring)
size: variable
games: [elden-ring]
note: Little-endian; offsets are absolute from the MSB start.
fields:
  - {at: 0, size: 4, type: u32, name: section revision, level: proven}
  - {at: 4, size: 4, type: u32, name: pointer count, level: proven, note: Record count plus one}
  - {at: 8, size: 8, type: u64, name: section name offset, level: proven}
  - {at: 16, size: "8 × record count", type: "u64[]", name: record offsets, level: proven}
  - {at: after record offsets, size: 8, type: u64, name: next section offset, level: proven, note: Zero terminates the chain}
```

## Parts

Ashina Castle's map-piece and object names, model references, positions, rotations and scales agree bit for bit with
an independent SoulsFormats decode. That comparison does not cover the other Sekiro part kinds. :observed{games="sekiro"}
The whole-install Elden Ring comparison covers all 935 MSBs, all 457,108 parts of every kind and all 227 spawn
points, with no refusals. Model names, part transforms, IDs, shadow controls, hit filters and spawn-point values
agree with SoulsFormatsNEXT. :proven{games="elden-ring"}

```layout
title: MSBS part header — selected fields
size: 160
games: [sekiro]
note: Offsets within records are relative to the record start. Unlisted fields are not described here.
fields:
  - {at: 0, size: 8, type: u64, name: name offset, level: observed}
  - {at: 8, size: 4, type: u32, name: part kind, level: observed}
  - {at: 16, size: 4, type: i32, name: model index, level: observed, note: -1 names no model}
  - {at: 24, size: 8, type: u64, name: resource path offset, level: sourced}
  - {at: 32, size: 12, type: "f32[3]", name: position, level: observed}
  - {at: 44, size: 12, type: "f32[3]", name: rotation in degrees, level: observed}
  - {at: 56, size: 12, type: "f32[3]", name: scale, level: observed}
  - {at: 96, size: 8, type: u64, name: entity data offset, level: observed, note: Entity block occupies 0x54 bytes}
  - {at: 104, size: 8, type: u64, name: type data offset, level: observed}
  - {at: 112, size: 8, type: u64, name: graphics configuration offset, level: observed}
  - {at: 120, size: 8, type: u64, name: scene configuration offset, level: observed}
```

```layout
title: MSBE part header — selected fields
size: 192
games: [elden-ring]
note: Unlisted fields are not described here; record-relative offsets.
fields:
  - {at: 0, size: 8, type: u64, name: name offset, level: proven}
  - {at: 12, size: 4, type: u32, name: part kind, level: proven}
  - {at: 20, size: 4, type: i32, name: model index, level: proven, note: -1 names no model}
  - {at: 24, size: 8, type: u64, name: resource path offset, level: sourced}
  - {at: 32, size: 12, type: "f32[3]", name: position, level: proven}
  - {at: 44, size: 12, type: "f32[3]", name: rotation in degrees, level: proven}
  - {at: 56, size: 12, type: "f32[3]", name: scale, level: proven}
  - {at: 96, size: 8, type: u64, name: entity data offset, level: proven, note: Entity block occupies 0x40 bytes}
  - {at: 104, size: 8, type: u64, name: type data offset, level: proven}
  - {at: 112, size: 8, type: u64, name: graphics configuration offset, level: proven}
  - {at: 120, size: 8, type: u64, name: scene configuration offset, level: proven}
```

Within entity data, the entity ID is at `+0` and eight group IDs start at `+0x1c`. Enemy type data stores the NPC
row ID at `+12`. :sourced[SoulsFormatsNEXT]

Kind 0 is a map piece, 2 an enemy, 4 a player, 5 collision, 10 a dummy enemy and 11 connecting collision.
:sourced[SoulsFormatsNEXT] :only[sekiro] Kind 1 is an object and 9 a dummy object.
:sourced[SoulsFormatsNEXT]{games="sekiro"} :only[elden-ring] Kind 13 is an asset and 9 a dummy asset.
:sourced[SoulsFormatsNEXT]{games="elden-ring"}

An entity ID of 0 or -1 names no entity. A positive group ID lets an event address all parts in that group.
:observed

### Part kinds present

Over all parts of the installs, only the kinds above occur; no part has kind 6 (the navmesh kind of earlier
games). Model records have kind 0, 1, 2, 4 or 5 in Sekiro and 0, 2, 4, 5 or 10 in Elden Ring (4,335 / 1,266 / 284 / 4 /
1,353 Sekiro records of those kinds; 4,958 / 4,475 / 189 / 3,351 / 40,530 Elden Ring records). :proven

| Kind | Sekiro parts | Elden Ring parts |
|---|---:|---:|
| 0 map piece | 40,970 | 4,522 |
| 1 object | 10,538 | n/a |
| 2 enemy | 1,557 | 16,776 |
| 4 player | 70 | 722 |
| 5 collision | 1,304 | 3,266 |
| 9 dummy object / dummy asset | 125 | 2,661 |
| 10 dummy enemy | 206 | 7,108 |
| 11 connecting collision | 582 | 800 |
| 13 asset | n/a | 421,253 |
| Total | 55,352 | 457,108 |

The counts cover the 10 Sekiro and 935 Elden Ring MSBs of the installs. :proven

### Model records

A model record is 40 bytes of header before its strings, in both games (the name offset is 40 in all 7,242 Sekiro and
53,503 Elden Ring records). Its u32 at `+24` is the number of parts that name the model: it equals the count of parts
whose model index is that record in every model record of both installs. A file's parts reference no model index
outside its model section, apart from the `-1` of 4 Elden Ring files. :proven

### Payload slots

The part header's payload slots (eleven u64 from `+80` in Elden Ring, seven in Sekiro) hold offsets of blocks, 0 for
none. The size below is the distance from a block to the next higher offset or the record's end, so it includes
alignment padding. :proven

| Slot | Block | Size (Sekiro / Elden Ring) | Present on |
|---|---|---|---|
| `+80` | draw and display groups | 388 / 392 | Elden Ring: every kind. Sekiro: map piece, object, enemy, collision |
| `+88` | second display-group block | 72 / 72 | Collision and connecting collision in both games; Elden Ring assets |
| `+96` | entity data | 84 (88 on player, dummy and connecting-collision kinds) / 64 | Every kind |
| `+104` | type data | per kind | Every kind |
| `+112` | graphics configuration | 32 / 32 | Every kind except player and connecting collision |
| `+120` | scene configuration | 80 / 80 | Collision only |
| `+128` | Sekiro: unnamed; Elden Ring: grass configuration | 32 / 32 | Sekiro map pieces only; Elden Ring map pieces and assets |
| `+136`, `+152` | Elden Ring: unnamed; `+152` is the tile-load configuration | 32 | Elden Ring: every kind |
| `+144`, `+160` | Elden Ring: unnamed | 32 | Elden Ring: `+144` map pieces and assets; `+160` map pieces, collisions, connecting collisions and assets |

Type-data sizes (Sekiro / Elden Ring): map piece 8 / 8; object 40 / n/a; enemy and dummy enemy 192 / 192; player 16 / 16;
collision 96 / 80; dummy object or asset 40 / 32; connecting collision 16 / 16; asset n/a / 392. :proven

### Asset effects (Elden Ring)

An asset part's type data stores at `+0x1c` a signed 16-bit word, the relative id of the row of `AssetModelSfxParam` its
effects come from: row `(nnn x 1000 + mmm) x 1000 + id` for the asset model `AEGnnn_mmm` (see
[model effect params](/engines/fromsoft/data-model/params/#modelsfxparam-and-assetmodelsfxparam)); -1 names none. Of the 421,253 asset parts of
`AEGnnn_mmm` models, 409,246 store -1, 11,533 name an existing row and 474 name an absent one. Of every 16-bit word of the type
data, this is the only one whose non-negative values name an existing row for more than a thousand parts (4,100 positive values
name a row and 16 do not; the next best word names one for 966 parts and misses 69,758). :observed{games="elden-ring"}
Sekiro's object part has no such field. :observed{games="sekiro"}

### Collision parts

A collision part's type data starts with a hit-filter byte. The values present, with the community names (Smithbox's
enumerations; both games leave 16, 17, 20, 23 and 24 unnamed):

| Value | Name | Sekiro collisions | Elden Ring collisions | Confidence |
|---:|---|---:|---:|---|
| 8 | Collide with all characters | 1,127 | 2,095 | :proven[counts]{games="sekiro elden-ring"} :sourced[Smithbox]{games="sekiro elden-ring"} |
| 9 | Collide with camera only | 6 | 27 | :proven[counts]{games="sekiro elden-ring"} :sourced[Smithbox]{games="sekiro elden-ring"} |
| 11 | Collide with non-player characters only | 14 | 71 | :proven[counts]{games="sekiro elden-ring"} :sourced[Smithbox]{games="sekiro elden-ring"} |
| 13 | Trigger fall death camera | 12 | 257 | :proven[counts]{games="sekiro elden-ring"} :sourced[Smithbox]{games="sekiro elden-ring"} |
| 15 | Trigger instant death | 13 | 258 | :proven[counts]{games="sekiro elden-ring"} :sourced[Smithbox]{games="sekiro elden-ring"} |
| 16 | unnamed | 19 | 187 | :proven[counts]{games="sekiro elden-ring"} |
| 17 | unnamed | 4 | 92 | :proven[counts]{games="sekiro elden-ring"} |
| 19 | Collide with non-player characters only (Sekiro enumeration), unnamed (Elden Ring) | 9 | 38 | :proven[counts]{games="sekiro elden-ring"} :sourced[Smithbox]{games="sekiro"} |
| 20 | unnamed | 0 | 10 | :proven[counts]{games="sekiro elden-ring"} |
| 22 | Block all fall damage (Sekiro enumeration), unnamed (Elden Ring) | 17 | 210 | :proven[counts]{games="sekiro elden-ring"} :sourced[Smithbox]{games="sekiro"} |
| 23, 24, 29 | unnamed | 0 | 10, 3, 8 | :proven[counts]{games="elden-ring"} |
| 25, 26, 27, 28 | absent from the community enumerations | 6, 2, 64, 11 | 0 | :proven[counts]{games="sekiro"} |

The counts are over all 1,304 Sekiro and 3,266 Elden Ring collision parts. Values 0 to 7, 14 and 21 (named in the Sekiro
enumeration) do not occur in either install. :proven

In Elden Ring the collision type data holds two more bytes read from the data: `+0x35` is 255 on 3,225 of 3,266
collisions and otherwise 0, 1, 2, 3, 21, 31 or 41 (41 collisions, all in `m60` tiles), and `+0x36` is 0 on 1,877 and 1
on 1,389. How `+0x35` selects a graphics-parameter file is under
[graphics parameters](/engines/fromsoft/lighting/gparam/#collision-selectors). :proven{games="elden-ring"}

### Entity IDs and groups

Entity IDs and group IDs follow a numbering per area, in the decimal digits of the ID. Counted over every positive
entity ID in the installs' MSBs (part IDs, the eight group IDs of each part, region IDs and the entity ID in each event's
base data), `n` being a number below 10,000:

| Game and kind of map | Form | Parts | Part groups | Regions | Events | Confidence |
|---|---|---:|---:|---:|---:|---|
| Sekiro, all maps but `_99` | `area × 10^5 + block × 10^4 + n` | 2,616 of 2,619 | 2,783 of 2,783 | 1,787 of 1,871 | 203 of 213 | :observed{games="sekiro"} |
| Elden Ring, legacy dungeons and other non-overworld maps | `area × 10^6 + block × 10^4 + n` | 6,241 of 6,256 | 6,198 of 6,204 | 3,106 of 3,425 | 239 of 240 | :observed{games="elden-ring"} |
| Elden Ring, `m60` tiles | `10^9 + X × 10^6 + Z × 10^4 + n` for tile `m60_X_Z_*` | 5,077 of 5,808 | 2,741 of 3,759 | 1,778 of 2,304 | 125 of 136 | :observed{games="elden-ring"} |

"Of" counts the positive IDs of that kind in those maps; the others are small numbers (group IDs 7 and 8, region IDs 1
and 2) or follow the numbering of another block (a `m10_00` region with an ID of the `m10_01` form). The Elden Ring forms
are also the forms of the event flags that the map's own scripts set (see
[EMEVD](/engines/fromsoft/gameplay/emevd/#flag-and-entity-numbering)).

## Regions and events

Regions combine a type, a shape and a placement. :sourced[SoulsFormatsNEXT]

```layout
title: Region record header — selected common fields
size: "96 (Sekiro), 104 (Elden Ring)"
note: Region-record-relative offsets; type-specific payloads differ. The first string (the name) starts at the header's end.
fields:
  - {at: 0, size: 8, type: u64, name: name offset, level: sourced, note: "Equals the header size (96 or 104) in all 45,121 regions"}
  - {at: 8, size: 4, type: u32, name: region type, level: sourced}
  - {at: 12, size: 4, type: u32, name: index among the regions of the same type, level: proven, note: "Counts from 0 in file order; equals the per-type counter in all 45,121 regions"}
  - {at: 16, size: 4, type: u32, name: shape type, level: sourced}
  - {at: 20, size: 12, type: "f32[3]", name: position, level: sourced}
  - {at: 32, size: 12, type: "f32[3]", name: rotation in degrees, level: sourced}
  - {at: 44, size: 4, type: u32, name: region number, level: proven, note: "Unique within the file in all 945 files; not the record index (equal to it in 391 of 45,121 regions)"}
  - {at: 72, size: 8, type: u64, name: shape data offset, level: sourced}
  - {at: 80, size: 8, type: u64, name: entity data offset, level: sourced}
  - {at: 88, size: 8, type: u64, name: type data offset, level: sourced, note: "0 in all 6,872 Elden Ring regions of type 0xffffffff and in 37 regions of other types"}
  - {at: 96, size: 8, type: u64, name: extra data offset, level: proven, games: [elden-ring], note: "Non-zero in all 36,409 regions; the block it names is described below"}
```

```layout
title: Event record header — selected common fields
size: "40 (Sekiro), 48 (Elden Ring)"
note: Event-record-relative offsets; type-specific payloads differ. The name string starts at the header's end.
fields:
  - {at: 0, size: 8, type: u64, name: name offset, level: sourced, note: "Equals the header size (40 or 48) in all 9,211 events"}
  - {at: 8, size: 4, type: u32, name: event number, level: proven, note: "Unique within the file in all 945 files; not the record index (equal to it in 367 of 9,211 events); densely 0..n-1 in 731 of 945 files"}
  - {at: 12, size: 4, type: u32, name: event type, level: sourced}
  - {at: 16, size: 4, type: u32, name: index among the events of the same type, level: proven, note: "Equals the per-type counter in 9,209 of 9,211 events; the other two have type 0xffffffff"}
  - {at: 24, size: 8, type: u64, name: base data offset, level: sourced, note: "Part index, region index and entity ID (16 bytes)"}
  - {at: 32, size: 8, type: u64, name: type data offset, level: sourced, note: "0 for events of type 0xffffffff, and for Sekiro type 22"}
  - {at: 40, size: 8, type: u64, name: extra data offset, level: proven, games: [elden-ring], note: "Non-zero in all 7,585 events; the block it names is described below"}
```

The event and region sections of every Elden Ring file are sorted by type, as are the event sections of all 10 Sekiro files
(the Sekiro region sections of 3 of the 10). The number at
`+8` of an event and the number at `+44` of a region are file-wide identifiers that keep their values when records are
removed: they are unique in every file but dense (a permutation of 0..n-1) in only 731 of the 945 event sections and 419
of the region sections, and they are in section order in 597 of the event sections of the Elden Ring files. They are
neither the record index nor the per-type index. :proven

### Extra block (Elden Ring)

:only[elden-ring] Every region and event ends with a 32-byte block that its extra data offset names. It is the last
thing in the record: the block ends at the record's end in 23,517 regions and 7,571 events, and 4 zero bytes of
alignment follow it in the other 12,892 regions and 14 events. :proven

```layout
title: Region and event extra block
size: 32
games: [elden-ring]
fields:
  - {at: 0, size: 4, type: u32, name: map word, level: proven, note: "0xffffffff in 35,784 of 36,409 regions and 7,454 of 7,585 events; otherwise a map word (area in the top byte)"}
  - {at: 4, size: 4, type: u32, name: unknown, level: unknown, note: "0 with a default map word; 13 in all 756 records with a map word"}
  - {at: 8, size: 4, type: u32, name: unknown, level: unknown, note: "0 in every region and event but one (2)"}
  - {at: 12, size: 4, type: i32, name: unknown, level: unknown, note: "-1 with a default map word; otherwise a non-negative number (226 distinct values, up to 9,081) whose meaning is not established"}
  - {at: 16, size: 16, type: "u8[16]", name: padding, level: proven, value: 0}
```

The records with a map word are the 625 regions and 131 events of 46 overworld tiles of levels 1 and 2: 17 `_01`
tiles, 26 `_02` tiles and the alternate tiles `m60_*_11` (2) and `m60_*_12` (1). :proven How the word is read is under [map words](/engines/fromsoft/world/areas-and-tiles/#map-words).

Sekiro has no extra block or pointer: its region header ends at `+96`, its event header at `+40`, and the name string
follows. :proven{games="sekiro"} A reader that takes a region's or event's type data as "from the type-data offset to the
record's end" in Elden Ring therefore includes the 32-byte block (and up to 4 padding bytes) in it.

### Effect regions (type 5)

An SFX region's type data names the effect it spawns (an [FXR file](/engines/fromsoft/effects/fxr/) by id) and whether the
effect starts disabled until an event script enables it. The word that holds the flag is SoulsFormats' `StartDisabled` (an
integer); the files store only 0 and 1 in Elden Ring's, and in Sekiro's 0, 1, 256 and 257, so its low byte is read as the flag.

```layout
title: SFX region type data
size: "8 (Elden Ring, before the extra block), 24 or 28 (Sekiro)"
fields:
  - {at: 0, size: 4, type: i32, name: effect id, level: proven, note: "The number of an FXR file; 1,872 Sekiro and 1,523 Elden Ring regions"}
  - {at: 4, size: 4, type: u32, name: start disabled, level: sourced, games: [elden-ring], note: "0 or 1 in all 1,523 regions (17 are 1)"}
  - {at: 4, size: 4, type: i32, name: unnamed, level: unknown, games: [sekiro], note: "SoulsFormats' UnkT04: -1 in 1,868 regions, 0x00110440 in 4"}
  - {at: 8, size: 12, type: "i32[3]", name: padding, level: proven, games: [sekiro], value: -1}
  - {at: 20, size: 4, type: u32, name: start disabled, level: sourced, games: [sekiro], note: "Low byte 0 or 1 (54 of 1,872 regions are 1); the second byte is 1 in 13 regions, not understood; the two high bytes are 0"}
```

Every SFX region of both installs has a flag byte of 0 or 1 and, in Elden Ring, zero bytes after it in its word. :proven[every region of type 5 of both installs]

Shape variants include points, circles, spheres, cylinders, rectangles,
boxes and composites; a shape and a region's purpose are different fields. :sourced[SoulsFormatsNEXT]

| Shape code | Payload | Confidence |
|---|---|---|
| `0xffffffff` | No shape | :sourced[SoulsFormatsNEXT] |
| 0 | Point, no dimensions | :sourced[SoulsFormatsNEXT] |
| 1 / 2 | Circle / sphere, one radius float | :sourced[SoulsFormatsNEXT] |
| 3 | Cylinder, radius then height | :sourced[SoulsFormatsNEXT] |
| 4 | Rectangle, width then depth | :sourced[SoulsFormatsNEXT] |
| 5 | Box, width then depth then height | :sourced[SoulsFormatsNEXT] |
| 6 | Composite child-region records | :sourced[SoulsFormatsNEXT] |

Region type 8 identifies spawn points in both generations. :sourced[SoulsFormatsNEXT] Sekiro's event type 9 is
MapOffset; MSBE has no corresponding MapOffset event. See [coordinate frames](/engines/fromsoft/world/frames/).
:observed

:::open[How do all region and event types behave?]
Community definitions name many types, but a name alone does not establish activation, priority or runtime lifetime.
Type-specific bytes need a separate interpretation for each type and game.
:::

---
title: MSB map layouts
description: MSBS and MSBE section chains, models, placements, regions and events.
sources:
  - title: SoulsFormatsNEXT MSB
    url: https://github.com/soulsmods/SoulsFormatsNEXT/tree/master/SoulsFormats/Formats/MSB
implementations:
  - name: primase MSB reader
    url: https://github.com/Kalmarv/primase/blob/main/worlds/fromsoft/src/msb.rs
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

## Regions and events

Regions combine a type, a shape and a placement. :sourced[SoulsFormatsNEXT]

```layout
title: Region header — selected common fields
size: variable
note: Region-record-relative offsets; type-specific payloads differ.
fields:
  - {at: 0, size: 8, type: u64, name: name offset, level: sourced}
  - {at: 8, size: 4, type: u32, name: region type, level: sourced}
  - {at: 12, size: 4, type: u32, name: region index, level: sourced}
  - {at: 16, size: 4, type: u32, name: shape type, level: sourced}
  - {at: 20, size: 12, type: "f32[3]", name: position, level: sourced}
  - {at: 32, size: 12, type: "f32[3]", name: rotation in degrees, level: sourced}
  - {at: 72, size: 8, type: u64, name: shape data offset, level: sourced}
  - {at: 80, size: 8, type: u64, name: entity data offset, level: sourced}
  - {at: 88, size: 8, type: u64, name: type data offset, level: sourced}
```

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

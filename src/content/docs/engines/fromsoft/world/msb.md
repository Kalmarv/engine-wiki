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
| 1 | `MODEL_PARAM_ST` | Same | :observed |
| 2 | `EVENT_PARAM_ST` | Same | :observed |
| 3 | `POINT_PARAM_ST` (regions) | Same | :observed |
| 4 | `ROUTE_PARAM_ST` | Same | :observed |
| 5 | `LAYER_PARAM_ST` (empty in the examined layouts) | Same | :observed |
| 6 | `PARTS_PARAM_ST` | Same | :observed |
| 7 | `MAPSTUDIO_PARTS_POSE_ST` (empty in the examined layouts) | Absent | :observed |
| 8 | `MAPSTUDIO_BONE_NAME_STRING` (empty in the examined layouts) | Absent | :observed |

The file begins with `MSB ` and a 16-byte header; the first section starts at 16. Section pointers are absolute,
whereas pointers inside a part or model record are relative to that record. Strings are NUL-terminated UTF-16.
:observed

```layout
title: Section header and pointer table
size: variable
note: Little-endian; offsets are absolute from the MSB start.
fields:
  - {at: 0, size: 4, type: u32, name: section revision, level: observed}
  - {at: 4, size: 4, type: u32, name: pointer count, level: observed, note: Record count plus one}
  - {at: 8, size: 8, type: u64, name: section name offset, level: observed}
  - {at: 16, size: "8 × record count", type: "u64[]", name: record offsets, level: observed}
  - {at: after record offsets, size: 8, type: u64, name: next section offset, level: observed, note: Zero terminates the chain}
```

## Parts

Ashina Castle's map-piece and object names, model references, positions, rotations and scales agree bit for bit with
an independent SoulsFormats decode. That comparison does not cover the other Sekiro part kinds. :observed{games="sekiro"}
Every part of every kind in Elden Ring's map-layout comparison agrees with SoulsFormatsNEXT. :proven{games="elden-ring"}

| Field | MSBS | MSBE | Confidence |
|---|---|---|---|
| Part header size | 160 bytes | 192 bytes | :observed |
| Kind field | `+8` | `+12` | :observed |
| Model index | `+16` | `+20` | :observed |
| Position / rotation / scale | `+32` / `+44` / `+56`, three floats each | Same | :observed |
| Entity data pointer / type data pointer | `+96` / `+104` | Same | :observed |
| Entity data size | `0x54` | `0x40` | :observed |
| Entity ID / eight group IDs within entity data | `+0` / `+0x1c` | Same | :observed |
| Enemy NPC row within type data | `+12` | Same | :sourced[SoulsFormatsNEXT] |

Kind 0 is a map piece, 2 an enemy, 4 a player, 5 collision, 10 a dummy enemy and 11 connecting collision.
:sourced[SoulsFormatsNEXT] :only[sekiro] Kind 1 is an object and 9 a dummy object.
:sourced[SoulsFormatsNEXT]{games="sekiro"} :only[elden-ring] Kind 13 is an asset and 9 a dummy asset.
:sourced[SoulsFormatsNEXT]{games="elden-ring"}

An entity ID of 0 or -1 names no entity. A positive group ID lets an event address all parts in that group.
:observed

## Regions and events

Regions combine a type, a shape and a placement. The common region header stores the type at `+8`, shape code at
`+16`, position at `+20`, rotation at `+32`, shape-data pointer at `+72`, entity-data pointer at `+80` and type-data
pointer at `+88`. :sourced[SoulsFormatsNEXT] Shape variants include points, circles, spheres, cylinders, rectangles,
boxes and composites; a shape and a region's purpose are different fields. :sourced[SoulsFormatsNEXT]

Region type 8 identifies spawn points in both generations. :sourced[SoulsFormatsNEXT] Sekiro's event type 9 is
MapOffset; MSBE has no corresponding MapOffset event. See [coordinate frames](/engines/fromsoft/world/frames/).
:observed

:::open[How do all region and event types behave?]
Community definitions name many types, but a name alone does not establish activation, priority or runtime lifetime.
Type-specific bytes need a separate interpretation for each type and game.
:::

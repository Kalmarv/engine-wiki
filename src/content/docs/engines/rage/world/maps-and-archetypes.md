---
title: Maps and archetypes
description: YMAP placements, YTYP archetypes, transforms, streaming extents, interiors and scripted map state.
games: [gta-v]
sources:
  - title: CodeWalker
    url: https://github.com/dexyfex/CodeWalker
    note: YmapFile, YtypFile and META structure names.
implementations:
  - name: primase worlds/gta (map.rs)
    url: https://github.com/Kalmarv/primase/blob/main/worlds/gta/src/rage/map.rs
---

A YMAP places entities; a YTYP defines the archetypes those entities name. Both are
[META resources](/engines/rage/data-model/meta/), so their stored descriptions identify fields rather than requiring
a single hard-coded record layout for every file. :observed

## Map data

`CMapData` holds its name hash, parent-map hash, flags, content flags, streaming extents, entity extents, entity
array and physics-dictionary references. A zero parent hash means no parent map. :observed

| Field group | Stored content | Confidence |
|---|---|---|
| `streamingExtentsMin/Max` | Streaming bounding box | :observed |
| `entitiesExtentsMin/Max` | Entity bounding box, separate from the streaming box | :observed |
| `entities` | `CEntityDef` or `CMloInstanceDef` references | :observed |
| `physicsDictionaries` | Collision dictionary hashes | :observed |
| Other arrays | Occluders, grass batches, lights, car generators and extensions | :observed |

A `CEntityDef` names an archetype and carries flags, GUID, position, quaternion, XY and Z scale, parent index, LOD
distances, LOD level, child count, priority, ambient-occlusion values and tint value. The two scale fields represent
`(scaleXY, scaleXY, scaleZ)`. :observed

The world coordinate frame is east, north, up, in metres. Ordinary entity orientation uses the conjugate of the
stored `(x,y,z,w)` quaternion; an interior instance uses its stored quaternion directly. :observed

## Archetypes

`CMapTypes` contains archetypes of three kinds. :observed

| Structure | Additional role | Confidence |
|---|---|---|
| `CBaseArchetypeDef` | Base asset definition | :observed |
| `CTimeArchetypeDef` | Adds `timeFlags`, selecting hours | :observed |
| `CMloArchetypeDef` | Interior with local entities, rooms, portals and entity sets | :observed |

The base definition holds name, LOD distance, flags, special attribute, bounding box and sphere, HD texture
distance, texture/clip/drawable/physics dictionary hashes, asset type and asset-name hash. :observed

| Asset type | Payload | Confidence |
|---|---|---|
| 0 | Uninitialized | :sourced[CodeWalker] |
| 1 | Fragment (`yft`) | :sourced[CodeWalker] |
| 2 | Drawable (`ydr`) | :sourced[CodeWalker] |
| 3 | Drawable-dictionary (`ydd`) entry | :sourced[CodeWalker] |
| 4 | Asset-less | :sourced[CodeWalker] |

An interior's local placements inherit the placed instance's rotation and position. Script-controlled entity sets
are separate from that interior's base entity list. :observed

## Streaming and scripts

Map flag bit 0 marks script-managed maps, commonly requested as IPLs. A child map whose parent chain reaches a
script-managed map shares that activation dependency. The stored bit does not establish whether startup scripts
activate that map in a particular save. :observed

Story and Online select different active files through [mount changes](/engines/rage/archives/mounts/). Keeping both
sets simultaneously without their state conditions can duplicate mutually exclusive world content. :observed

:::open[What is the complete startup IPL and interior-entity-set state?]
Map and archetype files describe available content; they do not establish all script requests for a save or mission.
:unknown
:::

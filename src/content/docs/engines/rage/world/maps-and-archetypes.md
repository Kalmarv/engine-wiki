---
title: Maps and archetypes
description: YMAP placements, YTYP archetypes, transforms, streaming extents, interiors and scripted map state.
games: [gta-v]
sources:
  - title: CodeWalker
    url: https://github.com/dexyfex/CodeWalker
    note: YmapFile, YtypFile and META structure names.
  - title: ragekit
    url: https://github.com/RatPrez/ragekit
    note: interior rotation checked against the game's interior proxies
implementations:
  - name: rage-engine-formats (map.rs)
    url: https://github.com/Kalmarv/rage-engine-formats/blob/main/src/map.rs
---

A YMAP places entities; a YTYP defines the archetypes those entities name. Both are
[META resources](/engines/rage/data-model/meta/), so their stored descriptions identify fields rather than requiring
a single hard-coded record layout for every file. :proven

Every one of the install's 19,941 YMAP and 2,869 YTYP copies decodes through its full META tree, with no refused files
or unreached data-block bytes. This covers the stored map/archetype fields and enum descriptions below, while
runtime orientation and activation rules retain their separate observation scope. :proven[all YMAP and YTYP entries]

## Map data

`CMapData` holds its name hash, parent-map hash, flags, content flags, streaming extents, entity extents, entity
array and physics-dictionary references. A zero parent hash means no parent map. :proven

| Field group | Stored content | Confidence |
|---|---|---|
| `streamingExtentsMin/Max` | Streaming bounding box | :proven |
| `entitiesExtentsMin/Max` | Entity bounding box, separate from the streaming box | :proven |
| `entities` | `CEntityDef` or `CMloInstanceDef` references | :proven |
| `physicsDictionaries` | Collision dictionary hashes | :proven |
| Other arrays | Occluders, grass batches, lights, car generators and extensions | :proven |

A `CEntityDef` names an archetype and carries flags, GUID, position, quaternion, XY and Z scale, parent index, LOD
distances, LOD level, child count, priority, ambient-occlusion values and tint value. The two scale fields represent
`(scaleXY, scaleXY, scaleZ)`. :proven

The world coordinate frame is east, north, up, in metres. Ordinary entity orientation uses the conjugate of the
stored `(x,y,z,w)` quaternion; an interior instance uses its stored quaternion directly. :observed
The interior rule has a check against the game's own data: in the interior proxies of `gta5_cache_y.dat` the stored
quaternion fits 163 rotated interiors and its conjugate fits none. :sourced[ragekit] The ordinary-entity convention
comes from CodeWalker, and the other readers copy it rather than confirm it. :sourced[CodeWalker]

## Archetypes

`CMapTypes` contains archetypes of three kinds. :proven

| Structure | Additional role | Confidence |
|---|---|---|
| `CBaseArchetypeDef` | Base asset definition | :proven |
| `CTimeArchetypeDef` | Adds `timeFlags`, selecting hours | :proven |
| `CMloArchetypeDef` | Interior with local entities, rooms, portals and entity sets | :proven |

The base definition holds name, LOD distance, flags, special attribute, bounding box and sphere, HD texture
distance, texture/clip/drawable/physics dictionary hashes, asset type and asset-name hash. :proven

| Asset type | Payload | Confidence |
|---|---|---|
| 0 | Uninitialized | :proven |
| 1 | Fragment (`yft`) | :proven |
| 2 | Drawable (`ydr`) | :proven |
| 3 | Drawable-dictionary (`ydd`) entry | :proven |
| 4 | Asset-less | :proven |

An interior's local placements inherit the placed instance's rotation and position. Script-controlled entity sets
are separate from that interior's base entity list. :observed

## Streaming and scripts

Map flag bit 0 marks script-managed maps, commonly requested as IPLs. A child map whose parent chain reaches a
script-managed map shares that activation dependency. The stored bit does not establish whether startup scripts
activate that map in a particular save. :observed

Story and Online select different active files through [mount changes](/engines/rage/archives/mounts/). Keeping both
sets simultaneously without their state conditions can duplicate mutually exclusive world content. :observed

## Content outside the maps

Some visible world objects are in no map file. The Del Perro pier Ferris wheel, `prop_ld_ferris_wheel`, is spawned
by scripts (`am_ferriswheel.ysc`, `bigwheel.ysc`, `armenian1.ysc`, `finalec2.ysc`) with its hub at
(−1663.97, −1126.70, 30.70) and 16 `prop_ferris_car_01` cars at radius 15.5 m, every 22.5°. :observed

Street litter such as bottles, cans and paper is absent from the map placements. :observed It is spawned as
procedural objects, which the procedural ID of [collision materials](/engines/rage/collision/bounds/) selects.
:inferred

:::open[What is the complete startup IPL and interior-entity-set state?]
Map and archetype files describe available content; they do not establish all script requests for a save or mission.
:unknown
:::

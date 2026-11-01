---
title: Hand-placed instances (.pvs)
description: The ribbon file that places everything not placed by a .pgeo rule in Forza Horizon 6, its sections, transform and instance records, gameplay records and model bounds.
implementations:
  - name: forzatech-formats (pvs.rs)
    url: https://github.com/Kalmarv/forzatech-formats/blob/main/src/pvs.rs
  - name: forzatech-formats (world.rs)
    url: https://github.com/Kalmarv/forzatech-formats/blob/main/src/world.rs
  - name: forzatech-formats (track.rs)
    url: https://github.com/Kalmarv/forzatech-formats/blob/main/src/track.rs
---

Everything not placed by a [`.pgeo` rule](/engines/forzatech/world/pgeo-placements/) is in one file per track,
`Ribbon_00\<track>_00.pvs`: prefab sign gantries, viaduct decks and bridges, landmarks, platforms, rocks, the Houdini-generated
buildings, roofs, plinths and cables (`hda_*` folders), the heightfield terrain clusters, distance proxies and the vista
backdrops. The executable's RTTI names the types `PVSModelInstance` and `PVSVisibleModelInstance`. :observed

Two files of the install are version `0xA4`: `brio_00.pvs` (42,782,135 bytes) and `Stripped\gs\generalsceneassets.pvs`
(381,229 bytes), which is the header and texture descriptors only. Both read to their last byte under the layout below, every
constant holding and every reference (an instance's transform, parent, gameplay record, frame and LOD rows; a LOD row's model;
a transform's clip and LOD profile group; a texture key's descriptor; a clip record's file) pointing inside what it refers to,
on every record. :proven[both files] The `homespace02` file (82,789 bytes) is version `0x63`, a different layout.
:observed Counts are those of `brio_00.pvs`.

## Sections

Little-endian, in order; every boundary comes from a count in the file and is asserted where the next section starts, with
no searching. :observed

| Section | Content | Confidence |
|---|---|---|
| header | 0x21 bytes: `SVPF`, u32 `0xA4`, u32 8, u32 0, u32 0, u8 world (1 when the world sections are present, 0 for the texture-only file), u32 6, a u32 (14,000,000 in Brio, 0 in the general file), u32 0 | :proven |
| megatextures | `u8 0`, 1,476 × 8 B entries, `u32`, `u8 1`, then 1,476 × `{ u32 len, name, u32, u32 }` | :proven |
| bounds | `u32, u32`, `u32 n` (76,907), n × 29 B `{ u32, u8 (0 or 0xFF), f32 centre[3], f16[4], u16 0, i16 }` | :proven |
| gameplay records | `u32, u32, u32 n` (120,225), `u32 count` (1,079), then `{ u8 nRoutes, u8 season mask, u16 routes[nRoutes], i32 link, cstring tag }` | :proven |
| per-pgeo-id | `u32 n + i32[n]` (mostly −1), `u32 n + u8[n]` (0xFF or 0x01) | :proven |
| index tables | `u32 0, u32 k` (5), k × `{ u32 own index, u32 n, i32[n] }`; 15,104 entries each in Brio | :proven |
| fixed block | 49 bytes, `u32 n + n × 8 B`, `u8 0` | :proven |
| texture descriptors | `u32 n` (48,733 in Brio; 6,807 in the general file) × 56 B | :proven |
| shaders, materials | `u32 n` × `{ u32 hash, u32 len, path }`, twice (46 shaders, 419 materials) | :proven |
| models | `u32 n` (134,330) + `u32[n]` | :proven |
| cells | `u32 n` (41,106) × 12 B `{ u32 reference, u32 reference, u8 level, u8[3] = 0 }`, see [Cells](#cells) | :proven |
| dependency blocks | `u32 n` (17,560) × `{ u32 k, k × 8 B }` | :proven |
| frames | `u32 n` (5,489) × 48 B: the ModulateConstants table (below) | :proven |
| transforms | `u32 n` (111,452) × 58 B (below) | :proven |
| LOD rows | `u32 n` (593,706) × `{ u32 model, u32 instance }`, sorted by instance; model = `brioout.N` | :proven |
| LOD profiles | `u32 groups` (155) × `{ u32 n, n × 50 B }`, 2,232 records; see [LODs and clusters](/engines/forzatech/geometry/lods-and-clusters/) | :proven |
| instances | `u32 n` (154,254) × 35 B (below) | :proven |
| model bounds | `u32 0, u32 n` (= models, 134,330) × the record below | :proven |
| tail | `u32 len + brioout`, `u8[3]`, 14 animation clip names, `u32 0` × 3, `u32[3]`, 48,733 × `{ u32 key, u32 descriptor }` (keys strictly increasing, the descriptors a permutation of the texture descriptors), `u8 0`, 5 clip files `{ u64 hash, string path }`, 14 clip records `{ u32 id, u64 file hash, u32[3] }`, `u32` | :proven |

The shader and material paths are `game:\media\tracks\brio\bin\<name>`, where `<name>` is the `Name` of the `bin.zip`
[asset manifest](/engines/forzatech/data-model/asset-manifest/#the-names-in-brio_00pvs) (`bin\` is the archive), on all 465 names. :proven
The loose manifest lists the file's textures, models and instances: its model numbers are the file's, and every LOD row is
named by one of its `Instance` elements. :proven

The meaning of the index tables, the fixed block, the dependency blocks, the per-pgeo-id tables and the tail's `u32` words is
not established: the bytes are read and accounted for. :unknown

## Records

```layout
title: PVS transform record
size: 58
games: [fh6]
note: "Little-endian. Row-vector 3×3 with the scale baked in; apply as p' = p · M + pos, also for the world-baked Houdini pieces, which share one 90°-about-Y record."
fields:
  - {at: 0, size: 2, type: u16, name: animation clip index, level: observed, note: "0xFFFF for none; below the number of clip names in the tail"}
  - {at: 2, size: 2, type: u16, name: clip index repeat, level: proven, note: "equal to the u16 at 0 on all 111,452 transforms"}
  - {at: 4, size: 1, type: u8, name: no-group flag, level: proven, note: "0 when the transform has a LOD profile group, 1 when it has none (byte 56 is 0xFF); both on all 111,452 transforms"}
  - {at: 5, size: 12, type: "f32[3]", name: position, level: observed}
  - {at: 17, size: 18, type: "f16[9]", name: matrix, level: observed}
  - {at: 35, size: 16, type: "f32[4]", name: tint, level: observed, note: "record tint.x is the likely source of INSTANCE_VARIATION for ribbon instances"}
  - {at: 51, size: 4, type: u32, name: zero, value: 0, level: proven}
  - {at: 55, size: 1, type: u8, name: material variant, level: observed, note: "row of the Modl variant table"}
  - {at: 56, size: 1, type: u8, name: LOD profile group, level: proven, note: "0xFF for none; otherwise below the number of LOD profile groups (155)"}
  - {at: 57, size: 1, type: u8, name: group mirror, level: proven, note: "0 with a LOD profile group, 0xFF without"}
```

```layout
title: PVS instance record
size: 35
games: [fh6]
fields:
  - {at: 0, size: 4, type: u32, name: unknown, level: unknown}
  - {at: 4, size: 2, type: u16, name: flags, level: observed, note: "0x40 = catalogue copy"}
  - {at: 6, size: 2, type: u16, name: unknown, level: unknown}
  - {at: 8, size: 4, type: i32, name: transform index, level: proven, note: "below the number of transforms on all 154,254 instances"}
  - {at: 12, size: 4, type: i32, name: HLOD parent, level: proven, note: "-1 = none, else an instance index"}
  - {at: 16, size: 1, type: u8, name: HLOD flag, level: proven, note: "1 exactly when the HLOD parent is set, else 0xFF"}
  - {at: 17, size: 2, type: i16, name: gameplay record, level: proven, note: "-1 = none, else an index into the gameplay records"}
  - {at: 19, size: 4, type: i32, name: minus one, value: -1, level: proven}
  - {at: 23, size: 4, type: u32, name: first LOD row, level: proven, note: "the first row of the instance; the first rows ascend and the rows between them belong to the instance"}
  - {at: 27, size: 6, type: "u8[6]", name: band rows, level: proven, note: "per LOD profile band, the index (counted from the first row) of the LOD row drawn there; 0x7F = nothing"}
  - {at: 33, size: 2, type: u16, name: frame, level: proven, note: "index into the frames table"}
```

An instance's models are the LOD rows from its first row to the next instance's. :proven Model number *N* is the id of a
`ChunkMap` record of type 4 (a `.modelbin`, all of them in `GeoChunk0`): the ids of all 113,868 type-4 records are model numbers
below the 134,330 of the file's list, so the record names the exact file, template and LOD cluster. The other 20,462 model
numbers have no entry in the install, and 19,436 of them are used by LOD rows (of the 130,240 model numbers the rows use).
:proven[brio_00.pvs and the four chunk maps] A checked 1% sample of 1,098 multi-LOD instances shows band *k* names the row whose model LOD is *k* (or repeats
the previous row) in 1,096; the two others have no LOD0 row (rows LOD1 to LOD4, band 0 points at LOD1). So the model drawn
close up is the one named by band 0, not the first row. :observed

**Frames (ModulateConstants).** A 48-byte record `{ float4 c0 = (origin xyz, absolute world, 0), float4 c1 = (unit axis A,
scale), float4 c2 = (axis B, scale) }`; record 0 is all zeros (no modulate). For city buildings A is the facade axis, B is
(0, 1, 0), the scales are −1/14 (a 14 m repeat) and the origin is the building centre. A frame is indexed by a `.pgeo` record's
u16 at +0x3E and by a ribbon instance's `frame`. :observed

**Model bounds.** Each record is an oriented box in model space: `u32 k, u32[k], u8, f32 centre[3], f16 half[3], f16 axes[9],
u16, u8`; a corner is `centre + Σ ±half_i × axis_i` with `axis_i` row *i* of the axes, which are orthonormal on every
record (83,025 identity, 51,227 rotated). The vertices of 44,976 of 44,987 shipped models with rotated axes lie inside their
oriented box; the other 10 are cable LOD2 and LOD3 files that poke out by at most 5.2 cm (plus `ocean_vista`). Read as an
axis-aligned centre ± half only 4,734 do. The boxes contain every vertex of 113,811 of the 113,823 shipped models that
carry them. 78 models carry the empty sentinel (centre 0, half −1, −1, −1). One record is saturated: `ocean_vista` has half
(65504, 375, 65504), the largest finite f16, and its vertices reach 30.8 km past that box. :observed

Of the 111,452 transforms, 2,069 have no LOD profile group, and no instance uses one of them. :proven

## Cells

Each cell record holds two `ChunkMap` words of type 12. The second names a `.pvsz` entry of `GeoChunk0`; the first is
the second's id plus `level × 6,851` (level 1, 2 or 3), and names no entry of the install's four chunk maps. :proven Each of the
13,702 `.pvsz` entries is the second word of exactly three records, one per level, and the 41,106 first words are all
different. :proven[brio_00.pvs and the four chunk maps] What the first word refers to, and what the levels mean, is not
established. :unknown

## The catalogue

Instances with flag `0x40` (3,483 of the 154,254, each with its transform at exactly (0, 0, 0) :proven; 790 of them `0x44`) form the **catalogue**: unplaced template
copies, including all 30 `el/` (`gpy_el_*`, evolving world) instances. 43,491 instances in all sit at the origin; being at
the origin is not by itself the catalogue rule. :observed Five instances are the trains: an animation clip index on an
identity transform at the origin with gameplay record 64 (route 0), positioned at run time along their clip. :observed

## Gameplay records

An instance's gameplay record carries routes, a season mask, a link and a tag; 31,918 of 154,254 instances use one. :observed

- Routes: 0 (speed cameras, XP boards, danger signs, mascots, trailblazer markers, the trains); 500 to 546 paired with 500;
  1, 2, 4, 5, 3335, 8003, 8004. :observed
- `link` equals `PhysicsDefinitionIndex` for the `ANIM_CM_*` records, matching `AnimatedCollisionMeshes.xml`; other values
  occur on physics props (reflectors, chairs, smashable boulders). :observed
- Tags: `ESTATE_ENTRANCE_13`, `BARN_FIND_NIS_Pao_89`, `[LEGEND_ISLAND_NORTH_GATE_CLOSED]` and `_OPEN`, `[BRIDGE_PILLARS]`,
  `SPEEDCAMERA_07_LEFT`, `ANIM_CM_E0001_Ambient_HighSpeedTrain_Front`. :observed

The 1,079 records end exactly at the per-pgeo-id table. By kind: route and/or tag 1,040 instances, season mask only 5,526,
link only 25,352 (physics props). :observed

## Which instances draw in the main view

Classified from data, whole map, summer: :observed

| Rule | Data | Instances |
|---|---|---|
| catalogue copy | flags & 0x40 | 3,483 |
| runtime-positioned animation | clip index on an identity transform at the origin | 5 |
| heightfield clusters | any shipped LOD row in `scene/tbheightfield/`; see [Terrain clusters](/engines/forzatech/terrain/heightfield-clusters/) | 23,941 |
| not in the main view | the LOD profile group has no pass-2 record (group 19: passes 0, 1, 8, 9) | 298 with no shipped model; the other 3,153 group-19 instances are the `_cb` terrain underlays |
| distance proxy | band 0 row is 0x7F; the proxy replaces its HLOD children further away | 5,771: all 5,060 `hlod_*` (4,761 with an HLOD parent), all 244 `autouberlod_*`, 361 `*_genmesh_lod1` |
| no shipped model | no band's model is in `ChunkMap0` | 7,163 |
| stripped LOD0 | band 0's model is not shipped, a later band's is | 194 |

Whole map, summer: 110,530 instances draw (spring 110,513, autumn 110,520, winter 112,808). :observed

**Backdrops.** The 167 `vista_*` instances (distant mountains in `models/vista`) and the one `ocean_vista` (`models/water`,
the sea to the horizon, material `Vista_Ocean`, family `ocean_vista`) use LOD profile group 63, whose main-view record draws
band 0 from 0 to 65,504 m; nothing in their rows, flags or groups marks them far-only. Their triangles lie around and beyond
the playable map: of 17,868 near-view terrain clusters (x −9,216..8,192, z −11,264..10,752), the vista triangles (76,785)
overlap 304 and the ocean vista's (7,021) overlap 71, all at the map's edge. :observed

Of the 12,283 ribbon instances whose model is also placed by a `.pgeo`, none lies within 1 mm of such a placement and one
within 5 cm: the game draws both lists. :observed

:::open[What are the index tables, fixed block, dependency blocks and tail words of the .pvs?]
They are read to the last byte and their sizes and constants are known, but what they index or drive is not.
:::

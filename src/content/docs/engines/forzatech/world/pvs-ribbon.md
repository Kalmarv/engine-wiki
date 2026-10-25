---
title: Hand-placed instances (.pvs)
description: The ribbon file that places everything not placed by a .pgeo rule in Forza Horizon 6, its sections, transform and instance records, gameplay records and model bounds.
---

Everything not placed by a [`.pgeo` rule](/engines/forzatech/world/pgeo-placements/) is in one file per track,
`Ribbon_00\<track>_00.pvs`: prefab sign gantries, viaduct decks and bridges, landmarks, platforms, rocks, the Houdini-generated
buildings, roofs, plinths and cables (`hda_*` folders), the heightfield terrain clusters, distance proxies and the vista
backdrops. The executable's RTTI names the types `PVSModelInstance` and `PVSVisibleModelInstance`. :observed

Only version `0xA4` is read: `brio_00.pvs` (42,782,135 bytes) parses through every section up to the model bounds, and
`Stripped\gs\generalsceneassets.pvs` (381,229 bytes) is header and texture descriptors only. The `homespace02` file is
version `0x63`, a different layout. :observed Counts here are from a recorded census of `Brio`, no longer re-checkable.
:observed

## Sections

Little-endian, in order; every boundary comes from a count in the file and is asserted where the next section starts, with
no searching. :observed

| Section | Content | Confidence |
|---|---|---|
| header | 0x21 bytes: `SVPF`, u32 `0xA4`, u32 8, ...; byte 0x14 is 1 when the world sections are present (Brio) and 0 for the texture-only file | :observed |
| megatextures | `u8 0, u32 n, n × 8 B, u32, u8 1, u32 n` then n × `{ u32 len, name, u32, u32 }` | :observed |
| bounds | `u32, u32, u32 n`, n × 29 B `{ u32 transform index, u8, f32 centre[3], f16[4], i16, i16 }` | :observed |
| gameplay records | `u32, u32, u32 n, u32 count` (1,079), then `{ u8 nRoutes, u8 season mask, u16 routes[nRoutes], i32 link, cstring tag }` | :observed |
| per-pgeo-id | `u32 n + i32[n]` (mostly −1), `u32 n + u8[n]` (0xFF or 0x01) | :observed |
| index tables | `u32 0, u32 k` (5), k × `{ u32 index, u32 n, i32[n] }`; 15,104 entries each in Brio | :unknown |
| fixed block | 49 bytes, `u32 n + n × 8 B`, `u8 0` | :unknown |
| texture descriptors | `u32 n` (48,733 in Brio; 6,807 in the general file) × 56 B | :observed |
| shaders, materials | `u32 n` × `{ u32 hash, u32 len, path }`, twice | :observed |
| models | `u32 n` (134,330) + `u32[n]` | :observed |
| cell hierarchy | `u32 n × 12 B` | :unknown |
| dependency blocks | `u32 n × { u32 k, k × 8 B }` | :unknown |
| frames | `u32 n × 48 B`: the ModulateConstants table (below) | :observed |
| transforms | `u32 n × 58 B` (below) | :observed |
| LOD rows | `u32 n × { u32 model, u32 instance }`, sorted by instance; model = `brioout.N` | :observed |
| LOD profiles | `u32 groups × { u32 n, n × 50 B }`, see [LODs and clusters](/engines/forzatech/geometry/lods-and-clusters/) | :observed |
| instances | `u32 n × 35 B` (below) | :observed |
| model bounds | `u32 0, u32 n` (= models) × the record below | :observed |
| tail | 391,399 bytes: `u32 len + brioout`, the 14 animation clip names and GUIDs, then count tables | :unknown |

## Records

```layout
title: PVS transform record
size: 58
games: [fh6]
note: "Little-endian. Row-vector 3×3 with the scale baked in; apply as p' = p · M + pos, also for the world-baked Houdini pieces, which share one 90°-about-Y record."
fields:
  - {at: 0, size: 2, type: u16, name: animation clip index, level: observed, note: "or -1; repeated as the next u16"}
  - {at: 2, size: 2, type: u16, name: clip index repeat, level: observed}
  - {at: 4, size: 1, type: u8, name: unknown, level: unknown}
  - {at: 5, size: 12, type: "f32[3]", name: position, level: observed}
  - {at: 17, size: 18, type: "f16[9]", name: matrix, level: observed}
  - {at: 35, size: 16, type: "f32[4]", name: tint, level: observed, note: "record tint.x is the likely source of INSTANCE_VARIATION for ribbon instances"}
  - {at: 51, size: 4, type: u32, name: zero, value: 0, level: observed}
  - {at: 55, size: 1, type: u8, name: material variant, level: observed, note: "row of the Modl variant table"}
  - {at: 56, size: 1, type: u8, name: LOD profile group, level: observed}
  - {at: 57, size: 1, type: u8, name: unknown, level: unknown}
```

```layout
title: PVS instance record
size: 35
games: [fh6]
fields:
  - {at: 0, size: 4, type: u32, name: unknown, level: unknown}
  - {at: 4, size: 2, type: u16, name: flags, level: observed, note: "0x40 = catalogue copy"}
  - {at: 6, size: 2, type: u16, name: unknown, level: unknown}
  - {at: 8, size: 4, type: i32, name: transform index, level: observed}
  - {at: 12, size: 4, type: i32, name: HLOD parent, level: observed}
  - {at: 16, size: 1, type: u8, name: HLOD flag, level: observed, note: "1 exactly when the HLOD parent is set, else 0xFF"}
  - {at: 17, size: 2, type: i16, name: gameplay record, level: observed, note: "-1 = none"}
  - {at: 19, size: 4, type: i32, name: minus one, value: -1, level: observed}
  - {at: 23, size: 4, type: u32, name: first LOD row, level: observed}
  - {at: 27, size: 6, type: "u8[6]", name: band rows, level: observed, note: "per LOD profile band, the index of the LOD row drawn there; 0x7F = nothing"}
  - {at: 33, size: 2, type: u16, name: frame, level: observed, note: "index into the frames table"}
```

An instance's models are the LOD rows from its first row to the next instance's. Model number *N* maps to an archive entry
through `ChunkMap0.dat` (`type << 24 | id`, type 4 = modelbin) and hence to an exact file, template and LOD cluster.
:observed A checked 1% sample of 1,098 multi-LOD instances shows band *k* names the row whose model LOD is *k* (or repeats
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

## The catalogue

Instances with flag `0x40` (3,483, all at exactly (0, 0, 0); 790 of them `0x44`) form the **catalogue**: unplaced template
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

:::open[What are the index tables, fixed block, cell hierarchy and dependency blocks of the .pvs?]
They are walked past by their counts but not decoded.
:::

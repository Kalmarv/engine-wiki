---
title: Models (.model)
description: "The Sunset Overdrive model asset: quantised vertices, 16-bit indices, the mesh table, the four-LOD look table, UVs, and the sections that are not yet decoded."
sources:
  - title: ALERT (Tkachov)
    url: https://github.com/Tkachov/ALERT
    note: vertex layout of the i16 branch and the packed-normal decoder; its OBJ writer reads the index flag inverted
---

A `.model` asset (8,780 in the install) is a [DAT1 container](/engines/insomniac/data-model/dat1-container/) with the type magic `0x6AE15C79`.
All 8,780 are LZ4-compressed with a zero wrapper tail. :observed Five have no geometry sections (`portal`, `cine_traincrash_rearrooffire_spawner`,
`tb_testbldg_globe_fountain`, `test_trash_can_breakable_stump`, `empty_weapon`); the other 8,775 all have the vertex, index, mesh, look, UV and
material sections below. :observed The geometry is +Y up. :observed

Numbers on this page are from a recorded census of the PC build 3373500; the install is no longer available. :observed

## Sections

| Tag | Name | Size | Content | Confidence |
|---|---|---|---|---|
| `283D0383` | Model Built | 72 B | bounds and the vertex quantisation | :observed |
| `A98BE69B` | vertices | 16 B each | packed position, normal and tangent | :observed |
| `0859863D` | indices | `u16` | plain 16-bit indices, no delta coding | :observed |
| `78D9CBDE` | meshes | 64 B each | one record per submesh | :observed |
| `06EB7EFC` | look | 16 B | four LODs, each (first mesh, mesh count) | :observed |
| `16F3BA18` | UV0 | 4 B per vertex | half-float u, v | :observed |
| `3250BB80` | materials | 32 B each | material path and name offsets | :observed |
| `5CBA9DE9` | vertex colour | | in 1,425 models | :observed |
| `DCA379A2` | skin data | | in 3,470 models | :observed |

### Model Built (`283D0383`, 72 bytes)

```layout
title: Model Built
size: 72
games: [sunset-overdrive]
note: "Little-endian; floats are indexed from 0 in the census."
fields:
  - {at: 0, size: 12, type: "f32[3]", name: bounds centre, level: observed}
  - {at: 12, size: 4, type: f32, name: bounding sphere radius, level: observed}
  - {at: 16, size: 12, type: "f32[3]", name: box half-extents, level: observed, note: "the box is centre ± half-extents"}
  - {at: 28, size: 4, type: u32, name: quantisation word, level: observed, note: "the low nibble N gives the position scale 2^−N; bits 4 to 15 take only the values 0, 16, 32, 48 and are unexplained"}
  - {at: 32, size: 4, type: f32, name: unknown, level: unknown}
  - {at: 36, size: 12, type: "f32[3]", name: LOD switch distances, level: inferred, note: "15, 30, 110 in 6,335 models"}
  - {at: 48, size: 12, type: "f32[3]", name: unknown, level: unknown}
  - {at: 60, size: 4, type: f32, name: unknown, level: unknown, note: "2 in almost every model"}
  - {at: 64, size: 4, type: f32, name: unknown, level: unknown, note: "8 in almost every model"}
  - {at: 68, size: 4, type: u32, name: unknown, level: unknown}
```

The position scale is `2^−(word & 0xF)` with no offset. :observed Evidence: the decoded minimum and maximum equal the stored box within two
quanta in all 5,305 static models (and in 1,078 of 3,470 skinned ones; the other 2,392 skinned models exceed their box); `1x1_plane` (nibble 12)
decodes to ±0.5 and its y of 41 to 0.01001 equal to the built centre; `seafloor_8x8` (nibble 12) to ±4.005 and `seafloor_96x96` (nibble 9) to ±48.01
equal their half-extents (a fixed 1/4096 would give 6.0 for the latter). :observed Nibble distribution: 12 → 7,603 models, 8 → 516, 11 → 366, 10 → 193,
9 → 62, 7 → 22, 5 → 13, 6 → 5. :observed

### Vertices (`A98BE69B`, 16 bytes)

```layout
title: Vertex
size: 16
games: [sunset-overdrive]
fields:
  - {at: 0, size: 6, type: "i16[3]", name: position, level: observed, note: "× 2^−N, no offset"}
  - {at: 6, size: 2, type: i16, name: w, level: observed, note: "±32767 in most models; possibly a bitangent sign"}
  - {at: 8, size: 4, type: u32, name: packed normal, level: observed, note: "the plane's word 0x200FFE00 decodes to (0, 1, 0) with the ALERT decoder"}
  - {at: 12, size: 4, type: u32, name: tangent, level: unknown, note: "probably a packed tangent"}
```

The layout is the same as ALERT's Sunset Overdrive branch. :sourced[ALERT] Whether the normals are unit length over all vertices, and the vertex-colour
format (probably a `u32` per vertex), are not checked. :unknown

### Meshes (`78D9CBDE`, 64 bytes)

```layout
title: Mesh entry
size: 64
games: [sunset-overdrive]
fields:
  - {at: 0, size: 16, type: "f32[4]", name: bounding sphere, level: observed, note: "centre xyz and radius"}
  - {at: 16, size: 4, type: u32, name: vertex start, level: observed}
  - {at: 20, size: 4, type: u32, name: index start, level: observed}
  - {at: 24, size: 4, type: u32, name: index count, level: observed, note: "a multiple of 3"}
  - {at: 28, size: 4, type: u32, name: vertex count, level: observed, note: "upper 16 bits always 0"}
  - {at: 32, size: 2, type: u16, name: flags, level: observed, note: "bit 0x10: indices are relative to the vertex start"}
  - {at: 34, size: 2, type: u16, name: material index, level: inferred, note: "0 to 49; from ALERT's layout"}
  - {at: 36, size: 28, type: "u8[28]", name: unknown, level: unknown}
```

Over 37,148 meshes: `vertex start + vertex count` never exceeds the vertex count, `index start + index count` never exceeds the index count. :observed
**Flag `0x10` means the indices are relative to the vertex start.** All 17,152 meshes with the flag have indices below their vertex count; of the 13,418
meshes without it and with a vertex start above 0, all have absolute indices within `[vertex start, vertex start + vertex count)`; no mesh fits neither.
:observed ALERT's OBJ writer tests `(flags & 0x10) == 0` for "relative", the opposite. :observed

In 3,365 models the per-mesh vertex counts do not sum to the vertex total (the sum equals it in 5,410 of 8,775); the cause (LODs or meshes sharing
vertex ranges, overlap versus gaps) is not established. :unknown

### Look (`06EB7EFC`) and LODs

Four (`u16` first mesh, `u16` mesh count) pairs, one per LOD. Over the 8,775 models with geometry the distinct ranges are contiguous and together
cover every mesh exactly. A model with fewer LODs repeats the last range: 4,225 models have 1 distinct LOD, 698 have 2, 3,759 have 3 and 93 have 4. :observed

### UV0 (`16F3BA18`)

Half-float u, v at 4 bytes per vertex. On the 1 × 1 plane it gives (0,0), (0,1), (1,1), (1,0) with `u = x + 0.5` and `v = z + 0.5`. Some models use 8 bytes per
vertex (the ALERT `get_uv` variant); the second pair is probably a second UV set. Their count is not established. :observed

### Materials (`3250BB80`, 32 bytes)

Per entry a `u32` string offset for the `.material` path, a `u32` for the material name, then six `u32` (zero in the fixtures). The layout is taken from ALERT and
the sampled strings match. :sourced[ALERT]

## Handedness

The 1 × 1 plane is symmetric and cannot show a mirror. Triangle (0, 1, 2) of the plane winds counter-clockwise about +Y in a right-handed frame, but whether
the engine's frame is left- or right-handed has not been decided. :unknown

:::open[What is the handedness of Sunset Overdrive's world?]
It needs an asymmetric reference: text geometry, a decal carrying text, or the minimap overlaid with zone placements (the hex placements are in world
coordinates, [Zones](/engines/insomniac/world/zone/)).
:::

:::open[What do the unexplained bits of the quantisation word, the vertex w and the 8-byte UV variant mean?]
Bits 4 to 15 of the word at +28 of Model Built take only 0, 16, 32, 48; vertex w is ±32767 in most models; some models carry a second UV pair. Skinned models
(3,470) exceed their box, so skinning is needed to place them, which was not decoded.
:::

---
title: Models (.modelbin)
description: The Forza Horizon 6 model container, its mesh record, vertex layouts, quantisation, draw buckets and how a mesh decodes to triangles.
sources:
  - title: ForzaTools
    url: https://github.com/Nenkai/ForzaTools
    note: Grub and modelbin reader for Forza Horizon 5; its mesh record stops at an older version than FH6 uses
  - title: ForzaTech-extraction-tools
    url: https://github.com/Doliman100/ForzaTech-extraction-tools
    note: modelbin extraction for FH5
---

Every model of the game is a `.modelbin`, a [Grub bundle](/engines/forzatech/data-model/grub-bundle/) with a header blob
(`Modl`), one record per mesh (`Mesh`), vertex layouts (`VLay`), one index buffer (`IndB`), vertex buffers (`VerB`) and
material instances (`MatI`). A model is one level of detail of a template: a building has one file per LOD, and files
whose names end `_clusterNNN.i.modelbin` are those levels or pieces of a smashable ([LODs and clusters](/engines/forzatech/geometry/lods-and-clusters/)).
:observed

The FH6 mesh record (version 1.13) is where FH6 diverges from FH4 and FH5 and where the published readers stop working.
:sourced[ForzaTools]

All counts below come from a recorded census of the Tokyo track `Brio`, where `GeoChunk0` holds 113,868 modelbins with
407,461 meshes; the install is no longer available to re-check. :observed

## Modl

```layout
title: Modl blob
size: variable
games: [fh6]
note: "Little-endian. Fields after the LOD flags appear from the blob version shown."
fields:
  - {at: 0, size: 2, type: u16, name: mesh count, level: observed}
  - {at: 2, size: 2, type: u16, name: buffer count, level: observed}
  - {at: 4, size: 2, type: u16, name: vertex layout count, level: observed}
  - {at: 6, size: 2, type: u16, name: material count, level: observed}
  - {at: 8, size: 1, type: u8, name: has LOD, level: observed}
  - {at: 9, size: 1, type: i8, name: min LOD, level: observed}
  - {at: 10, size: 1, type: i8, name: max LOD, level: observed}
  - {at: 11, size: 1, type: u8, name: padding, level: observed}
  - {at: 12, size: 2, type: u16, name: LOD flags, level: observed, note: "bit 1 is LOD0, bit i+1 is LOD i"}
  - {at: 14, size: 2, type: "u8[2]", name: decompress flags, level: observed, note: "v1.2 and later: u8 flags, u8 padding"}
  - {at: 16, size: 1, type: u8, name: retain CPU buffer copy, level: observed, note: "v1.3 and later"}
  - {at: 17, size: 1, type: u8, name: visibility flags, level: observed, note: "v1.4 and later"}
  - {at: 18, size: 4, type: u32, name: variant count, level: observed, note: "v1.5 and later, followed by variant count × mesh count bytes: the material variant table"}
```

In `.i.modelbin` files `minLOD` and `maxLOD` are equal (4,992 of 4,992 checked). In animated `.a.modelbin` files all LODs
share one file and the pair is stored as (coarsest, finest), for example `min=4 max=0` with LOD flags `0x3E`. :observed

### Material variants

Row *v* of the variant table gives, for every mesh in file order, the index of the material group that mesh uses in
variant *v*; row 0 is the base look. A placement picks its row with a byte of its own record ([placements](/engines/forzatech/world/pgeo-placements/),
[hand-placed instances](/engines/forzatech/world/pvs-ribbon/)). This is how one facade model shows different signs, colour
schemes or window types. :observed The material named `…_VARIANT_k` is not reliably the one row *k* selects; in about
28% of models it is not. :observed

The table length is exactly `22 + variant count × mesh count` on all 1,808 v1.5 blobs checked, every entry is below its
mesh's group count and row 0 is all zeros. :observed A sample of 90,000 `.pgeo` records has 42,000 of 42,000 indices
below the model's variant count and 47,500 of 47,500 zeros on models without a table. :observed

## Buffers

`IndB`, `VerB` and `MBuf` blobs share a header:

```layout
title: Buffer blob header
size: 16
games: [fh6]
note: "From blob version 1: 16 bytes. Before: 12 bytes with two padding bytes in place of the sub-element count and format."
fields:
  - {at: 0, size: 4, type: i32, name: length, level: observed}
  - {at: 4, size: 4, type: i32, name: size, level: observed, note: "bytes of payload; or length × stride"}
  - {at: 8, size: 2, type: u16, name: stride, level: observed}
  - {at: 10, size: 1, type: u8, name: sub-element count, level: observed}
  - {at: 11, size: 1, type: u8, name: padding, level: observed}
  - {at: 12, size: 4, type: u32, name: DXGI format, level: observed}
```

## Vertex layout (VLay)

A `VLay` blob lists semantic names, then elements of 20 bytes each, then one packed format word per element and, from
v1.1, a flags word. :observed

```layout
title: Vertex layout element
size: 20
games: [fh6]
fields:
  - {at: 0, size: 2, type: i16, name: semantic name index, level: observed}
  - {at: 2, size: 2, type: i16, name: semantic index, level: observed}
  - {at: 4, size: 2, type: i16, name: input slot, level: observed}
  - {at: 6, size: 2, type: i16, name: input slot class, level: observed}
  - {at: 8, size: 4, type: i32, name: DXGI format, level: observed}
  - {at: 12, size: 4, type: i32, name: aligned byte offset, level: observed, note: "-1 means append: accumulate the element sizes of the slot in declaration order"}
  - {at: 16, size: 4, type: i32, name: instance data step rate, level: observed}
```

Slot 0 is normally the position stream; slot 1 packs normals, UVs, colour and tangents. :observed

Across all 113,868 models the only elements are the ones below, and every element uses the append offset. :observed

| Semantic | DXGI format | Decoding | Confidence |
|---|---|---|---|
| `POSITION0` (slot 0) | 13 R16G16B16A16_SNORM | `s16 / 32767` ×3 (−32768 clamps to −1), then `raw × positionScale + positionTranslate`; w feeds the normal | :observed |
| `NORMAL0` | 37 R16G16_SNORM | `(position.w, s16/32767, s16/32767)`, normalised | :observed |
| `TEXCOORD0` to `TEXCOORD4` | 35 R16G16_UNORM | `u16 / 65535`, then the mesh's per-set transform | :observed |
| `COLOR0` | 28 R8G8B8A8_UNORM | four bytes / 255 | :observed |
| `TANGENT0` to `TANGENT4` | 24 R10G10B10A2_UNORM | one tangent per UV set, `xyz × 2 − 1` normalised; the high bit of the 2-bit field is the bitangent sign | :observed |

The float variants (formats 6, 10, 16, 2) of these semantics are read by the reference decoder but no FH6 model
uses them. :observed 449 vertices in 79 meshes have a stored normal of (0, 0, 0). :observed

### Tangent frame and texture coordinates

`B = (a ≥ 2 ? +1 : −1) × cross(N, T)` points along +v of UV set *k*, with D3D's v pointing down the image. Against the UV
derivatives of every mesh, T agrees with dP/du for 74.4 million sampled triangles and opposes it for 0.24 million; the
signed bitangent agrees with dP/dv for 73.6 million and opposes it for 52,000. :observed The low bit of the 2-bit field is
not decoded. :unknown

Texture coordinates are normalised: the mesh carries five transforms `(uOffset, uScale, vOffset, vScale)` and the vertex
shaders compute `TEXCOORDn = in × scale + offset`. Non-identity transforms are common (texture-atlas sub-rectangles). The
base colour samples `TEXCOORD0` in the environment shaders and the signage mask samples `TEXCOORD3`. :observed

On `COLOR0`, the environment shaders read `.xy`: red switches the swatch tint off and green is the palette column ([Environment shaders](/engines/forzatech/shaders/environment/)). :observed

## Mesh record (version 1.13)

```layout
title: Mesh record
size: variable
games: [fh6]
note: "Little-endian. Fields marked with a version appear from that blob version on; offsets are given for the 1.13 layout in reading order, with variable parts called out."
fields:
  - {at: 0, size: 4, type: i32, name: material group count, level: observed, note: "v1.13"}
  - {at: 4, size: "8 × group count", type: "i16[4][]", name: material ids, level: observed, note: "v1.9 and later: spring, summer, autumn, winter per group; -1 means the group's summer id. Before: one i16"}
  - {at: "after groups", size: 2, type: i16, name: rigid bone index, level: observed}
  - {at: "+2", size: 2, type: u16, name: LOD flags, level: observed}
  - {at: "+4", size: 2, type: "u8[2]", name: LOD level 1 and 2, level: observed}
  - {at: "+6", size: 2, type: u16, name: bucket flags, level: observed, note: "see below"}
  - {at: "+8", size: 1, type: u8, name: bucket order, level: observed}
  - {at: "+9", size: 1, type: u8, name: skinning elements count, level: observed, note: "v1.2 and later"}
  - {at: "+10", size: 4, type: u32, name: morph target count, level: observed, note: "v1.10 and later; a u8 before"}
  - {at: "+14", size: 1, type: u8, name: is morph damage, level: observed, note: "v1.3 and later"}
  - {at: "+15", size: 1, type: u8, name: is 32-bit indices, level: observed}
  - {at: "+16", size: 2, type: u16, name: topology, level: observed, note: "4 = triangle list on all 407,461 meshes"}
  - {at: "+18", size: 4, type: i32, name: index buffer index, level: observed}
  - {at: "+22", size: 4, type: i32, name: index buffer offset, level: observed}
  - {at: "+26", size: 4, type: i32, name: index buffer draw offset, level: observed, note: "start index, in indices"}
  - {at: "+30", size: 4, type: i32, name: indexed vertex offset, level: observed, note: "added to every vertex id"}
  - {at: "+34", size: 4, type: i32, name: index count, level: observed}
  - {at: "+38", size: 4, type: i32, name: primitive count, level: observed, note: "primitive count × 3 = index count on every mesh"}
  - {at: "+42", size: 8, type: "f32, u32", name: ACMR and referenced vertex count, level: observed, note: "v1.6 and later"}
  - {at: "+50", size: "4 + 4n", type: "u32[]", name: referenced vertex indices, level: observed, note: "v1.11 and later"}
  - {at: "next", size: 4, type: i32, name: vertex layout index, level: observed}
  - {at: "+4", size: "4 + 20 × buffers", type: "buffer ref[]", name: vertex buffers, level: observed, note: "count, then per buffer i32 buffer id, u32 input slot, u32 stride, u32 offset and, v1.12 and later, a u32 reserved"}
  - {at: "next", size: 8, type: "i32[2]", name: morph and skinning buffer indices, level: observed, note: "v1.4 and later"}
  - {at: "next", size: "4 + 4n", type: "i32[]", name: constant buffers, level: observed}
  - {at: "next", size: 4, type: u32, name: source mesh index, level: observed, note: "v1.1 and later"}
  - {at: "next", size: 80, type: "f32[4][5]", name: texture coordinate transforms, level: observed, note: "v1.5 and later: five (uOffset, uScale, vOffset, vScale)"}
  - {at: "next", size: 32, type: "f32[4][2]", name: position scale and translate, level: observed, note: "v1.8 and later"}
```

Each mesh has index buffer index 0, which is also that blob's id; the mesh draws `index count` indices from
`index buffer offset + draw offset × index stride`, with 4-byte indices when the flag is set. :observed No mesh has a
(0, 0, 0) position scale. :observed

### Draw buckets

`bucket flags` bits: `0x01` opaque, `0x02` decal, `0x04` transparent, `0x08` shadow, `0x10` not shadow, `0x20`
alpha-to-coverage, `0x40` occluder. Values seen in Brio are 0x18, 0x19, 0x1C, 0x38 (foliage, impostors), 0x3C and 0x58
(occluders). :observed

Two kinds of mesh are never drawn in the main view: those with bit `0x40` (every `OCC_*` mesh has it and no other does:
5,938 of 5,938 in `GeoChunk0`; they carry POSITION only and no NORMAL), and those with `bucket & 0x27 == 0` (no colour pass:
flattenable-bush proxies, area bounds, development meshes). :observed Shadow-only meshes (0x08 set, 0x10 clear) do not occur
in Brio. A test of `bucket & 7` alone is wrong because foliage is `0x38`. :observed Terrain decals carry bucket `0x38`, not
the decal bit. :observed

## Decoding a mesh

1. Read `index count` indices from the index buffer at `index buffer offset + draw offset × stride`. :observed
2. The vertex range is `min index + indexed vertex offset` to `max index + indexed vertex offset`. :observed
3. For each layout element, take the vertex buffer whose input slot matches and read
   `offset + (index + indexed vertex offset) × stride + element offset`. Every vertex of every mesh lies inside its
   stream. :observed
4. Triangles wind (A, C, B) for a left-handed frame; the engine's frame is Y-up left-handed in metres. :observed

Decoding all 113,868 `GeoChunk0` models strictly (unknown topology, semantic or format, an index or vertex outside its
buffer, a missing NORMAL on a non-occluder, a variant row selecting a missing group, a material id without a `MatI`, a
variant table that does not end at the blob end all count as failures) gave no failures. :observed 5,938 files contain
only occluder meshes. :observed

## Normals at the instance

The instanced vertex shaders (`environment`, `uber_rock`, `uber_rock_array`) place a normal as
`WORLDNORMAL = n.x × row0 + n.y × row1 + n.z × cross(row0, row1)`, with the record's unit rows and no scale, then the pixel
shader normalises it. Positions use the rows times the scale. So on a stretched placement (40% of the Shibuya rows have a
non-uniform scale) the game's normal is the rotated stored normal, not the geometric normal of the stretched
surface. :observed Whether hand-placed instances go through the instanced path (the non-instanced shader reads a separate
normal matrix filled by the CPU) was not traced. :unknown

## Animated models

Five `.a.modelbin` files exist in Brio, all in `GeoChunk0`: the Ferris wheel and Equinox ride, the wind turbine
`inf_lmt_wind_01_a` and the two trains. Their clips are in the track's `animation.zip`. :observed They use the same
bundle with two more blobs: :observed

```layout
title: Skel blob
size: variable
games: [fh6]
note: "Little-endian. The walk ends 4 bytes before the blob end on all five files."
fields:
  - {at: 0, size: 2, type: u16, name: bone count, level: observed}
  - {at: 2, size: 4, type: u32, name: name length, level: observed, note: "per bone, followed by the name"}
  - {at: "per bone", size: 6, type: "i16[3]", name: "parent, first child, next sibling", level: observed, note: "-1 = none"}
  - {at: "per bone", size: 64, type: "f32[16]", name: local rest transform, level: observed, note: "row-vector 4×4, translation in the last row"}
```

The `Skin` blob is one per skinned vertex range, with the buffer header above, DXGI format 34 (R16G16_FLOAT) and stride
4 × influences, each influence an (f16 weight, f16 bone index). The mesh's skinning element count is the influence count
(1 on the turbine and Equinox, 4 on the wheel). :observed

The stored vertices are the bind pose in model space, not bone-local: grouped by dominant bone, each group is centred on
that bone's accumulated rest translation (wind turbine `Rotor_Blades` is at (0, 84.0, −7.19) against a vertex centroid of
(−0.02, 84.16, −7.13)), and every Skel rotation is the identity. Applying the bone transforms again would double the
offsets. :observed Only 8 of 13,310 wheel vertices have more than one non-zero weight. :observed The trains have no LOD0
(`min=3 max=1`). :observed The ribbon places nine of them in the world; the other five instances are the trains, at the
origin with identity transforms, which the game positions at run time along their clip. :observed

## Morph targets

`Mesh.morph target count` is *n* and the morph data buffer index names an `MBuf` blob (buffer header format 10,
R16G16B16A16_FLOAT, sub-element count 2n), one per slot-1 vertex buffer, indexed like it. Per vertex there are 2n half4
values: *n* position deltas then *n* normal deltas; each vector's w is the index of its weight slot in the morph weight
constant buffer, and the `Mrph` blob names the slots as `weight[0]`, `weight[1]`, ... :observed The vertex shader computes
`p += w[slot] × dp` and `n = normalize(n + w[slot] × dn)` per target, in model space before skinning. :observed

Wheels and tyres use morphs to take their size; see [Wheels and tyres](/engines/forzatech/gameplay/car-wheels/). Body
panels carry one target on slot 0 (damage). :observed

:::open[What is the unknown dword of each blob record?]
Offset 20 of the 24-byte blob record is not used by any reader found.
:::

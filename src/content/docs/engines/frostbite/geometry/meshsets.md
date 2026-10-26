---
title: MeshSets and vertex declarations
description: MeshSet LOD pointers, sections, geometry chunks and stored versus draw vertex layouts.
games: [skate]
sources:
  - title: ReSkate resource readers
    url: https://github.com/Dingo-Shenanigans/ReSkate/tree/main/Engine/Resource
implementations:
  - name: primase worlds/frostbite (meshset.rs)
    url: https://github.com/Kalmarv/primase/blob/main/worlds/frostbite/src/meshset.rs
---

A MeshSet resource (`0x49b156d4`) describes LODs and their material sections. Each LOD names a geometry chunk
holding vertex buffers followed by the index buffer. Stored pointers are relative to byte 16 of the resource.
A census reads all 11,619 MeshSets found across the base-game TOCs without parse failures. :proven[all 11,619 MeshSets]

The header holds `u64` LOD pointers starting at `0x30` and a `u16` LOD count at `0xb4`. LODs are located through
those pointers; their allocation stride is not needed to locate the records. :proven[MeshSet census]

A MeshSet is one relocatable block: fixed-size records whose pointers name a pool after them, then a relocation
table, then trailing data that only one development mesh has. Its order is the header, the LOD records, every
LOD's section records, then the pool. Every one of the 47,758 MeshSets of the base data, and its bundle resource
metadata, is written back byte for byte from this description. :proven[all 47,758 MeshSets]

```layout
title: MeshSet header
size: variable
note: "0xd0 bytes, or 0xe0 when the mesh carries bone bounds. Pointers are relative to byte 16."
fields:
  - {at: 0, size: 4, type: u32, name: header bytes minus 16, level: proven}
  - {at: 4, size: 4, type: u32, name: LOD record bytes, level: proven, note: "0xb0, 0xb8 with bone masks, 0xbc with a bone map"}
  - {at: 8, size: 4, type: u32, name: section record bytes, value: 384, level: proven}
  - {at: 12, size: 4, type: bytes, name: unknown, level: unknown}
  - {at: 16, size: 16, type: "f32[4]", name: bounds minimum, level: observed, note: Over every section's bounds.}
  - {at: 32, size: 16, type: "f32[4]", name: bounds maximum, level: observed}
  - {at: 48, size: 56, type: "u64[7]", name: LOD record pointers, level: proven, note: At most seven LODs.}
  - {at: 104, size: 8, type: u64, name: name pointer, level: proven}
  - {at: 112, size: 8, type: u64, name: pointer to the name's last part, level: proven}
  - {at: 120, size: 4, type: u32, name: name hash, level: observed, note: djb2-XOR of the MeshSet name; equals the mesh asset's NameHash.}
  - {at: 180, size: 2, type: u16, name: LOD count, level: proven}
  - {at: 196, size: 2, type: u16, name: bone count, level: proven, note: 0xe0 header only.}
  - {at: 198, size: 2, type: u16, name: bounded bone count, level: proven, note: 0xe0 header only.}
  - {at: 200, size: 8, type: u64, name: bounded bone ids pointer, level: proven, note: "0xe0 header only; u16 each"}
  - {at: 208, size: 8, type: u64, name: bone bounds pointer, level: proven, note: "0xe0 header only; f32x4 minimum and maximum per bounded bone, else per bone"}
```

The pool holds, in order: the bone lists (then 16-aligned); the strings, per LOD its section names then its
`Mesh:<name>_lodN` name, then the MeshSet's name (16-aligned); each LOD's five section-index lists (16-aligned);
each LOD's bone masks (16-aligned) or bone map (4-aligned); the bone ids and bone bounds (each 16-aligned).
The relocation table lists every pointer field as a `u32` of its offset minus 16, in record order. The bundle's
resource metadata is `{table offset, table bytes, trailing bytes, 0}`. :proven[all 47,758 MeshSets]

```layout
title: MeshSet LOD fields
size: variable
note: Little-endian; offsets are relative to the pointed-to LOD record.
fields:
  - {at: 8, size: 4, type: u32, name: section count, level: proven}
  - {at: 12, size: 8, type: u64, name: section array pointer, level: proven}
  - {at: 20, size: 60, type: "{u32, u64}[5]", name: section-index lists, level: proven, note: "Count and pointer of five byte lists, at 12-byte steps"}
  - {at: 80, size: 1, type: u8, name: unknown flags, level: unknown, note: "0x40 or 0x41"}
  - {at: 84, size: 4, type: u32, name: index format, level: proven, note: "0x21 is 16-bit; 0x2e is 32-bit"}
  - {at: 88, size: 4, type: u32, name: index buffer byte count, level: proven}
  - {at: 92, size: 4, type: u32, name: vertex buffer byte count, level: proven, note: "Multiple of 16 in every stock MeshSet; the game also loads community MeshSets that are not (65,400)"}
  - {at: 116, size: 16, type: GUID, name: geometry chunk, level: proven}
  - {at: 140, size: 8, type: u64, name: name pointer, level: proven}
  - {at: 148, size: 8, type: u64, name: pointer to a part of the name, level: proven}
  - {at: 156, size: 8, type: u64, name: pointer to the name's last part, level: proven}
  - {at: 164, size: 4, type: u32, name: path-part name hash, level: observed, note: "djb2-XOR of `<name>_lod0`"}
  - {at: 176, size: variable, type: bytes, name: bone masks or bone map, level: proven, note: "0xb8 records: pointer to a 24-byte bone mask per section; 0xbc records: u32 count, then pointer to u32 bone map"}
```

LOD records are 16-aligned, so a 0xb8- or 0xbc-byte record occupies 192 bytes. :proven[all 47,758 MeshSets]

In the geometry chunk the index data starts at the vertex buffer byte count; indices are relative to their
section. :proven[MeshSet census]

The five lists name the sections each pass draws: list 0 the main pass, list 2 decals, lists 3 and 4 the
depth and shadow passes. The game's opaque shadow-casting sections are in lists 0, 3 and 4 with section flags
`0x0e`; its decal sections are in list 2 alone with flags `0x0a`; its shadow proxies are in lists 3 and 4 with
flags `0x04`. :observed Where a LOD carries shadow-proxy twins of its opaque sections, its primitive counts
summed over all sections are twice the triangles it draws in the main pass. :observed

```layout
title: MeshSet section fields
size: 384
note: Little-endian; undescribed ranges are not interpreted here.
fields:
  - {at: 8, size: 8, type: u64, name: material name pointer, level: proven}
  - {at: 16, size: 8, type: u64, name: bone list pointer, level: proven}
  - {at: 24, size: 2, type: u16, name: bone count, level: proven}
  - {at: 27, size: 1, type: u8, name: flags, level: observed, note: "0x0e opaque shadow-casting, 0x0a decal, 0x04 shadow proxy"}
  - {at: 28, size: 1, type: u8, name: material slot index, level: observed, note: Index in the mesh asset's Materials.}
  - {at: 30, size: 1, type: u8, name: total vertex stride, level: proven}
  - {at: 32, size: 4, type: u32, name: primitive count, level: proven}
  - {at: 36, size: 4, type: u32, name: start index, level: proven}
  - {at: 40, size: 4, type: u32, name: vertex byte offset, level: proven}
  - {at: 44, size: 4, type: u32, name: vertex count, level: proven}
  - {at: 84, size: 4, type: u32, name: repeated vertex byte offset, level: proven}
  - {at: 88, size: 4, type: f32, name: UV0 texel density, level: observed, note: "Median over the triangles of sqrt(UV area / area); 1.0 when no triangle has area"}
  - {at: 92, size: 4, type: f32, name: UV1 texel density, level: observed}
  - {at: 112, size: 100, type: declaration, name: stored vertex declaration, level: proven}
  - {at: 212, size: 100, type: declaration, name: draw vertex declaration, level: proven}
  - {at: 312, size: 8, type: u64, name: material key, level: proven}
  - {at: 320, size: 4, type: u32, name: repeated start index, level: proven}
  - {at: 324, size: 4, type: u32, name: material name hash, level: observed, note: djb2-XOR of the lowercased material name.}
  - {at: 332, size: 4, type: f32, name: surface area, level: observed, note: Square metres.}
  - {at: 336, size: 16, type: "f32[4]", name: bounds minimum, level: observed, note: "w is 0"}
  - {at: 352, size: 16, type: "f32[4]", name: bounds maximum, level: observed}
```

The surface area matches the area of the decoded triangles on the 1,222 rigid Quick Drop sections with UV0
(1st–99th percentile of stored/measured 0.996–1.003), and the UV0 density matches the median per-triangle
`sqrt(UV area / area)` on the same sections (25th–75th percentile 0.996–1.001). The density does not fit sections
whose UVs fold many triangles to nothing. :observed

```layout
title: Vertex declaration
size: 100
fields:
  - {at: 0, size: 64, type: "Element[16]", name: element slots, level: proven, note: Each element is four bytes in usage/format/offset/stream order.}
  - {at: 64, size: 32, type: "u8[16][2]", name: stream descriptors, level: proven, note: First byte of each pair is stride throughout the MeshSet census; second byte's meaning is not established here.}
  - {at: 96, size: 1, type: u8, name: element count, level: proven}
  - {at: 97, size: 1, type: u8, name: stream count, level: proven}
  - {at: 98, size: 2, type: bytes, name: unknown, level: unknown}
```

Stored streams occupy consecutive `stride * vertex_count` ranges from a section's vertex offset. The draw
declaration can reorder elements, supply an unbound element on stream `255`, alias a stored stream or append
runtime streams; 830 measured skinned sections use the latter. Treating the two declarations as interchangeable
loses this distinction. :proven[MeshSet census]

| Usage | Meaning | Common format | Confidence |
|---|---|---|---|
| `1` | Position | Float3 `0x03` or Half4 `0x08` | :observed |
| `2` | Blend indices | UShort4 `0x17` | :observed |
| `4` | Blend weights | UByte4N `0x0d` | :observed |
| `30`, `31` | Color0, Color1 | UByte4N | :observed |
| `33`, `34` | UV0, UV1 | Half2 `0x06` | :observed |
| `51` | Submaterial selector | UByte4 `0x0c` | :observed |
| `52` | Packed tangent space | UByte4N | :observed |

## Packed tangent space

Usage `52` stores a vertex's tangent frame in four bytes (UByte4N). :observed

| Bits | Meaning | Confidence |
|---|---|---|
| Byte 3, bits 0–2 | Largest normal axis and sign: code 0–5 is +x, −x, +y, −y, +z, −z | :observed |
| Byte 3, bit 3 | Bitangent sign, set for −1 | :observed |
| Byte 3, bits 4–5 | Ninth bits of the two other normal components | :observed |
| Byte 3, bits 6–7 | Quadrant of the tangent angle | :observed |
| Bytes 0, 1 | Low eight bits of the two other normal components (axes z,y for codes 0–1; x,z for 2–3; x,y for 4–5); a 9-bit value `q` decodes as `(q-256)/(255*sqrt 2)` | :observed |
| Byte 2 | Angle within the quadrant, 0–255 for 0–90° | :observed |

The largest normal component is the remainder of unit length. The tangent is a reference axis per code
(+z, −z, +x, −x, −x, +x) made perpendicular to the normal and turned about it by the angle,
`t0 cos a + (n × t0) sin a`; the bitangent is `sign * (n × t)`. On the LOD-0 sections of 120 stock Quick Drop
meshes, the decoded normal lies along the face normal (median dot 0.998), the tangent along increasing U (median
1.000) and the bitangent along increasing V (median 0.998). Re-encoding gives back 22,085 of 23,704 stored frames
of 60 one-LOD meshes byte for byte; the rest are the same frame under its second encoding, at a quadrant edge or
between two axes. :observed

## LOD groups

The LOD switch distances are not stored in the MeshSet: the sampled community level Numbani has zero
LOD-distance float fields. Distance policy comes from the mesh's LodGroup. :observed

San Van's level root uses 230 stock LodGroups across 9,579 MeshSets, which have one to six LODs
(762 / 3,527 / 4,009 / 1,145 / 99 / 37). Lod1 is mostly 180, 45, 90 or 112 m, the last switch mostly 180 or 90 m and
the terminal distance 1,000 m. CullScreenArea is 0.005–0.02; about 2,000 meshes set a CullDistance enum value 1–4
(detail, short, medium, long cull), 420 set a ShadowDistance of 5–80 m, and the level has 3,021
DingoDetailFadeComponentData. :observed

The stock `WorldObject_MediumVista_2Lod` group is Lod1 90 m, Lod2 1,000 m, CullScreenArea 0.005 and WpsDistance 4;
`DingoVistaLodGroup` is Lod1 10,000 m with CullScreenArea 0. :observed

| WpsDistance | Meaning | Confidence |
|---|---|---|
| 0 | Persistent | :inferred |
| 1 | ExtraLongCull | :inferred |
| 2 | LongVista | :observed |
| 3 | LongCull | :inferred |
| 4 | MediumVista | :observed |
| 5 | MediumCull | :observed |
| 6 | ShortCull | :observed |
| 7 | DetailCull | :observed |

---
title: Mesh and MeshData
description: Compiled mesh framing, vertex streams, primitive ranges and inline multi-mesh index origins.
games: [riders-republic, ghost-recon-breakpoint]
sources:
  - title: GRB modding reference
    url: https://github.com/dataterminals/grb-modding-knowledgebase/blob/main/docs/10-meshes-and-skeletons.md
implementations:
  - name: primase Anvil mesh reader
    url: https://github.com/Kalmarv/primase/blob/main/worlds/anvil/src/read/mesh.rs
---

A **Mesh** holds compiled vertex streams, triangle indices, primitive partitions and material references. Riders Republic has ranged and inline compiled layouts; the latter can contain several objects sharing buffers. :observed{games="riders-republic"}
Breakpoint also stores primitives with material assignments and several packed vertex formats, including formats with up to five UV sets. The Riders Republic offsets below are not established for Breakpoint. :sourced[GRB modding reference]{games="ghost-recon-breakpoint"}

## Header and layout selection

Offsets are relative to the resource body, after its resource identity and type header. The compiled marker is at `M = 61 + 81 × boneCount`, where `boneCount` is the little-endian u32 at body offset 16. :proven[all mesh headers]{games="riders-republic"}

```layout
title: Compiled mesh prefix
games: [riders-republic]
size: variable
note: Little-endian; offsets from M, not the resource body.
fields:
  - {at: 0, size: 4, type: u32, name: CompiledMesh marker, value: "0xFC9E1595", level: observed}
  - {at: 4, size: 1, type: u8, name: layout selector, level: observed, note: "0 ranged; 3 inline"}
  - {at: 5, size: 8, type: bytes, name: stored prefix, level: unknown, note: "zero in the split and inline multi-mesh census"}
  - {at: 13, size: 4, type: u32, name: layout class, level: observed, note: "0xC351EE43 ranged; 0x0645ABB5 MeshData for inline"}
```

The ranged prefix continues with a u32 at `M+17`, vertex-format byte at `M+21`, three u32 stream strides at `M+22`, a u32 at `M+34`, centre and half-extent float3 values at `M+38` and `M+50`, a byte at `M+62`, range count at `M+63`, and eight bytes before the first range at `M+75`. :proven[29,174 split meshes]{games="riders-republic"}

| Format | Kind | Stream strides in bytes | Confidence |
|---|---:|---|---|
| static16 | 11 | 16, 0, 0 | :observed{games="riders-republic"} |
| static24 | 2 | 24, 0, 0 | :observed{games="riders-republic"} |
| static28 | 3 | 28, 0, 0 | :observed{games="riders-republic"} |
| split12 | 0 | 12, 12, 8 | :proven[all split12 meshes]{games="riders-republic"} |
| split24 | 1 | 24, 12, 8 | :proven[all split24 meshes]{games="riders-republic"} |
| split12 with eight influences | 0 | 12, 12, 16 | :proven[all 58 meshes]{games="riders-republic"} |

## Ranged buffers

Each range starts with `0x07B19A87`, a byte 1, three bytes, first-index u32 and vertex-base u32. Every range except the last has another eight bytes. The first range begins at index and vertex zero; successive range boundaries partition the buffers. Indices are u16 and relative to each range's vertex base. :proven[29,174 split meshes]{games="riders-republic"}

After the ranges come four length-prefixed streams in order: primary attributes, positions, skin, indices. A static mesh's separate position and skin streams have zero lengths. Split position records are 12 bytes; skin records are 8 or 16 bytes. :proven[split census]{games="riders-republic"}

The index buffer is followed by a length-prefixed block of 32 bytes per range, two more length-prefixed streams, `MeshData`, the primitive records, four length-prefixed runs and the material list. All four final runs are empty in every split mesh; some static meshes carry copies of their vertex and index buffers there. :proven[29,174 split bodies; static copies observed]{games="riders-republic"}

```layout
title: MeshData declaration and count
games: [riders-republic]
size: 10
note: Starts immediately after the MeshData marker 0x0645ABB5.
fields:
  - {at: 0, size: 1, type: u8, name: index width selector, level: observed, note: "0 means u16; 1 means u32"}
  - {at: 1, size: 1, type: u8, name: vertex format, level: observed}
  - {at: 2, size: 3, type: "u8[3]", name: stream strides, level: observed}
  - {at: 5, size: 1, type: u8, name: declaration value, level: unknown, note: "4 in static24 and four-influence split meshes; 8 in eight-influence split meshes"}
  - {at: 6, size: 4, type: u32, name: object count, level: observed}
```

```layout
title: Inline object record
games: [riders-republic]
size: 36
fields:
  - {at: 0, size: 8, type: u64, name: stored identity, level: unknown, note: "zero in all 2,732 multi-mesh object records"}
  - {at: 8, size: 4, type: u32, name: MeshPrimitive marker, value: "0xA57387EF", level: proven}
  - {at: 12, size: 4, type: u32, name: vertex base, level: proven}
  - {at: 16, size: 4, type: u32, name: stored word, level: unknown, note: "zero in all 2,732 records"}
  - {at: 20, size: 4, type: u32, name: vertex count, level: proven}
  - {at: 24, size: 4, type: u32, name: first index, level: proven}
  - {at: 28, size: 4, type: u32, name: triangle count, level: proven}
  - {at: 32, size: 4, type: u32, name: stored word, level: unknown, note: "1 in all 2,732 records; material-slot interpretation not established"}
```

## Inline meshes and index origin

The inline form has `MeshData` directly at `M+13`. Its declaration, count and **all** object records precede the length-prefixed primary, position, skin and index blobs; the material list follows the indices. One object is a special case of this grammar. :proven[1,170 multi-mesh bodies]{games="riders-republic"}

Every one of the 1,170 multi-mesh entries contains two to four objects, uses 24-byte vertices and u16 indices, and has empty separate position and skin streams. Object vertex and index intervals tile their shared buffers in record order. Their indices are **absolute**, unlike the ranged form: adding the vertex base changes the result incorrectly. Independent decoding agrees on positions, indices and object partitions on all 1,170 entries, and each body is consumed exactly. :proven{games="riders-republic"}

## Material list

The common material list is a u32 count, eight bytes, one 28-byte descriptor per range, another u32 count, six bytes, one 31-byte group per range and a 20-byte trailer. Each descriptor starts with `0x0B1D34C1`, four bytes, zero byte, u16 vertex count, zero byte, u64 Material identity and eight bytes. The group's identity at offsets 8 and 17 repeats the descriptor's identity. :proven[split and inline multi-mesh censuses]{games="riders-republic"}

The descriptor vertex count is the range count modulo 65,536, rather than a limit on the mesh's number of vertices. Two sampled inline meshes contain 72,260 and 93,906 vertices. :observed{games="riders-republic"}

See [vertex formats](/engines/anvil/geometry/vertex-formats/) for stream decoding and [LOD levels](/engines/anvil/geometry/lod/) for geometry selection.

:::open[What do the remaining compiled fields control?]
The values retained around stream declarations, object records and the trailer do not all have established runtime meanings. A constant value alone does not establish a reserved field. :unknown{games="riders-republic"}
:::

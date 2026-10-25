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

```layout
title: MeshSet LOD fields
size: variable
note: Little-endian; offsets are relative to the pointed-to LOD record.
fields:
  - {at: 8, size: 4, type: u32, name: section count, level: proven}
  - {at: 12, size: 8, type: u64, name: section array pointer, level: proven}
  - {at: 84, size: 4, type: u32, name: index format, level: proven, note: "0x21 is 16-bit; 0x2e is 32-bit"}
  - {at: 88, size: 4, type: u32, name: index buffer byte count, level: proven}
  - {at: 92, size: 4, type: u32, name: vertex buffer byte count, level: proven, note: Multiple of 16.}
  - {at: 116, size: 16, type: GUID, name: geometry chunk, level: proven}
```

```layout
title: MeshSet section fields
size: 384
note: Little-endian; undescribed ranges are not interpreted here.
fields:
  - {at: 16, size: 8, type: u64, name: bone list pointer, level: observed}
  - {at: 24, size: 2, type: u16, name: bone count, level: observed}
  - {at: 27, size: 1, type: u8, name: flags, level: observed}
  - {at: 30, size: 1, type: u8, name: total vertex stride, level: proven}
  - {at: 32, size: 4, type: u32, name: primitive count, level: proven}
  - {at: 36, size: 4, type: u32, name: start index, level: proven}
  - {at: 40, size: 4, type: u32, name: vertex byte offset, level: proven}
  - {at: 44, size: 4, type: u32, name: vertex count, level: proven}
  - {at: 84, size: 4, type: u32, name: repeated vertex byte offset, level: proven}
  - {at: 112, size: 100, type: declaration, name: stored vertex declaration, level: proven}
  - {at: 212, size: 100, type: declaration, name: draw vertex declaration, level: proven}
  - {at: 312, size: 8, type: u64, name: material key, level: proven}
  - {at: 320, size: 4, type: u32, name: repeated start index, level: proven}
```

```layout
title: Vertex declaration
size: 100
fields:
  - {at: 0, size: 64, type: "Element[16]", name: element slots, level: proven, note: Each element is four bytes in usage/format/offset/stream order.}
  - {at: 64, size: 32, type: "u8[16][2]", name: stream descriptors, level: observed, note: First byte of each pair is stride; second byte's meaning is not established here.}
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

The sampled community level Numbani has zero LOD-distance float fields in MeshSets; distance policy is supplied
elsewhere, including the mesh's LodGroup. :observed

:::open[Is there a fixed LOD allocation stride?]
Older measurements report `0xb0` for level meshes and `192` bytes for costume meshes. The current census-backed
layout follows the pointer table and does not establish either stride as a universal rule. :unknown
:::

---
title: FLVER2 models
description: Model headers, mesh records, face sets, material references and vertex streams in FLVER2.
sources:
  - title: SoulsFormatsNEXT
    url: https://github.com/soulsmods/SoulsFormatsNEXT/tree/master/SoulsFormats/Formats/FLVER
    note: FLVER2 record names and reference reader
implementations:
  - name: primase worlds/fromsoft (flver)
    url: https://github.com/Kalmarv/primase/blob/main/worlds/fromsoft/src/flver/mod.rs
---

FLVER2 stores a model's meshes, material references, transform nodes, attachment points and vertex layouts. Meshes
refer to face sets and vertex buffers by index; materials refer to external definitions and texture paths.
:sourced[SoulsFormatsNEXT]

Whole-install comparisons cover 14,459 Sekiro FLVER records and 22,169 Elden Ring records. The independent
reader accepts all 14,459 Sekiro models and 22,050 Elden Ring models; it refuses the other 119 Elden Ring models,
all SpeedTree. One Sekiro archive entry fails before model inspection; Elden Ring has no such archive refusal.
The structural layouts below apply to the accepted models, with SpeedTree checked separately by executing its
vertex programs. :proven[whole-install reference population]

The comparison accounts separately for the different interpretations of
[vertex formats](/engines/fromsoft/geometry/vertex-formats/); agreement after reinterpreting the same stored bytes
does not prove the reference reader's shader-input semantics. :observed

## Header and table order

The PC header is 128 bytes, little-endian, with `FLVER\0L\0` at its start. The metadata tables follow in the order
dummy, material, node, mesh, face set, vertex buffer, buffer layout and texture. :proven[whole-install reference population]

The reference-readable FLVER records have the following version populations. The 119 SpeedTree files refused
by the reference are excluded from this version table. :proven[whole-install reference population]

| Version | Sekiro files | Elden Ring files | Confidence |
|---|---:|---:|---|
| `0x20013` | 1 | 1 | :proven |
| `0x20014` | 2 | 2 | :proven |
| `0x20016` | 14 | 0 | :proven |
| `0x2001A` | 14,442 | 22,047 | :proven |

```layout
title: FLVER2 PC header
size: 128
note: Little-endian; offsets are file-relative unless stated otherwise.
fields:
  - {at: 0, size: 6, type: char, name: magic, value: 'FLVER\0', level: proven}
  - {at: 6, size: 2, type: char, name: byte order, value: 'L\0', level: proven}
  - {at: 8, size: 4, type: u32, name: version, level: proven}
  - {at: 12, size: 4, type: u32, name: data offset, level: proven}
  - {at: 16, size: 4, type: u32, name: data length, level: proven}
  - {at: 20, size: 4, type: u32, name: dummy count, level: proven}
  - {at: 24, size: 4, type: u32, name: material count, level: proven}
  - {at: 28, size: 4, type: u32, name: node count, level: proven}
  - {at: 32, size: 4, type: u32, name: mesh count, level: proven}
  - {at: 36, size: 4, type: u32, name: vertex buffer count, level: proven}
  - {at: 40, size: 12, type: float3, name: minimum bounds, level: sourced}
  - {at: 52, size: 12, type: float3, name: maximum bounds, level: sourced}
  - {at: 64, size: 4, type: u32, name: nondegenerate non-motion-blur face count, level: sourced}
  - {at: 68, size: 4, type: u32, name: total face count, level: sourced}
  - {at: 72, size: 1, type: u8, name: default index width in bits, level: proven}
  - {at: 73, size: 1, type: bool, name: UTF-16 strings, value: 1, level: proven}
  - {at: 74, size: 1, type: u8, name: unknown 4A, level: unknown}
  - {at: 75, size: 1, type: u8, name: unknown 4B, level: unknown, note: Zero in the checked PC files.}
  - {at: 76, size: 4, type: u32, name: unknown 4C, level: unknown}
  - {at: 80, size: 4, type: u32, name: face set count, level: proven}
  - {at: 84, size: 4, type: u32, name: buffer layout count, level: proven}
  - {at: 88, size: 4, type: u32, name: texture count, level: proven}
  - {at: 92, size: 2, type: bytes, name: unknown 5C and 5D, level: unknown}
  - {at: 94, size: 10, type: bytes, name: reserved, value: 0, level: proven}
  - {at: 104, size: 2, type: u16, name: unknown 68, level: unknown, note: 5 on SpeedTree files.}
  - {at: 106, size: 2, type: u16, name: special modifier, level: proven, note: '0x8000 identifies SpeedTree in Elden Ring.'}
  - {at: 108, size: 20, type: bytes, name: reserved, value: 0, level: proven}
```

For version `0x2001A`, a 32-byte skeleton-set descriptor follows the texture table; the two tables it points to
contain 16-byte records. SoulsFormatsNEXT calls them base and all skeletons. :sourced[SoulsFormatsNEXT]

Elden Ring files may have zero padding from the end of the declared data block to the next 2,048-byte boundary.
:observed{games="elden-ring"}

## Meshes and buffers

```layout
title: Mesh
size: 48
fields:
  - {at: 0, size: 1, type: bool, name: dynamic, level: proven}
  - {at: 1, size: 3, type: bytes, name: reserved, value: 0, level: proven}
  - {at: 4, size: 4, type: u32, name: material index, level: proven}
  - {at: 8, size: 8, type: bytes, name: reserved, value: 0, level: proven}
  - {at: 16, size: 4, type: i32, name: node index, level: proven}
  - {at: 20, size: 4, type: u32, name: bone palette count, level: proven}
  - {at: 24, size: 4, type: u32, name: bounds offset, level: proven}
  - {at: 28, size: 4, type: u32, name: bone palette offset, level: proven}
  - {at: 32, size: 4, type: u32, name: face set reference count, level: proven}
  - {at: 36, size: 4, type: u32, name: face set references offset, level: proven}
  - {at: 40, size: 4, type: u32, name: vertex buffer reference count, level: proven}
  - {at: 44, size: 4, type: u32, name: vertex buffer references offset, level: proven}
```

References and bone palette entries are 32-bit indices. Multiple buffers of one mesh carry attributes for the same
vertex count. :observed Empty meshes with no face sets or buffers occur in Elden Ring, with bounds containing
negative infinity and NaN; these bounds do not describe drawable geometry. :observed{games="elden-ring"}

```layout
title: Vertex buffer
size: 32
fields:
  - {at: 0, size: 4, type: u32, name: buffer ordinal within mesh, level: proven}
  - {at: 4, size: 4, type: u32, name: layout index, level: proven}
  - {at: 8, size: 4, type: u32, name: vertex stride, level: proven}
  - {at: 12, size: 4, type: u32, name: vertex count, level: proven}
  - {at: 16, size: 8, type: bytes, name: reserved, value: 0, level: proven}
  - {at: 24, size: 4, type: u32, name: buffer byte length, level: proven}
  - {at: 28, size: 4, type: u32, name: buffer offset, level: proven, note: Relative to the header data offset.}
```

## Face sets

```layout
title: Face set
size: 32
fields:
  - {at: 0, size: 4, type: u32, name: flags, level: proven}
  - {at: 4, size: 1, type: bool, name: triangle strip, level: proven}
  - {at: 5, size: 1, type: bool, name: cull backfaces, level: sourced}
  - {at: 6, size: 2, type: i16, name: unknown 06, level: unknown}
  - {at: 8, size: 4, type: u32, name: index count, level: proven}
  - {at: 12, size: 4, type: u32, name: indices offset, level: proven, note: Relative to the header data offset.}
  - {at: 16, size: 4, type: u32, name: index byte length, level: proven}
  - {at: 20, size: 4, type: u32, name: reserved, value: 0, level: proven}
  - {at: 24, size: 4, type: u32, name: index width in bits, level: proven, note: Zero inherits the header width; otherwise 16 or 32.}
  - {at: 28, size: 4, type: u32, name: reserved, value: 0, level: proven}
```

| Flag or expression | Meaning | Confidence |
|---|---|---|
| `(flags >> 24) & 7` | LOD level; Elden Ring also uses levels 3 and 4 for far stand-ins | :observed |
| `0x01000000`, `0x02000000`, `0x04000000` | SoulsFormatsNEXT names the individual bits LodLevel1, LodLevel2 and LodLevelEx | :sourced[SoulsFormatsNEXT] |
| `0x40000000` | Edge-compressed indices | :sourced[SoulsFormatsNEXT] |
| `0x80000000` | Motion-blur face set | :sourced[SoulsFormatsNEXT] |
| `(flags & 0x87000000) == 0` | Neither a coarser LOD nor a motion-blur set | :observed |

Sekiro's `c1010` meshes have LOD0, LOD1 and LOD2 face sets, each with a motion-blur twin (flags `0`, `0x01000000`
and `0x02000000`, each also with `0x80000000`), and no strips. :observed{games="sekiro"}

For strips, `0xFFFF` restarts the strip and resets parity. Degenerate triples emit no triangle but still advance
parity; odd triples reverse the index order. Whole-install comparisons include the resulting index ordering.
:proven[whole-install reference population]

Material and texture records are described under [FLVER material bindings](/engines/fromsoft/materials/flver-bindings/);
nodes and attachment points under [nodes and skinning](/engines/fromsoft/geometry/nodes-and-skinning/).

:::open[What is inside the refused Sekiro archive entry?]
The one entry rejected before nested-model inspection is outside the model census. Its unread payload cannot
establish whether it contains additional FLVER records or other resources. :unknown{games="sekiro"}
:::

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

Whole-install comparisons check decoded attributes and strip ordering against independent readers in both games.
The comparison accounts separately for reference-reader rejections, [SpeedTree](/engines/fromsoft/vegetation/speedtree/)
models, and the different interpretations of [vertex formats](/engines/fromsoft/geometry/vertex-formats/).
It does not establish agreement on those exceptions. :observed

## Header and table order

The PC header is 128 bytes, little-endian, with `FLVER\0L\0` at its start. The metadata tables follow in the order
dummy, material, node, mesh, face set, vertex buffer, buffer layout and texture. :observed

SoulsFormatsNEXT identifies Sekiro's ordinary version as `0x2001A`, with `0x20016` on test characters.
:sourced[SoulsFormatsNEXT]{games="sekiro"} The available shared reader accepts `0x20013`, `0x20014`, `0x20016`
and `0x2001A`; this accepted set alone does not establish which versions each install contains. :unknown

```layout
title: FLVER2 PC header
size: 128
note: Little-endian; offsets are file-relative unless stated otherwise.
fields:
  - {at: 0, size: 6, type: char, name: magic, value: 'FLVER\0', level: observed}
  - {at: 6, size: 2, type: char, name: byte order, value: 'L\0', level: observed}
  - {at: 8, size: 4, type: u32, name: version, level: observed}
  - {at: 12, size: 4, type: u32, name: data offset, level: observed}
  - {at: 16, size: 4, type: u32, name: data length, level: observed}
  - {at: 20, size: 4, type: u32, name: dummy count, level: observed}
  - {at: 24, size: 4, type: u32, name: material count, level: observed}
  - {at: 28, size: 4, type: u32, name: node count, level: observed}
  - {at: 32, size: 4, type: u32, name: mesh count, level: observed}
  - {at: 36, size: 4, type: u32, name: vertex buffer count, level: observed}
  - {at: 40, size: 12, type: float3, name: minimum bounds, level: sourced}
  - {at: 52, size: 12, type: float3, name: maximum bounds, level: sourced}
  - {at: 64, size: 4, type: u32, name: nondegenerate non-motion-blur face count, level: sourced}
  - {at: 68, size: 4, type: u32, name: total face count, level: sourced}
  - {at: 72, size: 1, type: u8, name: default index width in bits, level: observed}
  - {at: 73, size: 1, type: bool, name: UTF-16 strings, value: 1, level: observed}
  - {at: 74, size: 1, type: u8, name: unknown 4A, level: unknown}
  - {at: 75, size: 1, type: u8, name: unknown 4B, level: unknown, note: Zero in the checked PC files.}
  - {at: 76, size: 4, type: u32, name: unknown 4C, level: unknown}
  - {at: 80, size: 4, type: u32, name: face set count, level: observed}
  - {at: 84, size: 4, type: u32, name: buffer layout count, level: observed}
  - {at: 88, size: 4, type: u32, name: texture count, level: observed}
  - {at: 92, size: 2, type: bytes, name: unknown 5C and 5D, level: unknown}
  - {at: 94, size: 10, type: bytes, name: reserved, value: 0, level: observed}
  - {at: 104, size: 2, type: u16, name: unknown 68, level: unknown, note: 5 on SpeedTree files.}
  - {at: 106, size: 2, type: u16, name: special modifier, level: observed, note: '0x8000 identifies SpeedTree in Elden Ring.'}
  - {at: 108, size: 20, type: bytes, name: reserved, value: 0, level: observed}
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
  - {at: 0, size: 1, type: bool, name: dynamic, level: observed}
  - {at: 1, size: 3, type: bytes, name: reserved, value: 0, level: observed}
  - {at: 4, size: 4, type: u32, name: material index, level: observed}
  - {at: 8, size: 8, type: bytes, name: reserved, value: 0, level: observed}
  - {at: 16, size: 4, type: i32, name: node index, level: observed}
  - {at: 20, size: 4, type: u32, name: bone palette count, level: observed}
  - {at: 24, size: 4, type: u32, name: bounds offset, level: observed}
  - {at: 28, size: 4, type: u32, name: bone palette offset, level: observed}
  - {at: 32, size: 4, type: u32, name: face set reference count, level: observed}
  - {at: 36, size: 4, type: u32, name: face set references offset, level: observed}
  - {at: 40, size: 4, type: u32, name: vertex buffer reference count, level: observed}
  - {at: 44, size: 4, type: u32, name: vertex buffer references offset, level: observed}
```

References and bone palette entries are 32-bit indices. Multiple buffers of one mesh carry attributes for the same
vertex count. :observed Empty meshes with no face sets or buffers occur in Elden Ring, with bounds containing
negative infinity and NaN; these bounds do not describe drawable geometry. :observed{games="elden-ring"}

```layout
title: Vertex buffer
size: 32
fields:
  - {at: 0, size: 4, type: u32, name: buffer ordinal within mesh, level: observed}
  - {at: 4, size: 4, type: u32, name: layout index, level: observed}
  - {at: 8, size: 4, type: u32, name: vertex stride, level: observed}
  - {at: 12, size: 4, type: u32, name: vertex count, level: observed}
  - {at: 16, size: 8, type: bytes, name: reserved, value: 0, level: observed}
  - {at: 24, size: 4, type: u32, name: buffer byte length, level: observed}
  - {at: 28, size: 4, type: u32, name: buffer offset, level: observed, note: Relative to the header data offset.}
```

## Face sets

```layout
title: Face set
size: 32
fields:
  - {at: 0, size: 4, type: u32, name: flags, level: observed}
  - {at: 4, size: 1, type: bool, name: triangle strip, level: observed}
  - {at: 5, size: 1, type: bool, name: cull backfaces, level: sourced}
  - {at: 6, size: 2, type: i16, name: unknown 06, level: unknown}
  - {at: 8, size: 4, type: u32, name: index count, level: observed}
  - {at: 12, size: 4, type: u32, name: indices offset, level: observed, note: Relative to the header data offset.}
  - {at: 16, size: 4, type: u32, name: index byte length, level: observed}
  - {at: 20, size: 4, type: u32, name: reserved, value: 0, level: observed}
  - {at: 24, size: 4, type: u32, name: index width in bits, level: observed, note: Zero inherits the header width; otherwise 16 or 32.}
  - {at: 28, size: 4, type: u32, name: reserved, value: 0, level: observed}
```

| Flag or expression | Meaning | Confidence |
|---|---|---|
| `(flags >> 24) & 7` | LOD level; Elden Ring also uses levels 3 and 4 for far stand-ins | :observed |
| `0x01000000`, `0x02000000`, `0x04000000` | SoulsFormatsNEXT names the individual bits LodLevel1, LodLevel2 and LodLevelEx | :sourced[SoulsFormatsNEXT] |
| `0x40000000` | Edge-compressed indices | :sourced[SoulsFormatsNEXT] |
| `0x80000000` | Motion-blur face set | :sourced[SoulsFormatsNEXT] |
| `(flags & 0x87000000) == 0` | Neither a coarser LOD nor a motion-blur set | :observed |

For strips, `0xFFFF` restarts the strip and resets parity. Degenerate triples emit no triangle but still advance
parity; odd triples reverse the index order. Whole-install comparisons include the resulting index ordering.
:observed

Material and texture records are described under [FLVER material bindings](/engines/fromsoft/materials/flver-bindings/);
nodes and attachment points under [nodes and skinning](/engines/fromsoft/geometry/nodes-and-skinning/).

:::open[Which header versions occur in each complete install?]
The community reader lists Sekiro versions, but its accepted versions are not a per-game census. Elden Ring's
ordinary, exceptional and SpeedTree version populations need an explicit inventory. :unknown
:::

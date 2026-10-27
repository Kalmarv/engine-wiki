---
title: FLVER2 models
description: Model headers, mesh records, face sets, material references and vertex streams in FLVER2.
sources:
  - title: SoulsFormatsNEXT
    url: https://github.com/soulsmods/SoulsFormatsNEXT/tree/master/SoulsFormats/Formats/FLVER
    note: FLVER2 record names and reference reader
implementations:
  - name: fromsoft-formats (flver/mod.rs)
    url: https://github.com/Kalmarv/fromsoft-formats/blob/main/src/flver/mod.rs
---

FLVER2 stores a model's meshes, material references, transform nodes, attachment points and vertex layouts. Meshes
refer to face sets and vertex buffers by index; materials refer to external definitions and texture paths.
:sourced[SoulsFormatsNEXT]

A strict reader that checks every table bound, every zero field and the coverage of the data block reads all 14,459 Sekiro
and all 22,169 Elden Ring models, the 119 SpeedTree ones included. :proven[every FLVER of both archive sets]

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
  - {at: 64, size: 4, type: u32, name: nondegenerate non-motion-blur face count, level: observed, note: "see Face counts in the header"}
  - {at: 68, size: 4, type: u32, name: total face count, level: observed, note: "see Face counts in the header"}
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
  - {at: 6, size: 2, type: i16, name: unknown 06, level: unknown, note: "1 on 85,996 of Sekiro's 110,365 face sets and 149,048 of Elden Ring's 277,113; up to 371 and 285 elsewhere"}
  - {at: 8, size: 4, type: u32, name: index count, level: proven}
  - {at: 12, size: 4, type: u32, name: indices offset, level: proven, note: Relative to the header data offset.}
  - {at: 16, size: 4, type: u32, name: index byte length, level: proven}
  - {at: 20, size: 4, type: u32, name: reserved, value: 0, level: proven}
  - {at: 24, size: 4, type: u32, name: index width in bits, level: proven, note: "16 or 32 on every face set of both installs; zero would inherit the header width"}
  - {at: 28, size: 4, type: u32, name: reserved, value: 0, level: proven}
```

| Flag or expression | Meaning | Confidence |
|---|---|---|
| `(flags >> 24) & 7` | LOD level; Elden Ring also uses levels 3 and 4 for far stand-ins | :observed |
| `0x01000000`, `0x02000000`, `0x04000000` | SoulsFormatsNEXT names the individual bits LodLevel1, LodLevel2 and LodLevelEx | :sourced[SoulsFormatsNEXT] |
| `0x40000000` | Edge-compressed indices | :sourced[SoulsFormatsNEXT] |
| `0x80000000` | Motion-blur face set | :sourced[SoulsFormatsNEXT] |
| `(flags & 0x87000000) == 0` | Neither a coarser LOD nor a motion-blur set | :observed |

Face sets are index lists of 16 or 32 bits: 110,157 Sekiro and 276,754 Elden Ring sets are 16-bit and 208 and 359 are
32-bit. No face set of either install is a triangle strip (the strip byte is 0 on all 110,365 and 277,113), so none
contains a restart marker (`0xFFFF` in a 16-bit set, `0xFFFFFFFF` in a 32-bit one), every index count is a multiple of
three, and the value `0xFFFF` in a 32-bit set (519 times in 177 Sekiro sets, 1,047 times in 356 Elden Ring sets) is an
ordinary vertex index. :proven[every face set of both archive sets] The two reserved words at 20 and 28 are zero in every
face set. :proven[every face set of both archive sets]

### Face counts in the header

The total face count (offset 68) equals the number of triangles in all of a model's face sets, degenerate and motion-blur
ones included, in all 14,459 Sekiro models and in 22,048 of Elden Ring's 22,169. :proven{games="sekiro"} The other 121
Elden Ring models, all version `0x20014` (SpeedTree), count only face sets with no LOD bit (`0x7F000000`) set in 120
of them. :observed{games="elden-ring"} The count at offset 64 equals the number of non-degenerate triangles in the face
sets without the motion-blur bit in 14,358 Sekiro models and 21,771 of the 22,048 Elden Ring models that count all
sets; in the rest, which include `_S.flver` models, it differs and can exceed the triangles present.
:observed

Sekiro's `c1010` meshes have LOD0, LOD1 and LOD2 face sets, each with a motion-blur twin (flags `0`, `0x01000000`
and `0x02000000`, each also with `0x80000000`), and no strips. :observed{games="sekiro"}

No shipped model uses strips, so this rule is unexercised by the installs. For strips, `0xFFFF` restarts the strip and resets parity. Degenerate triples emit no triangle but still advance
parity; odd triples reverse the index order. Whole-install comparisons include the resulting index ordering.
:proven[whole-install reference population]

### Winding and culling

In the left-handed source frame, a triangle `(a,b,c)` faces away from `cross(b−a, c−a)`: its front is on the
side opposite that vector. All 26,286 Sekiro LOD0 face sets that cull back faces wind this way; face sets of
`M[Shadow]` shadow-proxy materials wind the other way. :observed{games="sekiro"} Reflecting Z into the right-handed
frame (see [coordinate frames](/engines/fromsoft/world/frames/)) therefore makes the front the counter-clockwise
side without reordering indices. :inferred

About 8,200 non-shadow Sekiro meshes, 19.4 million triangles, have face sets with the cull-backfaces flag clear;
they include roofs, walls and the `AMSN_light_e` light geometry. Read with the flag's meaning, the game draws them
two-sided. :observed{games="sekiro"}

Material and texture records are described under [FLVER material bindings](/engines/fromsoft/materials/flver-bindings/);
nodes and attachment points under [nodes and skinning](/engines/fromsoft/geometry/nodes-and-skinning/).

:::open[What is inside the refused Sekiro archive entry?]
The one entry rejected before nested-model inspection is outside the model census. Its unread payload cannot
establish whether it contains additional FLVER records or other resources. :unknown{games="sekiro"}
:::

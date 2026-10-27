---
title: SGD2 shader databases
description: Enhanced DXIL program groups, effect records, binding tables, techniques and fixed-function states.
games: [gta-v]
sources:
  - title: CodeWalker
    url: https://github.com/dexyfex/CodeWalker
    note: ShadersGen9Conversion.xml supplies a reference mapping of material parameter names.
implementations:
  - name: rage-engine-formats (sgd2.rs)
    url: https://github.com/Kalmarv/rage-engine-formats/blob/main/src/sgd2.rs
  - name: rage-engine-formats (sgd2_effect.rs)
    url: https://github.com/Kalmarv/rage-engine-formats/blob/main/src/sgd2_effect.rs
  - name: rage-engine-formats (sgd2_table.rs)
    url: https://github.com/Kalmarv/rage-engine-formats/blob/main/src/sgd2_table.rs
---

Enhanced stores compiled programs in `common/shaders/fxdb/sga_win32_60_final.awc` inside `update/update2.rpf`, with an
`_init` sibling. Despite the `.awc` suffix, these files begin with `SGD2` and contain DXIL program containers and
effect records. :proven

Both inspected databases parse to their final byte: eight program groups followed by a count and that many effect
records, with no unexplained trailing bytes. This establishes the outer framing, not the meaning of every byte
inside a retained table. :proven[both complete databases]

| Group index | Stage | Programs in `sga_win32_60_final.awc` | Confidence |
|---|---|---|---|
| 0 | Vertex | 3,707 | :proven |
| 1 | Pixel | 7,594 | :proven |
| 2 | Geometry | 0 | :proven |
| 3 | Domain | 458 | :proven |
| 4 | Hull | 406 | :proven |
| 5 | Compute | 240 | :proven |
| 6–7 | Empty in both inspected files; stage meaning unknown | 0 | :unknown |

The main database therefore holds 12,405 programs, followed by 388 effect records. :proven[complete main database]

Each group begins with a little-endian u32 program count. Programs have length-prefixed NUL-terminated names,
a tag byte, a sized DXIL container with `DXBC` magic, a fixed 152-byte table and another sized table.
:proven

```layout
title: SGD2 program record
size: variable
fields:
  - {at: 0, size: 1, type: u8, name: name byte length, level: proven}
  - {at: 1, size: "name byte length", type: string, name: name including NUL, level: proven}
  - {at: "after name", size: 1, type: u8, name: unknown tag, level: unknown, note: "0x32, 0x41 or 0x42"}
  - {at: "after tag", size: 4, type: u32, name: container length, level: proven}
  - {at: "after container length", size: "container length", type: bytes, name: DXIL container, level: proven}
  - {at: "after container", size: 152, type: bytes, name: unknown fixed table, level: unknown}
  - {at: "after fixed table", size: 4, type: u32, name: binding table length, level: proven}
  - {at: "after binding table length", size: "binding table length", type: bytes, name: binding table, level: proven}
```

## What the programs use

A census of the main database's programs finds the following. :observed[census of the main database's programs]

- 1,275 programs belong to tessellation pipelines, named `VS_…`, `HS_…` and `DS_…_PNTri_*_Wrapped`: the 406 hull and
  458 domain programs, and 411 vertex programs, none of which writes `SV_Position`.
- 5,697 pixel programs index an unbounded sampler array (register `s0`, space 2) with a dynamic index.
- 30 programs use ray queries; three use quad operations.

The game's effect list `common/shaders/preload.list`, also in `update/update2.rpf`, names every effect that the
install's drawables use. :observed

## Effect framing

An effect record starts with a length-prefixed NUL-terminated name, then a u32 word and six lists of program indices,
in vertex/pixel/geometry/domain/hull/compute order. Each list is a u32 count followed by u32 indices into that stage's
database group. :proven

The word after the name is not the record's byte size; its complete purpose is unresolved. The record ends
structurally: `proplst\0`, a u32 section count, sized sections, then a u32-sized NUL-terminated name block.
:proven The root-signature interpretation of the `proplst` sections is not fully decoded here. :unknown

## Program bindings

Every program's binding table in the main database parses with complete resource/constant ownership counts and
name-hash resolution. This proves the stored table structure across all programs. The interface comparison below
has narrower scope because an interface can be unavailable and unbounded arrays are treated separately.
:proven[every main-database program table]

The per-program binding table begins with u16 resource count, u32 constant count and an unnamed u16. Resource records
are followed by constant records and NUL-terminated ASCII names. :proven

```layout
title: Program resource binding
size: 28
fields:
  - {at: 0, size: 2, type: u16, name: tag, level: unknown}
  - {at: 2, size: 2, type: u16, name: register, level: proven}
  - {at: 4, size: 1, type: u8, name: owned constant count, level: proven}
  - {at: 5, size: 1, type: u8, name: class byte, level: unknown}
  - {at: 6, size: 2, type: u16, name: register space, level: proven}
  - {at: 8, size: 6, type: bytes, name: unknown, level: unknown}
  - {at: 14, size: 4, type: u32, name: buffer size, level: proven}
  - {at: 18, size: 2, type: u16, name: unknown, level: unknown}
  - {at: 20, size: 4, type: u32, name: program name hash, level: proven}
  - {at: 24, size: 4, type: u32, name: current material name hash, level: proven}
```

```layout
title: Program constant binding
size: 24
fields:
  - {at: 0, size: 4, type: u32, name: flags and type, level: proven, note: "low byte identifies the value type; remaining bits are not fully named"}
  - {at: 4, size: 2, type: u16, name: byte offset in buffer, level: proven}
  - {at: 6, size: 2, type: u16, name: ID, level: unknown}
  - {at: 8, size: 8, type: bytes, name: unknown words, level: unknown}
  - {at: 16, size: 4, type: u32, name: program name hash, level: proven}
  - {at: 20, size: 4, type: u32, name: current material name hash, level: proven}
```

The first name hash resolves to a name in the table, with exact-case or lowercase joaat. The second links an older
program identifier, such as `specularFresnel`, to a material identifier such as `Fresnel`; engine constants can use
zero or repeat the first hash instead. :proven

The whole-database interface comparison checks each declared constant buffer, texture and sampler against a record
at the same class/register/space. Buffer sizes are rounded up to 16 bytes; root-constant records can state size zero,
and unbounded resource arrays need separate handling. Constant ownership counts sum to the constant-table count.
:observed[program-interface comparison]

## Techniques and state

Every technique-bearing effect in the main database decodes with valid program and state-table references and no
unread technique table. Effects without this structure, including post-processing and lighting effects, are counted
separately rather than forced into the layout. The proven pass and state fields below apply to all technique-bearing
effects; the outer framing proof also covers records without techniques. :proven[all technique-bearing effects]

Effects with a technique table have name-offset/pass-count entries and a count-prefixed list of 24-byte passes.
Post-processing and lighting effects can lack this table. :proven

```layout
title: Technique pass
size: 24
fields:
  - {at: 0, size: 6, type: "u8[6]", name: programs by stage, level: proven, note: "1-based position in the effect's stage list; 0 means absent"}
  - {at: 6, size: 2, type: bytes, name: unknown zero bytes, level: unknown, note: "zero in inspected records"}
  - {at: 8, size: 1, type: u8, name: rasterizer state index, level: proven}
  - {at: 9, size: 1, type: u8, name: depth-stencil state index, level: proven}
  - {at: 10, size: 1, type: u8, name: blend state index, level: proven}
  - {at: 11, size: 13, type: bytes, name: unknown tail, level: unknown}
```

State tables use Direct3D 12 enumeration values. Their record sizes are rasterizer 16, depth-stencil 24, blend 68 and
sampler 36 bytes. The blend record holds four leading bytes followed by eight 8-byte render-target descriptions.
:proven

```layout
title: Rasterizer state
size: 16
fields:
  - {at: 0, size: 1, type: u8, name: fill mode, level: proven, note: "2 wireframe, 3 solid"}
  - {at: 1, size: 1, type: u8, name: cull mode, level: proven, note: "1 none, 2 front, 3 back"}
  - {at: 2, size: 1, type: u8, name: front counterclockwise, level: proven}
  - {at: 3, size: 5, type: bytes, name: unknown, level: unknown}
  - {at: 8, size: 4, type: f32, name: polygon offset, level: proven, note: "nonzero in the two inspected foam effects"}
  - {at: 12, size: 4, type: bytes, name: unknown tail, level: unknown}
```

```layout
title: Depth-stencil state
size: 24
fields:
  - {at: 0, size: 1, type: u8, name: depth enable, level: proven}
  - {at: 1, size: 1, type: u8, name: depth write mask, level: proven}
  - {at: 2, size: 1, type: u8, name: depth comparison, level: proven}
  - {at: 3, size: 1, type: u8, name: stencil enable, level: proven}
  - {at: 4, size: 1, type: u8, name: stencil read mask, level: proven}
  - {at: 5, size: 1, type: u8, name: stencil write mask, level: proven}
  - {at: 6, size: 4, type: "u8[4]", name: front stencil operations and comparison, level: proven, note: "fail, depth-fail, pass, comparison"}
  - {at: 10, size: 4, type: "u8[4]", name: back stencil operations and comparison, level: proven}
  - {at: 14, size: 10, type: bytes, name: unknown tail, level: unknown}
```

```layout
title: Blend state
size: 68
fields:
  - {at: 0, size: 4, type: bytes, name: unknown prefix, level: unknown}
  - {at: 4, size: 64, type: "RenderTargetBlend[8]", name: target blend descriptions, level: proven}
```

```layout
title: RenderTargetBlend
size: 8
fields:
  - {at: 0, size: 1, type: u8, name: blend enable, level: proven}
  - {at: 1, size: 1, type: u8, name: source factor, level: proven}
  - {at: 2, size: 1, type: u8, name: destination factor, level: proven}
  - {at: 3, size: 1, type: u8, name: operation, level: proven}
  - {at: 4, size: 1, type: u8, name: alpha source factor, level: proven}
  - {at: 5, size: 1, type: u8, name: alpha destination factor, level: proven}
  - {at: 6, size: 1, type: u8, name: alpha operation, level: proven}
  - {at: 7, size: 1, type: u8, name: write mask, level: proven}
```

```layout
title: Sampler state
size: 36
fields:
  - {at: 0, size: 1, type: u8, name: filter, level: proven}
  - {at: 1, size: 3, type: "u8[3]", name: U-V-W address modes, level: proven, note: "1 wrap, 2 mirror, 3 clamp"}
  - {at: 4, size: 4, type: f32, name: mip LOD bias, level: proven}
  - {at: 8, size: 1, type: u8, name: maximum anisotropy, level: proven}
  - {at: 9, size: 1, type: u8, name: comparison function, level: proven}
  - {at: 10, size: 22, type: bytes, name: retained fields, level: unknown, note: "includes border colour and minimum LOD; not individually decoded"}
  - {at: 32, size: 4, type: f32, name: maximum LOD, level: proven}
```

Known-effect controls support the interpretation: `default` includes depth comparison `GREATER` (reversed Z);
`decal` includes source-alpha/inverse-source-alpha blending; `emissive_additive_alpha` includes
source-alpha/destination-one blending. These checks establish concrete states, rather than deriving state only
from effect names. :observed

:::open[What do the program tags and retained state-table bytes mean?]
Outer framing and named fields are decoded, but the three program-tag values and unnamed table fields have no
established semantic meaning. :unknown

Read as raw words, the effect bytes after the program lists hold seven u32 words at offset `0x18` with the values
6, 6, 2, 0, 2, 3, 2. A flags word follows them: `0x1002` in `default`, `emissive` and `cloth`, `0x10` in glass and
decal effects, and `0x2` in `cutout_fence`. A further word varies by effect (`0x11000011`, `0x11000111` with the
`0x100` bit in glass, `0x13000011`). The values are observed on those effects; how these words relate to the decoded
state tables and to the flag-8 classification of `cloth_*` effects on
[deferred decals](/engines/rage/effects/deferred-decals/) is not established. :unknown
:::

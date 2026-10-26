---
title: Binding sets and input layouts
description: Constant-buffer and texture register mappings, vertex inputs and unresolved render-state fields.
games: [skate]
implementations:
  - name: primase worlds/frostbite (binding.rs)
    url: https://github.com/Kalmarv/primase/blob/main/worlds/frostbite/src/binding.rs
  - name: primase worlds/frostbite (inputlayout.rs)
    url: https://github.com/Kalmarv/primase/blob/main/worlds/frostbite/src/inputlayout.rs
---

Binding sets connect hashed material parameters to constant-buffer offsets and resource indexes. Pass bindings
describe pass-supplied parameters; permutation shared data names these sets. :observed

## Binding structures

Resource metadata contains payload size, relocation size and resource id. A binding set has the following
little-endian header, followed by 64-byte groups at `0x20`. :observed

```layout
title: Binding-set header
size: 32
fields:
  - {at: 0, size: 4, type: u32, name: group count, level: observed}
  - {at: 4, size: 4, type: u32, name: group table offset, value: 32, level: observed}
  - {at: 8, size: 8, type: u64, name: unknown, level: unknown, note: Zero in measured records.}
  - {at: 16, size: 8, type: u64, name: resource id, level: observed}
  - {at: 24, size: 4, type: u32, name: unknown, level: unknown, note: One in measured records.}
  - {at: 28, size: 4, type: u32, name: parameter count, level: observed}
```

Pass-binding headers instead contain four `u32` words (version `1` or `0x101`, group count, group offset
`0x20`, zero), then the `u64` resource id and a zero `u64`. :observed

```layout
title: Binding group
size: 64
fields:
  - {at: 0, size: 8, type: u64, name: group name hash, level: observed}
  - {at: 8, size: 4, type: u32, name: buffer size or resource count, level: observed}
  - {at: 12, size: 4, type: bytes, name: unknown flags, level: unknown}
  - {at: 16, size: 2, type: u16, name: parameter count, level: observed}
  - {at: 18, size: 6, type: "u16[3]", name: unknown words, level: unknown}
  - {at: 24, size: 8, type: u64, name: unknown, level: unknown, note: Zero in measured records.}
  - {at: 32, size: 8, type: u64, name: all-parameters offset, level: observed}
  - {at: 40, size: 8, type: u64, name: group-parameters offset, level: observed}
  - {at: 48, size: 8, type: u64, name: group-entry table offset, level: observed}
  - {at: 56, size: 8, type: u64, name: end-of-tables offset, level: observed}
```

Parameters use the sixteen-byte name/type/count/extra prefix of
[depot parameters](/engines/frostbite/materials/shader-block-depots/). Entries are eight bytes:
`u32 byte_offset_or_resource_index`, `u16 marker`, `u16 kind`. Constant-buffer entries have marker `0xffff`
and kind equal to four times the parameter byte size; buffer size rounds up to sixteen bytes. Other
marker/kind meanings remain unresolved. :observed

## Register mapping and exceptions

The register census covers every space-zero declaration in every program of the game configuration's 2,931
raster permutations. The table reports exhaustive agreement counts for candidate sources, including mismatches;
it does not establish the candidate mapping where a declaration fails to match. :proven[all game-configuration raster programs]

| Register | Candidate source | Measurement | Confidence |
|---|---|---|---|
| `b0` | Set 1, group 0 | Matching buffer size in 4,069 of 4,613 declarations | :proven[exhaustive agreement count] |
| `b1` | Set 0, group 0 | Matching size in 2,867 of 2,887 | :proven[exhaustive agreement count] |
| `b4` | Pass binding, group 0 | Matching size in 5,707 of 5,707 | :proven[exhaustive agreement count] |
| `t0`–`t31` | Set 1, group 1, index equal to register | Part of combined resource result | :observed |
| `t32`–`t63` | Set 0, group 1, index register minus 32 | Part of combined resource result | :observed |
| `t64` and above | Pass binding, group 1, index register minus 64 | Combined result: 31,589 of 31,639 resource declarations have entries | :proven[exhaustive agreement count] |

Across all those programs, 1,866 `b2`, 38 `b3` and 4,277 sampler declarations have no assigned source under this
binding-set rule. :proven[all game-configuration raster programs]

A size match does not independently name a buffer's semantic role. :inferred

## Input layouts

```layout
title: Input-layout header
size: 32
fields:
  - {at: 0, size: 4, type: u32, name: element count, level: observed}
  - {at: 4, size: 8, type: u64, name: element table pointer, level: observed, note: "0x20 in measured resources"}
  - {at: 12, size: 8, type: u64, name: usage table pointer, level: observed}
  - {at: 20, size: 12, type: bytes, name: unknown, level: unknown, note: Zero in measured resources.}
```

```layout
title: Input-layout element
size: 20
fields:
  - {at: 0, size: 4, type: u32, name: semantic index, level: observed}
  - {at: 4, size: 4, type: u32, name: input slot, level: observed}
  - {at: 8, size: 4, type: u32, name: byte offset, level: observed}
  - {at: 12, size: 4, type: u32, name: slot class, level: observed}
  - {at: 16, size: 4, type: u32, name: format word, level: observed, note: Byte 1 is DXGI format; byte 0 has no established meaning.}
```

One usage byte follows per element; the element and usage arrays are separately sixteen-byte aligned.
Relocations identify pointer slots `4` and `0xc`. :observed

The exhaustive input comparison covers every vertex program of the game configuration's 2,931 raster
permutations, with no unmapped inputs. Of their 15,383 inputs,
15,336 match by name/index and width, six by elimination and width, and 41 by name with shader reads wider than
the stored format. :proven[all game-configuration vertex inputs]

## Render-state bytes

A raster permutation's shared data (RasterPermutationSharedData, type `0x250047b2`) holds the program's packed
fixed-function state. Thirteen distinct values occur in a fifteen-bundle sample, with payload sizes 148–300
bytes. :observed The bit layouts are those of the executable's RC2 state printers (rasterizer `Skate+0x4130300`,
depth-stencil `+0x4130430`, blend `+0x4130550`), and the decoded values agree with the pipeline descriptions the
game hands to D3D12 at run time. :observed

```layout
title: Raster shared-state fields
size: variable
note: Offsets in the payload.
fields:
  - {at: 120, size: 4, type: f32, name: slope-scaled depth bias, level: observed}
  - {at: 124, size: 2, type: i16, name: depth bias, level: observed}
  - {at: 126, size: 1, type: u8, name: forced sample count, level: observed}
  - {at: 127, size: 1, type: bits, name: rasterizer bits, level: observed, note: "b0 fill mode; b1-2 cull None/Front/Back; b3 front counter-clockwise; b4 depth clip"}
  - {at: 128, size: 1, type: bits, name: depth-stencil bits, level: observed, note: "b0 depth test; b1 depth write; b2 stencil test; b3-5 depth function Never, Less, Equal, LessEqual, Greater, NotEqual, GreaterEqual, Always"}
  - {at: 129, size: 1, type: u8, name: stencil read mask, level: observed}
  - {at: 130, size: 1, type: u8, name: stencil write mask, level: observed}
  - {at: 135, size: 1, type: bits, name: blend bits, level: observed}
  - {at: 140, size: 40, type: "u8[8][5]", name: render-target blend records, level: observed, note: "Final byte 0x0f is the All colour-write mask"}
```

Most render-target records are `02 00 01 00 0f`; two state values use `03 05 01 05 0f` for target zero. :observed
The per-byte blend factor mapping inside a record is not separately anchored. :inferred

Over all 3,619 dingolevel_root programs the states fall into a few classes. Depth is reversed: opaque programs
test GreaterEqual and write depth with stencil write mask `0xfe` and no bias; G-buffer programs after the depth
prepass test Equal without writing; shadow-depth programs test GreaterEqual and write with depth bias −10 and
slope −4. Every decal and transparent-decal program tests GreaterEqual without writing depth, tests stencil with
read mask `0x08` (or `0xe0`), uses depth bias 200 and slope-scaled bias 0.1, and blends premultiplied into
render targets 0–3. :observed Their consequence for overlays is described under
[decals](/engines/frostbite/effects/decals-and-order/).

A capture of the 24,218 pipeline descriptions the running game creates shows the main depth buffer as
`DXGI_FORMAT_D32_FLOAT_S8X24_UINT`, DepthBiasClamp 0 on every pipeline, decals with stencil read `0x08` and write
0, opaque with read `0x08` and write `0xfe`, and shadows with bias −10/−4 on D16 targets and −1000/−4 on D32
targets. :observed

:::open[What explains the register exceptions and the remaining render-state bytes?]
The b0/b1 mismatches, fifty resource exceptions and unassigned buffers/samplers require additional binding sources
or a narrower rule. The shared-state bytes outside the fields above have no established decode. :unknown
:::

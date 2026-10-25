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

Thirteen distinct raster shared-state values occur in a fifteen-bundle sample, with payload sizes 148–300
bytes. Eight five-byte render-target records start at `0x8c`. Their final byte `0x0f` matches the executable's
All colour-write mask. Most records are `02 00 01 00 0f`; two state values use `03 05 01 05 0f` for target zero.
:observed

A possible interpretation gives the latter records blend-enable flags, source One and destination
InvSourceAlpha. The blend-byte mapping and depth/cull/fill/stencil locations lack a validated anchor. :inferred

:::open[What explains the register exceptions and render-state fields?]
The b0/b1 mismatches, fifty resource exceptions and unassigned buffers/samplers require additional binding sources
or a narrower rule. Remaining render-state fields also lack an established decode. :unknown
:::

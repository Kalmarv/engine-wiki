---
title: Shader lookup tables and compiled programs
description: The three material tables, program decision trees, permutations and DXIL bytecode resources.
games: [skate]
sources:
  - title: ReSkate shader lookup
    url: https://github.com/Dingo-Shenanigans/ReSkate/blob/main/Engine/Resource/shader_lookup.cpp
implementations:
  - name: primase worlds/frostbite (lookup.rs)
    url: https://github.com/Kalmarv/primase/blob/main/worlds/frostbite/src/lookup.rs
  - name: primase worlds/frostbite (selector.rs)
    url: https://github.com/Kalmarv/primase/blob/main/worlds/frostbite/src/selector.rs
  - name: primase worlds/frostbite (permutation.rs)
    url: https://github.com/Kalmarv/primase/blob/main/worlds/frostbite/src/permutation.rs
---

A section's material key joins three kinds of data: a parameter block in a loaded depot, a program-index row in
`dingolevel_root_win32_shaderstate_db`, and a streamable-texture-set row. Changing only one lookup can leave the
section bound inconsistently. :observed

The exhaustive level-root database census reads all 3,619 program records at 168 bytes each, with zero
selector refusals. :proven[all level-root program records]

The measured program grouping has 27 families. :observed

| Resource type | Role | Confidence |
|---|---|---|
| `0xe2e6955b` ExpressionShaderDatabase | Program records and material-key to program-index arrays | :observed |
| `0x2d254a89` StreamableTextureSetLookupTable family | `u64 key, u64 texture-set` rows | :observed |
| `0xd489facb` RasterPermutation | Shared-data id, input-layout id and vertex/pixel bytecode GUIDs | :observed |
| `0x95ce62dd` ComputePermutation | Shared-data id and compute-bytecode GUID | :observed |
| `0x0e2b02f7` CompiledBytecode | Relocatable wrapper containing compiled DXBC/DXIL | :observed |
| `0x7d98f632` InputLayout | Vertex input declaration | :observed |
| `0xa19b025d` BindingSet | Shader resource bindings | :observed |
| `0x2fec6526` ShaderStateAssetId | 32-byte sublevel-associated identity | :observed |

The ShaderStateAssetId's final 16 bytes equal its sublevel EBX file GUID in measured examples. Its first 16 bytes
have no established meaning. Cell depots without this resource still resolve correctly in game. :observed

## Material lookup rows

The ExpressionShaderDatabase metadata gives program bytes, relocation bytes and lookup bytes. The lookup starts
after program and relocation data with a `u32` row count; each row is `u64 material_key`, `u32 index_count`, then
that many `u32` program indexes. Texture-set lookup rows are sixteen bytes each. :observed

A measured mapping from program row to texture set is single-valued for all 2,016 checked rows. Every one of
1,245 checked program tuples uses exactly one vertex declaration. These checks cover the measured stock tables,
not arbitrary newly authored programs. :observed

## Program selectors

Program records contain twelve `(u32 count, u64 pointer)` items from offset `0x18`, at twelve-byte intervals.
Five items form a decision tree. A strict census reads every record in the game configuration and dingolevel_root
databases: 5,137 records (1,518 and 3,619 respectively), with zero refusals. The array layout and tree invariants
below hold throughout these two databases. :proven[all 5,137 records in both databases]

| Offset | Array | Confidence |
|---|---|---|
| `0x30` | Options: 16-byte name/type/count/extra records | :proven[5,137 records] |
| `0x3c` | Nodes: `u16 option_index, start, length` | :proven[5,137 records] |
| `0x48` | One `u64` option-value hash per entry | :proven[5,137 records] |
| `0x54` | `u16` entries: child-node index or `0x8000 + permutation_index` | :proven[5,137 records] |
| `0x60` | `u64` permutation ids | :proven[5,137 records] |

Node zero is the root. A node tests its indexed option and selects an entry by value hash; an entry either
continues to a child or terminates at a permutation. Options increase along a path. Of the 5,137 records, 473
have no options and one permutation; the other 4,664 have trees of one to seven options. Those trees contain
42,297 nodes, including 2,444 mixing child and leaf entries, and 62,274 leaves. Every permutation index occurs
once among its record's leaves, and walking each leaf's own path returns the expected permutation in all
62,274 cases. :proven[all records and leaves in both databases]

The option names and values are still hashes. Only 43 of 1,345 option-name hashes also appear in material depot
parameters; deriving all selector values from the material alone is not supported by this measurement. :observed

## Permutations and bytecode

```layout
title: Raster permutation fixed fields
size: 32
note: Little-endian; GUID array follows at 0x20 in measured records.
fields:
  - {at: 0, size: 8, type: u64, name: shared-data id, level: observed}
  - {at: 8, size: 8, type: u64, name: GUID array pointer, level: observed}
  - {at: 16, size: 8, type: u64, name: input-layout id, level: observed}
  - {at: 24, size: 8, type: u64, name: unknown, level: unknown, note: Zero in measured records.}
```

A raster permutation names vertex bytecode and optionally pixel bytecode. A compute permutation stores shared-data
id and GUID pointer at `0` and `8`, followed by its compute GUID at `0x10`. The GUID resolves a resource named
`shaders/bytecode/<guid>`. :observed

A stock-data census counts 20,429 CompiledBytecode resource entries across twelve TOCs. All embedded containers
have DXIL chunks; eight entries in globals contain two `DXBC` signatures and the remainder contain one. The
ordinary wrapper begins `u16 6, u16 2` and contains an `RC2S` block at `0x20`; observed DXBC starts range from 88 to 294
bytes. Trailing wrapper data is common. Every CompiledBytecode entry in this twelve-TOC census contains the
described DXIL container structure; no container is refused. :proven[all CompiledBytecode entries]

Two-container ray-tracing wrappers use `RPTR` at `0x20`. The embedded DXBC length is stored at container `+24`;
container bytes and surrounding wrapper bytes are separate extents. :observed

Register mappings and vertex-input structures are described under
[bindings and input layouts](/engines/frostbite/shaders/bindings-and-input-layouts/).

ReSkate's map merge keeps base programs and does not accept map-supplied shader bytecode. Studio's private
`vertex_blend` program is therefore subject to loader behaviour beyond a valid container layout.
:sourced[ReSkate] See [Studio compilation](/engines/frostbite/mod-loading/studio/).

:::open[What supplies each selector option?]
The tree structure is validated across both databases, but the option names, value hashes and all caller-supplied values are not decoded.
The other seven program-array items are also unresolved. :unknown
:::

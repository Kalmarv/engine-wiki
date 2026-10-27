---
title: MTD material definitions
description: Sekiro's nested material definition blocks, typed parameters and texture declarations.
games: [sekiro]
sources:
  - title: SoulsFormats
    url: https://github.com/JKAnderson/SoulsFormats
    note: Independent MTD reader
implementations:
  - name: fromsoft-formats (mtd.rs)
    url: https://github.com/Kalmarv/fromsoft-formats/blob/main/src/mtd.rs
---

MTD defines a material's shader, description, typed parameters and texture declarations. Sekiro groups these
definitions in `/mtd/allmaterialbnd.mtdbnd.dcx`. :observed The binder holds 3,170 definitions under 3,169 names
(`M[ARSN]_4m.mtd` appears twice). :observed{games="sekiro"}

Every definition in that binder is compared with an independent reader, including all decoded strings, parameters
and textures. Parsing reaches the exact end of each file. :proven[all binder definitions]

## Nested blocks

MTD is little-endian and uses length-prefixed Shift-JIS strings. Marker bytes following strings and blocks are
followed by zero alignment to a four-byte boundary. :proven[all binder definitions]

```layout
title: MTD block prefix
size: 20
fields:
  - {at: 0, size: 4, type: u32, name: reserved, value: 0, level: proven}
  - {at: 4, size: 4, type: u32, name: declared body length, level: proven}
  - {at: 8, size: 4, type: u32, name: block kind, level: proven}
  - {at: 12, size: 4, type: u32, name: block version, level: proven}
  - {at: 16, size: 1, type: u8, name: marker, level: proven}
  - {at: 17, size: 3, type: bytes, name: alignment, value: 0, level: proven}
```

Some stock blocks overstate their lengths. Typed counts, nested structure and markers still describe the complete
file; this discrepancy does not establish whether the game uses or ignores the declared lengths. :proven[all binder definitions]
The definitions with an overstated length are 83 of the 3,170. :inferred{games="sekiro"}

| Block kind | Version | Contents | Confidence |
|---|---:|---|---|
| 0 | 3 | Outer material block | :proven |
| 1 | 2 | Header with string `MTD ` and integer 1000 | :proven |
| 2 | 4 | Shader and description | :proven |
| 3 | 4 | Parameter and texture collections | :proven |
| 4 | 4 | Parameter name, type and value block | :proven |
| `0x1000` | 1 | Boolean, one byte 0 or 1 | :proven |
| `0x1001` | 1 | Signed 32-bit integer values | :proven |
| `0x1002` | 1 | 32-bit float values | :proven |
| `0x2000` | 3 or 5 | Texture declaration | :proven |

Supported stored parameter types are `bool`, `int`, `int2`, `float`, `float2`, `float3` and `float4`; the value block
also stores a component count. :proven Texture declarations contain a kind, UV number and shader-data index;
version 5 adds a fixed path and a counted float array. :proven

The MTD's `GXFT_SATStaticSwitch` selects a pixel-program permutation; the shader path names the shader bundle
family. See [shader bundles](/engines/fromsoft/shaders/bundles/) and
[constant binding and tiling](/engines/fromsoft/materials/constant-binding/). :observed

:::open[Which consumers rely on overstated block lengths?]
Structural parsing and independent values agree, but that does not settle how the runtime treats an incorrect
declared length. :unknown
:::

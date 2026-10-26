---
title: Enhanced texture dictionaries
description: YTD tables, texture records, SGA formats, mip storage and parent/resident texture lookup.
games: [gta-v]
sources:
  - title: CodeWalker
    url: https://github.com/dexyfex/CodeWalker
    note: TextureDictionary, Gen9 texture conversion and GameFileCache resident dictionaries.
implementations:
  - name: primase worlds/gta (texture.rs)
    url: https://github.com/Kalmarv/primase/blob/main/worlds/gta/src/rage/texture.rs
  - name: primase worlds/gta (sga.rs)
    url: https://github.com/Kalmarv/primase/blob/main/worlds/gta/src/rage/sga.rs
  - name: primase worlds/gta (gtxd.rs)
    url: https://github.com/Kalmarv/primase/blob/main/worlds/gta/src/read/gtxd.rs
---

Enhanced YTD resources use version 5. Drawables can embed dictionaries with the same texture representation.
A dictionary has a sorted array of name hashes and a parallel array of texture pointers; some embedded entries
have null pointers. :proven

The structural census reads all 89,813 version-5 YTD copies and embedded dictionaries in every accepted Enhanced
drawable resource, with no failures. Four YTDs with other layouts (one version 2 and three version 13) and fifteen
other-version YDRs are excluded. Every decoded texture's computed mip/slice byte length equals its stored block
count times block size. The proven record and storage claims below have this scope; texture lookup examples are
separate observations. :proven[version-filtered full-install census]

```layout
title: Texture dictionary
size: 64
fields:
  - {at: 0, size: 16, type: bytes, name: resource base, level: sourced}
  - {at: 16, size: 16, type: bytes, name: unknown, level: unknown}
  - {at: 32, size: 8, type: pointer, name: sorted name hashes, level: proven}
  - {at: 40, size: 2, type: u16, name: hash count, level: proven}
  - {at: 42, size: 2, type: u16, name: hash capacity, level: proven}
  - {at: 44, size: 4, type: bytes, name: unknown, level: unknown}
  - {at: 48, size: 8, type: pointer, name: texture pointers, level: proven}
  - {at: 56, size: 2, type: u16, name: texture count, level: proven}
  - {at: 58, size: 2, type: u16, name: texture capacity, level: proven}
  - {at: 60, size: 4, type: bytes, name: unknown, level: unknown}
```

```layout
title: Enhanced texture
size: 128
note: The first 80 bytes form the texture base also used by shader references.
fields:
  - {at: 0, size: 8, type: bytes, name: unknown, level: unknown}
  - {at: 8, size: 4, type: u32, name: block count, level: proven}
  - {at: 12, size: 4, type: u32, name: block size, level: proven}
  - {at: 16, size: 4, type: u32, name: flags, level: proven}
  - {at: 20, size: 4, type: bytes, name: unknown, level: unknown}
  - {at: 24, size: 2, type: u16, name: width, level: proven}
  - {at: 26, size: 2, type: u16, name: height, level: proven}
  - {at: 28, size: 2, type: u16, name: depth, level: proven}
  - {at: 30, size: 1, type: u8, name: dimension, level: proven, note: "1 2D, 2 3D, 3 cube"}
  - {at: 31, size: 1, type: u8, name: SGA buffer format, level: proven}
  - {at: 32, size: 1, type: u8, name: tile mode, level: proven}
  - {at: 33, size: 1, type: u8, name: unknown, level: unknown}
  - {at: 34, size: 1, type: u8, name: mip count, level: proven}
  - {at: 35, size: 5, type: bytes, name: unknown, level: unknown}
  - {at: 40, size: 8, type: pointer, name: texture name, level: proven}
  - {at: 48, size: 8, type: bytes, name: unknown, level: unknown}
  - {at: 56, size: 8, type: pointer, name: texture data, level: proven}
  - {at: 64, size: 4, type: u32, name: usage word, level: proven}
  - {at: 68, size: 60, type: bytes, name: unknown tail, level: unknown}
```

## Storage and formats

Texture data contains every mip of every slice, largest mip first. Each mip occupies whole compression blocks;
computed sizes from dimensions, format and mip count match `blockCount * blockSize` in the inspected format census.
Mip sides halve down to at least one texel. :proven

SGA format numbers partly resemble DXGI but use their own numbering. The table gives selected decoded codes, not an
exhaustive list of all possible formats. :observed

| Code | Format | Confidence |
|---|---|---|
| `0x1C` / `0x1D` | RGBA8 UNORM / sRGB | :observed |
| `0x38` | R16 UNORM | :observed |
| `0x47` / `0x48` | BC1 UNORM / sRGB | :observed |
| `0x4A` / `0x4B` | BC2 UNORM / sRGB | :observed |
| `0x4D` / `0x4E` | BC3 UNORM / sRGB | :observed |
| `0x50` / `0x51` | BC4 UNORM / SNORM | :observed |
| `0x53` / `0x54` | BC5 UNORM / SNORM | :observed |
| `0x57` / `0x5B` | BGRA8 UNORM / sRGB | :observed |
| `0x5F` / `0x60` | BC6H unsigned / signed float | :observed |
| `0x62` / `0x63` | BC7 UNORM / sRGB | :observed |

CodeWalker's Gen9-to-Legacy conversion can be lossy: R16 UNORM becomes A8, and unknown codes can fall back to
A8R8G8B8. A converted texture's format is therefore not evidence for its original Enhanced storage format.
:sourced[CodeWalker]

CodeWalker's BC5 decoder (`DDSIO.DecompressBC5Block`, at commit `485d56b`) decodes the second channel into red with
the first channel's endpoints and leaves green at 255. BC5 normal maps, about 2% of the city's normal maps, then
decode as a flat `y = +1, z = 0` normal; an independent BC5 decoder gives the correct channels. :observed

## Lookup

Texture parenting comes from live `gtxd.ymt` RBF data, `mph4_gtxd.ymt` and enabled `GTXD_PARENTING_DATA` XML.
`CMapParentTxds/txdRelationships` records name child/parent dictionary pairs; lookup can walk a parent chain.
:observed

CodeWalker also searches resident dictionaries after local and parent dictionaries. Its resident initialization
loads `mapdetail`, then `vehshare`, with later duplicate names replacing earlier resident entries.
:sourced[CodeWalker]

Sampled vehicle-mod fragments obtain shared `vehicle_generic_detail2`, `detail2_normal`, `detail_spec` and
`genericmud_car` textures from `vehshare`; parent relationships alone do not supply them. :observed

:::open[Which unresolved textures have additional ownership rules?]
Sampled `blank` and Tulip `mesh_3a`/`mesh3_normal` references remain unresolved after the resident lookup described
above. They do not establish permission to synthesize a replacement texture. :unknown
:::

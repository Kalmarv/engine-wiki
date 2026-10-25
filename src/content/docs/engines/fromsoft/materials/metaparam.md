---
title: Shader METAPARAM
description: Texture declarations, pass masks and material constant offsets shared by shader bundles.
sources:
  - title: SoulsFormatsNEXT
    url: https://github.com/soulsmods/SoulsFormatsNEXT/blob/master/SoulsFormats/Formats/METAPARAM.cs
    note: Reference names for metadata fields
implementations:
  - name: primase worlds/fromsoft (metaparam.rs)
    url: https://github.com/Kalmarv/primase/blob/main/worlds/fromsoft/src/metaparam.rs
---

A shader bundle's `.metaparam` describes texture slots, default textures, UV groups, per-pass sampler masks and
material constant locations. Version 6 starts with `SMD\0` and has a 152-byte header. :proven[version-6 bundle census]

In Sekiro's 248 bundles, 232 version-6 files match the independent reader field for field across textures,
passes, CAParams and MtdParams; the other 16 use version 4. This proves the comparison for version 6, not a
version-4 layout. The comparison permits Sekiro colour type 12 where the reference otherwise expects 13.
:proven[232 version-6 files]{games="sekiro"}

Elden Ring's four bundle binders contain 1,063 metaparams; every one reads and matches the independent reader
for header values, texture slots, passes and parameters. The texture word at offset `0x20`, which the reference
skips, remains unknown rather than an independently verified meaning. No Elden Ring metaparam is refused.
:proven[all 1063 bundles]{games="elden-ring"}

The version-6 layouts below cover those 232 Sekiro and 1,063 Elden Ring files; Sekiro's 16 version-4 files are
excluded. :proven[version-6 bundle census]

## Header

```layout
title: METAPARAM version 6 header
size: 152
fields:
  - {at: 0, size: 4, type: char, name: magic, value: 'SMD\0', level: proven}
  - {at: 4, size: 4, type: u32, name: reserved, value: 0, level: proven}
  - {at: 8, size: 4, type: u32, name: version, value: 6, level: proven}
  - {at: 12, size: 4, type: u32, name: texture count, level: proven}
  - {at: 16, size: 8, type: u64, name: unknown offset, level: unknown}
  - {at: 24, size: 8, type: u64, name: CAParam table offset, level: proven}
  - {at: 32, size: 8, type: u64, name: MtdParam table offset, level: proven}
  - {at: 40, size: 4, type: u32, name: CAParam record count, level: proven}
  - {at: 44, size: 4, type: u32, name: MtdParam count, level: proven}
  - {at: 48, size: 4, type: u32, name: unknown 30, level: unknown}
  - {at: 52, size: 4, type: u32, name: constant buffer byte size, level: proven}
  - {at: 56, size: 4, type: u32, name: feature flags, level: sourced}
  - {at: 60, size: 4, type: u32, name: reserved, value: 0, level: proven}
  - {at: 64, size: 4, type: u32, name: unknown 40, level: unknown}
  - {at: 68, size: 4, type: u32, name: reserved, value: 0, level: proven}
  - {at: 72, size: 4, type: u32, name: GXMD matching key, level: sourced}
  - {at: 76, size: 4, type: u32, name: CAParam block byte size, level: sourced}
  - {at: 80, size: 4, type: u32, name: unknown 50, level: unknown}
  - {at: 84, size: 4, type: u32, name: CAParam component count, level: sourced}
  - {at: 88, size: 4, type: u32, name: shader ID, level: sourced}
  - {at: 92, size: 60, type: bytes, name: reserved, value: 0, level: proven}
```

SoulsFormatsNEXT identifies feature bits `0x10` for CAParams, `0x100` for vertex-stage material parameter reads,
and `0x10000` for tessellation. :sourced[SoulsFormatsNEXT]

## Textures and render passes

Texture records start at byte 152; a 40-byte render-pass descriptor follows them and points to the pass array.
All string offsets are file-relative and name NUL-terminated UTF-16 strings. :proven[version-6 bundle census]

```layout
title: METAPARAM texture
size: 48
fields:
  - {at: 0, size: 8, type: u64, name: name offset, level: proven}
  - {at: 8, size: 1, type: u8, name: unknown 08, level: unknown}
  - {at: 9, size: 1, type: u8, name: slot register, level: proven}
  - {at: 10, size: 1, type: u8, name: reserved, value: 0, level: proven}
  - {at: 11, size: 1, type: u8, name: texture category, level: sourced}
  - {at: 12, size: 4, type: i32, name: unknown 0C, level: unknown, note: Usually -1.}
  - {at: 16, size: 8, type: u64, name: default texture path offset, level: proven}
  - {at: 24, size: 8, type: u64, name: UV group name offset, level: proven}
  - {at: 32, size: 4, type: u32, name: unknown 20, level: unknown, note: Zero in checked Sekiro files; sometimes hash-like in Elden Ring.}
  - {at: 36, size: 12, type: bytes, name: reserved, value: 0, level: proven}
```

| Category | Role | Confidence |
|---|---|---|
| 0 | Other | :sourced[SoulsFormatsNEXT] |
| 1, 3, 4 | Albedo, reflectance, normal | :sourced[SoulsFormatsNEXT] |
| 6, 7, 10 | Emissive, displacement, flow | :sourced[SoulsFormatsNEXT] |
| 14, 15, 16, 17 | Metallic, one-channel mask, three-channel mask, vector map | :sourced[SoulsFormatsNEXT] |

```layout
title: METAPARAM pass descriptor
size: 40
fields:
  - {at: 0, size: 8, type: u64, name: pass array offset, level: proven}
  - {at: 8, size: 4, type: u32, name: pass count, level: proven}
  - {at: 12, size: 28, type: bytes, name: reserved, value: 0, level: proven}
```

```layout
title: METAPARAM render pass
size: 24
fields:
  - {at: 0, size: 4, type: u32, name: pass ID, level: sourced}
  - {at: 4, size: 4, type: u32, name: reserved, value: 0, level: proven}
  - {at: 8, size: 4, type: u32, name: pixel sampler mask, level: sourced}
  - {at: 12, size: 4, type: u32, name: hull sampler mask, level: sourced}
  - {at: 16, size: 4, type: u32, name: vertex sampler mask, level: sourced}
  - {at: 20, size: 4, type: u32, name: reserved, value: 0, level: proven}
```

Bit `n` of each stage mask names sampler slot `n`. :sourced[SoulsFormatsNEXT]

## Material parameters

```layout
title: METAPARAM CAParam
size: 96
fields:
  - {at: 0, size: 8, type: u64, name: name offset, level: proven}
  - {at: 8, size: 32, type: bytes, name: reserved, value: 0, level: proven}
  - {at: 40, size: 4, type: u32, name: sequence index, level: sourced}
  - {at: 44, size: 4, type: u32, name: parameter ID, level: sourced}
  - {at: 48, size: 4, type: u32, name: component, level: sourced}
  - {at: 52, size: 4, type: f32, name: default, level: proven}
  - {at: 56, size: 4, type: u32, name: unknown 38, level: unknown}
  - {at: 60, size: 4, type: u32, name: name hash, level: sourced}
  - {at: 64, size: 32, type: bytes, name: reserved, value: 0, level: proven}
```

```layout
title: METAPARAM MtdParam
size: 80
fields:
  - {at: 0, size: 8, type: u64, name: name offset, level: proven}
  - {at: 8, size: 28, type: bytes, name: reserved, value: 0, level: proven}
  - {at: 36, size: 4, type: u32, name: absolute constant word offset, level: proven}
  - {at: 40, size: 4, type: i32, name: sequence index, level: sourced}
  - {at: 44, size: 1, type: u8, name: value type, level: proven}
  - {at: 45, size: 1, type: u8, name: renderer-only parameter flag, level: proven, note: 2 means not a direct shader input; otherwise 0.}
  - {at: 46, size: 1, type: bool, name: sRGB colour conversion, level: proven}
  - {at: 47, size: 1, type: bool, name: colour flag, level: proven}
  - {at: 48, size: 4, type: u32, name: override key, level: proven}
  - {at: 52, size: 20, type: float5, name: default value, level: proven}
  - {at: 72, size: 8, type: bytes, name: reserved, value: 0, level: proven}
```

MtdParam type 0 is bool; types 1â€“4 are float through float4. Colour is type 12 in Sekiro and 13 in Elden Ring,
with RGBA and a fifth intensity component. These codes differ from MATBIN's parameter codes. :proven[version-6 bundle census]

The override key is a CRC-32 of the UTF-16LE logical parameter name, or zero when there is no override; that logical
name need not equal the shader field name. :observed

:::open[What does version 4 change?]
Sixteen Sekiro bundles use version 4, including older lightmap shaders and `sfx_AMSN_cloth`; the version-6 layouts
above do not describe them. :observed{games="sekiro"}
:::

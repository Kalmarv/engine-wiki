---
title: FLVER material bindings
description: Material records, texture overrides, GX extensions and texture addressing.
sources:
  - title: SoulsFormatsNEXT
    url: https://github.com/soulsmods/SoulsFormatsNEXT/tree/master/SoulsFormats/Formats/FLVER/FLVER2
    note: Material, Texture and GXList readers
  - title: RunDevelopment GX investigation
    url: https://github.com/JKAnderson/SoulsFormats/issues/14
    note: GXMD framing and optional flag records
implementations:
  - name: primase worlds/fromsoft (materials.rs)
    url: https://github.com/Kalmarv/primase/blob/main/worlds/fromsoft/src/materials.rs
---

A FLVER material binds a mesh to an external definition and supplies texture-path overrides. Sekiro uses
[MTD](/engines/fromsoft/materials/mtd/); Elden Ring uses [MATBIN](/engines/fromsoft/materials/matbin/), even though
the FLVER reference may retain a `.matxml` source name. :observed

```layout
title: FLVER2 material
size: 32
fields:
  - {at: 0, size: 4, type: u32, name: material name offset, level: observed}
  - {at: 4, size: 4, type: u32, name: definition path offset, level: observed}
  - {at: 8, size: 4, type: u32, name: texture count, level: observed}
  - {at: 12, size: 4, type: u32, name: first texture index, level: observed}
  - {at: 16, size: 4, type: u32, name: calculated string byte count, level: sourced, note: SoulsFormatsNEXT identifies this as the combined material and texture string size.}
  - {at: 20, size: 4, type: u32, name: GX list offset, level: observed}
  - {at: 24, size: 4, type: u32, name: material index, level: sourced}
  - {at: 28, size: 4, type: u32, name: reserved, value: 0, level: observed}
```

```layout
title: FLVER2 texture binding
size: 32
fields:
  - {at: 0, size: 4, type: u32, name: path offset, level: observed}
  - {at: 4, size: 4, type: u32, name: texture kind name offset, level: observed}
  - {at: 8, size: 8, type: float2, name: scale, level: observed}
  - {at: 16, size: 1, type: u8, name: U tiling type, level: sourced}
  - {at: 17, size: 1, type: u8, name: V tiling type, level: sourced}
  - {at: 18, size: 2, type: bytes, name: reserved, value: 0, level: observed}
  - {at: 20, size: 12, type: float3, name: unknown values, level: unknown}
```

| Tiling code | Reference-reader name | Confidence |
|---|---|---|
| 0 | None | :sourced[SoulsFormatsNEXT] |
| 1 | Repeat | :sourced[SoulsFormatsNEXT] |
| 2 | MirrorRepeat | :sourced[SoulsFormatsNEXT] |
| 3 | Clamp | :sourced[SoulsFormatsNEXT] |
| 4 | Border | :sourced[SoulsFormatsNEXT] |
| 5 | MirrorOnce | :sourced[SoulsFormatsNEXT] |

A nonempty FLVER texture path overrides the definition's fixed path for the matching kind. Elden Ring's
metaparam can supply a system texture for an otherwise unbound numbered slot; captured uploaded mip hashes on
Stormveil DetailBlend draws match those defaults. :observed

The `N` in `Texture2D_N` identifies a logical texture across material and program names. It is distinct from the
metaparam slot/register: Sekiro's DetailBlend base albedo `Texture2D_7` is at register 1, while detail albedo
`Texture2D_2` is at register 7. :observed{games="sekiro"}

## GX extension lists

GX lists preserve material extension payloads beside the ordinary texture bindings. :sourced[SoulsFormatsNEXT]

```layout
title: GX item header
size: 12
fields:
  - {at: 0, size: 4, type: bytes, name: identifier, level: observed}
  - {at: 4, size: 4, type: u32, name: version, level: sourced}
  - {at: 8, size: 4, type: u32, name: total item length, level: observed, note: Includes this header for ordinary items.}
```

The terminator identifier is `0x7FFFFFFF` or `0xFFFFFFFF`, with version word 100 and zero payload padding.
Ordinarily its length includes the 12-byte header; where the FLVER header's low word at `0x68` is 5, it counts
padding alone, as on Elden Ring SpeedTree files. :observed

### GXMD payloads

GXMD contains a 32-bit item count followed by typed ID/value entries, without a trailing sentinel. IDs can appear
in any order. Sekiro and Elden Ring can add a type-0 boolean record sharing the preceding value's ID; its meaning
is unresolved. :sourced[RunDevelopment]

```layout
title: GXMD item prefix
size: 8
fields:
  - {at: 0, size: 4, type: i32, name: item ID, level: sourced}
  - {at: 4, size: 4, type: i32, name: value type, level: sourced}
```

| Type | Following value | Confidence |
|---|---|---|
| 0 | One boolean word, 0 or 1; optional flag for an existing ID | :sourced[RunDevelopment] |
| 1 | One float | :sourced[RunDevelopment] |
| 2 | Two floats | :sourced[RunDevelopment] |
| 3 | Three floats | :sourced[RunDevelopment] |
| 11 | Five floats | :sourced[RunDevelopment] |

For the inspected Sekiro `MetallicValue` and `MetallicValue_MeshDecal` shader families, GXMD version 123 item
237 corresponds to the scalar named `snp_0_float_0_0`; their G-buffer programs read `cb2[20].x` for the metallic
mixture. This association is not established for other shader families or flagged values. :observed{games="sekiro"}

:::open[What do all GX payloads and trailing texture floats mean?]
The structural records do not establish the semantics of every extension or the three floats at texture offset 20.
They remain raw values rather than universal shader parameters. :unknown
:::

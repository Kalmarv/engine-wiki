---
title: MATBIN material definitions
description: Elden Ring's material binary header, typed values, sampler records and unreferenced tails.
games: [elden-ring]
sources:
  - title: SoulsFormatsNEXT
    url: https://github.com/soulsmods/SoulsFormatsNEXT/blob/master/SoulsFormats/Formats/MATBIN.cs
    note: Independent material binary reader
implementations:
  - name: fromsoft-formats (matbin.rs)
    url: https://github.com/Kalmarv/fromsoft-formats/blob/main/src/matbin.rs
---

MATBIN stores the shader source path, material source path, parameters and samplers behind a FLVER material's
`.matxml` reference. Its magic is `MAB\0` and its version is 2. :proven

Every material-binder entry is compared with SoulsFormatsNEXT: shader and source paths, keys, parameter names,
types and float bit patterns, and sampler names, paths, keys and trailing floats. Extra stored float3 components
and truncated values are accounted for separately. :proven[all material binders]

## Records

Offsets below are file-relative 64-bit offsets; strings are NUL-terminated UTF-16. Parameter records immediately
follow the header, then sampler records, then referenced strings and values. :proven

```layout
title: MATBIN header
size: 56
fields:
  - {at: 0, size: 4, type: char, name: magic, value: 'MAB\0', level: proven}
  - {at: 4, size: 4, type: u32, name: version, value: 2, level: proven}
  - {at: 8, size: 8, type: u64, name: shader path offset, level: proven}
  - {at: 16, size: 8, type: u64, name: source path offset, level: proven}
  - {at: 24, size: 4, type: u32, name: key, level: unknown}
  - {at: 28, size: 4, type: u32, name: parameter count, level: proven}
  - {at: 32, size: 4, type: u32, name: sampler count, level: proven}
  - {at: 36, size: 20, type: bytes, name: reserved, value: 0, level: proven}
```

```layout
title: MATBIN parameter
size: 40
fields:
  - {at: 0, size: 8, type: u64, name: name offset, level: proven}
  - {at: 8, size: 8, type: u64, name: value offset, level: proven}
  - {at: 16, size: 4, type: u32, name: key, level: unknown}
  - {at: 20, size: 4, type: u32, name: type code, level: proven}
  - {at: 24, size: 16, type: bytes, name: reserved, value: 0, level: proven}
```

```layout
title: MATBIN sampler
size: 48
fields:
  - {at: 0, size: 8, type: u64, name: kind name offset, level: proven}
  - {at: 8, size: 8, type: u64, name: texture path offset, level: proven}
  - {at: 16, size: 4, type: u32, name: key, level: unknown}
  - {at: 20, size: 8, type: float2, name: stored scale, level: observed, note: Nonzero values participate in captured texture tiling.}
  - {at: 28, size: 20, type: bytes, name: reserved, value: 0, level: proven}
```

| Type | Value | Nominal bytes | Confidence |
|---|---|---:|---|
| 0 | Boolean | 1 | :proven |
| 4 | Signed integer | 4 | :proven |
| 5 | Two signed integers | 8 | :proven |
| 8 | Float | 4 | :proven |
| 9 | Float2 | 8 | :proven |
| 10 | Float3; some stored extents contain two further floats | 12 or 20 | :proven |
| 11 | Float4 | 16 | :proven |
| 12 | Float5; colours include intensity as the fifth component | 20 | :proven |

A stored value's actual extent can end before its nominal type size, because the next referenced item begins
sooner. Some files also contain unreferenced tail bytes, including strings from an earlier material revision.
The type code alone therefore does not describe every byte after a value offset. :proven

The separate [METAPARAM](/engines/fromsoft/materials/metaparam/) supplies binding offsets, colour flags and texture
UV groups; MATBIN's stored values alone do not specify the uploaded shader words. :observed

:::open[What do the MATBIN keys identify?]
The keys are preserved and compared bit for bit, but their complete generation rule and runtime use are not
established here. :unknown
:::

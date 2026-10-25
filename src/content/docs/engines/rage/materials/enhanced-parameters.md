---
title: Enhanced material parameters
description: Drawable shader records, parameter-info words, constant buffers and Enhanced parameter names.
games: [gta-v]
sources:
  - title: CodeWalker
    url: https://github.com/dexyfex/CodeWalker
    note: Gen9 shader reader and ShadersGen9Conversion.xml.
implementations:
  - name: primase worlds/gta (drawable.rs)
    url: https://github.com/Kalmarv/primase/blob/main/worlds/gta/src/rage/drawable.rs
---

A drawable's shader group owns shader records and can embed a texture dictionary. Each shader names an effect by
hash and supplies typed material parameters, a render bucket and a bucket mask. Compiled programs and their pass
states live in [SGD2](/engines/rage/shaders/sgd2/). :observed

```layout
title: Enhanced drawable shader
size: 64
fields:
  - {at: 0, size: 4, type: u32, name: effect name hash, level: observed}
  - {at: 4, size: 4, type: u32, name: preset word, level: observed, note: "0x6D657461 in the inspected shader census"}
  - {at: 8, size: 8, type: pointer, name: parameter buffer pointers, level: observed}
  - {at: 16, size: 8, type: pointer, name: texture-reference pointers, level: observed}
  - {at: 24, size: 8, type: bytes, name: unknown, level: unknown}
  - {at: 32, size: 8, type: pointer, name: parameter information, level: observed}
  - {at: 40, size: 17, type: bytes, name: unknown, level: unknown}
  - {at: 57, size: 1, type: u8, name: render bucket, level: observed}
  - {at: 58, size: 2, type: bytes, name: unknown, level: unknown}
  - {at: 60, size: 4, type: u32, name: bucket mask, level: observed}
```

The inspected shader census has one preset-word value, `0x6D657461`; the word alone does not distinguish material
families. Effect identity, parameters and render state carry that distinction. :observed

The parameter-info header is eight bytes: buffer, texture, other, sampler and parameter counts, two zero bytes,
then buffer-copy count. Eight-byte parameter records follow. :observed

```layout
title: Material parameter info
size: 8
fields:
  - {at: 0, size: 4, type: u32, name: parameter name hash, level: observed}
  - {at: 4, size: 4, type: u32, name: packed parameter descriptor, level: observed}
```

| Descriptor bits | Meaning | Confidence |
|---|---|---|
| 0–1 | Kind: 0 texture, 1 other, 2 sampler, 3 constant-buffer data | :observed |
| 2–9 for reference kinds | Reference index | :observed |
| 2–7 for buffer data | Constant-buffer index | :observed |
| 8–19 for buffer data | Byte offset in buffer | :observed |
| 20–31 for buffer data | Byte length | :observed |

Buffer pointers can be stored in several copies. Texture references point at texture bases carrying names; a null
texture pointer is a stored absence, not a named white texture. :observed

CodeWalker's conversion XML maps Enhanced names to Legacy names. For example, `Specular` corresponds to
`specularFalloffMult`, and `SpecularColor` to `specularIntensityMult`. Exported Legacy names therefore do not
necessarily reproduce the original Enhanced parameter identifiers. :sourced[CodeWalker]

The program binding tables independently relate current material hashes, program identifiers and constant-buffer
offsets. A material's constants and engine-global constants have different owners even when both are shader inputs.
:observed

:::open[What do the remaining shader-record bytes and other-reference kinds control?]
Their presence is recorded, but decoding a reference index does not establish the resource's runtime role. :unknown
:::

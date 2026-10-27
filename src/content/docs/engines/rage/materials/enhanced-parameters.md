---
title: Enhanced material parameters
description: Drawable shader records, parameter-info words, constant buffers and Enhanced parameter names.
games: [gta-v]
sources:
  - title: CodeWalker
    url: https://github.com/dexyfex/CodeWalker
    note: Gen9 shader reader and ShadersGen9Conversion.xml.
implementations:
  - name: rage-engine-formats (drawable.rs)
    url: https://github.com/Kalmarv/rage-engine-formats/blob/main/src/drawable.rs
---

A drawable's shader group owns shader records and can embed a texture dictionary. Each shader names an effect by
hash and supplies typed material parameters, a render bucket and a bucket mask. Compiled programs and their pass
states live in [SGD2](/engines/rage/shaders/sgd2/). :proven

Every shader and its parameters in all version-159 YDR/YDD and version-171 YFT copies pass the structural resource
census, with every effect, texture-parameter and buffer-parameter hash resolving. Fifteen other-version YDRs are
excluded. The record and descriptor proofs on this page apply to the accepted versions. :proven[all accepted drawable resources]

```layout
title: Enhanced drawable shader
size: 64
fields:
  - {at: 0, size: 4, type: u32, name: effect name hash, level: proven}
  - {at: 4, size: 4, type: u32, name: preset word, level: proven, note: "0x6D657461 in the inspected shader census"}
  - {at: 8, size: 8, type: pointer, name: parameter buffer pointers, level: proven}
  - {at: 16, size: 8, type: pointer, name: texture-reference pointers, level: proven}
  - {at: 24, size: 8, type: bytes, name: unknown, level: unknown}
  - {at: 32, size: 8, type: pointer, name: parameter information, level: proven}
  - {at: 40, size: 17, type: bytes, name: unknown, level: unknown}
  - {at: 57, size: 1, type: u8, name: render bucket, level: proven}
  - {at: 58, size: 2, type: bytes, name: unknown, level: unknown}
  - {at: 60, size: 4, type: u32, name: bucket mask, level: proven}
```

All 721,634 shaders of the full-install census have one preset-word value, `0x6D657461`; the word alone does not
distinguish material families. Effect identity, parameters and render state carry that distinction. :proven

The parameter-info header is eight bytes: buffer, texture, other, sampler and parameter counts, two zero bytes,
then buffer-copy count. Eight-byte parameter records follow. :proven

```layout
title: Material parameter info
size: 8
fields:
  - {at: 0, size: 4, type: u32, name: parameter name hash, level: proven}
  - {at: 4, size: 4, type: u32, name: packed parameter descriptor, level: proven}
```

| Descriptor bits | Meaning | Confidence |
|---|---|---|
| 0–1 | Kind: 0 texture, 1 other, 2 sampler, 3 constant-buffer data | :proven |
| 2–9 for reference kinds | Reference index | :proven |
| 2–7 for buffer data | Constant-buffer index | :proven |
| 8–19 for buffer data | Byte offset in buffer | :proven |
| 20–31 for buffer data | Byte length | :proven |

Buffer pointers can be stored in several copies. Texture references point at texture bases carrying names; a null
texture pointer is a stored absence, not a named white texture. :proven

CodeWalker's conversion XML maps Enhanced names to Legacy names. For example, `Specular` corresponds to
`specularFalloffMult`, and `SpecularColor` to `specularIntensityMult`. Exported Legacy names therefore do not
necessarily reproduce the original Enhanced parameter identifiers. :sourced[CodeWalker]

The same XML gives each material constant's buffer and byte offset. For `normal_spec_decal`, buffer 1 holds
`Fresnel` at 0, `Specular` at 4, `SpecularColor` at 8 and `specMapIntMask` at 16. :sourced[CodeWalker]

An `AlphaTest` parameter exists in only 12 tree effects of the XML's list. :sourced[CodeWalker] The alpha reference
of other cutout materials is therefore not a material constant but part of the render state. :inferred

The program binding tables independently relate current material hashes, program identifiers and constant-buffer
offsets. A material's constants and engine-global constants have different owners even when both are shader inputs.
:proven

:::open[What do the remaining shader-record bytes and other-reference kinds control?]
Their presence is recorded, but decoding a reference index does not establish the resource's runtime role. :unknown
:::

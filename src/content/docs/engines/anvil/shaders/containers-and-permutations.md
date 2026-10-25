---
title: Shader containers and permutations
description: DXBC packs, template-local code frames, sparse permutation tables and draw-key composition.
games: [riders-republic]
implementations:
  - name: primase Anvil shader pack reader
    url: https://github.com/Kalmarv/primase/blob/main/worlds/anvil/src/read/shader_pack.rs
  - name: primase Anvil shader source reader
    url: https://github.com/Kalmarv/primase/blob/main/worlds/anvil/src/read/shader_source.rs
---

Riders Republic stores Shader Model 5 DXBC programs both in material templates and in `ShaderDataDX11.bin` beside the game executable. A template chooses its own code through stage-specific permutation tables; global passes also come from the standalone pack. :observed

## Standalone pack

The pack is 2,443 consecutive DXBC containers followed by 16 bytes containing the MD5 of everything before them. Every container's stored checksum and the pack's MD5 agree over the complete file; there are no intervening records. Resource-definition metadata is stripped from these programs. :proven[complete pack]

## Template code and keys

All 432 template entries contain a stage-separated permutation table. Across base and patch copies, 177,578 records select 55,130 code frames: 124,398 vertex records and 53,180 pixel records. There are 13,790 distinct container byte sequences. Every UCodeHash resolves within its own template and stage; no code frame is unreferenced and no hash repeats within that stage. :proven[all template records]

```layout
title: ShaderPermutation record
size: 41
fields:
  - {at: 0, size: 8, type: u64, name: stored identity, level: unknown, note: "zero in all 177,578 records"}
  - {at: 8, size: 4, type: u32, name: ShaderPermutation class, value: "0x9467F2BB", level: proven}
  - {at: 12, size: 4, type: u32, name: ShaderKey, level: proven}
  - {at: 16, size: 4, type: u32, name: Parameters count, value: 0, level: proven}
  - {at: 20, size: 4, type: u32, name: UCodeHash, level: proven}
  - {at: 24, size: 16, type: bytes, name: stored digest-like data, level: unknown, note: "not identified as a tested common container hash"}
  - {at: 40, size: 1, type: u8, name: stored byte, level: unknown, note: "0 in the table census"}
```

A code frame starts with `ShaderCodePermutation` class `0x7C7AC9C7`, u32 byte length and that many DXBC bytes, followed by UCodeHash and a pass-like u32. Eight bytes after that are often zero but form the next element at stage boundaries, so they are not a universal reserved trailer. :proven[55,130 frames]

Vertex records precede pixel records. Each record block sorts by ShaderKey; each code block sorts by UCodeHash. One extra four-byte gap separates stages. Many keys share a code frame, and the key sets are sparse rather than the full product of their varying bits. :proven[all 432 templates]

| `ShaderKey >> 22` | Pixel output profile | Confidence |
|---:|---|---|
| 0 | No render target; depth/shadow family | :proven[all corresponding containers] |
| 1 | G-buffer: usually four targets; some families have three or five | :proven[all corresponding containers] |
| 2 | One target, often light-list reads; forward family | :proven[all corresponding containers] |
| 3 | One target; two distinct pixel programs across seven template names | :proven[table census] |
| 4 | Four targets, structured UAVs u6/u7, atomic allocation and fragment stores | :proven[all 888 distinct containers] |

The code-frame pass value agrees with `key>>22` except for 480 vertex records in 16 templates that reuse a pass-0 frame for pass 2. :proven

## Draw-key composition

Static inspection of the engine's key composer identifies bits 22–29 as pass, bits 17–21 as vertex layout, bits 14–16 as variants, bits 6–13 as features and the low bits as Material state. Layout bits enter the vertex key; Material bits 1–5 enter the pixel key. :observed[composer disassembly and Rocks table comparison]

| Bit | Producer or effect | Confidence |
|---|---|---|
| `0x40` | Both TwoSided and FlipNormalOnBackFace, gated by a template feature; adds front-face input | :observed[composer and all one-bit shader comparisons] |
| `0x4` | LayerMaterial in the G-buffer pass, gated by the template | :observed[composer] |
| `0x20` | LayerMaterial with nonzero blend mode, requiring `0x4` | :observed[composer] |
| `0x80`, `0x100` | Reduced-material draw levels, gated by template support | :observed[composer] |
| `0x200`–`0x1000` | Base draw features with template and vertex-layout restrictions | :observed[composer] |
| `0x2000` | Vertex-pulling draw flag | :observed[composer] |
| `0x4000` | Draw-time variant; Rocks uses it for LOD dither discard, not texture alpha test | :observed[variant code and Rocks shaders] |
| `0x8000` | Instance-related variant; vertex layout 10 also requests it | :observed[composer and shader comparisons] |
| `0x10000` | Variant associated with vertex colour and structured inputs | :observed[one-bit shader comparisons] |

The cache resolves all eight subsets of bits 14–16 into eight slots; it does not choose the first available subset. The later draw-time choice among them is unresolved. Rocks' ordinary opaque Material has LayerMaterial clear, so its normal-map-alpha roughness path applies; the constant-roughness `0x20` permutation is not evidence that ordinary Rocks uses roughness 1. :observed[composer and permutation lookup]

:::open[Which draw selects each cached variant?]
The base-key and draw-flag producers, the final choice among eight cached subsets, the pass-4 consumer and the meaning of the 16-byte record data remain unresolved. :unknown
:::

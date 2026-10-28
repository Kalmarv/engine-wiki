---
title: MTD material definitions
description: Nested material definition blocks, typed parameters and texture declarations of Sekiro and Elden Ring.
games: [sekiro, elden-ring]
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

Elden Ring keeps the format. `/mtd/allmaterialbnd.mtdbnd.dcx` holds 2,517 definitions and
`/mtd/speedtree.mtdbnd.dcx` 85 more, 2,602 in the installed archives (the DLC archive pair is not installed). A
strict reader of the structure below, which refuses any unexpected marker, count or trailing byte, reads all 2,602 to
the exact end of each file. :proven{games="elden-ring"}

## Nested blocks

MTD is little-endian and uses length-prefixed Shift-JIS strings. Marker bytes following strings and blocks are
followed by alignment bytes up to a four-byte boundary. Those bytes are zero in every Sekiro definition
:proven{games="sekiro"} and in every Elden Ring definition but one (see [alignment padding](#alignment-padding)).
:proven{games="elden-ring"}

```layout
title: MTD block prefix
size: 20
fields:
  - {at: 0, size: 4, type: u32, name: reserved, value: 0, level: proven}
  - {at: 4, size: 4, type: u32, name: declared body length, level: proven}
  - {at: 8, size: 4, type: u32, name: block kind, level: proven}
  - {at: 12, size: 4, type: u32, name: block version, level: proven}
  - {at: 16, size: 1, type: u8, name: marker, level: proven}
  - {at: 17, size: 3, type: bytes, name: alignment, value: 0, level: observed}
```

Some stock blocks overstate their lengths. Typed counts, nested structure and markers still describe the complete
file; this discrepancy does not establish whether the game uses or ignores the declared lengths. :proven[all binder definitions]
A declared length is never shorter than the bytes the block's structure spans, and is longer for at least one block in
83 of Sekiro's 3,170 definitions and 92 of Elden Ring's 2,602, by 4 to 388 bytes in Sekiro's and 4 to 384 in Elden Ring's.
:proven[every definition of both installs] A writer that gives each block the length it declares and each marker the
alignment bytes it holds reproduces every definition of both installs byte for byte; one that gives each block the length
it spans and zero alignment bytes reproduces 3,087 of Sekiro's and 2,509 of Elden Ring's.
:proven[an independent writer over every definition of both installs]

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

## Alignment padding

One definition breaks the zero rule: `character\chr\c9757_crystal.mtd` of Elden Ring's `allmaterialbnd` binder
(1,556 bytes). 19 of its marker alignment runs hold non-zero bytes, where the other 3,170 Sekiro and 2,601 Elden Ring
definitions hold zeros in every run. :proven[all 5,772 definitions of both installs]

| Offset | Alignment bytes |
|---|---|
| `0xc6` | `72 34` |
| `0xdd` | `61 6c 5d` |
| `0xe5` | `75 65 41` |
| `0xfd` | `47 42 55` |
| `0x151` | `6c a3 00` |
| `0x1a1` | `62 44 69` |
| `0x1b9` | `6f 6f 6c` |
| `0x259` | `66 a3 00` |
| `0x2b9` | `10 00 00` |
| `0x2c5` | `04 00 00` |
| `0x379` | `72 4d 61` |
| `0x39d` | `10 00 00` |
| `0x3d9` | `5f 53 70` |
| `0x3e5` | `65 72 a3` |
| `0x441` | `61 6e 63` |
| `0x49a` | `65 6e` |
| `0x4a1` | `65 63 74` |
| `0x561` | `74 45 6e` |
| `0x5b9` | `6f 64 41` |

Most runs are printable ASCII (`72 34` is `r4`, `61 6c 5d` is `al]`, `6f 6f 6c` is `ool`), a few carry the marker
byte `a3` or the small words `10` and `04`. They look like leftover buffer contents from the tool that wrote the
file, not data. :inferred Nothing else in the file is odd: every block's declared length equals the bytes its
structure spans, and the shader (`RecursiveCrystal.spx`), description, ten parameters and four texture slots equal those
of `character\Special\C[Crystal].mtd`, which has clean padding. :observed{games="elden-ring"} The two differ in the
texture declarations: this file stores version 3 (no path, no floats) where the sibling stores version 5.
:observed{games="elden-ring"} Version 3 declarations occur in 86 Elden Ring definitions (174 declarations), 85 of which have zero
padding throughout, so the version does not explain the bytes. :proven{games="elden-ring"} Sekiro stores no version 3
declaration: nine definitions hold 90 version 5 declarations with an empty path and no floats.
:proven{games="sekiro"}

:::open[Which consumers rely on overstated block lengths?]
Structural parsing and independent values agree, but that does not settle how the runtime treats an incorrect
declared length. :unknown
:::

:::open[Does the game read the alignment bytes?]
The one definition with non-zero padding ships in the install, but whether the game loads it, or what it does with
the padding, is not established. :unknown
:::

## Blend mode and alpha reference

Material definitions state `g_BlendMode` and `g_AlphaRef`. `g_BlendMode` takes the values 0, 2, 3, 4 and 5 and is
absent from two definitions of each game; the value 1 occurs in no definition: not in Sekiro's 3,170 MTDs (0 in 2,957,
2 in 191, 3 in 1, 4 in 17, 5 in 2), nor in Elden Ring's 20,619 MATBINs (0 in 19,433, 2 in 1,065, 3 in 10, 4 in 97,
5 in 12) or 2,602 MTDs (0 in 2,458, 2 in 113, 4 in 24, 5 in 5). :proven[every definition of both installs] `g_AlphaRef`
is an integer pair; a first word above 0 is the alpha-test reference (over 255), 0 states none. :observed Elden Ring
MATBINs whose shader is named `Edge` state a positive first word in 878 of 924; Sekiro's shader and material names contain no
`Edge`. :proven[every definition of both installs] Definitions with blend mode 2 and a positive reference exist as well
(Sekiro 55 MTDs, Elden Ring 416 MATBINs and 62 MTDs), so the blend mode does not make the alpha test redundant.
:proven[every definition of both installs]

## Shader names

Sekiro's 3,170 definitions name 257 distinct shader stems. 56 of them (1,077 definitions: the map shaders `M[Multiple]` 457,
`M[Translucency]` 169, `M[MultipleGround]` 169, `M[LandScape]` 54, `M[Sky]` 46, `M[Mb2]` 44, and eight `C[...]` definitions) follow
the bracket grammar of [Elden Ring's MATBIN shader names](/engines/fromsoft/materials/matbin/#shader-names); 201 (2,093 definitions)
do not: `Character_AMSN_[DetailBlend]` (293, with `_cloth` 88), `character_AMSN` (578), `Character_AMSN_SSS` (115), `Fur_NTC` (218),
the `GXFlver_*` family and the test shaders. :proven[all 3,170 definitions]

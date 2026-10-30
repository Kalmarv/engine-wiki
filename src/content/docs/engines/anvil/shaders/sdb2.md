---
title: "SDB2 shader bundles"
description: "The effect and program bundles of Shaun White Skateboarding: source files, records, state pairs and the programs they hold, with their opcodes and registers."
games: ["shaun-white-skateboarding"]
---

Shaun White Skateboarding ships its Direct3D 9 shaders as bundles beside the executable: `ekshadersPChigh.bin`, `ekshadersPCmed.bin` and `ekshadersPClow.bin` for the three quality levels, three `...compress.bin` siblings and `ekshadersinitpccompress.bin`. The three named bundles are uncompressed and carry both the original HLSL source of the effects and the compiled Shader Model 3 programs; the compressed siblings have not been read. :observed{games="shaun-white-skateboarding"}

The executable takes its shaders from these bundles only, never from the forges, and checks the magic `SDB2` and the version 39 when it opens one. :observed{games="shaun-white-skateboarding"}[the executable's loader, read]

## Container

All three uncompressed bundles start with the same 24-byte header. :proven[all three quality files]

```layout
title: "SDB2 header"
size: 24
games: [shaun-white-skateboarding]
note: "Little-endian. Identical in the three quality files except for the record count."
fields:
  - {"at": 0, "size": 4, "type": "char[4]", "name": "magic", "value": "SDB2", "level": "proven"}
  - {"at": 4, "size": 4, "type": "u32", "name": "version", "value": "39", "level": "proven"}
  - {"at": 8, "size": 4, "type": "u32", "name": "source count", "value": "62", "level": "proven"}
  - {"at": 12, "size": 4, "type": "u32", "name": "record count", "level": "proven", "note": "6,456 in the high and medium files, 3,919 in the low file"}
  - {"at": 16, "size": 4, "type": "u32", "name": "first source", "value": "24", "level": "proven"}
  - {"at": 20, "size": 4, "type": "u32", "name": "table offset", "value": "304563", "level": "proven", "note": "0x4A5B3"}
```

The sources run from offset 24 to the table at 304,563 with nothing between them; the table follows, then the compiled payloads, which tile the rest of the file to its end (35,094,609 bytes high, 34,181,857 medium, 16,310,862 low). :observed

```layout
title: "SDB2 source entry"
size: "88 + length"
games: [shaun-white-skateboarding]
note: "Little-endian."
fields:
  - {"at": 0, "size": 64, "type": "char[64]", "name": "file name", "level": "observed", "note": "NUL-padded"}
  - {"at": 64, "size": 4, "type": "u32", "name": "CRC-32", "level": "observed", "note": "of the exact source bytes, line endings included"}
  - {"at": 68, "size": 4, "type": "u32", "name": "length", "level": "observed"}
  - {"at": 72, "size": 16, "type": "u32[4]", "name": "dependency identity", "level": "observed", "note": "128 bits with exactly one bit set, a different bit per source"}
  - {"at": 88, "size": "length", "type": "bytes", "name": "source text", "level": "observed", "note": "HLSL"}
```

The compiled table is laid out for 8,192 records of 36 bytes (nine `u32`) and only the active records are stored, followed by the payloads; the unused part is zero. Each record is a seven-word key, then the payload's offset and length. :observed

## Records

A record's payload begins `0xBEEF`. Five kinds exist; the loader dispatches on the kind: :observed

| Kind | Content | Count in the high file |
|---:|---|---:|
| 4 | An effect pass: vertex and pixel program with state and sampler tables | 6,446 |
| 5, 7 | A utility-stage program | 1 each |
| 6 | A pixel program whose only use is a presence flag | 1 |
| 8 | A pass of render state only, with no programs | 7 |

Fifty-four kind-4 records of the high file have length zero: they name keys that were never compiled. They hold 6,393 vertex and 6,394 pixel programs, 26,921 sampler bindings, 59,876 state pairs and 39,938 state-variable names. The medium file has the same records with 25,298 sampler bindings; the low file has 3,919 records (3,909 of kind 4), none missing, 3,910 vertex and 3,911 pixel programs, 13,026 sampler bindings, 36,657 state pairs and 23,429 names. Each file tiles exactly to its end with these counts. :observed

```layout
title: "SDB2 pass header (kinds 4 and 8)"
size: 48
games: [shaun-white-skateboarding]
note: "Little-endian. The bytecodes follow for their exact declared lengths, then the state, sampler and name tables."
fields:
  - {"at": 0, "size": 2, "type": "u16", "name": "marker", "value": "0xBEEF", "level": "observed"}
  - {"at": 2, "size": 1, "type": "u8", "name": "literal state count", "level": "observed"}
  - {"at": 3, "size": 1, "type": "u8", "name": "save and restore state count", "level": "observed"}
  - {"at": 4, "size": 1, "type": "u8", "name": "state variable name count", "level": "observed"}
  - {"at": 5, "size": 1, "type": "u8", "name": "sampler group count", "level": "observed"}
  - {"at": 6, "size": 1, "type": "u8", "name": "second sampler group count", "level": "observed", "note": "0 in the PC files"}
  - {"at": 7, "size": 1, "type": "u8", "name": "reserved", "value": "0", "level": "observed"}
  - {"at": 8, "size": 4, "type": "u32", "name": "vertex program length", "level": "observed"}
  - {"at": 12, "size": 4, "type": "u32", "name": "pixel program length", "level": "observed"}
  - {"at": 16, "size": 8, "type": "u64", "name": "vertex stage cache key", "level": "unknown", "note": "no hash algorithm is established"}
  - {"at": 24, "size": 8, "type": "u64", "name": "pixel stage cache key", "level": "unknown"}
  - {"at": 32, "size": 16, "type": "bytes", "name": "reserved", "value": "0", "level": "observed"}
```

After the programs come the literal state pairs, the save-and-restore pairs (each a Direct3D render-state number and a value, both `u32`), the sampler groups and the NUL-terminated names of the runtime state variables. A sampler entry is the sampler name and the texture parameter name (each NUL-terminated), a packed address `u32`, a count `u32` and that many pairs of sampler-state kind and value; on PC the packed address is `0x00800000` or'd with the pixel sampler slot. There is no padding between the strings and integers. :observed

The second state array holds placeholders that the loader fills: on entry the pass reads the current device states into them, applies the first array and, on exit, restores the saved values. :observed

The pixel programs of the high file are `ps_3_0` and use 22 token kinds, 20 of them executable (`MOV`, `ADD`, `MAD`, `MUL`, `RCP`, `RSQ`, `DP3`, `DP4`, `MIN`, `MAX`, `EXP`, `LOG`, `LRP`, `FRC`, `POW`, `NRM`, `TEXKILL`, `TEX`, `CMP`, `DP2ADD`), all in straight lines with no `IF`, `LOOP` or `CALL`. Unique programs number 589 vertex and 3,752 pixel by byte hash. :observed

## The compiled programs

The three uncompressed bundles hold 7,306 distinct programs by their bytes, 1,099 vertex and 6,207 pixel (588 and 3,751 in the high bundle, 538 and 3,273 in the medium, 543 and 2,062 in the low; most repeat across bundles). Every one is Shader Model 3.0: the version token is `0xFFFE0300` for a vertex program and `0xFFFF0300` for a pixel program, and none is Shader Model 1 or 2. :observed[the three uncompressed bundles]
Together they hold 63,679 vertex and 601,220 pixel instructions. A program has no control flow: no `if`, `loop`, `rep`, `call`, `break` or predicate. :observed[the three uncompressed bundles]

| Stage | Opcodes used (besides `dcl` and `def`) | Confidence |
|---|---|---|
| Pixel | `add` `cmp` `dp2add` `dp3` `dp4` `exp` `frc` `log` `lrp` `mad` `max` `min` `mov` `mul` `nrm` `pow` `rcp` `rsq` `tex` `texkill` | :observed[the three uncompressed bundles] |
| Vertex | `add` `dp3` `dp4` `exp` `frc` `log` `lrp` `mad` `max` `min` `mov` `mova` `mul` `nrm` `pow` `rcp` `rsq` `sge` `sincos` `slt` | :observed[the three uncompressed bundles] |

The vertex programs address the float constants relative to the address register in 4,170 source operands, always as `c[a0.x]`, `c[a0.y]`, `c[a0.z]` or `c[a0.w]` plus the register number, in `mul` (1,038), `mad` (3,114), `mov`, `max` and `min` (6 each), after a `mova a0, r` (344 writes of all four lanes and 12 of x alone). :observed[the three uncompressed bundles]
This is the form of a matrix-palette skinning loop, a `mova` of a scaled index vector followed by reads of the bone matrices from the constant file; that these programs skin is concluded from the form. :inferred
Pixel source operands carry no modifier besides negate (68,301), absolute value (4,171) and negated absolute value (6); vertex operands only negate (4,603). Saturation is on 27,515 pixel results and 656 vertex results; no result is partial precision. :observed[the three uncompressed bundles]
Microsoft's `D3DDisassemble` lists the same instructions, in the same order, with the same registers, swizzles and modifiers, as a reader of the tokens: all 1,099 vertex programs and all 6,207 pixel programs, line for line. :observed[the three uncompressed bundles]
That reading depends on four details of the token format that these programs use. A register's type is five bits, the low three at
bits 28 to 30 of the operand token and the high two at bits 11 and 12, so the colour outputs `oC0` and `oD0` and the samplers
(types 8 to 10) decode only with both parts; bit 31 of an operand token is a marker set on every operand, not part of the type.
Relative addressing is bit 13, and the address-register token follows the operand. Every `sincos` has a destination and one
source. A `dcl` token's second word is a usage and an index (usage in bits 0 to 3, index in bits 16 to 19), or for a pixel
sampler the texture type in bits 27 to 30. :observed[the three uncompressed bundles]

On the reference rasterizer (`D3DDEVTYPE_REF`, software vertex processing) `mova` rounds to the nearest integer with a half going away from zero (`-2.5` gives `-3`, `0.5` gives `1`), a relative constant read at an index from 256 up to 4096 returns zero, and `slt` and `sge` are the IEEE comparisons (a NaN operand gives 0). :observed[a vertex program run on the reference rasterizer]

## Selecting a record

A material does not name its program. The material class sets a key from its stored switches (see [the material body](/engines/anvil/materials/material/)) and the pass looks the key up; the key words are not the global define numbering. The generic colour passes of the effect `ekgeneric.fx` all use the shader configuration value 2, and the high bundle holds no stored colour permutation with configuration 0: those records are the shadow and depth passes. :observed

## The layered diffuse equation

The pixel source `ekgeneric.fx` computes a surface's diffuse colour from the vertex colour, the mask and up to three diffuse layers. With the mask sample defaulting to 1 and an absent vertex colour reading as 1, let `f = COLOR0 · mask`. The base layer is `lerp(tex1.rgb, tex1.rgb · tint1.rgb, f.r)`. The second layer, `tex2 · tint2`, is blended over it by `f.g`, multiplied by its own alpha when its `UseTextureAlpha` flag is set. The third layer is blended likewise by `f.b`. Neither a plain product with the vertex RGB nor alpha as the only weight reproduces the compiled program; the compiled pixel program of one record agrees with this equation. :observed{games="shaun-white-skateboarding"}[a compiled pixel program disassembled; reference rasteriser runs]

A pixel program run on a Microsoft reference rasteriser with controlled constants and textures, for 246 colour values of the layered equation, matched this computation in 234 exactly and 12 within 1e-5. :observed

The products in this equation are taken on the texture's stored values, even for a texture whose [TextureMap](/engines/anvil/textures/texture-map/) is flagged sRGB. None of the 6,399 effect and state records of the high-quality bundle sets sampler state 11 (`D3DSAMP_SRGBTEXTURE`), the pixel programs contain no gamma conversion, and in a runtime trace of one level all 304 calls that set sampler state 11 in a window of 40,001 `SetSamplerState` calls set it to 0. :observed{games="shaun-white-skateboarding"}[the bundle's records; one level, one call window at run time]
A tint therefore multiplies sRGB-encoded texels as numbers, so in linear terms it acts as if it were itself sRGB-encoded. :inferred Materials of this kind (an sRGB diffuse with a non-white tint) are 327 of 773 in level 01 and 124 of 273 in level 05. :observed{games="shaun-white-skateboarding"}

:::open[How do lighting, fog and tone mapping combine with the base colour?]
The equations above give the base colour of the restored state only. Per-frame light constants, the fog and the tone controls are bound by frame jobs that are not described. :unknown
:::

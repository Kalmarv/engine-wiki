---
title: Texture and sampler pairing
description: "Which sampler register each texture register of a pixel, vertex or compute program is sampled with in Sekiro and Elden Ring, the engine's fixed sampler registers, and the few textures that are read through two samplers."
games: [sekiro, elden-ring]
implementations:
  - name: dx (dxbc-reader, dxil-reader)
    url: https://github.com/Kalmarv/dx
---

A Direct3D 11 program reads a texture register `t<n>` with an explicit sampler register `s<m>` in every `sample`, `gather4` and
`lod` instruction; the texture's contents come from the resource bound at the draw, and the filter and addressing from the sampler
state bound at `s<m>`. The program fixes two things: which sampler register goes with which texture register, and whether the
read compares against a reference (a comparison sampler). A load (`ld`, `bufferLoad`, ...) uses no sampler. Sekiro's programs are
Shader Model 5 [DXBC](/concepts/d3d-shader-containers/) and Elden Ring's Shader Model 6 DXIL; the two pair their registers alike.

## One sampler per texture register

In a program, a texture register is read through exactly one sampler register, in all but 26 of the 192,998 (program, texture
register) pairs that are sampled.

| | Sekiro | Elden Ring |
|---|---|---|
| distinct programs (by file bytes) | 9,371, of which 9,204 read a texture: 6,700 pixel, 2,381 vertex, 70 compute, 38 domain, 15 geometry | 13,423, of which 12,754 read a texture: 7,856 pixel, 4,694 vertex, 143 compute, 36 domain, 25 geometry |
| programs that sample a texture | 6,876 | 8,136 |
| texture registers read (sampled or loaded) | 106,399 | 123,339 |
| sampled | 89,699 | 103,299 |
| sampled through one sampler register | 89,688 | 103,284 |
| sampled through two | 11 (in 10 programs) | 15 (in 13 programs) |
| only loaded, no sampler | 16,700 | 20,040 |
| sampled and loaded | 1 | 1 |

:observed[the programs extracted from each game's shader bundles, each compared with Microsoft's own disassembly of it]
The register spaces of all these registers are 0. :observed
Every texture and sampler handle of a Shader Model 6 sampling call is made by a `createHandle` call in the same function; the 3
calls in Elden Ring whose texture register is computed (a texture array indexed in two compute programs) are loads, and no sampler
register is computed. :observed{games="elden-ring"}

## Comparison samplers

An instruction compares exactly when its sampler register is declared a comparison sampler: `sample_c_lz` (Sekiro, 5,585 calls)
and `sampleCmpLevelZero` (Elden Ring, 11,116) on a comparison sampler, every other sample and gather (101,668 and 132,245 calls) on a
default sampler. :observed[every sampling call] The comparison sampler is always register `s12`, and no other register is a
comparison sampler. :observed `sample_b`, `sampleBias`, `sampleCmp` and `textureGatherCmp` do not occur; `gather4` and
`textureGather` are rare (23 and 27 calls).

## The sampler registers

The programs name their samplers, and the name of a register is the same in every program that declares it:

| Register | Name | Sekiro programs | Elden Ring programs |
|---|---|---|---|
| `s6` | `SS_WrapPoint` | 3,777 | 4,551 |
| `s7` | `SS_ClampPoint` | 394 | 554 |
| `s8` | `SS_WrapLinear` | 5,051 | 5,945 |
| `s9` | `SS_ClampLinear` | 3,829 | 4,482 |
| `s10` | `SS_WrapAniso` | 68 | 0 |
| `s11` | `SS_ClampAniso` | 0 | 106 |
| `s12` | `SS_Shadow` (comparison) | 1,414 | 1,463 |

Some programs spell the name differently (`g_ClampPointSampler`, `g_samLinearWrap`, `s_WrapPoint`, ...) and none declares another
kind of sampler at these registers. :observed[the `Resource Bindings` table of every program] The registers `s0` to `s4` are the material
samplers of the surface programs: `SS_DiffuseMap` `s0` (5,582 Sekiro and 6,856 Elden Ring programs), `SS_SpecularMap` `s1`,
`SS_BumpMap` `s2`, `SS_MaskMap` `s3` and `SS_DisplacementMap` `s4`. Other programs reuse them under their own names: the
screen-space ambient occlusion, depth-of-field and bilateral programs declare `SS_ClampPoint` as `s2` and `SS_ClampLinear` as `s3`,
and `SS_WhiteBorderPoint` is `s4`. For these the name carries the meaning and the register does not. :observed
The texture register a given sampler register pairs with differs from program to program: the two numbers are equal in 8,955 of
Sekiro's 89,688 single-sampler pairs and 10,003 of Elden Ring's 103,284. :observed
The filter and addressing behind each name are set by the engine when it binds the state and are not stored in the programs.
:unknown

## Textures read through two samplers

The 26 exceptions are the same texture read through a point sampler and a linear sampler (22) or through the point sampler and the
comparison sampler (4). All are pixel programs. :observed

| Program | Texture (register) | Samplers and calls |
|---|---|---|
| `GXScreenSpaceCascadedShadow_PCF4_Fade`, `_PCF9_Fade`, `_Soft_Fade` | `g_PrevScreenTexture` (`t2`) | `SS_ClampPoint` 1, `SS_ClampLinear` 1 |
| `GXScreenSpaceCascadedShadow_Soft`, `_Soft_Fade` | `g_ShadowTexture` (`t32`) | `SS_Shadow` 16 (comparison), `SS_ClampPoint` 4 |
| `GXSssBlurX`, `GXSssBlurY` | `g_LightAccTexture` (`t36`) | `SS_ClampPoint` 1, `SS_ClampLinear` 16 |
| `LensSimu2_BlurCoC` | `g_CoCTex` (`t2`) | `SS_ClampPoint` 1, `SS_ClampLinear` 8 (Sekiro) or 1 (Elden Ring) |
| `ScreenSpaceAO2_ReProj`, `_SeparatedReProj`, `_WithNormalReProj`; :only[elden-ring] `CopyExternalAOTextureReProj` | `g_PrevAOTex` (`t3`) | `SS_ClampPoint` 1, `SS_ClampLinear` 1 |
| :only[elden-ring] `SampleBilateralDepthBlurTwo1`, `Two2` | `g_SourceTex` (`t0`), and in `Two2` `g_SourceTex2` (`t3`) | `SS_ClampLinear` 1, `SS_ClampPoint` 4 |

:observed[all 26 slots]
In Sekiro's `g_PrevScreenTexture` and `g_PrevAOTex` programs the two reads use one coordinate register and take different
components of the result (one component through the linear sampler, three through the point sampler); in Elden Ring's
`ScreenSpaceAO2`, `CopyExternalAOTextureReProj` and `_Soft_Fade` programs they use identical coordinate values. In `GXSssBlurX/Y` and `LensSimu2_BlurCoC` the
point-sampled read is at the interpolated texture coordinate and the linear reads are at computed coordinates. In the two
`GXScreenSpaceCascadedShadow_Soft` programs the shadow map is read four times as plain depth and sixteen times by comparison.
:observed

:::open[Which sampler state does each register bind?]
The programs state the sampler's name and whether it compares, not its filter or addressing; those are set by the draw code.
Whether `SS_WrapAniso` (Sekiro, `s10`) and `SS_ClampAniso` (Elden Ring, `s11`) are two registers of one table, each seen in only
one game's programs, is not established.
:::

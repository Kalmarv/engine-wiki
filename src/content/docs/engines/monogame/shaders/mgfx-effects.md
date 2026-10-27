---
title: MGFX compiled effects
description: "MonoGame's compiled effect format, version 12 with the OpenGL profile: header, constant buffers, GLSL shaders written by MojoShader, parameters and techniques, and STUNTBOOST's 18 effects."
games: [stuntboost]
sources:
  - title: MonoGame Effect and EffectReader
    url: https://github.com/MonoGame/MonoGame/blob/develop/MonoGame.Framework/Graphics/Effect/Effect.cs
    note: ReadHeader, ReadEffect, the parameter and pass readers (versions 10 and 11 upstream)
  - title: MojoShader
    url: https://github.com/icculus/mojoshader
    note: compiles Direct3D 9 shader bytecode to GLSL
implementations:
  - name: monogame-formats (mgfx.rs)
    url: https://github.com/Kalmarv/monogame-formats/blob/main/src/mgfx.rs
  - name: primase worlds/monogame (programs.rs)
    url: https://github.com/Kalmarv/primase/blob/main/worlds/monogame/src/programs.rs
---

An **effect** (`.fx`) in a MonoGame game is compiled by the content pipeline into an **MGFX** blob and stored as an
[XNB](/engines/monogame/archives/xnb-containers/) whose reader is `Microsoft.Xna.Framework.Content.EffectReader`; the object is
an `i32` byte count and the MGFX bytes. :proven{games="stuntboost"} STUNTBOOST's 18 effects are version 12 (BytingGames' fork of
MonoGame 3.8.1; upstream releases write 10 and 11) for the OpenGL profile: the shaders are GLSL text that MojoShader wrote from
the effect's Shader Model 3 programs. :proven{games="stuntboost"}

Every effect parses to its last byte, including the trailing `MGFX` signature; every shader's GLSL declares the samplers, the
vertex attributes and the uniform array that its tables list; every technique's passes name shaders of the right stage; every
sampler names a parameter and every constant-buffer entry names one. :proven{games="stuntboost"}

## Layout

All numbers are little-endian; strings are .NET's (a 7-bit encoded length, then UTF-8).

```layout
title: MGFX header
size: 11
games: [stuntboost]
fields:
  - {at: 0, size: 4, type: "char[4]", name: signature, value: "MGFX", level: proven}
  - {at: 4, size: 1, type: u8, name: version, value: "12", level: proven}
  - {at: 5, size: 1, type: u8, name: profile, level: proven, note: "0 OpenGL (all 18 files), 1 DirectX 11"}
  - {at: 6, size: 4, type: i32, name: effect key, level: proven, note: "a different value in each of the 18 files"}
  - {at: 10, size: 1, type: u8, name: MojoShader flag, value: "1", level: observed, note: "1 in every file; the game's reader treats the shaders as MojoShader output"}
```

After the header, in this order: :proven{games="stuntboost"}

| Part | Content | Confidence |
|---|---|---|
| constant buffers | `i32` count; per buffer its name, a byte 0, its size in bytes (`i16`), a byte 0, an `i32` parameter count and per parameter its index (`i32`) and its byte offset in the buffer (`u16`) | :proven{games="stuntboost"} |
| shaders | `i32` count; per shader the stage (a byte: 0 vertex, 1 pixel), source file name and entry point (strings, empty in every file), a byte 0, the code (`i32` length and the GLSL bytes), its samplers, the constant buffers it reads and its vertex attributes | :proven{games="stuntboost"} |
| parameters | `i32` count; per parameter its class and type, name and semantic, an annotation count (0), rows and columns, its elements and structure members (parameters again), and for a plain bool, int or float its `rows × columns` default values | :proven{games="stuntboost"} |
| techniques | `i32` count; per technique its name, an annotation count (0) and its passes | :proven{games="stuntboost"} |
| tail | `MGFX` again, at the end of the effect's bytes | :proven{games="stuntboost"} |

**Samplers** of a shader: a byte count, then per sampler its kind (2D, cube, volume, 1D), texture slot, sampler slot, whether it
has a state, that state's 20 bytes (address modes U, V, W as bytes with 0 wrap, 1 clamp, 2 mirror, 3 border; a border colour;
the filter with 0 linear, 1 point, 2 anisotropic; the maximum anisotropy; the largest mip level; the mip bias), then its name
(`ps_s0`) and the index of the parameter that holds its texture. :proven{games="stuntboost"} **Constant buffers** a shader
reads: a byte count and a byte index each. **Vertex attributes**: a byte count and per attribute its name, usage
(`VertexElementUsage`: 0 position, 1 colour, 2 texture coordinate, 3 normal, 4 binormal, 5 tangent, 6 blend indices, 7 blend
weight, ...), usage index, location (`i16`) and a byte 1. :proven{games="stuntboost"}

**Parameters** carry MonoGame's `EffectParameterClass` (0 scalar, 1 vector, 2 matrix, 3 object, 4 struct) and
`EffectParameterType` (1 bool, 2 int, 3 float, 7 texture 2D, 9 texture cube, ...). **Passes**: a name, an annotation count (0),
six shader indices (vertex, pixel, then four more, −1 when the pass has none) and three bytes saying whether the pass has a
blend, a depth-stencil and a rasterizer state. :proven{games="stuntboost"} No effect has an annotation, a string parameter or
a pass with a state, so those layouts are not described. :proven{games="stuntboost"}

## The GLSL

The shaders are GLSL with the register names of the Direct3D 9 program they came from: `ps_r0` registers, `ps_c56` constants,
`ps_uniforms_vec4[N]` as the one uniform array of vec4s, and a `GL_OES_standard_derivatives` extension line for derivatives.
Float constants that the program defines are `const vec4 ps_c<N>`; the effect's parameters live in the uniform array at
`byte offset / 16`. :observed{games="stuntboost"} A vertex shader's position output is corrected by a `posFixup` uniform for
OpenGL's clip space. :observed{games="stuntboost"}

## STUNTBOOST's effects

`Content/Effects/D3` holds 10 effects (3D rendering and its post passes), `Content/Effects/D2` 8 (2D, UI and screen effects).
:proven{games="stuntboost"}

| Effect | Shaders | Techniques | Size (bytes) |
|---|---|---|---|
| `D3/Render` | 10 | Render, RenderWithDepthOutput, RenderInstanced, RenderInstancedWithDepthOutput, RenderBeam, RenderBoosterBeam, RenderVolumetricLight | 79,223 |
| `D3/Depth` | 3 | Render, RenderInstanced | 15,698 |
| `D3/DropShadow` | 3 | Render, RenderInstanced | 18,275 |
| `D3/DisplayPosFromDepth` | 3 | RenderWorld, RenderView | 4,216 |
| `D3/Outlines` | 2 | Render | 6,212 |
| `D3/SSAO` | 2 | Render | 4,058 |
| `D3/Post` | 2 | Technique | 4,012 |
| `D3/DisplayDepth`, `DisplayShadowMap`, `Skybox` | 2 each | Render | 2,034, 1,885, 1,866 |
| `D2/Post2D` | 2 | Technique | 18,310 |
| `D2/SpeedSmear` | 2 | Radial | 9,535 |
| `D2/SpeedMeter` | 2 | Technique | 3,431 |
| `D2/GammaPost`, `Grayscale`, `D2Template`, `DropShadowBugDetect`, `TextColorBlend` | 2 each | Technique or Render | 1,934, 1,688, 1,565, 1,486, 1,952 |

All :proven{games="stuntboost"}. The `Render` effect's pixel constant buffer is a `ps_uniforms_vec4` array of 56 vec4 (896 bytes)
with parameters such as `ViewProjectionLight[4]`, `ShadowDepthBiases[4]`, `GammaInverse`, `FogStart`, `FogLength`, `FogColor`,
`ShadowMapSplitCount`, `Color`, `LightDir`, `CamPos`, `AmbientColor`, `DiffuseColor`, `SpecularColor`, `ShadowColor`,
`AmbientLightInShadow`, `MetallicFactor`, `RoughnessFactor`, `EmissiveFactor`, `DynamicObject`, `InstancedEnabled`,
`VertexColorEnabled`, `AlbedoMapEnabled`, `NormalMapEnabled`, `OrmMapEnabled`, `EmissiveMapEnabled`, `ShadowsEnabled`,
`DiffuseLightingEnabled` and `InverseHullOutlines`; its vertex buffer (7,184 bytes) has 106 joint matrices and `World`,
`ViewProjection`, `OutlineThicknessOn0Meters`, `OutlineThicknessOn3Meters`, `SkinnedEnabled` and `VertexShiftEnabled`. Its
samplers are `AlbedoTex`, `NormalTex`, `ORMTex`, `EmissiveTex`, `LightDepthTex`, `DiffuseTex` and, for the volumetric technique,
`BlueNoiseTex`. :proven{games="stuntboost"} What these compute is on [level rendering](/engines/monogame/lighting/baked-lighting/).

---
title: Effect shader programs
description: "The effect shader bundles of Sekiro (399 DXBC programs) and Elden Ring (488 DXIL programs): stages and families, the vertex inputs and render targets of the effect draws, the constant buffers and resources they read, the programs of the particles that live on the GPU, and what Sekiro's engine binds for the effect draws of a running session."
games: [sekiro, elden-ring]
---

Every effect draw of [an FXR file](/engines/fromsoft/effects/fxr/) is shaded by a program from one bundle, separate from the
material bundles ([shader bundles](/engines/fromsoft/shaders/bundles/)). This page records what the programs of Sekiro's
effect bundle read and write, as their own reflection data states it, so a renderer knows the interface of each family before it
runs one. How the engine fills that interface from an effect's actions is not recorded here.

## The bundle

`/shader/gxffxshader.shaderbnd.dcx` holds 399 Shader Model 5 programs: 249 pixel, 35 domain, 29 vertex, 24 hull, 17 geometry
and 45 compute programs. :observed[every member of the bundle parsed: container, reflection and signature chunks]{games="sekiro"}
The names fall into four families.

| Family | What the names say | Pixel | Vertex | Hull | Domain | Geometry | Compute |
|---|---|---|---|---|---|---|---|
| `GXFfx` (not tessellated) | `texture`, `bumpTexture`, `colorOnly`, `softTracer`, `distortion*`, `radialBlur`, `SoftRadialBlur`, `LightShaft*` | 28 | 10 | - | - | - | - |
| `GXFfxtessellate` | the same draws with a tessellated surface: `Texture`, `BumpTexture`, `MultiTexture`, `Blend*`, `PointSprite`, `LineColorOnly`, `QuadLineColorOnly`, `LensFlare`, `Tracer*`, `DistortionTracer*`, with `Soft`, `GlowD`, `AboveSdw` and `Specular` variants | 85 | 16 | 24 | 35 | 10 | 1 |
| `*_VFX_*` | `StandardParticle`, `SparkParticle` and their `SingleTexture`, `AllLight`, `Glow`, `Soft`, `Overlay` and `AboveShadow` variants | 136 | 3 | - | - | 7 | 28 |
| sorting | `BitonicSort*`, `PrepareSort*`, `MatrixTranspose` | - | - | - | - | - | 16 |

:observed[the same parse]{games="sekiro"}
The draw names match the forms an effect file can draw (a textured billboard, a normal-mapped one, several textures, a point
sprite, a tracer, lines and quad lines, distortion, radial blur, a light shaft, a lens flare). :inferred[by the names]
The `_VFX_` programs are the pipeline of the particles that live on the GPU: compute programs that emit and update them with
append and consume buffers, sorting programs, a vertex program that reads one record of a structured buffer by vertex number, a
geometry program that expands it to a quad, and the pixel programs. :observed{games="sekiro"} That these are the programs of the
GPU particle action types is inferred from the names. :inferred

## The effect draws

The vertex program of a plain textured draw takes one vertex per corner of the sprite: a position of three floats, two colours
of four, a texture coordinate of two and three further coordinates of one and two floats (`POSITION`, `COLOR0`, `COLOR1`,
`TEXCOORD0`, `TEXCOORD2`, `TEXCOORD3`, `TEXCOORD4`), with no vertex number among its inputs, and outputs the clip position and
the values the pixel program reads. :observed{games="sekiro"} The corners of such a sprite are therefore made before the draw,
not expanded by the GPU. :inferred The 29 vertex programs have 12 input layouts. The tessellated draws take the same
vertex layout in the hull, domain and geometry programs (the hull and domain programs come in `_quad`, `_octed` and `_quincunx`
variants) and their vertex programs pass the inputs through unchanged; the multi-texture ones take five colours and eight
coordinates. The bump-mapped draws take a normal, tangent and binormal as well, the distortion and radial-blur draws only a
position and a coordinate, the colour-only draws a position and two colours, and the three `_VFX_` vertex programs only a vertex
number. :observed{games="sekiro"}

All 249 pixel programs write two render targets. :observed{games="sekiro"} What they read:

| Resource | Programs |
|---|---|
| 3-D volumetric fog `g_volumetricFog` (slot 16) | 226 of the pixel programs |
| 3-D shadow volume `g_shadowVolumeTexture` (slot 5) | 200 |
| colour texture `g_texAlbedo0` (slot 0) | 136, the `_VFX_` ones |
| colour texture `g_diffuseTexture` (slot 0) | 77 |
| depth `g_depthTexture` | 123 |
| shadow of the area above `g_aboveShaodowTexture` and the sampler `g_ShadowSampler` (slot 12) | 94 |
| normal maps `g_texNormalMap`, `g_normalTexture` | 64, 52 |
| motion vectors `g_MotionVectorTexture` | 32 |
| further layers `g_multiTexture0` to `g_multiTexture2`, `g_blendTexture`, `g_specularTexture`, `g_frameBufferTexture`, `g_TraceframeBufferTexture` | 16 to 4 each |

:observed[the reflection data of all 249 pixel programs]{games="sekiro"}
The samplers are a clamping linear one at slot 9 (240 pixel programs), a wrapping linear one at slot 8 (234: `g_samLinearWrap`
in the `_VFX_` ones, `g_WrapLinearSampler` in the others) and a clamping point one at slot 7 (123). :observed{games="sekiro"} The
irradiance volumes (`g_IrradianceVolumeX` to `W`, `g_IrradianceVolume2X` to `W`) and the tile-based light lists (`g_LightIndices`,
`g_LightLookupBuffer`, `g_LightBuffer`, `g_SpotLightBuffer`, structured buffers at slots 59 to 62) are read by the vertex (5 and
6 programs), domain (31 and 30) and geometry (15 and 15) programs, not the pixel programs: the lighting of an effect is done per
vertex. :observed{games="sekiro"}

The values that choose how a draw looks are constants of one buffer shared by the pixel programs, `PSCommonBuffer` of 960
bytes: a colour, the texture and colour combination words (`g_ps_TexBlendType`, `g_ps_TexBlendType2`, `g_ps_TexBlendType3`,
`g_ps_ColorBlendType`, `g_ps_BlendingMode`, `g_ps_FogMultMode`, `g_ps_bPreAlphaMult`, `g_flipbookBlendMode`), the soft-edge
and fog switches and parameters, the tracer parameters (`g_vTracerParam`), the distortion wave parameters, the radial-blur
and light-shaft parameters, and the lighting switches. :observed{games="sekiro"} The vertex programs share `VSCommonBuffer`
(720 bytes: view, projection and view-projection matrices, fog range, screen size, near and far distances, camera position,
near and far fade ranges, soft-sprite parameters, the irradiance volume matrices and parameters, the tile light parameters);
the domain programs `DSCommonBuffer` (736 bytes, the same kinds of values), the hull programs `HSCommonBuffer` (80 bytes), and
the lit variants `PSEnvLightBuffer` and `VSDSEnvLightBuffer` (576 bytes each). :observed{games="sekiro"}

## Elden Ring's bundle

`/shader/gxffxshader.shaderbnd.dcx` holds 488 members: 279 pixel, 77 compute, 41 vertex, 39 domain, 27 geometry and 25 hull
programs. :observed{games="elden-ring"} Every member is a container of the DXBC wrapper that holds a Shader Model 6 module (a `DXIL`
part, a root signature, pipeline-state and signature parts), not Shader Model 5 code, and none has a reflection part, so the
names of the constant buffers and their variables are not stored. :observed[every member's part list]{games="elden-ring"} 381 of
the 488 member names occur in Sekiro's bundle, 107 are new and 18 of Sekiro's are absent (the `LightShaft` programs, the
`DistortionTracer` and `SoftTracer` variants of the tessellated family and the seven `SparkParticle` level-of-detail programs).
:observed The new ones are the GPU billboard programs (`CS_GpuBillboard`, `CS_GpuBillboard_Emit`, the `CS_GpuClearEmitCounter` and
`CS_GpuCopyEmitCounter` families, `GS_GpuBillboard`), the particle correction programs (`CS_VFX_StandardParticleCorrect*` in
variants for collision, force, a sway called `Yurayura` and splitting, `CS_VFX_SparkParticleCorrect`), the `Specular` and
`GlowD` pixel variants of the bump-mapped programs, the `Blend*BumpMultiTexture*` programs and two `Rotation` distortion vertex
programs. :observed[by the names] The register classes the programs bind agree with Sekiro's: pixel programs use the constant
buffers at registers 0 (all 279) and 7 (225), shader resources at 0 to 6, 16 (252) and 32 (94), samplers at 7, 8, 9 and 12; the
vertex, domain and geometry programs read the structured buffers at registers 8 to 15 and 59 to 62; the geometry and domain
programs the constant buffers at 0, 1 and 10. :observed[the resource ranges of each program's module]{games="elden-ring"}

## What the engine binds for an effect draw

A session of Sekiro with a capture of the Direct3D 11 calls (five captures of two frames each) recorded 904 draws and 9 dispatches
of programs of the bundle, with what each had bound at the call: the constant buffers and structured buffers of every stage, the
vertex and index buffers, the input layout, the topology and the blend, depth-stencil and rasterizer states.
:observed{games="sekiro"}

*Geometry.* The draws that shade an effect's quads are patch lists of one control point per particle (topology 33): 632 draws
of the `GXFfxtessellateTexture` vertex program with a 112-byte vertex, 242 of the `GXFfxtessellateSoftMultiTexture` program
with 160 bytes and 8 of `GXFfxtessellatePointSprite` with 36, each with a hull and a domain program (the `_quad`, `_octed` and
`_quincunx` variants) and a pixel program (`Blend`, `Soft`, `GlowD`, `2Sampler` variants). The distortion draws (22,
`GXFfxdistortionSoft`) are triangle lists of 20-byte vertices (a position of three floats and a texture coordinate of two).
:observed{games="sekiro"} A particle is therefore one vertex, and the quad is built by the tessellation stages, not by the CPU.
:inferred The 112-byte vertex of the plain texture draw holds:

| Bytes | Semantic, format | Value |
|---|---|---|
| 0 | `POSITION0`, 3 floats | zero in the vertices read; the particle's place is in the matrix rows below |
| 12 | `COLOR0`, 4 bytes (unorm) | the particle's colour packed red, green, blue, alpha from the lowest byte, the packed colour that the engine keeps in each billboard particle's record ([the appearance](/engines/fromsoft/effects/particle-appearance/)) |
| 16 | `COLOR1`, 4 floats | a colour multiplier: 1, 1, 1, 1 in the vertices read, 1.5 in others |
| 32 | `TEXCOORD0`, 4 floats | texture coordinates (0.5625, 0.1875, 0.6875, 0.1875 in the first vertex read), probably the sprite's flipbook cell |
| 48 | `TEXCOORD1`, 4 unorm 16-bit | four fractions (0.125, 0.125, 0.96, 0 in the first vertex read) |
| 56 | `TEXCOORD2`, 2 floats | two values from 0 to 1 |
| 64, 80, 96 | `TEXCOORD3` to `TEXCOORD5`, 4 floats each | three rows of a 3 by 4 matrix: the columns of the first three entries are three axes of length 0.315, 0.315 and 1.0, and the last entries are a position (-170.6, -25.2, 172.5 beside a camera at -206.8, -24.9, 177.3) |

:observed[the first 4 vertices of one draw and the same fields of others]{games="sekiro"} That the matrix rows are the sprite's
world transform (two scaled axes and the facing axis) follows from those values. :inferred The multi-texture vertex of 160 bytes
has a position of four floats, four packed colours, a colour of four floats, three texture coordinates of four floats, one of
three, a pair of 16-bit fractions and the same three matrix rows at 112, 128 and 144. :observed

*Constants.* The domain, hull and pixel programs read the camera from their common buffers: the view matrix (rotation in the
first three columns, translation in the fourth), the projection, the view-projection, the camera position and up vector, the near
distance 0.08, the far distance 10,000 and the screen size 1,920 by 1,080. :observed Of the `PSCommonBuffer` variables of the 904
draws, `g_ps_BlendingMode` is 1 in 642 and 2 in 262, `g_ps_FogMultMode` is 1 in the same 262 and 0 in the rest,
`g_ps_TexBlendType` 1 in 246, `g_ps_bPreAlphaMult` 1 in 206, `g_ps_bEnableLighting` 1 in 374 and `g_ps_bEnableFog` 1 in 470 (the
integers are stored as integers in the floats' bytes); `g_vColorScale` has 128 distinct values, (15, 15, 15, 5) in 197 draws,
(3.75, 3.75, 3.75, 1) in 88 and (1, 1, 1, 1) in 26; `g_ps_softSpriteScaleOffset` has the scale 1 (547 draws), 0.25 (234), 0.5 (108)
or 0.1 (15) and a zero offset; the wave, radial-blur, light-shaft and tracer variables are zero in every draw (no draw was of
those programs). :observed{games="sekiro"} The light lists at registers 59 to 62 are bound in the vertex, domain and pixel
stages. :observed

*State.* Every draw tests depth with `GREATER_EQUAL` (the depth is stored reversed) and writes none, culls nothing and fills
solid. The colour blends source alpha against inverse source alpha (668 draws) or against one (236); the alpha channel is
written with source one and destination zero (550 draws), source zero and destination inverse source alpha (248) or source zero
and destination one (106). The plain draws (574) go to the
1,920 by 1,080 scene target (an 11-bit-float colour format) with eight render targets bound; the soft and multi-texture draws
(330) to a 960 by 540 target of 16-bit floats with two targets bound. :observed[the recorded states of all 904 draws]{games="sekiro"}
The nine dispatches are all of `CS_VFX_StandardParticleEmit`. :observed

## The particles on the GPU

The GPU particle programs read their parameters from larger buffers: `gcbSceneParam` (880 bytes: base colour, near and far,
blend parameters, a billboard matrix, view and projection matrices, the previous frame's matrix for motion blur, trace
parameters), `ccbSceneParam` (752 bytes) and `ccbEmitionSeed` (960 bytes: the emitter's initial values and random ranges for
position, move vector, rotation, scale and colour, its lifetime and its placement) for the emit and update programs, and
`ccbForceFiledParam` (3,616 bytes) for the force fields. :observed{games="sekiro"} A particle is one element of a structured
buffer, 176 bytes in the standard and 336 bytes in the spark programs. :observed{games="sekiro"}

:::open[How does the engine fill these interfaces?]
Which program a draw selects from its blend mode, soft-edge, glow and light flags, how the vertex buffers of the plain draws are
built from an effect's properties (the order and meaning of the constants of `PSCommonBuffer` and `VSCommonBuffer`), the
contents of the 176 and 336-byte particle records, and what the second render target holds are not recorded. :unknown{games="sekiro"}
The per-particle state the billboard appearance keeps before it draws is on [Particle appearances in the executable](/engines/fromsoft/effects/particle-appearance/).
:::

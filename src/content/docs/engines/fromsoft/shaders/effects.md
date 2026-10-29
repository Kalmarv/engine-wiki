---
title: Effect shader programs
description: "Sekiro's effect shader bundle: its 399 programs by stage and family, the vertex inputs and render targets of the effect draws, the constant buffers and resources they read, and the programs of the particles that live on the GPU."
games: [sekiro]
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
:::

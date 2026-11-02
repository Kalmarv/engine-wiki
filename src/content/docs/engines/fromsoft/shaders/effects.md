---
title: Effect shader programs
description: "The effect shader bundles of Sekiro (399 DXBC programs) and Elden Ring (488 DXIL programs): stages and families, the vertex inputs and render targets of the effect draws, the constant buffers and resources they read, the programs of the particles that live on the GPU, and what Sekiro's engine binds for the effect draws of a running session."
games: [sekiro, elden-ring]
sources:
  - title: fxr
    url: https://github.com/EvenTorset/fxr
    note: "the effect file's action fields and their documented values (MultiTextureBillboardEx's unk_ds3_f2_10)"
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

## How the multi-texture draws compose their layers

A multi-texture billboard ([action 604](/engines/fromsoft/effects/fxr-actions/)) draws three textures on one quad. The pixel
program samples each layer's texture at its own coordinates (`g_multiTexture0` at `TEXCOORD0.xy`, `g_multiTexture1` at
`TEXCOORD0.zw`, `g_multiTexture2` at `TEXCOORD1.xy`) and composes the three into one colour before the particle's colour applies.
:observed[the disassembly of the pixel program]{games="elden-ring"}

Each texel's alpha has `TEXCOORD2.z` added and is clamped to 0..1; the texel's colour is then multiplied by its layer's colour
(the first layer's red, green and blue from `TEXCOORD4`, which has no alpha read; the second's and third's colour and alpha from
`TEXCOORD5` and `TEXCOORD6`), and with `g_ps_bPreAlphaMult` above 0 also by the layer's own opacity.
:observed[the disassembly of the pixel program]{games="elden-ring"}

The first layer gives the colour and the opacity. The second and third each change one of the two, chosen by
`g_ps_TexBlendType`, by an operation chosen by `g_ps_TexBlendType2` (the second layer) and `g_ps_TexBlendType3` (the third),
weighted by the layer's own opacity `w`. With `b` the value the layer changes and `l` the layer's colour (for the colour) or its
brightness, the mean of its red, green and blue clamped to 0..1 (for the opacity):

| Word | Value | Effect |
|---|---|---|
| `g_ps_TexBlendType` | 0 | both layers change the colour |
| | 1 | both layers change the opacity |
| | 2 | the second layer changes the opacity, the third the colour |
| `g_ps_TexBlendType2`, `g_ps_TexBlendType3` | 0 | `b * (1 + (l - 1) * w)` (multiply) |
| | 1 | `b + l * w` (add) |
| | 2 | `b + (overlay(b, l) - b) * w`, where `overlay(b, l)` is `2 b l` for `b` below 0.5 and `1 - 2 (1 - b) (1 - l)` otherwise |
| | any other | the layer changes nothing |

Running Elden Ring's `GXFfxtessellateMultiTexture` pixel program (lifted from its module and executed on the CPU) with one
texel per layer, every value 0 to 2 of `g_ps_TexBlendType`, every value 0 to 3 of the two operation words, both premultiply
settings and eight sets of texels and layer colours gives this rule on all 768 pixels, to within 1e-4, with the particle
colour not applied (`g_ps_ColorBlendType` 1), unlit, unfogged and at an exposure of 1.
:proven[that program, the inputs stated]{games="elden-ring"} The other multi-texture pixel programs (the `Soft`, `GlowD`,
`2Sampler`, `Bump` and `Blend` variants) are not run. The program then clamps the opacity to 0..1 and the colour to at least 0.
:observed[the disassembly of the pixel program]{games="elden-ring"}

The particle's colour (`COLOR0`) applies by `g_ps_ColorBlendType`: with 0 the composed colour is multiplied by its direction
`n = COLOR0.rgb / |COLOR0.rgb|`, squared and scaled by `|COLOR0.rgb|` and `g_vColorScale.rgb`; with 2 the composed colour
times its opacity is overlaid with `n` and then squared and scaled the same way; with any other value it does not apply. The
opacity is multiplied by `COLOR0.a` and `g_vColorScale.a` with 0 and 2. :observed[the disassembly, not run]{games="elden-ring"}

No step after a sample converts its colour (no power or curve applies to a texel), so the texels are used as the texture's
view gives them. :observed[the disassembly of `GXFfxtessellateMultiTexture` and `GXFfxtessellateSoftMultiTextureGlowD`]{games="elden-ring"}
After fog (the colour times the fog's transmittance, plus its in-scatter times `g_ps_invPreExposure`), the glow variant
`GXFfxtessellateSoftMultiTextureGlowD` multiplies the colour by `g_ps_preExposure` unless `g_ps_BlendingMode` is 4; with
`g_ps_BlendingMode` 1 or 2 an opacity above 1 multiplies the colour and is then clamped to 1; and with
`g_transductionAlphaToColorScale` `s` below 1 it keeps the colour up to 1 and scales what exceeds 1 by `s²`, the opacity by
`s`. Its second target takes `g_psGlowScale.rgb` times the colour (with the same pre-exposure) and `g_psGlowScale.a` times the
opacity. :observed[the disassembly, not run]{games="elden-ring"} The frame's pre-exposure is off in every recorded frame
([frame](/engines/fromsoft/lighting/frame/#pre-exposure)), so an effect's colour lands in the frame's own light units and the
scene exposure and tone curve apply to it as to the rest of the frame. :inferred{games="elden-ring"}

In the effect files, the multi-texture billboard's layer word (`unk_ds3_f2_10` in the fxr project's naming) holds 0, 1 or 2 in
all 13,852 of Elden Ring's multi-texture billboards (1,375, 2,411 and 10,066), as do the two words after it (`unk_ds3_f2_11`
and `unk_ds3_f2_12`), and the fourth (`unk_ds3_f2_13`) holds 0 or 2 (13,429 and 423). :proven[every multi-texture billboard
of the install's effect binders]{games="elden-ring"} The fxr project documents the layer word's three values as the table
above gives `g_ps_TexBlendType`'s. :sourced[fxr] That the four words are `g_ps_TexBlendType`, `g_ps_TexBlendType2`,
`g_ps_TexBlendType3` and `g_ps_ColorBlendType` follows from the documented first, the value sets and the order. :inferred

:::open[Do the words reach the constants unchanged?]
The mapping of the effect file's words to the program's constants is read from their values and order, not from a capture of
the constants the engine binds for a known effect.
:::

:::open[How are the layers' coordinates made?]
The coordinates arrive in the vertices: the vertex and domain programs pass them through, so the engine computes each layer's
scroll, offset and scale before the draw. Whether a scale is about the corner or the centre of the quad, and whether the
atlas cell applies to every layer, is not established.
:::

## How the distortion draws move the picture

A distortion sheet ([action 607](/engines/fromsoft/effects/fxr-actions/)) draws the picture already drawn behind it, sampled at
a moved point. Elden Ring's three distortion pixel programs (`GXFfxdistortion`, `GXFfxdistortionBump` and
`GXFfxdistortionRotation`, each with a `Soft` variant) read the frame drawn so far (`g_frameBufferTexture`, through the clamping
linear sampler) and the depth (`g_depthTexture`, through the clamping point sampler). :observed[the disassembly of the pixel
programs]{games="elden-ring"}

The move is a strength times a falloff from the sheet's centre. With `r` the distance from the centre in the sheet's own
coordinates (`TEXCOORD0.xy`, 0 to 1 across the sheet: `r = |(|u - 0.5| * 2, |v - 0.5| * 2)|`), the strength is
`max(1 - g_clampDistanceInverse * r, 0) * 0.01 * g_waveStrength`, in shares of the view: the radius at which it reaches 0 is the
inverse of `g_clampDistanceInverse`, 1 being the ellipse the sheet inscribes. :observed[the disassembly of the pixel
programs]{games="elden-ring"} The three programs move the point differently:

| Program | The moved point |
|---|---|
| `GXFfxdistortion` (stir) | along the direction at the angle `-TEXCOORD1.z - g_waveTime * TEXCOORD1.y + g_waveNum * r`, by the strength; the vertex program sets `TEXCOORD1.y` to 1 or -1 and `TEXCOORD1.z` to 0 or pi together, by one condition |
| `GXFfxdistortionBump` (push) | by the strength times the normal texture's `xy * 2 - 1` (`g_normalTexture`, through the wrapping linear sampler), read at the sheet's coordinates scrolled by `g_waveTime` times `g_vNormalMapScrollDistance` and `g_hNormalMapScrollDistance` and scaled about the centre by `g_normalMapScrollScale` |
| `GXFfxdistortionRotation` (twist) | turned about the sheet's projected centre (`TEXCOORD6`) by the strength in radians, in the view's coordinates (not its pixels, so the turn is not round on a view that is not square) |

:observed[the disassembly of the pixel programs]{games="elden-ring"} The point is the pixel's own place in the view (from
`TEXCOORD0.zw` over `TEXCOORD1.x`, the clip position over its w) plus the move, scaled by `g_dynamicResolution_UVScale` and
clamped to `g_resolveRectUV`. Where the depth stored at the moved point is nearer than the sheet (`TEXCOORD3.z`), the program
samples the pixel's own place instead, so a nearer surface is not pulled in behind the sheet. :observed[the disassembly of the
pixel programs]{games="elden-ring"}

The sample is multiplied by `g_ps_invPreExposure`, then by the colour `g_color` (with `g_ps_ColorBlendType` 2 it is overlaid
with it instead) and by `g_vColorScale`; the opacity is `g_color.a * g_vColorScale.a * TEXCOORD5`, and 0 at or below a
cutoff constant. :observed[the disassembly of the pixel programs]{games="elden-ring"}

The distortion draws blend by their opacity: source colour times its alpha plus the target times one minus it, the target's
alpha kept. The two distortion pixel programs the captures hold (`GXFfxdistortionBump` and `GXFfxdistortionSoftBump`) each
have one pipeline in a frame, and all 156 of their draws in two frame captures (82 and 74) carry that blend; the other
distortion programs are not drawn in them. :observed[two frame captures of a running session]{games="elden-ring"}

The frame each sheet moves is copied just before it: each distortion draw follows a `PointSampleColor1` draw into a target of
its own, and the distortion draws come as one run after the other effect draws of the full-resolution effect pass, with no
other effect draw among them (21, 22 and 20 sheets in three frames of two sessions). :observed[three frames of two capture
sessions]{games="elden-ring"} So each sheet moves the picture with every effect drawn before it, and the sheets drawn before
it, in it. :inferred{games="elden-ring"}

### The constants a sheet is drawn with

In one recorded frame of Stormveil Castle the 20 distortion draws (17 `GXFfxdistortionBump`, 3 `GXFfxdistortionSoftBump`, each
a quad of six vertices) carry these pixel constants: :observed[the constant buffers of one frame capture]{games="elden-ring"}

| Constant | `GXFfxdistortionBump` (17 draws) | `GXFfxdistortionSoftBump` (3 draws) |
|---|---|---|
| `g_waveStrength` | 10 in every draw | 0.296, 4.308 and 8.348: 10 times an opacity that rounds to the draw's `g_color.a` (0.031, 0.431 and 0.835) |
| `g_clampDistanceInverse` | 1 | 1 |
| `g_waveTime` | 1 | 1 |
| `g_vNormalMapScrollDistance`, `g_hNormalMapScrollDistance` | different in each draw, 0.05 to 0.95 and 0.19 to 1.32 | 0 and 0 |
| `g_normalMapScrollScale` | 0.5, 0.5 | 1, 1 |
| `g_color` | white, its alpha rising from 0.19 to 1 over four draws, 1 over the next nine and falling to 0.22 over the last four | white, the alphas above |
| `g_vColorScale` | 1, 1, 1, 1 | 1, 1, 1, 1 |

Every `g_color` alpha in them is a whole number of 255ths. :observed[the constant buffers of one frame capture]{games="elden-ring"}
So the scrolls reach the program as distances already travelled, with `g_waveTime` left at 1, and each Bump sheet moves the
picture by the same strength while it fades in and out by its opacity alone. :inferred{games="elden-ring"}

The executable writes one record per particle of a distortion sheet: it evaluates action 607's properties at the particle,
packs `color` times the particle's own colour into four bytes, and keeps the 4-component property after `color`, `intensity`,
the property after it and `radius` as the floats they evaluate to, `intensity` with no factor applied. :observed[the decompiled
per-particle writer of `FXSingleAppearanceDistortion`]{games="elden-ring"} The bytes account for the 255ths of `g_color`. How
the record becomes the draw's constants is not traced. :inferred{games="elden-ring"}

Of the 1,348 distortion actions of Elden Ring's effect files (each effect id once), 1,304 have mode 1 (the normal-map push)
and 44 mode 0 (the stir); none has another. 726 store `intensity` as a constant (most often 30, in 106; then 5, in 75;
1, in 68; 2.5, in 57; and 10, in 51) and 622 as a curve. `radius` is 1 in all but one (0.85), and `normalMapScaleU` and `V`
are both 1 in 985 and both 0.5 in 267.
:observed[every distortion action the effect reader types in Elden Ring's effect binders]{games="elden-ring"}

:::open[Can an effect file's blend mode change a distortion's blend?]
Action 607 stores a blend mode, as the billboards do, but no captured distortion draw is tied to its effect file, so whether a
sheet of another mode draws with another blend is not read. The captures hold one pipeline per distortion program, which fits
a fixed blend.
:::

:::open[How does the engine set the strength and the stir from the file?]
The per-particle record keeps the file's intensity unscaled, and the captured Bump sheets' strength of 10 is a constant
intensity 51 actions store, but no captured draw is tied to its effect file, and the step from the record to
`g_waveStrength` is not traced. The SoftBump sheets' strength follows their opacity: an intensity curve keyed with the
colour's alpha fits that, and so would the engine multiplying the two, though the record holds the opacity only rounded to
bytes and the strength follows it unrounded. Whether `g_clampDistanceInverse` is the inverse of `radius`,
`g_normalMapScrollScale` the normal map's scale and the two scroll distances its offset plus its speed times the age (and
which of them is u), and what `g_waveTime` holds for a stir, are not read either.
:::

## Elden Ring's bundle

`/shader/gxffxshader.shaderbnd.dcx` holds 488 members: 279 pixel, 77 compute, 41 vertex, 39 domain, 27 geometry and 25 hull
programs. :observed{games="elden-ring"} Every member is a container of the DXBC wrapper that holds a Shader Model 6 module (a `DXIL`
part, a root signature, pipeline-state and signature parts), not Shader Model 5 code, and none has a reflection part.
:observed[every member's part list]{games="elden-ring"} The module itself still names its constant buffers' variables in its
type annotations: `GXFfxtessellateMultiTexture.ppo` names every field of its `PSCommonBuffer` (832 bytes, `g_color` at 0 to
`g_dynamicResolution_UVScale` at 816) and of `PSEnvLightBuffer`, with the same names as Sekiro's.
:observed[that program's module]{games="elden-ring"} 381 of
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

### Where a billboard's corners are placed

The 12 geometry programs of the textured billboards (`GXFfxtessellate` with `Texture`, `SoftTexture`, `BumpTexture`,
`SoftBumpTexture` and their `AboveSdw` forms, and the four `MultiTexture` ones) each take one point per particle and read
`g_CroppingTexture`. Each reads the `x`, `y` and `w` lanes of three coordinates of the point: `TEXCOORD3` to `TEXCOORD5` in
the single-texture programs, `TEXCOORD6` to `TEXCOORD8` in the multi-texture ones. The bump-mapped programs read the `z`
lanes as well. :observed[the input loads of every geometry program in the bundle]{games="elden-ring"} In
`GXFfxtessellateMultiTexture` the three coordinates are the rows of a 3×4 matrix. Each corner's world position is that
matrix applied to (u − ½, v − ½, 0, 1), where (u, v) is a corner of the cropping polygon read from `g_CroppingTexture`. The
position then goes through `g_ds_viewMatrix` and `g_ds_projectionMatrix` of `DSCommonBuffer` (constant buffer 0), and no
other transform applies. :observed[that program's module]{games="elden-ring"} The program's vertex program passes all 14
inputs through unchanged and writes no position. :observed[`GXFfxtessellateMultiTexture.vpo`]{games="elden-ring"} So a
billboard's plane and turn in the world are not made on the GPU: they arrive with each particle in the vertex buffer, with
the quad's two edges as the matrix's first two columns and its centre as the last. :inferred[from the loads; the other
eleven programs were checked for the same lanes, not read through] The `z` lanes of the bump-mapped programs are the
quad's third axis, for the lighting. :inferred[by the lanes alone]

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

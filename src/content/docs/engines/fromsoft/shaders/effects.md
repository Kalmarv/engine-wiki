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
runs one. How the engine fills that interface from an effect's actions is recorded for the multi-texture draws (below) and in part for
the distortion draws; the rest is open.

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
opacity. :observed[the disassembly, not run]{games="elden-ring"} That second target is the frame's glow target, which the
glow chain blurs into the glare ([glow and the glare](/engines/fromsoft/lighting/tone-mapping/#glow-and-the-glare)).
:observed[one frame's draws]{games="elden-ring"} The frame's pre-exposure is off in every recorded frame
([frame](/engines/fromsoft/lighting/frame/#pre-exposure)), so an effect's colour lands in the frame's own light units and the
scene exposure and tone curve apply to it as to the rest of the frame. :inferred{games="elden-ring"}

In the effect files, the multi-texture billboard's layer word (`unk_ds3_f2_10` in the fxr project's naming) holds 0, 1 or 2 in
all 13,852 of Elden Ring's multi-texture billboards (1,375, 2,411 and 10,066), as do the two words after it (`unk_ds3_f2_11`
and `unk_ds3_f2_12`), and the fourth (`unk_ds3_f2_13`) holds 0 or 2 (13,429 and 423). :proven[every multi-texture billboard
of the install's effect binders]{games="elden-ring"} The fxr project documents the layer word's three values as the table
above gives `g_ps_TexBlendType`'s. :sourced[fxr] That the four words are `g_ps_TexBlendType`, `g_ps_TexBlendType2`,
`g_ps_TexBlendType3` and `g_ps_ColorBlendType` follows from the documented first, the value sets and the order. :inferred

### What the engine takes from the file

A draw does not name its effect, but its textures and vertices do. A multi-texture draw binds the three layers' textures
(`g_multiTexture0` to `2`), which the files' `layer1` to `layer3` numbers name (`sfx/tex/s%05d`), and its vertices hold the layers'
colours as bytes and the flipbook's cell size (the inverse of `columns`). The files whose multi-texture billboards have those textures
and that column count, and whose layer colours (a constant, or the range of a keyframed curve) contain the vertex's, are the draw's
candidates. In Sekiro's Ashina frame (25 multi-texture draws) and three Elden Ring frames of Stormveil's gate (21, 20 and 20 draws)
every draw has candidates, from one to several hundred; Elden Ring's five draws of effect 810341 (2123 to 2126 and 2128 of one frame) and Sekiro's two of effect 839520 are
tied to a single file. :observed[four frame captures, the files of the common and area effect binders]{games="sekiro elden-ring"}
Comparing each draw's constants with its candidates:

| File field | Reaches | Evidence |
|---|---|---|
| `unk_ds3_f2_10` to `_13` | `g_ps_TexBlendType`, `g_ps_TexBlendType2`, `g_ps_TexBlendType3`, `g_ps_ColorBlendType`, as the same integers | the constants equal the words of every candidate in 21 of Sekiro's 25 draws and 19 of the 61 Elden Ring draw records (three frames), and of at least one candidate in all the others; no draw's constants differ from all its candidates |
| `premultiplyAlpha` | `g_ps_bPreAlphaMult` (1 for true) | every candidate agrees with the constant in all 25 Sekiro draws (true for texture 11634's files, false for 11633's) and in 34 of the 61 Elden Ring records, some candidate in the rest; no draw contradicts |
| `blendMode` | `g_ps_BlendingMode` and the pipeline's blend: 6 gives 1 and source alpha against inverse source alpha, 4 and 7 give 2 and source alpha against one | Elden Ring: the single file of draws 2123 to 2126 and 2128 (mode 6) has 1, the files of draws 2087 and 2088 (9 and 6 candidates, all mode 4) have 2; Sekiro: the three draws with 2 have layer-2 scale values 0.202 to 0.796 (66 values), which fit the one candidate of mode 7 (scale 0.5 varied by up to 60 %, so 0.2 to 0.8) and not the mode 6 candidates (0.625 varied by up to 60 %, so 0.25 to 1.0), whose draws have 1 and values 0.253 to 0.998 (147) |
| `rgbMultiplier`, `alphaMultiplier` | `g_vColorScale` = (`rgbMultiplier` × K, the same, the same, `alphaMultiplier`) | Sekiro: 1.4 gives 1.58285, 1.0 gives 1.13061, 1.8 gives 2.0351, 1.2 gives 1.35673 and 1.5 gives 1.69591, with the alphas 0.3, 0.2, 1.0, 0.9 and 0.5 as stored; Elden Ring: 20 gives 1.4956 and 10 gives 0.7478, with the alphas 10, 5, 2.5 and 1.25 as stored |
| `lighting` | `g_ps_bEnableLighting`: -1 gives 0, -2 gives 1 | Elden Ring: the 48 records with 0 have only files with -1 and the 13 with 1 only files with -2; Sekiro has ten unlit draws whose only candidates hold -2 (four of them draws of texture 1001's files), so the field is not the whole rule there |
| `bloomColor` | `g_psGlowScale`, as stored | Elden Ring: in a frame with a Great Glintstone Shard in flight, seven of the nine tracer draws on its tracers' textures hold (0.5, 0.75, 1, 0.1), the `bloomColor` of 13 nodes of its flight effect 523022 (all with `bloom` set), to the bit; the other two hold (1, 0.75, 0.5, 0.1), which 523022 does not store |
| `depthBlend`, `bloom`, `interpolateFrames` | the program: `Soft`, `GlowD` and `Blend` | Elden Ring: no `Soft` record has a candidate set that is all `depthBlend` false; the 13 records of `GlowD` programs whose candidates agree on `bloom` have true, and the 13 of the program without `GlowD` have false; all 18 `Blend` records have `interpolateFrames` true in every candidate, while the records of programs without `Blend` have it false (13), true (15) or both (15) |

:observed[the table's scopes: four frame captures, and one of the shard]{games="sekiro elden-ring"} Only the first word takes several values in these frames
(0, 1 and 2 in Elden Ring, 1 in Sekiro) and the other three are 0 in every draw, so the order of the four words is shown for the first
alone and the other three are shown only at 0. A file that holds 2 in the fourth word is among the candidates of draws whose constant
is 0: it is not the file those draws drew. :observed{games="sekiro elden-ring"}

The factor K of `g_vColorScale` is 1 in every draw with `g_ps_bEnableLighting` 1 (the 34 lit effect draws of Sekiro's frame, the 6
of one Elden Ring frame) and the same number in every draw without it within a frame, whatever its file: 1.13061 in Sekiro's 50
unlit draws (ten different scales) and 0.07478 in Elden Ring's frames (0.07476 to 0.07478; 42 of the 48 unlit draws of one frame are
a whole `rgbMultiplier` times it, the other 6 are 1.0). :observed{games="sekiro elden-ring"} The engine therefore folds a
frame-wide factor into the multiplier of a draw whose pixel program does not light it; where the factor comes from is not read.
:inferred

### How the layers' coordinates are made

The vertex holds each layer's offset and scale, and the domain program applies them to the corner of the sprite. The corner is the
tessellation domain `(x, y)` (the octagon variants first trim its corners), taken as `c = (½ + x, ½ - y)`. From the control point's
`TEXCOORD0` to `TEXCOORD4`, the domain program of `GXFfxtessellateSoftMultiTexture` computes:

| Output | Value |
|---|---|
| layer 1 (`TEXCOORD0.xy`) | `TEXCOORD1.zw × (c - k) + k + TEXCOORD0.xy`, with `k` = `TEXCOORD4.x` |
| layer 2 (`TEXCOORD0.zw`) | `(c - ½) × TEXCOORD2.xy + ½ + TEXCOORD0.zw` |
| layer 3 (`TEXCOORD1.xy`) | `(c - ½) × TEXCOORD2.zw + ½ + TEXCOORD1.xy` |
| the next flipbook cell (`TEXCOORD1.zw`) | `TEXCOORD1.zw × (c - k) + k + TEXCOORD3.xy` |

:observed[the disassembly of the domain program, from the domain point to these outputs]{games="sekiro"} A layer's scale is therefore about
the centre of the sprite's coordinate square, and the flipbook cell applies to the first layer alone (with its next cell, for frame
interpolation): the second and third layers are not cells of the atlas. :observed{games="sekiro"} In every vertex read `TEXCOORD4.x`
is 0, so `k` is 0; `TEXCOORD1.zw` is the inverse of the file's `columns` (0.125 for 8), `TEXCOORD0.xy` is a cell's corner (multiples
of 0.125) and `TEXCOORD3.xy` is the next cell's (the cell index plus one, wrapping to the next row: (0.875, 0.625) then (0, 0.75) in
one Sekiro vertex). :observed{games="sekiro elden-ring"}

The scale and the offset arrive per particle. In Elden Ring's draw 2123 of effect 810341 (14 particles) `TEXCOORD2` is exactly
(0.5, 0.5, 0.5, 0.5), the file's constant layer-2 and layer-3 scale, while `TEXCOORD0.zw` and `TEXCOORD1.xy` take 0.08 to 1.07: the
file's offset is 0.5 varied by up to 100 % (0 to 1), and its speeds are 0.06 and 0.03 for layer 2 and 0.03 and 0.015 for layer 3.
:observed{games="elden-ring"} In Sekiro's draws of the one mode 7 file `TEXCOORD2.xy` takes 0.202 to 0.796 over 33 particles, the file's
scale of 0.5 varied by up to 60 %; those of the mode 6 files take 0.253 to 0.998 over 147, inside their 0.25 to 1.0. :observed{games="sekiro"}
That a particle's offset is the file's offset plus its speed times its age is inferred from the excess over 1 (at most 0.07) being
less than a speed times a second or two; it is not read from the code. :inferred

## The glow target

An effect node that blooms is drawn by a `GlowD` program, which writes a second target beside the colour: its final colour times
`g_psGlowScale.rgb` and its opacity times `g_psGlowScale.a` (see [the layers](#how-the-multi-texture-draws-compose-their-layers)).
:observed[the disassembly of `GXFfxtessellateTracerTextureGlowD` and `GXFfxtessellateSoftMultiTextureGlowD`]{games="elden-ring"}
One blend state applies to both targets: of the frame's 72 `GlowD` draws, 45 add (source alpha and one) and 27 blend over
(source alpha and its inverse), on every target alike. :observed[the blend states of every `GlowD` draw of one
frame]{games="elden-ring"} An additive draw thus adds its colour times its glow colour times the glow's alpha to the glow
target, and a draw that does not glow leaves it as it is. :inferred{games="elden-ring"} The target is R11G11B10_FLOAT at the frame's size, cleared before the effects, and the
[glow chain](/engines/fromsoft/lighting/frame/#glow) spreads it into the picture. :observed{games="elden-ring"}

`g_psGlowScale` is the node's bloom colour (`bloom_color`, four floats beside the `bloom` flag in the fxr project's naming) as
stored, and the flag picks the program: :observed[one frame drawing effect 523022, its draws matched to its nodes by
texture]{games="elden-ring"}

| Nodes of effect 523022 | Draws |
|---|---|
| 7 tracers, `bloom` true, colour (0.5, 0.75, 1, 0.1) | 7 `GXFfxtessellateTracerTextureGlowD` draws holding (0.5, 0.75, 1, 0.1) |
| 2 point sprites, `bloom` true, colour (0.5, 0.75, 1, 0.25) | 2 `GXFfxtessellatePointSpriteGlowD` draws holding (0.5, 0.75, 1, 0.25) |
| 1 billboard, `bloom` false, colour (0.5, 0.75, 1, 0.05) | the frame's one `GXFfxtessellateSoftMultiTexture` draw (no `GlowD`), its `g_psGlowScale` still the node's colour |

The frame's 72 `GlowD` draws hold eight distinct values, with alphas from 0.05 to 0.5. :observed[one frame]{games="elden-ring"}

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
| `GXFfxdistortionBump` (push) | by the strength times the normal texture's `xy * 2 - 1` (`g_normalTexture`, through the wrapping linear sampler), read at the sheet's coordinates scrolled by `g_waveTime` times the two scroll distances, `g_vNormalMapScrollDistance` added to u and `g_hNormalMapScrollDistance` taken from v, and scaled about the centre by `g_normalMapScrollScale` |
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
All 20 sheets of the captured frames (2 in Sekiro, 6 in each of three Elden Ring frames) are drawn with one blend (source alpha
against inverse source alpha, alpha written as source one and destination zero), `g_ps_BlendingMode` 1 and `g_ps_ColorBlendType` 0.
:observed{games="sekiro elden-ring"} The distortion files whose normal map is the bound texture (6000 in Sekiro, 60012 in Elden Ring)
number 27 and 217 actions in the binders read; 20 and 211 of them have blend mode 2 and 7 and 6 have 0. For 19 of the 20 sheets the pair of
`g_waveStrength` and `g_color.a` is reproduced, at one age along the files' keyframes read as linear, only by mode 2 files; for the
20th (Sekiro, 0.5 and 1.0) by both. :observed{games="sekiro elden-ring"} No sheet is tied to a file of another mode, so the captures
show the blend of mode 2 files only. A multi-texture billboard's mode does change its pipeline's blend (above); whether a distortion's
does needs a frame that draws a sheet of a mode 0 file (effect 30050 or 613215 in Sekiro, 523804 in Elden Ring). :unknown
:::

:::open[How does the engine set the strength and the stir from the file?]
`g_waveStrength` is the file's `intensity` at the particle's age, not multiplied by the colour's alpha. In both Sekiro sheets it is 0.5, the
constant `intensity` of three candidate files, while `g_color.a` is 0.714 and 1.0. :observed{games="sekiro"} In Elden Ring the sheets
come in threes (each drawn twice) of steps of about 4.03 in strength (1.667, 5.70, 9.733; 2.70, 6.733, 10.0; 2.0, 6.033, 10.0), with the
alphas 0.169, 0.569, 0.973; 0.271, 0.675, 0.616; 0.2, 0.604, 0.965. The third sheets of the last two have strength exactly 10.0 with alpha
0.616 and 0.965, so the strength saturates at 10 while the alpha does not: a product of a constant 10 and the alpha would give 6.2 and
9.65, and the earlier fit of 10 times the alpha (above) was two curves rising together. :observed{games="elden-ring"} The file that drew
them is not identified. :observed{games="elden-ring"}

The two scroll distances are, by their values, the offset plus speed times age of the normal map's U axis (`g_vNormalMapScrollDistance`) and V axis (`g_hNormalMapScrollDistance`), named across: in
both Sekiro sheets the candidates scroll along V alone (speed 0.25, U speed 0), and the distance `g_vNormalMapScrollDistance` is 0.6185
and 0.6278, inside the 0 to 1 of the random offset, while `g_hNormalMapScrollDistance` is 0.8765 and 14.79, which only a V speed can reach.
:inferred{games="sekiro"} All Elden Ring candidates have offset 0 and speed 0, matching the 0 and 0 captured, which tests nothing.
`g_clampDistanceInverse` is 1 and `radius` 1 in every candidate but one, `g_normalMapScrollScale` is (1, 1) and `normalMapScaleU` and `V`
1 in all, and `g_waveTime` is 1 and `g_waveNum` 0 in every sheet: the captured sheets are all of mode 1 (the normal-map push), so
what the stir (mode 0) sets for `g_waveTime`, `g_waveNum` and the strength is not captured, nor whether `g_clampDistanceInverse` is
the inverse of `radius`. :unknown
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

In a frame at the Ashina gate a compute dispatch writes 176-byte records into a list, each thread taking its slot with an
atomic add, and an indirect instanced draw then draws from that list, blended additively into the 11-bit-float scene
target. Run again on the frame's recorded inputs, the dispatch writes the same records in another order. :observed[one
captured frame, re-runs of the dispatch]{games="sekiro"} The record size is the standard particle's, so this is the list of
particles to draw, whose order changes from run to run; added in another order, a pixel of the scene target can round
differently. :inferred{games="sekiro"}

:::open[How does the engine fill these interfaces?]
For the multi-texture draws the file fields that reach the pixel constants and the vertex are listed above (the four texture and colour
words, `premultiplyAlpha`, `blendMode`, the two multipliers with a frame-wide factor, `lighting`, and the layers' colours, offsets, scales
and flipbook cells); the second colour `COLOR4` (four floats) lies inside the range of the file's `color3` in all 61 Elden Ring records,
and its range of `color2` in 34 of them, and the single-texture vertex's `COLOR1` (four floats at byte 16) inside `color3`'s range
in all 59 Sekiro draws against `color2`'s in 40. :observed{games="sekiro elden-ring"} The Elden Ring vertex of these draws is 148 bytes
(`COLOR0` to `COLOR3` bytes at 0, `COLOR4` at 16, `TEXCOORD0` to `TEXCOORD2` at 32, 48 and 64, `TEXCOORD3` at 80 as three floats,
`TEXCOORD4` at 92 as two 16-bit fractions, `TEXCOORD5` at 96 as one float, `TEXCOORD6` to `TEXCOORD8` at 100, 116 and 132); Sekiro's is
160 with a `POSITION` of four floats first. :observed[input layouts of the captured draws]
Which program a draw selects from the other flags, the single-texture draws' fields, the source of the frame-wide factor, the float
at `TEXCOORD5` (0.17 to 0.23 in some sheets, 12 to 31 in others) and `POSITION.w` (21 to 27), the contents of the 176 and 336-byte
particle records, and what the second render target holds are not recorded. :unknown{games="sekiro"}
The per-particle state the billboard appearance keeps before it draws is on [Particle appearances in the executable](/engines/fromsoft/effects/particle-appearance/).
:::

---
title: The rendered frame
description: "The renderer's passes in GPU order, from shadow maps through deferred light, fog, sky, effects, exposure and tone mapping, with their targets."
---

Both games draw a frame the same way: shadow maps, a G-buffer of the scene's opaque surfaces, screen-space passes over
it (ambient occlusion, the sun's shadow mask, reflections), deferred light into two light targets (diffuse and specular),
a composite with the albedo, volumetric fog, the sky and forward surfaces, effects, motion vectors and temporal
anti-aliasing, glow, exposure, bloom and a tone-mapping look-up into a 10-bit picture, then the interface. The renderer's
own passes are the programs of the `gxrenderershader` and `gxposteffect` [bundles](/engines/fromsoft/shaders/bundles/);
the scene's draws are the materials' programs. :observed

The order and targets below come from one frame of each game recorded in GPU execution order (every draw, dispatch,
clear and copy of the frame with its programs and bindings): Sekiro 1.06 at 1920x1080 at the Ashina Castle gate, Elden
Ring 1.17.2 at 2560x1440 at night at the Stormveil gate. Programs are named by matching their bytecode with the bundles'.
:observed

## The passes

| # | Pass (programs) | Sekiro | Elden Ring | Confidence |
|---|---|---|---|---|
| 1 | Shadow casters, `GXRend_CopyShadowMapDepth` between maps | R16 4096x2048 and four R16 4096x4096 | D16 atlases: 6144x4096, 8192x4096, 4096x4096 | :observed |
| 2 | G-buffer: the scene's opaque materials | targets as on [G-buffer](/engines/fromsoft/shaders/gbuffer/): RGB10A2, RGBA8, RGBA8, RGBA8, RGBA16F; depth D32S8 | RGB10A2, RGBA8, RGBA8 sRGB, RG8, RGBA16F; depth D32S8 | :observed |
| 3 | Depth reductions: `DepthScale2x2OutputDepth` | one level | two levels, then `DownSampleDepth16CS` (compute) to a 160x90 RG32F tile map and a 1x1 | :observed |
| 4 | Ambient occlusion: `ScreenSpaceAO2_WithNormal`, `_SeparatedReProj` (temporal), `_BilateralUpScale` | half resolution, up to full | the same, to R8 | :observed |
| 5 | Sun shadow mask: `GXScreenSpaceCascadedShadow_PCF9`, `GXRend_CompositeShadowMask` | splits 10 / 50 / 200 m, fades 2 / 10 / 40 m; plus a view-space shadow volume (`GXViewSpaceShadowVolume_*`) and two blurs | neither the volume nor the blurs among the named programs | :observed |
| 6 | Screen-space reflections: `GXSsrConvertDepth`, `GXSsrNew`, then `GXSsrTexDownScale` / `GXSsrTexBlur2` | RGBA16F, half resolution, 6 mips | a prepass of programs not named in the recording, then the down-scale and blur chain, five levels | :observed |
| 7 | Environment-map regions: one box draw per region, `GXEnvMapRegion[Box][DiffSpc]` and variants | 61 regions in the frame | 64 | :observed |
| 8 | Sun: `GXLightAcc_DDirLightShadowed1` | with `GXLightDeferredAOWithSsr` | | :observed |
| 9 | Point and spot lights: `GXLightOrganize<N>` (compute, tile lists) then a tiled light pass | `GXLightOrganize16`, `GXRend_TileBasedLighting` | `GXLightOrganize8`, and `GXLightAcc_DPointLightShadowed1` for a shadowed point light | :observed |
| 10 | `GXLightCmbAlbedo`, `GXSssBlurX` / `Y`, `GXLightComposite` | into R11G11B10F | then `OutputColor` | :observed |
| 11 | Volumetric fog: `GXVolumetricFog_DirLightShadowReproj`, `_WriteInScatteringPreShadowed`, a dispatch per local light, `_SolveVolumetricFog`, `_SceneComposite` | froxels 120x72x16 | 144x88x36, plus `_DirLightShadowPostFilter`; then `GXFogVolume_*` fog volumes at half resolution | :observed |
| 12 | Sky and forward surfaces | the sky's materials (below), depth-only and blended material draws | | :observed |
| 13 | Effects, distortion, half-resolution particles with `SampleBilateralDepthBlurTwo` | | | :observed |
| 14 | Motion vectors `MotionBlurWriteCMBVelocity`, then `StencilAndMotionVectorPreprocess`, `TempAA[StencilMask]`, `SharpenFilter` | | | :observed |
| 15 | Glow: `EmissiveToGlowPS`, `Sample13Weight` down, `GlowCompositeSinglePS` up | 6 levels | 7 levels | :observed |
| 16 | Exposure: `ToneMap_ColorToLuminancePS` (64x64), `ToneMap_ScaleLuminancePS` (16, 4, 1), `ToneMap_AdaptedLuminancePS` (1x1 with the previous frame's) | RG32F | the same, after `ToneMap_DownSample2x2PS` | :observed |
| 17 | Tone curve and grading: `ToneMap_WriteReinhardExToneMappingTablePS` (1024x1 R16F), a 16³ look-up | `ToneMap_Blend2Dto3DLUTCS`, RGBA32F | `ToneMap_Copy2Dto3DLUTCS`, RGBA16F | :observed |
| 18 | Bloom: `ToneMap_BrightPassTemporalPS`, `ToneMap_BloomGaussBlurPS` chain, `…CompositeUpScalePS`, `…CompositeSinglePS` | | | :observed |
| 19 | `ToneMap_TabledToneMapLUTPS` into RGB10A2 | | then `ToneMap_PostOETFPS` | :observed |
| 20 | Interface, `GXSimple_BlendUI_SDR2SDR_F` to the back buffer | | Scaleform draws | :observed |

## Pre-exposure

The scene constants `cbSceneParam` carry `SC_PreExposure` and `SC_InvPreExposure`. Both are 1 in every program of the
recorded Sekiro frame, and in all 50 distinct `cbSceneParam` contents the Elden Ring frame binds (and its loading frame).
:observed So in these frames neither game scales its light targets by a pre-exposure factor through this constant.

Elden Ring's `cbSceneParam` also carries `SC_SceneExposure` and `SC_InvSceneExposure` (offsets 1152 and 1156, reciprocal):
37.696 at night at the Stormveil gate and 19.886 in a loading frame. :observed{games="elden-ring"} None of the 96 programs
that declare `cbSceneParam` in the `gxrenderershader`, `gxposteffect`, `gxffxshader`, `gxshader`, `gxdecal` and grass bundles
reads them: the 72 that read that row
read only `SC_PreExposure`, by their DXIL. :observed{games="elden-ring"} The scene exposure is therefore a value of the
CPU side, which a light packer can apply to the records it writes. :inferred{games="elden-ring"}

## Sekiro

The sky is not a pass of its own. It is drawn as material draws (programs of the materials' shader bundles), in one
command list right after the volumetric fog's composite, into both light targets with depth testing: boxes
(`GXSimple_Transform_V`) that write neither colour nor depth, the dome (`M[Sky]_SkyDome_Ver2`, 1,824 indices), the moon
(`M[Moon]`, a quad of 6 indices), the far mountains (`M[LandScape]_FarMountain`) and the cloud layer
(`M[LandScape]_CloudFog`, 60,324 indices), in two recorded frames of the sunset sky. :observed{games="sekiro"} The
dome, the moon, the far mountains and the cloud layer draw with the same states: blended by the source alpha
(`SRC_ALPHA`, `INV_SRC_ALPHA`), the depth tested with `GREATER_EQUAL` (the depth is reversed) and written, back faces
culled. :observed{games="sekiro"} The dome's pixel program reads the sun's direction from `cbLight`, `FC_GlobalTime`, the
camera, the volumetric fog and 37 material values of its own, per its resource definitions; no separate sun-disc draw is
in the frame. :observed{games="sekiro"} None of the map pieces the layouts of the nine maps place draws a material whose
name or definition names the sky or the moon (every map piece model of each layout read, a positive control finding
1,590 pieces with `AMSN` materials). :observed{games="sekiro"} The sky is a map of its own, `m89_00_00_99`, whose layout
places at the origin one dome per sky state (map pieces `m900000` to `m900095`, materials `M[Sky]_SkyDome_<state>`:
morning, afternoon, evening, night, past night, dawn, dark clouds, storm, fog, cloud sea, fire, and two night domes with
a cloud layer), one ring of far mountains per state (`m900100` to `m900200`, `M[LandScape]_FarMtn_<state>`) and the moon,
the object `o005900`. :observed{games="sekiro"} Each dome is 12.6 km across (±6,293.6 m) and spans −1,191.2 m to 3,000 m
in height, 1,824 indices. :observed{games="sekiro"} `m10_00_00_00`, `m11_01_00_00` and `m17_00_00_00` keep domes of their
own (±6,000 m, 0 to 3,000 m) that their layouts do not place. :observed{games="sekiro"} In the recorded frame the dome
draw's index and vertex data are byte for byte those of the `m89_00_00_99` morning, evening and night domes, which share
their geometry. :observed{games="sekiro"} Which state the frame drew is not established: the draw's material constants
match none of the states' material definitions. :unknown

The moon `o005900` is a 10 by 10 quad with the material `M[Moon]` (masked by the texture `m99_Moon_3m`), skinned whole to
the second of its two bones, with a skeleton and animations of its own; the recorded moon draw's vertex and index data are
byte for byte its model's. :observed{games="sekiro"}

A map's `_farmodel` param (`FAR_MODEL_PARAM_ST`) names placed parts by parts group, not the sky.
:observed{games="sekiro"}

The dome and the far mountains follow the camera across the ground and keep their height: their object matrices are
the identity rotation at the camera's horizontal position and height 0. :observed{games="sekiro"}

:::open[Where is Elden Ring's sky?]
Forward draws into the light targets come before the volumetric fog in the Elden Ring frame; the recorded frame lost the
names of many programs, so which of them are the sky is not established.
:::

The moon follows the light: in both frames its quad's object matrix places it 25.0 units from the camera exactly along the
light set's direction towards its first directional light (0, 0.4226, −0.9063), with its rotation built from the same
direction so that it faces the camera. :observed{games="sekiro"} The quad is 10 by 10 units (corners at ±5 in its own x
and y), its normal its own −z, and its vertices select the second of the draw's two object matrices, whose z axis is that
direction, whose y axis is the world's up made perpendicular to it, and whose x axis completes a right-handed frame.
:observed{games="sekiro"} So the moon moves with the light set's `Angle0` over the day. :inferred{games="sekiro"}

:::open[Where does the moon's distance come from?]
The distance of 25 and what moves the object `o005900` (its bone or its placement) to the light are not established.
:::

:::open[What chooses the dome?]
Which of `m89_00_00_99`'s domes and far-mountain rings is drawn, by time of day or weather, and whether two are blended,
is not established: no event instruction names their entity ids, and the draw parameters name no model.
:::

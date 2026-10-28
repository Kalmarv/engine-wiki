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

## Sekiro

The sky is not a pass of its own. It is drawn as material draws of the map, in one command list right after the
volumetric fog's composite, into both light targets with depth testing: six depth-only boxes (`GXSimple_Transform_V`), the
dome (`M[Sky]_SkyDome_Ver2`, 1,824 indices), the moon (`M[Moon]`, a quad of 6 indices), the far mountains
(`M[LandScape]_FarMountain`) and the cloud layer (`M[LandScape]_CloudFog`, 60,324 indices), in a frame of the sunset sky.
:observed{games="sekiro"} The dome's pixel program reads the sun's direction from `cbLight`, `FC_GlobalTime`, the camera,
the volumetric fog and 37 material values of its own, per its resource definitions; no separate sun-disc draw is in the
frame. :observed{games="sekiro"}

:::open[Where is Elden Ring's sky?]
Forward draws into the light targets come before the volumetric fog in the Elden Ring frame; the recorded frame lost the
names of many programs, so which of them are the sky is not established.
:::

:::open[What sets the moon's position?]
The moon is a quad with its own world matrix; whether the game places it from the time of day or a light set's direction is
not established.
:::

---
title: The rendered frame
description: "The renderer's passes in GPU order, from shadow maps through deferred light, fog, sky, effects, exposure and tone mapping, with their targets."
sources:
  - title: Paramdex
    url: https://github.com/soulsmods/Paramdex
    note: the field names and types of WEATHER_ASSET_CREATE_PARAM_ST
  - title: SoulsFormats
    url: https://github.com/JKAnderson/SoulsFormats
    note: the names of the environment-map box's type-data words (UnkT08 and on)
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

## Across recorded frames

Over more recorded frames (Sekiro: 9 frames of 4 sessions at 1920x1080; Elden Ring: 7 frames of 2 sessions at 2560x1440): :observed

- Every full-screen draw of Sekiro binds one 3-vertex buffer, a triangle over the screen: positions (−1, 1, 1, 1), (3, 1, 1, 1),
  (−1, −3, 1, 1) with texture coordinates (0, 0), (2, 0), (0, 2). :observed{games="sekiro"}
- Targets sized from the view round up: 1080 / 16 gives 68 rows in Sekiro, and Elden Ring's bloom chain is 80x45, 40x23, 20x12,
  10x6. :observed
- The tiled light lists: Elden Ring's `GXLightOrganize8` writes 1,382,400 bytes at `u0` (345,600 words) and 43,264 at `u1`
  (3,600 records of 12 bytes); Sekiro's `GXLightOrganize16` writes 522,240 bytes at `u0`. :observed
- Elden Ring draws the shadows of local lights into a 4096x4096 R16 atlas in 64x64 regions (26 in one frame), which
  `GXLightAcc_DPointLightShadowed1` reads at `t7`. It is there in the 2 of 7 frames that have shadowed point lights.
  :observed{games="elden-ring"}
- Elden Ring runs the screen-space reflection chain and `DeferredAOWithSsr` only in the frames that draw `M[Water]` (5 of 7).
  :observed{games="elden-ring"}
- Elden Ring's `GXEnvMapRegion_CopyCubeToCubeLerp` writes an 8-mip 128x128 R11G11B10F cube through `u0` to `u7`, and the
  region variant `[LerpDiff]` reads it at `t25`. :observed{games="elden-ring"} Its program writes `u`*k* only inside size >> *k*,
  from the source cubes at level *k*, so `u`*k* is mip *k*. :inferred[from the program]{games="elden-ring"}
- Elden Ring's `ToneMap_AdaptedLuminancePS` writes one RG32F 1x1 target and reads another at `t4` that no recorded frame
  writes. :observed{games="elden-ring"}
- The order of fog and sky differs: Sekiro composites the volumetric fog (`GXVolumetricFog_SceneComposite`) before its sky
  draws, while Elden Ring draws its sky's cloud shell (`M[Clouds9]` with an `_FwdSdw` program) before its fog composite.
  :observed

The [forward or G-buffer rule](/engines/fromsoft/shaders/bundles/#forward-or-g-buffer) decides which sky materials are drawn
forward. In both games the sky's colour comes from forward programs: Elden Ring's G-buffer variants of its skysphere and cloud
materials (`M[Sky9]_Gbuf`, `M[DistantClouds]_001_Gbuf`, `M[Clouds5]_Gbuf`, `M[Atmosphere][Clouds]_001_Gbuf`) write no colour,
only a normal (`normal * 0.5 + 0.5` in target 0) and alpha words, every colour lane being the constant 0 (`M[Sky9]` samples no
texture). :observed[the programs translated and read, for the tile `m60_42_36_00`]{games="elden-ring"}

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
in the frame. :observed{games="sekiro"} These draws are in pass 0 (`Fwd`), not the shadowed forward pass, by a breakpoint on
the running game's pass id (see [bundles](/engines/fromsoft/shaders/bundles/#passes-and-switches)). :observed{games="sekiro"}
None of the map pieces the layouts of the nine maps place draws a material whose
name or definition names the sky or the moon (every map piece model of each layout read, a positive control finding
1,590 pieces with `AMSN` materials). :observed{games="sekiro"} The sky is a map of its own, `m89_00_00_99`, whose layout
places at the origin one dome per sky state (map pieces `m900000` to `m900095`, materials `M[Sky]_SkyDome_<state>`:
morning, afternoon, evening, night, past night, dawn, dark clouds, storm, fog, cloud sea, fire, and two night domes with
a cloud layer), one ring of far mountains per state (`m900100` to `m900200`, `M[LandScape]_FarMtn_<state>`) and the moon,
the object `o005900`. :observed{games="sekiro"} Each dome is 12.6 km across (±6,293.6 m) and spans −1,191.2 m to 3,000 m
in height, 1,824 indices. :observed{games="sekiro"} `m10_00_00_00`, `m11_01_00_00` and `m17_00_00_00` keep domes of their
own (±6,000 m, 0 to 3,000 m) that their layouts do not place. :observed{games="sekiro"} In the recorded frame the dome
draw's index and vertex data are byte for byte those of the `m89_00_00_99` morning, evening and night domes, which share
their geometry. :observed{games="sekiro"} The draw drew the evening dome: its material constants (`cbMtdParam`) equal
`M[Sky]_SkyDome_Evening`'s parameters on all 37 fields, a colour being its stored value raised to the power 2.2 and
multiplied by its `-Intensity` parameter, in nine recorded frames of one save at the 18:00 lighting; the next closest state
(dawn) matches 28 fields. :observed{games="sekiro"} Each of those frames draws one dome and no blend of two.
:observed{games="sekiro"}

The game's executable loads the sky map's 27 models and the moon's object from a fixed list of paths whatever the area.
:observed{games="sekiro"} Its run-time code moves the sky map's parts every frame: each part whose enabled flag is set
gets the world matrix "translation (camera x, 0, camera z) times the part's own transform", and the moon is then placed
at a distance the in-game step stores as 25.0 when it is built (a debug value, `Moon Distance`, can change it), read from
the decrypted code of the running game. :inferred{games="sekiro"} The part's enabled flag is set only by the engine's
enable-entity call, by entity id, in the same code. :inferred{games="sekiro"} The layout puts every dome, ring and the
moon in draw group 0, so draw groups do not pick the state. :observed{games="sekiro"}

In the running game the sky map's 27 parts are one block of map parts, and one dome and one ring are enabled among them. At an
Ashina Castle scene, read twice 40 s apart, two of the 27 have bit `0x200` set in the 32-bit word at part `+0x14C` (`0x04043E00`
against `0x04043C00` on the other 25): the dome `m900020_0000` (entity 8904020) and the ring `m900120_0000` (entity 8904021), the
ring's number being the dome's plus 100. :observed[one scene, two readings]{games="sekiro"} So the game shows a sky by enabling one
dome and its ring, not by choosing among drawn domes when it renders. :inferred{games="sekiro"} `m900020` is the evening dome.
:observed{games="sekiro"}

### What chooses the sky

Event 100 of `common.emevd` (initialised by instruction 6 of common event 50) chooses the sky and the environment volumes
from four story flags, 9800 to 9803. After branches for particular maps and flags (one for map 10 selects environment 0), it
takes the first of these that holds: :observed[the installed script, read instruction by instruction]{games="sekiro"}

| Flags 9800 to 9803 | Part group enabled (`2012:1`) | `2003:80` environment |
|---|---|---|
| all off | 8907000 | 1 |
| 9800 on, the rest off | 8907010 | 2 |
| 9800 and 9801 on, 9802 and 9803 off | 8907020 | 3 |
| 9800 to 9802 on, 9803 off | 8907030 | 4 |
| all on | 8907050 | 5 |

The third branch also clears flag 9810 and sets animation 4 on the sky object 8901000. `2012:1` takes the group, not a part:
the one call for group 8907020 enables the evening dome (entity 8904020) and its ring (8904021); in a run of the game from a cold
start, all 29 calls the script made reached those parts. :observed[29 of 29 calls, one run]{games="sekiro"} The sky therefore
follows the story's world state, not the clock hour. :inferred{games="sekiro"} The environment number of `2003:80` is the
package suffix of the environment volumes the frame draws: the evening branch's 3 goes with `_03` below. :inferred{games="sekiro"}

### Irradiance volumes

The walls' diffuse ambient comes from volumes, not from the light set. Each of `m11_01`'s six packages
`m11_01_00_00_envmap_00` to `_05.tpf.dcx` holds 580 textures: 464 BC7 (DXGI 98, package code 102) single-mip volume textures
and 116 cube maps, the volumes being 116 complete groups `GIIV<nnnn>_<ss>_W`, `_X`, `_Y` and `_Z`, and every one of the 107
`EnvironmentMapEffectBox` regions of the layout has a group in every package (9 groups more are not placed).
:observed[all six packages, read with an independent reader]{games="sekiro"} The four volumes of a group usually share one
grid, but not always: six groups of `m11_00` (packages 01 and 05: groups 0250, 0300, 0307 and 0323) mix sizes, `0250_05` having
X, Z and W of 40 × 20 × 36 and Y of 64 × 36 × 60. Every group of `m11_01`, and every group of the `_03` packages, shares one grid.
:observed[the DDS headers of the `m11_00`, `m11_01` and `m11_02` packages]{games="sekiro"}

In a frame at the evening lighting, every one of the 1,524 volume textures the game created matched, byte for byte, a `GIIV`
texture of the packages, and each of the 61 `GXEnvMapRegion` draws bound the four volumes `X`, `Y`, `Z` and `W` of one group
of package `_03`, in that order, including regions of the neighbouring maps `m11_00` and `m11_02`. :observed[one frame, the
uploads hooked]{games="sekiro"} The neighbouring maps' regions draw in an `m11_01` frame: the region draws of one frame
included `m11_00`'s box 000 (centre (102.4, 583, 8.69), 13,520 × 1,600 × 13,439 m) and `m11_02`'s (centre (−8.5, −67.3, −62.5),
10,000 × 1,250 × 10,000 m) beside `m11_01`'s own; a drawn centre is the layout's position plus half the box's height.
:observed[one frame]{games="sekiro"}

The diffuse region program decodes each coefficient texel as `(rgb − 0.5) × 2 × 2^((a − 0.5) × 20)`, takes per colour channel
the dot product of a coefficient row with `(n, 1)`, clamps it at 0 and multiplies by the pre-exposure; it scales by its
diffuse colour scale (1) and does not read `g_envMapColorScale`, and it samples the volumes trilinearly at level 0, clamped,
at a position offset along the normal. :observed[the program's disassembly]{games="sekiro"}

### Environment-map regions

Each `EnvironmentMapEffectBox` region of a layout is one box draw of a `GXEnvMapRegion` program, which adds the region's
diffuse and specular light. In one recorded frame of `m11_01` at 18:00 (61 region draws, each matched to its box by
`g_envMapDrawAreaExtents` and the translation of `g_envMapWorld`, the box's position plus half its height) the programs were
`[Box][DiffSpc]` 42 times, `[Box][DiffSpcPcc]` 9, `[Stencil]` 5, `[Box][Diff]` 3 and `[Box][SpcPcc]` 2. :observed[one frame]{games="sekiro"}

The box's type data chooses the program and supplies its constants. The names are SoulsFormats' for the type data's words.
:observed[61 region draws of one frame]{games="sekiro"}

| Type data | Use | Confidence |
|---|---|---|
| `UnkT08` | 1: parallax-corrected specular (the `Pcc` programs); 1 on all 11 `Pcc` draws, 0 on the other 50 | :observed{games="sekiro"} |
| `UnkT09` | 90 on the reflection boxes below; the region's priority | :inferred{games="sekiro"} |
| `UnkT24` (`i32` at `0x24`) | 0 diffuse and specular (`[DiffSpc]`, `[DiffSpcPcc]`, `[Stencil]`), 1 diffuse only (`[Diff]`), 2 specular only (`[SpcPcc]`): 56, 3 and 2 draws | :observed{games="sekiro"} |
| `UnkT28` (`f32` at `0x28`) | `g_envMapDiffuseColorScale`, bit for bit on 61 of 61 draws | :observed{games="sekiro"} |
| `UnkT2C` (`f32` at `0x2C`) | `g_envMapColorScale`, the specular cube's scale, bit for bit on the 58 draws whose program reads it | :observed{games="sekiro"} |

The three diffuse-only draws are each map's whole-map box `Env_Box000`, and the two specular-only ones `m11_01`'s and `m11_00`'s
`Env_Box900`. `m11_01`'s boxes 900 to 917, named `映りこみ用` ("for reflections"), have priority 90 and `UnkT08` 1, and
`m11_00` and `m11_02` have one each. :observed{games="sekiro"} `m11_01`'s `Env_Box902` stores 258 (`0x102`) in `UnkT24`. :observed{games="sekiro"}
For a parallax-corrected region, `g_envMapMatPccObb` is the box itself (`g_envMapWorld`) on all 11 draws, and
`g_envMapRegionPccOrigin` (`cb3` byte 288) is the position of the environment point of the same number (`Env_Point<id>`) bit for
bit on all 7 of `m11_01`'s. :observed[one frame]{games="sekiro"} `g_envMapInterpRatio` is 0 on every draw, and `g_envMapFadeRate`
1.0 on 59 (0.468 and 0.324 on the others). :observed[one frame]{games="sekiro"}

The region's specular cube (`t25`) is `<map>_GILM<id>_<package>` in the same environment package as its irradiance volumes: a
BC6H_UF16 (DXGI 95) cube of 128 × 128 with 7 levels, one per coefficient group. Package `_03` of `m11_01` holds 116, their ids
those of its 116 `GIIV` groups one for one; every package of `m11_00` (1 to 5) holds 55 and every one of `m11_02` 20.
:observed[the packages listed with an independent reader]{games="sekiro"} All 61 draws bind such a cube at `t25`. :observed[one frame]{games="sekiro"}

The program, by its disassembly: :observed[the programs' disassembly]{games="sekiro"}

- It writes specular to `o0` and diffuse to `o1`, both with one alpha. With `local = g_envMapInvWorld × P` and
  `edge = min((1 − |local|) × g_envMapDrawAreaExtents)`, a pixel with `edge < 0` writes 0 with alpha 0; otherwise
  `alpha = smoothstep(saturate(edge × g_envMapInvFadeDistance)) × g_envMapFadeRate`.
- The reflection is `r = 2(n·v)n − v`, `v` the unit vector to the eye and `n` the G-buffer normal (`× 2 − 1`, normalised).
- A `Pcc` program moves the ray into the unit box (`q = g_envMapMatInvPccObb × P`, `d` its rotation of `r`), takes per axis
  `|(1 − q) / d|` where `d > 0`, `|(1 + q) / d|` where `d < 0` and 5,000 otherwise, the least of these `t`, and the exit point
  `q + t d`. If any coordinate of the exit lies outside `±(1 + 1e-4 t)` the specular is 0 (the alpha stays); otherwise the cube is
  sampled along `g_envMapMatPccObb × exit − g_envMapRegionPccOrigin`. The other programs sample along `r`.
- The cube is sampled (`SS_WrapLinear`) at level `min(6.5 − 6.5 × gloss, 6)`, `gloss` being `g_GBuffer1.x` (`t3`). `o0` is the
  texel times `g_envMapColorScale` times the pre-exposure (`cb8[62].z`); `o1` is the volumes' irradiance times
  `g_envMapDiffuseColorScale` times the pre-exposure.

`GXLightDeferredAOWithSsr` then applies ambient occlusion and the ambient BRDF: :observed[the program's disassembly]{games="sekiro"}

- `AO = t32.x × t32.y` (`g_ShadowTexture`), and the diffuse out is `AO` times the diffuse sum.
- `(A, B)` is `g_AmbientBRDFTexture` (`t39`) `.rg`, sampled `SS_ClampLinear` at (`min(|n·v|, 1)`, `gloss`) with `n` in view space,
  and `envBRDF = GBuffer3.rgb² × A + B` (`t5`).
- The specular sum (`t7`) times `envBRDF` is blended with the screen-space reflections (`t44`, sampled at level
  `5 × saturate((1 − gloss) × cb0[20].w + cb0[21].x)`) by `k = min(saturate(max(f0) × 10 − cb0[20].z), depth fade)`:
  `AO × (spec × (1 − k × ssr.a) + envBRDF × ssr.rgb × k)`.

`GXLightComposite` adds that to the diffuse light times the albedo. :observed[the program's disassembly]{games="sekiro"}

The ambient BRDF table is data of the executable, not of a texture file. The renderer's setting `AmbientBRDF LUT` (`LUT Type`)
names five tables, `R8G8_OLD_256`, `R8G8_UE4_128`, `R8G8_UE4_256`, `R8G8_UE4_512` and `R16G16_UE4_256`, and each has a loader that
copies its table out of `.rdata` into a new texture. `R16G16_UE4_256` is 0x40000 bytes at VA `0x143114D30` of the 1.06 executable
(SHA-256 `637aca52…8b856`; file offset `0x3114130`, the section being stored unencrypted), a 256 × 256 `R16G16_UNORM` texture
with a row pitch of 1,024; the table's SHA-256 is `aebecda11cf0543a67b87c1585dff816226e33e46653983cbb46cc945ef532fb`. The
renderer's set-up creates all five and makes `R16G16_UE4_256` the current one whenever it exists, and the setting is bound to that
same pointer, so only the parameter editor changes it. :observed[read from the decrypted code and the executable file]{games="sekiro"}
All three recorded frames bind a format-35 (`R16G16_UNORM`) texture at `t39`, the only R16G16 type. :observed[three frames]{games="sekiro"}
That the bound texels are that table's bytes is not yet read back from the running game. :inferred{games="sekiro"}

### Tone curve

`ToneMap_WriteReinhardExToneMappingTablePS` writes the tone curve as a 1024 × 1 R16F table. At texel `i`, with
`u = (i + 0.5) / 1024`, it computes `z = (0.2 × u / (1 − u) × g_ReinhardParam.y) ^ g_ReinhardParam.x` and writes
`(z / (1 + z)) ^ (1 / g_ToneMapParam.y)`. :observed[the program's disassembly]{games="sekiro"} The same operations in the same
order, rounded to `f16` where the program narrows, give all 1,024 stored half-words of a recorded frame's table bit for bit,
with the frame's constants: contrast 1.45, white balance 1.7 and gamma 1. :observed[one frame at the Ashina Castle gate]{games="sekiro"}
`ToneMap_TabledToneMapLUTPS` multiplies the scene by the scene exposure, adds the bloom, reads the curve at `x / (x + 0.2)`,
then applies a colour matrix and the vignette and looks up the 16³ grading table. :observed[the program's disassembly]{games="sekiro"}

Of the 253 draw-parameter files of the install, which hold 151 Reinhard fields, `mapbase.gparam.dcx` stores `ReinhardContrast`
1.45 and `ReinhardWhiteBalance` 1.7, the recorded frame's values; `default.gparam` stores 1.6 and 1.7, and `m11_01_0000` neither.
:observed[every installed draw-parameter file]{games="sekiro"} So the frame's curve takes the `MapBase` layer's values there.
:inferred{games="sekiro"} How the [banks](/engines/fromsoft/lighting/gparam/#banks-and-layers) take precedence is not traced.

### Volumetric fog

`GXVolumetricFog_SolveVolumetricFog` runs as 15 × 9 × 1 groups of 8 × 8 × 1 threads. It integrates the 16 slices of
120 × 72 froxels from two `R32_UINT` targets that pack density and blue, and red and green, as half floats, and writes slices
0 to 15 in RGBA16F, the accumulated end in slice 16 and, with `EnableAnalyticalFog` 0, a neutral (0, 0, 0, 1) in slice 17: a
120 × 72 × 18 volume, which the sky draw reads. Before it run the sun's shadow reprojection, the in-scattering and one dispatch
per local point light (four in the frame). :observed[one frame, the program's disassembly]{games="sekiro"} How its constants
come from the draw parameters is on [GPARAM](/engines/fromsoft/lighting/gparam/).

The moon `o005900` is a 10 by 10 quad with the material `M[Moon]` (masked by the texture `m99_Moon_3m`), skinned whole to
the second of its two bones, with a skeleton and animations of its own; the recorded moon draw's vertex and index data are
byte for byte its model's. :observed{games="sekiro"}

A map's `_farmodel` param (`FAR_MODEL_PARAM_ST`) names placed parts by parts group, not the sky.
:observed{games="sekiro"}

The dome and the far mountains follow the camera across the ground and keep their height: their object matrices are
the identity rotation at the camera's horizontal position and height 0. :observed{games="sekiro"}

:::open[Where is the rest of Elden Ring's sky drawn in the frame?]
Forward draws into the light targets come before the volumetric fog in the Elden Ring frame, among them the cloud shell
`M[Clouds9]`; where the skysphere itself and the other cloud layers are drawn is not established.
:::

The moon follows the light: in both frames its quad's object matrix places it 25.0 units from the camera exactly along the
light set's direction towards its first directional light (0, 0.4226, −0.9063), with its rotation built from the same
direction so that it faces the camera. :observed{games="sekiro"} The quad is 10 by 10 units (corners at ±5 in its own x
and y), its normal its own −z, and its vertices select the second of the draw's two object matrices, whose z axis is that
direction, whose y axis is the world's up made perpendicular to it, and whose x axis completes a right-handed frame.
:observed{games="sekiro"} So the moon moves with the light set's `Angle0` over the day. :inferred{games="sekiro"}

:::open[Which part groups hold which domes?]
Group 8907020 holds the evening dome and its ring; which domes the other four groups enable, and what the map and flag
branches before the table choose, were not read from the layouts.
:::

## Elden Ring

The sky is a family of assets, `AEG096` (82 asset binders): skyspheres 53 to 86 km across (`aeg096_010` to `_016`,
`_101`, `_102`), cloud layers (`_400` and up), the aurora (`_201`), a rainbow (`_200`) and pieces of the Erdtree, drawn by
the sky material families (`M[Sky3]` to `M[Sky9]`, `M[Clouds…]`, `M[Atmosphere][Clouds]_…`, `M[DistantClouds]_…`) whose
materials are named `Field_Skysphere_…`. :observed{games="elden-ring"} They are placed by the areas' `_99` maps: the
open world's `m60_00_00_99` places 38 of them. :observed{games="elden-ring"}

Which show depends on the weather: `WeatherAssetReplaceParam` (1,007 rows) lists, for a `_99` map and a weather id, the
assets drawn; every one of `m60_00_00_99`'s 38 sky assets is listed for some weather, and its 18 weathers list 1 to 27 of
them (weather 0: the clear skysphere `aeg096_010` with its clouds and the Erdtree; weather 99: `aeg096_102` alone).
:observed{games="elden-ring"} A row (64 bytes, data version 2) is keyed by the sky map, the weather (a `WeatherParam` id), `isFireAsh` and
four `CreateAssetLimitId`s, and lists up to 8 asset ids, `AEGnnn_mmm` being the number `nnn * 1000 + mmm`; no key repeats, and
every asset a row names is placed by its sky map's layout, over all 18 sky maps of the base game.
:observed[every row, and the 935 layouts of the base game]{games="elden-ring"} `isFireAsh` is 0 or 1 in the base game's rows
and 2 only on the expansion's maps (`m20`, `m21`, `m28`, `m61`). :observed{games="elden-ring"} The code that applies the rows
takes 2 as either: it skips a row whose `isFireAsh` (byte 8) is 0 or 1 and does not equal the game's current ash state, a byte of
a world-state object (`+0xBCD`; 0 when the object is absent). :observed[read from the decrypted code of 2.7.2.0]{games="elden-ring"} A row with limits applies only on
maps whose `MapDefaultInfoParam` row (its id the map's 8-digit number) has a `WeatherCreateAssetLimitId` among them: the open
world's tiles hold 0 to 4, 21, 31, 41 and 42 in the base game and 50 to 75 in the expansion, the legacy dungeons −1; every row of
`m60` has limits and no row of a legacy map has. :observed{games="elden-ring"}

The sky maps place more than the rows name: far-view land pieces (`m90XXZZ`), `AEG004` and `AEG299` props and the Erdtree
`AEG094`, 594 parts in `m60_00_00_99`. :observed{games="elden-ring"} `m60_00_00_99`'s origin is the centre of the level-2 tile
cell (10, 8): a piece `m90XXZZ` stands at ((XX − 10) × 1024, 0, (ZZ − 8) × 1024) and its model is centred on its cell (±512),
as the terrain of `m60_10_08_02` is centred on its own; a level-0 tile (x, z) has its centre at ((x − 42) × 256 + 128,
(z − 34) × 256 + 128) in that frame. :observed{games="elden-ring"} A legacy dungeon's sky map `mAA_BB_00_99` shares its
dungeon's frame. :observed{games="elden-ring"} `WeatherAssetCreateParam` (8 rows) spawns the rainbow between 7 and 16 h and the aurora
between 21 and 3 h, by weather. :observed{games="elden-ring"} Its rows: 0 and 1 the rainbow `AEG096_200` (condition 0, on the
change from weather 21 to 0 or to 1, 7 to 16 h), 1000 and 1001 the aurora `AEG096_201` (condition 1, after an elapsed time,
21 to 3 h), and 7000 to 7003 `AEG050_448` and `_449` (condition 0, −2 to 82, a life time of 99,999). Rows of condition 0 set a
transition and rows of condition 1 an elapsed time, so 0 is the transition condition and 1 the elapsed-time one. :inferred{games="elden-ring"}
Every row sets exactly one creation point and one limit (2, 4 or 70). :proven[the 8 rows]{games="elden-ring"}

```layout
title: WeatherAssetCreateParam row (WEATHER_ASSET_CREATE_PARAM_ST)
size: 64
games: [elden-ring]
note: Data version 1. The names are the community param definition's; the bytes it leaves as padding are zero in every row.
fields:
  - {at: 0, size: 4, type: u32, name: AssetId, level: proven}
  - {at: 4, size: 4, type: u32, name: SlotNo, level: unknown}
  - {at: 8, size: 1, type: u8, name: CreateConditionType, level: inferred, note: "0 on a weather transition, 1 after an elapsed time"}
  - {at: 9, size: 3, type: "u8[3]", name: padding, level: proven, value: 0}
  - {at: 12, size: 2, type: s16, name: TransitionSrcWeather, level: sourced}
  - {at: 14, size: 2, type: s16, name: TransitionDstWeather, level: sourced}
  - {at: 16, size: 2, type: s16, name: ElapsedTimeCheckWeather, level: sourced}
  - {at: 18, size: 2, type: "u8[2]", name: padding, level: proven, value: 0}
  - {at: 20, size: 4, type: f32, name: ElapsedTime, level: sourced}
  - {at: 24, size: 4, type: f32, name: CreateDelayTime, level: sourced}
  - {at: 28, size: 4, type: u32, name: CreateProbability, level: sourced}
  - {at: 32, size: 4, type: f32, name: LifeTime, level: sourced}
  - {at: 36, size: 4, type: f32, name: FadeTime, level: sourced}
  - {at: 40, size: 4, type: f32, name: EnableCreateTimeMin, level: sourced, note: "hours: 7 for the rainbow, 21 for the aurora"}
  - {at: 44, size: 4, type: f32, name: EnableCreateTimeMax, level: sourced, note: "hours: 16, 3"}
  - {at: 48, size: 8, type: "s16[4]", name: CreatePoint0..3, level: sourced, note: one set per row}
  - {at: 56, size: 4, type: "s8[4]", name: CreateAssetLimitId0..3, level: sourced, note: "one set per row: 2, 4 or 70"}
  - {at: 60, size: 4, type: "u8[4]", name: padding, level: proven, value: 0}
```

The layout reads the base game's 8 rows with every padding byte zero. :proven[the 8 rows of the base game's regulation]{games="elden-ring"} `AssetGeometryParam`'s `isSkydomeFlag` ("treated as a
celestial sphere: follows the player", by its definition) is set on one asset only, `AEG620_002`, and no layout part names
one of the 17 `PartsDrawParam` rows that set `isSkydomeDrawPhase` (935 layouts read). :observed{games="elden-ring"}

### Frame constants

In the scene constants `cbSceneParam` (2,016 bytes, `b8` of the sky and light programs) `FC_ShadowColor` is at byte 544 and
`FC_ShadowDir` at 560, a unit vector towards the sun in the drawing frame: it agrees within 0.01 with the negated forward
axis of the frame's orthographic shadow camera. :observed[one frame at the Stormveil gate]{games="elden-ring"} `cbPerFrame`
(`b9`, 448 bytes, `FC_GlobalTime` at 432 and `FC_TimeOfDay` at 436) is bound from a buffer in GPU memory in every draw, not
from an upload heap. :observed{games="elden-ring"}

### Exposure

The picture's exposure is a scale the CPU writes: `ToneMap_TabledToneMapLUTPS` multiplies the scene by `cbToneMap`'s
(`b1`, 416 bytes) `g_ToneMapSceneLumScale` at byte 48, which equals `SC_SceneExposure`, and samples no luminance texture.
:observed[the program's DXIL, three frames]{games="elden-ring"}

The GPU measures the frame first: :observed[the DXIL of the four programs, with constants from recorded frames]{games="elden-ring"}

1. `ToneMap_DownSample2x2PS` halves the R11G11B10F scene, one bilinear tap per half-size texel (2560 × 1440 to 1280 × 720).
2. `ToneMap_ColorToLuminancePS` writes a 64 × 64 RG32F target. Each texel takes 16 bilinear taps of the half-size frame at its
   centre plus `((k mod 4 − 1.5) / 256, (k / 4 − 1.5) / 256)`, the luma `dot(rgb, (0.299, 0.587, 0.114))` of each (NaN or
   infinity read as 0) times `g_vScenePreExposure.z`, and `L = log2(Y + 1e-5) + 20`; it writes `(mean(L) × w, w)` with the centre
   weight `w = 1 − (1 − 2^−r)³`, `r = length(2(uv − 0.5) × g_AdaptCenterWeight.xy)`. `g_AdaptCenterWeight` is the draw
   parameters' `Center Weight` and that times 720 / 1280: (7, 3.9375) at Stormveil at noon.
3. `ToneMap_ScaleLuminancePS` takes exact 4 × 4 means, 64 to 16 to 4 to 1.
4. `ToneMap_AdaptedLuminancePS` forms `target = s.x / s.y − g_AdaptParam.x` and `adapted = prev + (target − prev)(1 − 10^−rate)`,
   the rate `g_AdaptParam.y` when the target is above the previous value and `.z` otherwise, and writes
   `(adapted, 2^−(adapted − 20))`. A still frame converges to `adapted = target`.

Read back from one frame (all six draws of the chain, the Stormveil gate, one GPU): the down-sample matches a 2 × 2 mean to
within 0.97 of an R11G11B10F step, each scale level is the exact 4 × 4 mean (to 1e-7 relative) and the adapted value the rule
above to 5e-7, with a rate times `T` of 0.005183 that frame. :observed[one frame]{games="elden-ring"} The shipped
`ToneMap_ColorToLuminancePS`, run outside the game on Direct3D 12 on the same GPU and driver with the root signature of its own
`RTS0` part and the frame's constants, vertex buffer and source texture, reproduces all 4,096 cells of the 64 × 64 target, both
words, bit for bit. :proven[the shipped program run on one frame's inputs]{games="elden-ring"}

The formula computed exactly does not: its cells are all above the game's, by 2.2e-4 in `log2` per sample on average, at every
brightness, and the metered value differs by 2e-4 stops (−6.838357 in the game). The difference comes from the texture unit's
bilinear filter, which on that GPU differs from the exact blend of the stored texels by up to 2⁻¹¹ relative per channel; the same
operations with the hardware's sample reproduce the game's cells (`w` 4,096 of 4,096, `x` 3,949, the rest within 3 ulp). The
GPU's `log2` is not correctly rounded (1 ulp off on 122,104 of 196,608 arguments), and the driver may reorder the per-sample
dot product and the loop it compiles, which moves single cells by an ulp; the 4 × 4 means absorb these, so the 1 × 1 result is
the game's in both words. :observed[one frame, one GPU]{games="elden-ring"} So the meter's last digits depend on the GPU, not
only on the program. :inferred{games="elden-ring"}

`g_AdaptParam` is (`AutoExposure Middle Gray`, the light adaptation speed × `T`, the dark adaptation speed × `T`, 0), `T` a
per-frame value that is 0 while the game is paused and 1/30 by default; in recorded frames it ranges from 0.025 to 1.28 with
the recorder's stalls, so it reads as the frame time in seconds. `g_vScenePreExposure` is `(e, 2^e, 2^−e, 0)`; it is (0, 1, 1, 0)
in all 26 frames read, so pre-exposure is off. :observed[read from the decrypted code, and 26 frames of two runs]{games="elden-ring"}

The CPU then sets the scale `S`. With `x = adapted − 20`, `adapted` being the value the GPU wrote four frames earlier (the
results come back through a ring of four read-backs), `log2 S = Exposure − L(1 − e^(−x / L))`, `L` being the Tone Map's
`AutoExposure Adaption Max` when `x > 0` and `Adaption Min` when `x < 0`: a soft clamp, not a hard one. `Exposure`, `Max` and `Min`
are the draw parameters at the current hour, blended by the clamped rule of [GPARAM](/engines/fromsoft/lighting/gparam/#looking-up-an-hour)
(each is registered with interpolation); `FreezeAdaptionFade` forces `x = 0`. :observed[read from the decrypted code]{games="elden-ring"}
Over 21 frames of two runs at Stormveil (`x` from −0.44 to −0.33) the rule gives `log2 S` within 0.00011; a lag of 0, 2 or 6
frames, or base 2 for the exponential, misses by 0.002 to 0.09. Only the `Min` branch is checked on data. :observed[21 frames,
two runs]{games="elden-ring"}

The tone map's other constants: `g_ReinhardParam` is (`ReinhardContrast`, `ReinhardWhiteBalance`), `g_ToneMapParam`
(`Contrast`, the table exponent 1, 1/2.2), and `g_bEnableFlags.z` the HDR flag. :observed{games="elden-ring"}

:::open[Do Elden Ring's skyspheres follow the camera?]
How a weather's list combines with the `_99` map's own placements, and whether the skyspheres move with the camera as
Sekiro's sky map does, are not established.
:::

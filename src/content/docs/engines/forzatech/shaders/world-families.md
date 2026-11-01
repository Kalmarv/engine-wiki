---
title: Other world shader families
description: Albedo, opacity, roughness, metalness, normal and emissive outputs of the Forza Horizon 6 world families other than environment, rock and water, as read from their compiled shaders.
---

This page gives what each remaining world family writes to the G-buffer. [Environment](/engines/forzatech/shaders/environment/),
[rocks and animated props](/engines/forzatech/shaders/rock-and-animated/), [spline deform](/engines/forzatech/shaders/spline-deform/)
and [water](/engines/forzatech/water/water/) have their own pages; cars are on [Car materials](/engines/forzatech/shaders/car-materials/).
Each formula was transcribed from the family's `GBufferLightScenario` pixel shader, and those marked [V] were reproduced by
interpreting the compiled shader on real Tokyo materials (real merged constants, real textures, random points on real
faces with the mesh's own normal and tangent), with a maximum difference of 1e-7 over 49 runs. :observed Counts come from a
recorded census of the Tokyo track `Brio`, no longer re-checkable. :observed

"Overlay" below is always `a > .5 ? 1 − 2(1−a)(1−b) : 2ab`. The alpha-test threshold is a global (`cb2[128].x`) found in no
file. :unknown

## Albedo and opacity

| Family | Albedo (`RT0.rgb`) | Opacity | Confidence |
|---|---|---|---|
| `uber_foliage` | `DiffuseTexture(uv0)` (0x0940E415); `_Tint` adds a world tint map and LUT overlay (one material) | alpha test `sat((a − AlphaStepMin)/(AlphaStepMax − AlphaStepMin))` | :observed |
| `uber_branch` | `DiffuseA(uv0 · DiffuseAUVTiling)` | opaque | :observed |
| `environmentdeferreddecal` | `DiffAlphaTex((uv0 + Uv0Offset) · DiffAlphaUVTiling)` (0x0670EE0A); `_ST` swatch tint as the environment family; offset and tiling select an atlas cell (94 of 424 materials) | the deferred-decal pass: alpha `a · DiffRoughIntensity · (VertexAlphaOnOff ? COLOR.a : 1)`, discard below 0.01 | :observed |
| `environment_plot` | `D = DiffAlphaTex_A((uv0 + Uv0Offset) · BaseColorAlpha_A_UVTiling)`; `_M`: `M = Modulate(uv2 · ModulateUVTiling)` (PavementCorner texture where `uv3.x ≥ .999`), `b = sat((M.r − .5)·_BrightnessStrength + .5)`, `s` likewise with `.g`, `c1 = overlay(b, D^(1/2.2))`, `L = luma(c1)`, `mod = sat(L + (c1 − L)·2s)^2.2`, `albedo = D + (mod − D)(1 − RMA.y)` (grey128 = identity) | AlphaTest variants: `D.a` | :observed |
| `uber_roaddecal`, `uber_roaddecalretro` | `DecalDiffuseATexture(uv0 · RoadUVMultiplierA)` (0xFCA19F4A); `PerObjectTint0OnOff`: overlay with `ObjectTintColor^(1/2.2)`; `T` variants overlay with `COLOR.b`; modulate variants multiply by `1 + (Modulate(uvM).w − 1)·sat(DecalNormalA.w + 1 − HeightInfluence)·COLOR.r` | alpha test on `DecalMaskATexture(uv0).r` (0xBB3F3690, raw uv0) × `(AlphaFadeOnOff ? COLOR.g : 1)`; `HA` variants `sat((mask + fade − 1)/MaxHeightAlpha)`. The diffuse alpha is not opacity | :observed |
| `uber_road` | layers A to D (0x83D46B62, 0x92A9011B, 0x2B52DAF3, 0xB053D5E9; normal alpha = height) on world-planar uv when `UVSet < 0` (`u = X·Tiling.x·WorldUVScale.x`, `v = −Z·Tiling.y·WorldUVScale.y`), else uv0 or uv1; height blend with `BlendTexture(uv2)` channels and `BlendSmoothness`; then `overlay(mix, TintTexture(uv2).rgb)`; `_modnorm` × `(1 + (Mod.w − 1)·Tint.a)` | opaque | :observed |
| `anim_flag` | `DiffuseATexture(uv0 + DiffuseUVOffset)` (the offset picks a flag in an atlas) | AlphaTest variants: `a` | :observed |
| `projection_lod` | `uv = lerp(UVOutMinMax.xy, UVOutMinMax.zw, uv0)` (atlas cell); `DiffuseA(uv) · lerp(palette(vc.g, IV.x), 1, 1 − d.a(1 − vc.r))`, `vc = BakedVCTexture(uv)` | AlphaTest variants: `d.a` | :observed |
| `glass` | `_Standard`: the constant `TintColor`; `_BCT*` (switch `BaseColorTexOnOff`): `BaseColour(uv0)`; `_M`: modulate as the plot family | transparency is not in `RT0` | :observed |
| `snow` | `BaseColor(uv0 · UVTiling)` | opaque | :observed |
| `emissiveonly`, `pylon_cables` | constant `Color` | opaque | :observed |
| `diff1` | `DiffuseA(uv0 · UVTilingA)` | opaque | :observed |
| `ocean`, `ocean_shoreline` | `RT0` holds water data, not colour: the global ocean renderer colours them | | :observed |
| `uber_water` | `RT0 = InScatterColourA`; the colour comes from its forward pass | | :observed |

The modulate uv of `environment_plot` is `WorldSpaceUV_Modulate ? world.xz · WorldSpaceUVTiling_Modulate : TEXCOORD2`, with
`ModulateUVTiling` or `ModulateUVTiling_PavementCorner`, selected by `TEXCOORD3.x ≥ 0.999` (float32); the luma weights are
(0.299, 0.587, 0.114) and the gamma 1/2.2 and 2.2 as float32. The road decals' `uvM` is
`TEXCOORD[ModulateUV] · ModulateUVTiling` (int `ModulateUV` 0, 1 or 2; any other value samples (0, 0)), and `DecalNormalA` is read
at `uv0 · RoadUVMultiplierA`. :observed

`uber_road` `_TB` (terrain blend, 12 materials) and glass `_M` were transcribed but not run on a material; the road world-uv
origin depends on camera constants. :unknown

### Glass transparency

`glass` is drawn by the forward `glassTrack` pass (17 Tokyo permutations, each with a G-buffer and a forward shader), which
writes two targets: target 0 the reflected radiance (the fresnel term between `F0` and 1 times the lit sky, with
`Cloudyness`) and its gloss, target 1 the transmittance the background is multiplied by, `1 − k·c` per channel, `c` the
colour of the G-buffer shader (`TintColor`, or `BaseColour.rgb` with `BaseColorTexOnOff`) and
`k = (0.4·Alpha + 0.5)·(0.98 − a view-dependent term)·(1 − Cloudyness)·(1 − fog)`. The `_ATT` permutations
(`AlphaTestTexOnOff`) drop the `Alpha` factor and `discard` where `BaseColour.a < 1e-4`: a cut-out, not a coverage. :observed

`Cloudyness` scales only `k`, so at 1 the transmittance is 1 and the reflected radiance of target 0 is the whole
contribution; in 61% of the triangles of the 119 Shibuya glass materials the transmission alone, `k` times the luminance of
`c`, is below 2%. :observed The two-target output has the form of dual-source blending, `dst = target0 + dst·target1`, as the
car glass group does ([Car materials](/engines/forzatech/shaders/car-materials/#glass-group)); the blend state is run time, so
that the reflection is added whatever the transmittance is inferred. :inferred

## Roughness, metalness and normal

`uvK` is `TEXCOORDK` (D3D v down).

| Family | Roughness | Metal | Normal | Evidence |
|---|---|---|---|---|
| `uber_foliage` `_BushVertDeformHiQDoubleSided(_Tint)` | `NormalTexture(uv0).a · RoughnessScale` | 0 | standard `NormalTexture(uv0)`, then `n = normalize(n + (up − n)·f)` with `f = sat(NormalFadeOffset + 1 − sat((d − FadedNormalEndDistance)/(FadedNormalStartDistance − FadedNormalEndDistance)))`, `d` the camera distance (Tokyo 4500/5000 m or 0/0, offset 0: `f = 0` nearer than 4,500 m); no `SV_IsFrontFace`, so back faces keep the front normal | [V] |
| `uber_foliage` `Tree` | same | 0 | canopy normal (all four channels `·2 − 1`, bounding-box normal `cb9[23..24]`): not traced | roughness [V] |
| `uber_branch` `_BranchHiQ_NormalAlpha_AO` | `DiffuseA(uv0 · DiffuseAUVTiling).a` | 0 | `NormalA(uv0 · NormalAUVTiling)`: `z` from the unscaled `x, y`, then `x, y ·= NormalAIntensity` | [V] |
| `environment` | `sat(RMA.x)`; modulate: `sat(r − 1 + 2·mA)`, `mA = sat((.5 + (tm.b − .5)k) + (Mod.b − .5)·_RoughnessStrength)`; deposits: `r + (DepositRoughness − r)·mask` | `RMA.y` | `NormHeightTex_A` (uv0 tangent) | [V] on two permutations |
| `environment_plot` | `r0 = sat(RMA.r)`; `_M`: `corner ? sat(r0 + 2mC − 1) : sat(r0 + 2mA − 1)`, `mA = sat((Mod(uvM·ModulateUVTiling).b − .5)·_RoughnessStrength + .5)`, `mC` likewise with the corner texture | `RMA.g` | `NormHeightTex_A(uvA · NormalHeight_A_UVTiling)` | [V]; RCSM parallax omitted (≤ 0.003 rough, 0.04 normal) |
| `uber_roaddecal`, `uber_roaddecalretro` | `D.a`; Modulate: `D.a(1 + (M.b − 1)k)`, `k = sat(DecalNormalA.a + 1 − HeightInfluence)·COLOR.r`; frost: `+ sat(4·sat((.5 − FrostHeightMin)/(FrostHeightMax − FrostHeightMin))·FrostAmount)(0.43 − r)` (FrostAmount 0 in Tokyo) | `Metalness` switch: `Mask_MetalnessATexture(uv).r` (sRGB-decoded), else 0 | standard `DecalNormalA(uv)` | [V]; POM parallax omitted |
| `uber_road` | `r_L = UberRoad{L}DiffuseTexture.a`, height-blended with the colour weights `r = r_L + (r − r_L)·w_L`; `ModulateNormal`: `r ·= 1 + (M.b − 1)·Tint.a` | 0 | per layer standard decode on the layer's tangent, `n = n_L + (n − n_L)·w_L` (not renormalised); `ModulateNormal`: `x,y = (2M.rg − 1)·ModulateNormalScale`, `z = sqrt(sat(1 − x² − y²))`, `n2 = normalize(Tm·x − cross(n, Tm)·w·y + n·z)`, `n = n + (n2 − n)·Tint.a` | [V]; `TerrainBlend` and winter `Snow` not traced |
| `anim_flag` | `RoughnessMetalnessATexture(uv0).r` (raw uv0) | `.g` | `normalize(nA + COLOR.r·COLOR.a·nAnim)`; `nAnim = NormalAnimTexture((uv2 + 1 − t)·NormalAnimUVTiling)`, `t` = time and wind scroll (run time) | [V] at `t = 0` |
| `projection_lod` | `_RM`: `RoughnessMetalnessATexture(uvA).r`; else the constant `Roughness` (0 in every Tokyo material) | `_RM`: `.g`; else 0 | vertex normal | [V] |
| `glass` | `RoughnessTexOnOff ? Roughness texture(uv0).r : Roughness`; Modulate: `sat(r − 1 + 2·sat((Mod(uv2·ModulateUVTiling).b − .5)·_RoughnessStrength + .5))` | 0 | `NormalTexOnOff ?` standard `Normal(uv0)` : vertex; then a per-instance tilt `lerp(n, normalize(n + r/2), GlassNormalOffsetStrength)` with `r = clamp(frac(hash(instance pos))·2 − 1, ±MaxPerturbAngle/90)` (0 in Tokyo) | [V]; drawn in the transparent bucket by the forward `glassTrack` pass with the same roughness and normal |
| `snow` | `RoughMetalAO(uv0·UVTiling).r` | 0 | the sample used raw (no `2v − 1`, no flip) | [V] |
| `emissiveonly`, `diff1`, `pylon_cables` | 1 | 0 | vertex normal; `pylon _LineInner`: constant game `(0, 0, −1)` | [V] |
| `terr_mega` `_Default` (far field) | `sat(TerrainGlossTexture(uvB).r / 0.93)` | 0 | world space, not a normal map: `x = 2A.r − 1`, `z = 2A.g − 1`, `y = sqrt(sat(1 − x² − z²))` (game Y up), `A = TerrainColourTexture(uvB)` | [V]: 300 points, 0 error |
| `window_linecastroom` | see [Environment](/engines/forzatech/shaders/environment/) | `Metalness` | | window trace |

All rows :observed; the evidence column gives the check. The standard normal decode is the one on
[Swatch textures](/engines/forzatech/textures/pb-swatch/).

Several families normalise `B` and some do not, which does not matter for orthonormal frames. The `uber_road` layers with
`UVSet < 0` use the constant game +X with w = +1. :observed

### Terrain far field in the near range

The `terr_mega` row is the far field: no clipmap ring contains the pixel, the camera is far enough that the normal's fade to
the vertex normal has ended (`sat((1 − d/cb7[34].y)·cb7[34].x)`, run-time clipmap constants), there is no twinkle (the sand
and snow sparkle normal from `TwinkleTexture`, within 40 m of the camera), and the puddle path is off. The puddle path runs
where `TerrainGlossTexture.b` and `.a` exceed 0.01 and a luminance mask of `TerrainNormalTexture.a` is non-zero, and its
roughness and normal then depend on the run-time wetness globals `cb2[91].y` and `cb2[140].y` even in dry weather
(interpreter: 78 of 100 such points change with random values of them). :observed The rural road families `uber_megaroad` and
`uber_megaroad_edge` have no traced roughness or normal. :unknown

## Foliage, branch and facade-LOD permutations

A dependency census of every `GBufferLightScenario` pixel shader of three families in the Tokyo track's `bin.zip`
(`uber_foliage` 27 permutations, `uber_branch` 7, `projection_lod` 24; each render-target channel followed back to its
texture reads and parameter rows through the `CBMP` and `TXMP` maps), with the texture formats the Shibuya Scramble box's
materials bind (18, 6 and 59 materials; 13,674, 8,213 and 10,002 triangles). :observed

**`uber_foliage`**

- `RT1.w` is `NormalTexture.a · RoughnessScale` in the 11 HiQ, static and punch-through permutations of tree, bush and grass
  and in the ray-tracing hit shader; `RTAOTexture.b` joins it in `Grass3DNoFlattenVCO`. The 7 very-low-quality (`VL`) and
  billboard permutations write no `RT1.w` and no normal (`RT2`), and the 7 impostor permutations read `MaskTexture`,
  `NormalTexture.a` and `RTAOTexture` for both. :observed
- `RT0.xyz` is `DiffuseTexture.rgb` times a factor of `RTAOTexture.b`, `MediumDOPower`, `MediumDOIntensity` and three
  scene constants (`cb2[43].x`, `cb2[44].x`, `cb2[159].x`); the `_Tint` permutations add `LUTTex` and `RTAOTexture.g`, and
  the static, punch-through and world-tint ones `RTAOTexture.r`. :observed
- The bush and grass permutations take the normal from `NormalTexture.r` and `.g` only; the tree permutations read all four
  channels (the canopy normal). :observed
- Every map is sampled at `TEXCOORD0` with no tiling parameter; the alpha discard compares
  `sat((DiffuseTexture.a − AlphaStepMin)/(AlphaStepMax − AlphaStepMin))` with `cb2[128].x`, a constant of the draw. :observed
- Formats bound in the box: `DiffuseTexture` BC7 sRGB; `NormalTexture` BC7 linear (BC5 unorm on 2 triangles, which has no
  alpha); `RTAOTexture` BC7 linear; `LUTTex` BC1 sRGB (10,444) or BC7 linear (3,230); `WorldTintMap` BC1 linear or BC7 sRGB;
  `MaskTexture` RGBA8 sRGB; `NoiseTexture` BC4 unorm. :observed
- The impostor permutations (`Impostor` on; `FramesXY_Colour` 4, `FramesXY_Depth` 6) draw a tree from an atlas of views, chosen by the object-space camera direction a per-draw constant holds. `DiffuseTexture` is 4 × 4 colour frames (256² each in a 1,024² texture), `MaskTexture` 6 × 6 depth frames (BC4 snorm), `NormalTexture` an object-space normal (the texture's name ends `objnorm`) and `RTAOTexture` the occlusion, in the same frame layout as the colour. The pixel shader encodes the direction hemi-octahedrally, `dir = (x, (1 − |x| − |z|)^p, z)` with `x = (u + v)/2`, `z = (v − u)/2` and `p` = `HemiOctahedronRemapYPower`, takes the colour frames at `u`, `v` in {−1, −⅓, ⅓, 1}, blends the four nearest frames, ray-marches the depth frames, and discards when a saturated coverage of the blended alpha is below `cb2[128].x`. :observed Of the 16 colour frames, the 12 with |u| or |v| = 1 have `dir.y` = 0: horizon views, and the 4 inner ones look down. :inferred

**`uber_branch`**

- `RT0.xyz` is `DiffuseA.rgb` (read at `uv0 · DiffuseAUVTiling`) times a factor of `NormalA.a`, the vertex colour's alpha,
  `MediumDOPower`, `MediumDOIntensity` and the same scene constants (the `NormalAlpha_AO` permutations: `NormalA.a` is the
  occlusion). `RT1.w` is `DiffuseA.a`; `NormalA.a` enters only the wetness terms. `RT2` is `NormalA.r` and `.g` read at
  `uv0 · NormalAUVTiling`. :observed
- The only `discard` compares a value that is not a texture channel with `cb2[128].x`: the surface is opaque. :observed
- The `_MS` (mega-skirt) permutations read the terrain's textures (`DeferredTerrainRoot_MegaSkirtTwinkleTexture` and a texture at a fixed
  register, class 0 space 4 t0) for a height-gated blend; the box's six materials all select them. :observed
- Formats bound in the box: `DiffuseA` and `FuzzBaseColor` BC7 sRGB; `NormalA`, `MicroNormal` and `FuzzNormal` BC7 linear;
  `NormalB` BC5 unorm; `TintTexture` and `FuzzMask` RGBA8 sRGB. :observed

**`projection_lod`**

- Every map (`DiffuseATexture`, `RoughnessMetalnessATexture`, `NormalATexture`, `EmissiveTexture`, `BakedVCTexture`) is read
  at `UVOutMinMax.xy + (UVOutMinMax.zw − UVOutMinMax.xy) · TEXCOORD0`, the atlas cell of the building. :observed
- `RT0.xyz` is `DiffuseATexture.rgb · ((1 − a(1 − v))(1 − s) + s)` with `a = DiffuseATexture.a`, `v = BakedVCTexture.r` and
  `s = SwatchTintTexture.r` (read at row `BakedVCTexture.g` and the instance variation), through the wetness terms; the
  alpha is not the surface's opacity. :observed
- 18 of the 24 permutations (every `_RM` one) write `RT0.w = RoughnessMetalnessATexture.g` and
  `RT1.w = RoughnessMetalnessATexture.r` before wetness; the other 6 use the constant `Roughness` and no metalness. The 6
  `HiQ` permutations read `NormalATexture.r` and `.g`, the others the vertex normal. The `AlphaTest` permutations discard
  when `DiffuseATexture.a` is below `cb2[128].x`. :observed
- Over the 142 distinct BC5 SNORM `RoughnessMetalnessATexture` maps the whole box binds, 5,707 of 112,664,608 channels (0.0051%) in level 0 are
  below −0.06 (the 36 maps of every twentieth prototype: 19 of 34,701,312): the stored values are the positive half of the signed range. :observed
- Formats bound in the box: `DiffuseATexture` BC1 sRGB; `RoughnessMetalnessATexture` BC5 SNORM linear (9,650 triangles) or
  BC7 sRGB (352); `NormalATexture` BC5 unorm linear; `BakedVCTexture` BC5 unorm linear (9,842) or RGBA8 sRGB (160);
  `EmissiveTexture` BC1 linear (9,400), BC1 sRGB (12) or BC7 sRGB (518); `SwatchTintTexture` and `LightmapTexture` RGBA8 sRGB. :observed

## Ground permutations: plots, terrain and roads

A dependency census of every `GBufferLightScenario` pixel shader of four families in the Tokyo track's `bin.zip`
(`environment_plot` 19 permutations, `terr_mega` 65, `terr_distant` 2, `uber_road` 50; each render-target channel followed
back to its texture reads and parameter rows through the `CBMP` and `TXMP` maps), with the texture formats the Shibuya
Scramble box's materials bind (all of the box: 91,811, 14,462, 10,481 and 66,426 triangles). :observed

In `environment_plot` a material's texture index dwords start 4 dwords before the end of its 384 bytes of constants: with that
base every texture read is sampled with the tiling parameter of its own role, which the end of the constants as base does not
give. In the other three the base is the end of the constants (64, 48 and 288 bytes). :observed

**`environment_plot`** is the `environment` family's one-texture-set material on a terrain plot.

- It reads `DiffAlphaTex_A`, `NormHeightTex_A` and `RoughMetAoPorTex_A` with `environment`'s tiling parameters and offset
  (`BaseColorAlpha_A_UVTiling`, `NormalHeight_A_UVTiling`, `RoughMetAoPoros_A_UVTiling`, `Uv0Offset`), and `RT0.w` is
  `RoughMetAoPorTex_A.g` in all 19 permutations. :observed
- `TerrainGlossTexture` (sampled at `BlendMapOffset + BlendMapScale · world xz`) and `NormHeightTex_A.a` against
  `BlendHeightMapRange` make the mask of the snow term, which mixes the albedo, the roughness (`RoughMetAoPorTex_A.r`
  when dry) and the normal; `AoWetBlendContextTex.r` (`TEXCOORD1` at `MacroAOWetBlendMaskTiling`) enters the occlusion
  factor with `RoughMetAoPorTex_A.b`. :observed
- The `_M` permutations add `ModulateTexture` and `ModulateTexture_PavementCorner` (`TEXCOORD2` at `ModulateUVTiling`): red
  moves the brightness, green the saturation and blue the roughness around one half, scaled by `_BrightnessStrength`,
  `_SaturationStrength` and `_RoughnessStrength`. The `_B` permutations blend a second set (`DiffAlphaTex_B`,
  `NormHeightTex_B`, `RoughMetAoPorTex_B`) by `BlendHeightMapBRange`, and the `_W` ones add `Snow_WetMax`. :observed
- The alpha test discards `DiffAlphaTex_A.a` below `cb2[128].x`. :observed
- Formats bound in the box: `DiffAlphaTex_A` BC1 or BC7 sRGB; `NormHeightTex_A` BC7 linear; `RoughMetAoPorTex_A` BC7
  linear; `TerrainGlossTexture` BC7 linear; `AoWetBlendContextTex` BC7 linear. :observed

**`terr_mega` and `terr_distant`**

- Every texture is sampled at `BlendMapOffset + BlendMapScale · (x, z)`, the surface point's position in the ground plane;
  `terr_mega`'s `Alpha` permutations take it from `TEXCOORD1` and `TEXCOORD4` instead. No other mesh coordinate is
  read. :observed
- `TerrainNormalTexture.rgb` (BC7 sRGB: a colour) times `TerrainColourTexture.a` squared is the albedo before the gamma
  1/2.2 and snow terms; `TerrainColourTexture.rg` are decoded as `x = 2 r − 1` and `z = 2 g − 1`, lerped with the vertex
  normal's `x` and `z` by a distance term, and `y = sqrt(sat(1 − x² − z²))` completes the vector, which makes them a
  world-space normal's horizontal components :inferred; `TerrainGlossTexture.r · 1.0752689` (`r / 0.93`) is the dry roughness; `RT0.w` is not
  written. The dependency sets of these channels are the same in `terr_mega`'s `Default`, `Distant`, `Winter`, `Alpha_NR` and
  `Noise` permutations and in `terr_distant`'s `Default`. :observed
- Formats bound in the box: `TerrainColourTexture` and `TerrainGlossTexture` BC7 linear; `TerrainNormalTexture` BC7 sRGB. :observed

**`uber_road`**

- A layer `L` of `A` to `D` is `UberRoadLDiffuseTexture` (colour in RGB, roughness in A) and `UberRoadLNormalTexture`
  (`x = 2 r − 1`, `z = 2 g − 1`, occlusion in B, a height in A). Both are sampled at `TEXCOORD0` or `TEXCOORD1`
  times `UberRoadLUVTiling` when `UberRoadLUVSet` is 0 or 1, and at the surface point's position in the ground plane times
  `UberRoadLWorldUVScale` when it is −1. :observed
- The layers combine from the last: `lerp(D, lerp(C, lerp(B, A, s1), s2), s3)` of the albedo, the roughness, the occlusion
  and the decoded normals, with `s1 = smoothstep(sat((s + (1 − hB) − w0 (1 + s)) / s))` for `s = BlendSmoothness`, `hB`
  the layer's normal alpha and `w0` the channel `BlendShuffle[0]` of `BlendTexture` (`TEXCOORD2`); `s2` and `s3` are the same
  with `hC`, `w1` and `hD`, `w2`. :observed
- `TintTexture` (`TEXCOORD2`) is blended over the albedo as an overlay before the snow and frost mixes
  (`UberRoadLFrost`, `UberRoadLSnow`, `FrostAmount`); `RT0.w` is not written. :observed
- The permutations are named by the layer count (`blend1` to `blend4`), `M` and `modnorm` (modulate maps), `TB` (terrain
  blend), `winter` and `S` (frost and snow). In the box `Blend2` is on for 9,157 triangles and `Blend3` for 582, `Blend4` for none;
  `UberRoadAUVSet` is −1 for 22,433 triangles, `UberRoadBUVSet` for 9,095 and `UberRoadCUVSet` for 235, and 0 for the rest. :observed
- Formats bound in the box: the diffuse maps BC7 sRGB; the normal maps BC7 linear; `BlendTexture` BC7 linear (23,021) or
  RGBA8 sRGB (43,405); `TintTexture` BC7 linear. :observed

## Emissive

The emissive term seeds `RT1.xyz`: `g(d) = d ≥ 1 ? 1/(d + 1e-5)² : (d + 1e-5)²`, `d` the distance to the camera.
`emissiveonly`: `Color.rgb · EmissiveMultiplier · g(d)` (Tokyo: 0). `projection_lod _E`: `EmissiveTexture(uvA).rgb ·
EmissiveTextureScale · sat((INSTANCE_VARIATION.y − EmissiveVariationMin)/(EmissiveVariationMax − EmissiveVariationMin)) · g(d)`
(152 of 186 Tokyo materials bind the black `ubershader_default_emissive`). `pylon_cables`: `Lightmap(uv1).rgb · Color.rgb ·
0.96 · g(d)` when `LightmapActive` (false in Tokyo). `uberlod _Default`: `EmissiveTexture(uv0).rgb · EmissiveScale · g(d)`
(see [Heightfield far view](#heightfield-far-view-uberlod)). :observed Whether a later pass multiplies
`g(d)` back is not determinable statically (`FPlusPlus_CombineSeperateDiffuseSpec_Final_Tile0` and the deferred composite
`FPlusPlus_Composite_NoDepthWrite_DirectLight_DXR_PixelClassify0` do not; no other pass was read), and the source of
`INSTANCE_VARIATION.y` for hand-placed instances is not traced. :unknown The `environment` family's `_Emissive`
permutations are on [Environment](/engines/forzatech/shaders/environment/#what-each-g-buffer-channel-depends-on).

In the Shibuya box, 174 of the 1,366 placed prototypes hold an emissive material (306,233 triangles), and 87 of them
(213,088 triangles) hold one whose emission depends on `INSTANCE_VARIATION.y`: 795 `projection_lod`, 2 `environment` and
1 `environment_signage` materials. Those 87 are placed 106 times. The 22 rule placements all store the byte 255, so the
factor is 1. The 84 hand placements have no such byte (see [the tint's inputs](/engines/forzatech/shaders/environment/#the-tints-inputs-over-the-shibuya-box)).
Their tint's second float is 0 in 79 of them, 0.098 in one, 0.246 in one, and 0.648, 0.922 or 1 in the other three.
The ramps (`EmissiveVariationMin`, `Max`) of the materials concerned are (0.2, 0.4) in 508, (0, 0.2) in 122, (0.6, 0.8) in 76 and
(0.7, 0.9) in 62. :observed[the prototypes and placements of the box] If that float were `y`, 80 of the 84 hand-placed
buildings would emit nothing. Nothing establishes whether it is `y` or a field left at zero. :unknown The preset scales that turn the authored values into
lighting units are on [Time-of-day presets and light units](/engines/forzatech/lighting/time-of-day/).

The authored magnitudes in the prototypes of the Shibuya box (every prototype placed there, counted by material and triangle) are
small: `GIEmissiveScale` is 1 in all 9,467 `environment`, 286 `environment_plot` and 188 `environment_signage` materials;
`EmissiveTint` is at most 1 per channel (white in all but about 35 of those materials, whose channels run from 0.002 to 0.982);
`EmissiveTextureScale` of `projection_lod` is 1 in 1,166 of its 1,178 materials and between 0.16 and 1.4 in the other 12; the `emissiveonly`
materials (12) have `EmissiveMultiplier` 0 and a black `Color`; the `anim_ledflipbookpanel` materials (8) have `Brightness` 1 or 10;
`Emissive` is 1 in 227 `environment` (18,966 triangles), 90 `environment_signage` (2,462), 912 `projection_lod` (218,071), all 10
`uberlod` and 1,337 `window_linecastroom` materials (25,167 triangles), whose `EmissiveVariationMin` and `Max` are fractions between
0 and 1 (most often 0.2 to 0.4, 0.6 to 0.8 or 0.7 to 0.9). :observed[a census of the box's prototype materials]

## Heightfield far view (`uberlod`)

The track's `uberlod` shader file (the family of the `autouberlod_*` clusters of the far heightfield) holds two G-buffer
permutations, `_Default` and `_Rock_NM`. Both were dumped and their render-target channels followed. :observed

- `_Default` reads `DiffuseATexture`, `RoughnessMetalnessATexture` and `EmissiveTexture`, every one at `TEXCOORD0` as it is, and
  no normal map; `_Rock_NM` reads `DiffuseATexture` and `NormalATexture` at `TEXCOORD0`, takes roughness and metalness from
  the parameters `Roughness` and `Metalness`, and reads no emission texture. The parameter switches `RoughnessMetal`,
  `Emissive`, `NormalMap` and `Modulate` are not rows of the constant buffer. :observed
- `_Default`: `RT0.w` is `RoughnessMetalnessATexture.g` (the metalness) and `RT1.w` is `RoughnessMetalnessATexture.r` raised
  to a power that depends on the vertex normal's `y` and a scene constant (the roughness). `RT0.xyz` is the diffuse colour
  moved away from or toward its luma (weights 0.3, 0.59, 0.11) by a factor of the normal's `y` and two scene constants,
  times a scene constant. No texture alpha is read, so nothing is alpha tested. :observed
- The emission of `_Default` adds `g(d) · EmissiveScale · EmissiveTexture.rgb` to `RT1.xyz`, `g(d)` the distance encoding
  of [Emissive](#emissive). It has no instance variation, no tint, no `GIEmissiveScale`, no lightmap. :observed
- The Shibuya box holds 10 `uberlod` materials (8,568 triangles) of one signature: `RoughnessMetal`, `Emissive` on,
  `NormalMap`, `Modulate` off, `EmissiveScale` 1, `Roughness` 0.8, `Metalness` 0, `LightSwitchOnStart` 0.01, `LightSwitchOnEnd`
  0.02 (the last two are read by neither permutation). `DiffuseATexture`, `EmissiveTexture` and `RoughnessMetalnessATexture` are BC1 sRGB, `NormalATexture`
  BC5 linear. The switches match `_Default`, not `_Rock_NM`. :inferred[the switch names; which permutation a material takes is not read from the shader bin]

## Road decals

Over the 30 G-buffer permutations of `uber_roaddecal` (`decal`, `winter`, `metal`, `T`, `AM`, `Modulate`, `POM` in their
combinations) and the 5 of `uber_roaddecalretro` (`decal`, `HA`, `M`, `T`, `T_M`) of the Tokyo track, each render-target channel
was followed back to its texture reads and parameter rows. :observed

- Only the `AM` permutations of `uber_roaddecal` and every `uber_roaddecalretro` permutation test a mask per pixel. The other
  `uber_roaddecal` permutations (`_decal`, `_T`, `_metal_T`, ...) have two `discard`s, both on `1 − cb2[128].x < 0`, which holds
  for the whole draw or for none of it; they write every pixel of a draw otherwise, the diffuse alpha is the roughness and
  no opacity is derived. :observed[all 35 permutations hold two `discard`s; the mask test is the first one in the permutations named, and the 4 non-`AM` ones without `winter` have no noise code at all]
- The `discard` is a dithered coverage test. With `s` the test value (`mask · (AlphaFadeOnOff ? COLOR.g : 1)`, or the `HA` form;
  the retro permutations also multiply by a camera-distance smoothstep of scene constants) and the scene's dither on, the pixel
  is kept where `s·sat(5(s − 0.2)) − 1 + n ≥ 0`, with `n = frac(52.98·frac(0.0671·x + 0.00584·y))` (interleaved gradient noise of the
  pixel coordinates; when a second scene flag is set both coordinates are first shifted by `(frame & 63)·5.588`). The test value
  is then 0.5 or −0.5 and is compared with the per-draw reference `cb2[128].x`. With the dither off the pixel is kept where `s`
  reaches that reference. `s·sat(5(s − 0.2))` equals `s` from 0.4 up, so a hard 0/1 mask is exact either way, and a plain test at one
  half is the median of the dither. :observed[the discard code of the `_decal_AM` permutation read; the constants are those of the compiled code]
- Dry albedo goes toward `FadeColor` by a smoothstep between `FadeStart` and `FadeEnd` of the screen-space derivative of `uv0.x`
  (a far fade); wetness (`WetScale`, `Porosity`, `HeightPuddlingOnOff`) acts on run-time rain state, so the other formulas on this
  page are the dry surface. `Snow` and `Frost` change nothing while `SnowAmount` and `FrostAmount` are 0, as in every material of the
  Shibuya box. :observed
- The retro permutations' `RT1.xyz` carries a retro-reflective term from `RetroReflectivity`, `RetroReflectivityFalloff` and
  `Hardness`; the retro permutations write metalness 0, as do the `uber_roaddecal` ones without `metal`. :observed
- `Enabled` is a `CBMP` entry of `uber_roaddecal` (byte 228), but no render-target channel and no `discard` of any of the 35
  permutations depends on it. It is 0 on 1,161 of the 20,743 road-decal triangles of the Shibuya box (the parameter is stored
  as a switch). Whether the draw path honours it before the shader runs is not established. :observed[the dependencies of all 35
  permutations' outputs and discards; the materials of one Shibuya area]
- In every material of the Shibuya box `RoadUVMultiplierA` is (1, 1), so the diffuse, normal and mask reads coincide with the mask's
  raw `uv0`. :observed[the materials of one Shibuya area]

## Mesh decals

The mesh permutations `_Standard_DR`, `_DR_NAO` and `_DR_ST` of `environmentdeferreddecal` sit in draw bucket `0x1C`
(transparent, no opaque bit; all 917 Shibuya groups) and carry the `AlphaBlended` technique tag, so they are drawn by the
deferred-decal pass (`environmentdeferreddecalDeferredDecalsLightScenario`), not the alpha-tested G-buffer scenario (which also
exists, with `discard a < cb2[128].x`). :observed

```
uv  = uv0 + Uv0Offset;  c = DiffAlphaTex(uv · DiffAlphaUVTiling)         (_ST: c.rgb swatch-tinted as environment)
a   = c.a · DiffRoughIntensity (r4.w) · (VertexAlphaOnOff ? COLOR.a : 1)
NAO: aN = c.a · NormalAOIntensity (r5.x) · (VertexAlphaOnOff ? COLOR.a : 1);   discard max(a, aN) < 0.01 (else a < 0.01)
SV_Target0 = (c.rgb, a)
SV_Target1 = NAO ? (normalize(T·x − B^·y + N·z) of NormalTex(uv · NormalUVTiling), aN) : 0
SV_Target2 = (1 − RoughMetAOTex(uv · RMAOUVTiling).r, NAO ? 1 − max(cb2[43].x, RMAO.b) : 0, 0.5, NAO ? max(a, aN) : a)
```

The ten pixel shaders of the family are these two mesh groups (`_DR`, `_DR_NAO` and `_ST`; the `RCSM` ones add a cone-step march of
`ConeMapTexture` for `uv`) and the two projected ones. The permutations with the `DiffRough` switch off are different: `_Standard`
discards every pixel and writes zero to all three targets, and `_Standard_NAO` writes zero to targets 0 and 2 and only the normal
and its weight to target 1. :observed[the dumped bodies of all ten permutations] Every material of the Shibuya box has `DiffRough` on
and `Projected` off (the draws are the `_DR` ones); `NormalAOIntensity` is 0 in 1,056 of its 38,263 triangles, where the
normal's weight is 0 and the occlusion's weight is `a`. :observed[the materials of one Shibuya area]

The blend state and the resolve of the decal buffer into the G-buffer are in no shipped file. :unknown

:::open[What does the decal buffer resolve do?]
The depth, raster and blend state (names such as `DecalGreaterEqual` and `ZBiasDecalOpaque` appear in the executable) and the
decal resolve are in encrypted settings or code, so how decals composite is not traced.
:::

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

## Emissive

The emissive term seeds `RT1.xyz`: `g(d) = d ≥ 1 ? 1/(d + 1e-5)² : (d + 1e-5)²`, `d` the distance to the camera.
`emissiveonly`: `Color.rgb · EmissiveMultiplier · g(d)` (Tokyo: 0). `projection_lod _E`: `EmissiveTexture(uvA).rgb ·
EmissiveTextureScale · sat((INSTANCE_VARIATION.y − EmissiveVariationMin)/(EmissiveVariationMax − EmissiveVariationMin)) · g(d)`
(152 of 186 Tokyo materials bind the black `ubershader_default_emissive`). `pylon_cables`: `Lightmap(uv1).rgb · Color.rgb ·
0.96 · g(d)` when `LightmapActive` (false in Tokyo). Every other family writes 0. :observed Whether a later pass multiplies
`g(d)` back (a precision encoding) is not determinable statically, and the source of `INSTANCE_VARIATION.y` for hand-placed
instances is not traced. :unknown

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

The blend state and the resolve of the decal buffer into the G-buffer are in no shipped file. :unknown

:::open[What does the decal buffer resolve do?]
The depth, raster and blend state (names such as `DecalGreaterEqual` and `ZBiasDecalOpaque` appear in the executable) and the
decal resolve are in encrypted settings or code, so how decals composite is not traced.
:::

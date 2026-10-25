---
title: Water
description: How Forza Horizon 6 colours rivers, lakes, rice paddies and the sea (uber_water, ocean, ocean_shoreline, ocean_vista), the colour model, the season presets and what is not traced.
---

Water is recognised by **shader family only**: `uber_water` (bin.zip `_0x2F`), `ocean` (`_0x2E`), `ocean_shoreline` (`_0x2C`) and
`ocean_vista` (`_0x2D`). Names do not help (`Material__855` is a river; Tokyo's `Ocean_2-6103ab46` is `ocean_shoreline` while
`Ocean_2-0ce7d6f3` is `ocean`). The water surfaces are faces of the [terrain clusters](/engines/forzatech/terrain/heightfield-clusters/);
none of them has a colour texture. :observed

Counts come from a recorded census of the Tokyo track `Brio` and its coast and rice-paddy test boxes; the install is no longer
available. :observed

## Who draws the colour

`uber_water` (rivers, lakes, ponds, rice paddies, waterfalls) colours itself in its forward pass (`uber_waterTrackLightScenario`,
entry `SimpleWaterLightScenarioMainPS`); its G-buffer `RT0` is just `InScatterColourA`. The `ocean` and `ocean_shoreline` material
shaders are generic (no textures, one dummy float; their `RT0` is a visualisation of the vertex data). The sea is coloured by the
global ocean renderer in `media\ShadersDXIL.zip` (`Ocean*.vshader/.pshader`, `OceanShoreline*.pshader`, `OceanDistant.pshader`,
...), which reads the same vertex streams and the `OceanConst` constant buffer: one `SeasonSettings` preset of `media\Water.zip`
`OceanSettings.xml`. :observed That the cbuffer is that preset is a strong inference (same streams and dequantisation rows, the
512-byte cbuffer matches the XML); which pixel shader runs per family, distance and quality is not traceable statically.
:inferred

## Season preset

The preset is chosen by `Tracks\Brio\triggerzones\tz_oceanparams\tz_oceanparams.tz`: one box zone per preset, the `params` tag is
the preset name, and `FORZA_SeasonExclusion` is the seasons it does **not** apply to (bits as for placements): Forte_Spring 14,
Forte_Summer 13, Forte_Autumn 11, Forte_Winter 7. All four zones are the same box (centre (0, 2500, 0), size
11,500 × 2,500 × 11,500; whether `size` is a full or half extent is not traced), so the season alone selects the preset. :observed
Brio summer ocean: Extinction (1, 0, 0), ScatterMagnitude 0.1, FrontScatter (0.01, 0.02, 0.03), UnderwaterPorosity 0.6. :observed

## Colour model

With `L_view` and `L_vert` the path lengths through the water along the view ray and vertically, per channel (transcribed from
the compiled shaders):

```
T  = exp(−Kext · (L_vert + L_view))           Ts = exp(−sigma · L_view)
C  = (1 − F0) · [ T·Ts·(1 − foam)·R  +  (1 − Ts·(1 − foam))·lerp(S, FoamColour, foam)·(E_amb + E_sun·NdotL/π) ]
     + F(F0, gloss, N·V)·reflection + sun specular            then fog, volumetric fog, exposure
R  = refracted scene colour (the opaque bottom, already lit) [· P] + caustics
```

| | `uber_water` (per material and season) | `ocean`, `ocean_shoreline` (global, per season) |
|---|---|---|
| Kext | `ExctinctionScaleA · ExtinctionA.rgb` (constant r21.z, r6) | `Optics.Extinction` RGB (`OceanConst` 6.xyz) |
| sigma | `ScatteringA` (r21.x) | `Optics.ScatterMagnitude` (5.w) |
| S | `InScatterColourA` (r5) | `lerp(FrontScatter, BackScatter, b)`, b from sun and view angles (9.w to 11.x) |
| P | none | `OceanConst[8].w` multiplies the refracted colour; named `UnderwaterPorosity` by XML field order |
| F0 | literals 0.98 / 0.02 | `Optics.F0` (4.x), 0.02 in every Forte preset |
| L_view | `max(sceneZ − waterZ, 0) · EdgeMask(TEXCOORD1).x` (depth-buffer thickness) | `lerp(Dv / abs(V.y), dz, w)` |
| L_vert | `L_view · abs(V.y)` | `lerp(Dv, dz · abs(V.y), w)`, `w = sat(OpticalSmoothDepthScale · dz · abs(V.y))` when `uv2.y = 1` |

Every row is :observed except the ocean's sigma and P columns, which are :inferred (strong). For the summer rice paddy: Kext
(2.057, 1.204, 1.204), sigma 0.025, S (0.0203, 0.0307, 0.0262). :observed

`Dv` is the ocean vertex shader's depth (`DepthModify`, `OceanNoTesselation.vshader`): `D0 = max(uv0.x, 0)`,
`minDepth = MinDepth · (1 − smoothstep(HeightToStartMinDepth, HeightToEndMinDepth, h))` (global settings 0.5, 100.25, 100.75),
`Dv = D0 + max(minDepth − D0, 0) · uv2.y`; the vertex is raised by the same amount. `h` is `OceanConst[18].x` (BaseOceanHeight) when
`OceanConst[18].z ≠ 0`, else the vertex height; `[18].z` is set by code, not the XML. :observed The ocean vertex data is verified
on exports: `uv0.x = 100 − terrain height` under the vertex (correlation 1.000, mean error 0.000 m, coast and Tokyo) and
`uv2.y = 1` (river blend) everywhere sampled. `EdgeDistanceFade` `uber_water` variants multiply the edge mask by
`1 − sat((camDist − StartFade) / (EndFade − StartFade))`. :observed The ocean's `uv0.x` matches the exact terrain depth under visible
sea-level water to 0.035 m (coast, p95) and 0.005 m (Tokyo). :observed

For a viewer looking straight down (`abs(V.y) = 1`, so `L_vert = L_view = L`) the diffuse part reduces to
`A = (1 − F0)·(T·Ts·P·A_bottom + (1 − Ts)·S)`, with `T = exp(−2·Kext·L)`; `L = d·E` for `uber_water` (`d` the water height minus the
top of the static surface below, `E` the edge mask) and `L = Dv` for the ocean; `ocean_vista` has no refraction:
`A = (1 − F0)·FrontScatter`. `A_bottom` is the cell's [far-field ground colour](/engines/forzatech/terrain/far-field-colour/) at the
same world X/Z. :observed The surface is dielectric with index 1.33 (F0 0.02) and the shader's base gloss 0.95 (`uber_water`) or
`Optics.DirectGlossiness` (ocean). :observed

## What is not traced

Sun and sky lighting of the in-scatter, the ocean's backscatter colour, reflections and screen-space reflections, foam, caustics
(`cb2[171].w` global), shoreline waves, refraction distortion, the far `SimpleUnderwater` blend (beyond 500 m from the camera),
the `B` parameter set of `River_Blend` and `Ocean_Blend` variants, `MinTransparency` (`Transparent` variants) and the optional
transmittance remap `sat((Ts − cb2[171].y)/(1 − cb2[171].y))` (a run-time switch). The specular roughness is
`(1 − gloss · weather)^p` with `p = LS[107].y` and a floor from the light scenario, both run time. :unknown

The `EdgeMask` sampler is the material's `SamplerStates1Sampler_WaterFoam_WaterRiver` (s12), whose type-7 value (u32 `1, 3, 2, 0`)
is not decoded; it also samples the world-tiled foam textures, which only work with a wrapping sampler, so the sampler is probably
wrap. :inferred That matters at the paddies: their interior vertices have `UV1 = (0, 0)` exactly, where a wrapping bilinear sampler
averages the mask's white top row and black bottom row (`E = 0.5`); a clamping sampler would give `E = 1`, twice the path length.
:observed

## Checks against the formula

The depth model above was evaluated over every water texel centre (summer, terrain-only exports; visible texels only) and compared
with a reference using the exact depth at the texel; the largest channel difference in 8-bit sRGB at p95 / p99: paddies
`PLN_Lake_RicePaddy` (54,551 texels, d 0.10 m, E 0.50) 0 / 0; coast `Ocean` (54,635 texels, L 8.7 m) 1 / 3; `Ocean_2` (26,966,
L 4.5 m) 3 / 8; `Ocean` as `ocean_shoreline` (10,481, L 0.4 m) 3 / 7; Tokyo harbour `Ocean_2` (33,577, L 9.9 m) 0 / 2 and
`Ocean_2_2` (11,852, L 8.1 m) 0 / 5. :observed No game frame was compared; the game was never run. :observed

:::open[What register holds UnderwaterPorosity and which ocean pixel shader runs per family?]
The register is inferred from the XML field order, and the choice of ocean pixel shader per family, distance and quality cannot be
traced statically.
:::

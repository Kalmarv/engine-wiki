---
title: Shader containers (.shaderbin)
description: How Forza Horizon 6 packs shader families, their parameter names, variant tables, register maps and compiled DXIL permutations, and how a material picks its permutation.
---

Each shader **family** (`environment`, `uber_road`, `terr_mega`, `glass`, `uber_water`, ...) is a `.shaderbin`, a
[Grub bundle](/engines/forzatech/data-model/grub-bundle/), plus one compiled **DXIL** container per permutation and
light scenario. World families are in `<track>\bin.zip` → `shaders\_0xNN\<family>.shaderbin`; the car families are in
`media\Cars\_library\shaders\<family>.zip`; the engine's compute and post shaders are in `media\ShadersDXIL.zip`. :observed
A permutation file is named like `_Standard…_ST…\environmentGBufferLightScenario_I.pcdxil.pso`; the `.pso` files are plain
shader containers that carry no depth, raster or blend state. :observed Disassembling them works with a current DXC
(`dxc -dumpbin`); the 2020 SDK build crashes on them. :observed

Counts here come from a recorded census of the Tokyo track `Brio`, no longer re-checkable. :observed

## Blobs

| Blob | Holds | Confidence |
|---|---|---|
| `PARM` | every material parameter the family declares, with its hash | :observed |
| `DFPR` | the family's default parameter values (the end of every material chain) | :observed |
| `VARS` | the uber-shader name, the switch names with hashes and one record per compiled variant | :observed |
| `CBMP` | parameter hash → byte offset in the material constant buffer | :observed |
| `TXMP` | parameter hash → texture slot | :observed |
| `SPMP` | parameter hash → sampler register | :observed |
| `CBEX` | the material constant buffer size | :observed |

`PARM`, written as the tag bytes `MRAP`, is `u32 count` then `count × { u32, varint name length, name, u32 hash, u8 n, n bytes }`;
`n` is usually 0. Walking records this way ends exactly at the blob's end (`environment`: 328 records, 15,003 bytes); a
parser that assumes `n = 0` stops halfway. :observed

`CBMP`, `TXMP` and `SPMP` (version 3.1) are `u16 count; count × { u32 parameter hash; u16 value; u8 guid[16] }`, 22 bytes each,
so the blob size is `2 + 22 n` (checked on `car_standard`). :observed

## Choosing a permutation

The `VARS` blob (tag bytes `SRAV`) holds the uber-shader name, the switch names with their hashes (43 for `environment`), then
one record per compiled variant (1,540 for `environment`): name, 12 bytes, `"DefaultOrTerrain"`, then 1 + 43 bytes where
byte *i*+1 is switch *i*: 1 on, 0 off, 2 don't care. A material's switch values are its merged type-4 parameters (`int` 1
is on), with unset switches taken from the shader's `DFPR` defaults. In a Tokyo area, 6,052 of 6,059 materials match exactly
one variant and every matched variant exists in `bin.zip`. :observed

Two refinements hold for every world family: a switch absent from the whole chain (instance, parents, defaults) matches any
value, and a switch with the same value in every compiled variant is fixed by the shader and ignored. Under this rule 4,037
summer materials over three test areas each map to exactly one shipped variant; the 68 misses are unshipped winter-only
permutations. :observed

Name suffixes of `environment` variants: `_B` Blend2, `_L` Lightmap, `_M` Modulate, `_ST` SwatchTint, `_WM` WetnessMask,
`_D` Deposits, `_MS` MegaSkirt, `_TPNAO` TriPlanarNormalAO, `TriPlanar` (implies Modulate and WetnessMask), `DualUv` prefix.
The most common is `_StandardRCSM_ShadowsTriPlanar_ST_TPNAO_D`. :observed

The rural road families `uber_megaroad` and `uber_megaroad_edge` cannot be matched this way: none of the family's 493 compiled
variants matches any of the 574 census materials, and its `VARS` table carries an extra name list (`WinterRoads`,
`TerrainNoise`, `RoadParallax`, `RoadDetail`, `UseMegaTex...`) that presumably maps material switches to variant switches
and is not decoded. :observed

## How a draw reaches its material

World families read their material from a **bindless constant block**: a parameter's register is its `CBMP` byte offset ÷ 16
(component = offset % 16 ÷ 4), and texture indices are dwords in the same block at a family-specific base plus the `TXMP`
value: 188 for `environment`, 124 for `window_linecastroom` (whose `CBEX` says 33 registers, so the base is not always four
times the register count), 88 for `uber_rock_array` and 76 for `uber_rock`. :observed Per draw one packed integer X locates the
material: constants at row `(X >> 16) + CBMP offset / 16`, textures at index-buffer entry `(X & 0xFFFF) + (TXMP offset − 16)`.
`environmentdeferreddecal` and `projection_lod` keep their texture indices in parameter rows from register 9, `anim_flag`
from 12 and `environment_plot` from 27. :observed

Car families use classic bound registers instead: the `CBMP` value is the byte offset in the material buffer `cb0` (register =
value ÷ 16), the `TXMP` value is the `t` register (t16 to t33 for `car_standard`), and `SPMP` the sampler register; `CBEX` is 528
bytes for `car_standard`. :observed

## Outputs

The main pass of the world families writes a G-buffer: `RT0.rgb` linear albedo, `RT0.w` metalness, `RT1.w` perceptual
roughness, `RT2.xyz` the world-space normal in the game frame (a raw signed vector to normalise when consumed) and `RT1.xyz`
the light scenario seed (emissive and local lights). :observed The forward light loop uses GGX
`D = a⁴ / (π((n·h)²(a⁴ − 1) + 1)²)` with `a = max(sat(r), 0.05)`, Smith-Schlick `k = r²/2`, Burley diffuse with
`F90 = 0.5 + 2 r (l·h)²` and `F0 = lerp(0.04, albedo, metal)`. :observed In dry weather every wetness term is the identity
(rain constant `cb7[2].x = 0`; randomising the wet-only globals leaves all outputs bit-identical). :observed

Per-family formulas are on [Environment shaders](/engines/forzatech/shaders/environment/),
[Other world families](/engines/forzatech/shaders/world-families/), [Rock and animated props](/engines/forzatech/shaders/rock-and-animated/),
[Spline deform](/engines/forzatech/shaders/spline-deform/) and [Car materials](/engines/forzatech/shaders/car-materials/); water is on [Water](/engines/forzatech/water/water/).

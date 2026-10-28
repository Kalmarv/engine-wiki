---
title: Layered surface shaders
description: Vertex blend inputs, height masks, snow, overlays and character detail layers.
implementations:
  - name: primase worlds/fromsoft (layer_bake)
    url: https://github.com/Kalmarv/primase/blob/main/worlds/fromsoft/src/passes/layer_bake.rs
---

Layered materials combine multiple sampled surfaces using vertex attributes, masks and material constants. A
material's apparent base colour is therefore not necessarily any one albedo texture. :observed

## Sekiro

### Multiple and MultipleGround

The shared vertex programs pass normalized-byte FLVER members to the pixel program as follows. The UV member
numbers below identify stored attributes, not separate two-lane interpretations of their bytes. :observed{games="sekiro"}

| Pixel input | Source lanes | Confidence |
|---|---|---|
| `TEXCOORD5` | `(UV1.x, UV2.y, UV4.x, UV5.y)` for MultipleGround; Multiple uses `UV2.z` in the second lane | :observed{games="sekiro"} |
| `TEXCOORD7` | `(UV3.xyz, COLOR1.x)` | :observed{games="sekiro"} |
| `TEXCOORD12.x` | `UV6.z` | :observed{games="sekiro"} |
| `TEXCOORD0.xy` | Texture coordinates before per-slot scaling | :observed{games="sekiro"} |

These families, with `M[Multiple]_Emissive`, cover most of Ashina Castle's drawn surface. :observed{games="sekiro"}
The share is about 80%. :inferred{games="sekiro"} In `m11_01`, 23 of 790 models store all-zero layer weights, among them `m100090_1000` with
`M[m11_00]_Ground1`. :observed{games="sekiro"}

For the inspected roof-tile permutation 18, the second-layer weight is
`w = saturate((v - m*(1-v)) * (1 + float_5))`, with
`m = (dot(mask3, float3_0)*float_10 + 0.01)*float_4`.
The colour path is `lerp(lerp(base,layer2,w) * (1 + float_2*(UV3-1)), snowColour, snow)`.
The snow branch uses its own mask constants and a normal-facing factor. These equations describe that permutation,
not every member of the shader family. :observed{games="sekiro"}

`M[MultipleGround]` blends the snow albedo `m11_snow_01_a` by `dot(float3_5, normal) × UV5.y`, with no time-of-day
or world-state input. Up-facing ground with a stored snow weight near 0.64 saturates to the snow colour (mean RGB
about 228, 233, 243), so near-white ground in Ashina is authored snow. :observed{games="sekiro"}

Executing saved vertex and pixel programs under the WARP rasterizer checks interpolation, sRGB-before-filtering
sampling and the resulting channels against independent execution. The channel comparison permits one byte level
for encoded albedo and normal; float-channel tolerance is one level of `1/255` or one thousandth of the value.
This establishes execution agreement for the supplied states, not the correctness of every runtime constant.
:proven[executed saved states]{games="sekiro"}

Some layered programs read a second coordinate set in `TEXCOORD0.zw`. Stored UV1 differs from UV0 in sampled meshes
from both m10_00 and m11_01, and need not be an affine transform of UV0. :observed{games="sekiro"}

## Elden Ring

### Layer weights of the Mb families

The layered programs of the `Mb2`, `Mb3` and `Mb4` families take their layer weights from the second UV member of the
vertex layout, kind `0x13`, four unsigned bytes read as `byte / 255`: 8,140 of 8,860 `Mb2`, 4,910 of 5,892 `Mb3` and 1,360
of 3,512 `Mb4` meshes have exactly that second member (a `UV` short pair first). Over the 28,597,065, 14,421,619 and
6,785,862 vertices of those meshes that have one, the bytes of lanes x, y and z cover 0 to 255 (most are 0, 3% to 18%
are 255) and lane w is 0 on every vertex. :observed{games="elden-ring"} The vertex programs read it as a float input
`TEXCOORD1` and pass lanes x, y and z on unchanged to a pixel input; there is no remapping from a signed range.
:observed{games="elden-ring"}

Running the lifted vertex and pixel programs of `M[AMSN][Mb2]_Gbuf` with the weight swept from 0 to 1 gives the blend
weight `w = saturate((v - p (1 - v) (m + 0.01)) (1 + q t))`, where `v` is lane x, `m` the first lane of the mask
texture, `p` and `q` the material's `float_0` and `float_1` and `t` the pixel input `TEXCOORD0.w`; the albedo is
`lerp(AlbedoMap_0, AlbedoMap_1, w)`. `M[AMSN][Mb3][Ov_AN]_Gbuf` gives `w_a = saturate(1 - 1.4 s1 (m + 1 - 2 a))`
and `w_b = saturate(1 - 1.4 s2 (m + 1 - 2 b))` with `a` and `b` lanes x and y, `s1` and `s2` its `float_1` and
`float_2`; the albedo is `AlbedoMap_1` blended to `AlbedoMap_2` by `w_a`, and that to `AlbedoMap_3` by `w_b`; lane z
changes nothing. Both agree with the formulas read from the disassembly (`w = 0.44` at `a = 0.4`, `s1 = 2`, mask 0).
:observed{games="elden-ring"} Sweeping each lane of `TEXCOORD1` of the `*_Gbuf` programs of the Mb families (104
programs: 21 without a `TEXCOORD1` input, 5 that the executor does not run, 30 whose albedo does not change under the
constants used) shows lane x alone changing the albedo in 36 (30 `Mb2`, 1 `Mb3`, 5 `Mb5`), lanes x and y in 9 (7 `Mb3`,
2 `Mb2`), lanes x, y and z in `M[AMSN_V][Mb4]` and lane z alone in 2 `Mb4` programs: the plain families with n layers
use n - 1 lanes. :observed{games="elden-ring"}

### Masked blends and overlays

The inspected `M[AMSN][Mb2][Ov_AN]_Gbuf.ppo` uses
`w2 = saturate(1 - 1.4*s*(mask.r + 1 - 2*v))`, where `v = TEXCOORD1.x` and `s` is `snp_0_float_1`.
A saved comparison against WARP covers 81,240 lanes. In the material read (`m60_fort_216`), `s` is 5.
:observed{games="elden-ring"}

In the multi-layer families (`Mb2`, `Mb4`, `GSBlendMap`) the base layer is `AlbedoMap_1` with `NormalMap_1`; layer 0
(`Ov_AN`) is an overlay blended last. :observed{games="elden-ring"}

The same program's overlay uses a colour-dependent weight per channel:
`x = t*(pow(o,1/2.2)-0.5)` and `c = lerp(a,o,x*x)`, with `t = snp_0_float_6`.
The result is saturated and multiplied by the diffuse-map multiplier and instance colour.
This is not a single scalar mask shared by RGB. :observed{games="elden-ring"}

For character DetailBlend shaders, `Texture2D_7` carries the character's base albedo: its own `_a` texture, of
which the game streams the `_l` variant. Shared `aat100` detail albedos at slots 1, 10 and 4 multiply over it at their own tilings; masks come from normal texture `Texture2D_0` alpha.
Program inspection and an in-world capture agree on those roles. :observed{games="elden-ring"}

The inspected Fur family multiplies the strand-card texture at slot 1 by a colour texture at slot 8. Two-sided
cloth permutations with switch 18 select back-face colour from slot 8 using `SV_IsFrontFace`.
:observed{games="elden-ring"}

The [detail-blend equations](/engines/fromsoft/materials/detail-blend/) describe the separately executed character
family, including Sekiro's different slot assignment and reflectance encoding.

:::open[Which equations generalize across permutations?]
Family and switch names do not prove an identical blend graph. The formulas above remain scoped to the inspected
programs; runtime snow, instance colour and secondary UV inputs require their own bindings. :unknown
:::

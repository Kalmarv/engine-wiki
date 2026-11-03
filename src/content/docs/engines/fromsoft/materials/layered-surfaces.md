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

Permutation 27 (`M[Multiple]_27_Gbuf.ppo`) uses the tint as a mask as well as a colour. With `t = UV3.xyz`,
`L = dot(1 - t, (0.29891, 0.58661, 0.11448))` and `m` a layer mask of the same form as above,
`s = saturate((L - m*(1-L)) * (1 + cb[41].x))` and the albedo is `base * (1 + s*(t*cb[28].xyz - 1))`, where `cb` is
the material's constant buffer. :observed[the program's code]{games="sekiro"} A zero tint gives `L = 1` and so `s = 1`
whatever the mask, wherever `cb[41].x` is at least 0, and the albedo is black. A white tint gives `s = 0` for a
positive mask and leaves the base unchanged. :inferred{games="sekiro"} Executing the program with
`M[m11_02]_StoneWall1`'s constants (`cb[41].x = 3`, `cb[28] = (4.376, 3.577, 2.740)`) gives a mean albedo of 0 at
tint 0, 88 at tint 1 and 106 at tint 0.498 (8-bit levels). :observed[one material]{games="sekiro"}

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

### The albedo and the instance palette

Read as value graphs specialised with each material's own constants, the G-buffer programs of the 62 `Mb2`, `Mb3` and
`Mb4` materials of one Stormveil region (11 of them ColorAdjust) all compute the albedo as `saturate(Over) × F`. `Over` is
a chain of blends `lerp(below, L_i, w_i)`, one per layer, each weight `w_i` made of sums, products, saturates, minima and
maxima of vertex lanes (`TEXCOORD4.xy` and `.w`, `TEXCOORD7.x`, `TEXCOORD0.w`) and mask texels. :observed[62 materials of
one region of `m10_00_00_00`]{games="elden-ring"} A layer's value `L_i` takes one of three forms:

| Layer value | Where | Confidence |
|---|---|---|
| `texel × C`, with `C` at most 1 | the plain `Mb2` and `Mb3` layers | :observed{games="elden-ring"} |
| `lerp(texel, C, f)` | ColorAdjust; `f` between 0 and 1 (`lerp(texel, white, 0.3)`) in 4 of the 11 ColorAdjust materials | :observed{games="elden-ring"} |
| `texel × C`, with `C` up to 1.47 | ColorAdjust; the blended colour can then pass 1, so the outer `saturate` changes it | :observed{games="elden-ring"} |

`TEXCOORD0.w` reaches the albedo in the plain `Mb2` programs alone: in all 17 materials of `M[AMSN_V][Mb2]_Gbuf` and
`M[AMSN][Mb2]_Skin_Gbuf` in the region, and in none of the other 45. There their vertex programs write it from the
vertex colour's alpha, `COLOR0.w`, unchanged. Run on each of the 256 byte values the stream can store, the vertex
program gives that value back exactly, with no constant read on the way. It is the `t` of the `Mb2` weight above.
:observed[the 62 `Mb` materials of one region of `m10_00_00_00`, each vertex program run over every stored value]{games="elden-ring"}

The material constant `snp_0_float_6` means different things in different programs. :observed[62 `Mb` materials of one
region]{games="elden-ring"}

| Program | `snp_0_float_6` | Read by the albedo | Confidence |
|---|---|---|---|
| `[Mb2][Ov_AN]` (4 materials) | 2.5, and 0 in the `_Edge` program | yes: a value computed from it multiplies the overlay's centred colour (`pow(o, 1/2.2) - 0.5`) | :observed{games="elden-ring"} |
| plain `Mb3` (7) | 1, 1.5 or 2 | yes, with no overlay colour in the program | :observed{games="elden-ring"} |
| `Mb2`, `Mb3` and `Mb4` ColorAdjust (11) | 1 or 2 | yes, with no overlay colour in the program | :observed{games="elden-ring"} |
| `[Mb3][Ov_N2_T]` (1) | 0.8 | no | :observed{games="elden-ring"} |
| plain `Mb2`, `[Ov_N]`, `[Flag][Mb2]`, `[Mb4][3Mask][Ov_AN]` (39) | not stated | no | :observed{games="elden-ring"} |

So `snp_0_float_6` is the overlay's strength only where an `Ov_AN` overlay colours the albedo; in the plain `Mb3`
and ColorAdjust programs it feeds some other part of the albedo, not established which. :inferred{games="elden-ring"}

`F` is a colour of the drawing instance's palette: `aColor[13 × r + 9 + FC_ColorSlotNo]` of `cbInstanceData` (`b4`), the
four colours at byte 144 of the 208-byte record `r`, as the [SpeedTree leaf](/engines/fromsoft/vegetation/speedtree/#leaf-colour)
program reads them. The pixel program's record `r` arrives as `NORMAL0.w`,
which is no vertex stream here: every `Mb` vertex program writes it from the instance table, at
`VC_InstanceIdxOffset + SV_InstanceID`, bounds-checked. :observed[the vertex programs of every Mb material of the same
region]{games="elden-ring"}

In the recorded frames of two sessions at the Stormveil gate (2,076 draws of 26 `Mb` pixel programs, 1,476 of them
with `b4` recorded), every record an instance can address (2,474 records, among them 1,299 drawn by `Mb3_ColorAdjust`,
26 by `Mb2_ColorAdjust` and 16 by `Mb4_ColorAdjust`) holds the same palette, four slots of (1, 1, 1, 1), so `F` is white
there. :observed[two recorded sessions, one area]{games="elden-ring"} The records past the instance count hold world-matrix
rows, zeros and non-numbers: stale buffer space, not palettes. :observed{games="elden-ring"} That instance `i` reads
record `i` is inferred from the addressed records being well formed (a valid `mWorld` in rows 0 to 2); the instance
table itself is not recorded. :inferred{games="elden-ring"}

:::open[Is the instance palette white everywhere?]
The palette is white over every addressed record of the Stormveil captures. Whether other areas, or other material
families than `Mb`, draw with a coloured palette, and what fills it, is not established.
:::

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

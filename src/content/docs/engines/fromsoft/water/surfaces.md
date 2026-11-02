---
title: Water surfaces
description: "Which materials draw water, what the frame binds to a water draw, and how a lake's forward program turns what is behind its surface into water."
sources:
  - title: SoulsFormatsNEXT MATBIN
    url: https://github.com/soulsmods/SoulsFormatsNEXT/blob/master/SoulsFormats/Formats/MATBIN.cs
    note: Independent material binary reader
---

Rendered water is a forward material drawn after the opaque composite. Its program reads a copy of the lit picture
drawn so far and of the depth, and draws what lies behind the surface through the depth of water in front of it, with
moving normal maps, reflections and the sun on top. This is apart from the [collision surfaces](/engines/fromsoft/water/collision-surfaces/)
that make water walkable or swimmable. :observed

## Which materials draw water

In Elden Ring a material states water by the MATBIN parameter `g_GXFT_WaterInteraction` (a boolean). In the install's
material binder, 115 of the 20,619 MATBINs set it true, and they belong to 24 shader families: the lakes and swamps
(`M[Lake]`, `M[PlacidLake]` and its LOD variants, `M[MuddyWater]`, `M[PoisonSwamp]` and its variants, `M[MossSwamp]_Emissive_Glow`),
the rivers and oceans (`M[Water][river]`, `M[Water][ocean2]` to `[ocean7]`), `M[Oil_Liquid]`,
`M[ShadowErdtree_BlackBlood]` and the cutscene water families. :proven[every MATBIN of the material binder]{games="elden-ring"}

The flag goes with what the family's forward (`_FwdSdw`) program reads: over the 952 shader bundles of material
families examined, every family whose MATBINs set the flag has a forward program that reads the water simulation's
normal map `g_WaterSimulationNormalTexture` (`t57`), and no family whose MATBINs leave it false or unset has one that
does (743 family and flag pairs, none disagreeing). `M[MossSwamp]_Emissive_Glow` sets the flag and has no forward program
among those bundles. :observed[952 material bundles, every forward program's reflection]{games="elden-ring"}

`g_GXFT_Refraction` is not a water marker: it is also set on clouds, ice, lava and bonfire materials. The waterfall
families (`M[Waterfall*]`) refract and do not set `g_GXFT_WaterInteraction`. :observed[every MATBIN of the material binder]{games="elden-ring"}

Sekiro's MTDs state the same flag. In the install's `allmaterialbnd`, 28 of the 3,170 MTDs set
`g_GXFT_WaterInteraction` true and none sets it false: `M[Interaction]_Tessellation_Water` (22),
`M[Interaction]_Tessellation_PoisonWater` (2), `M[Interaction]_Water` (2), `GXFlver_WaterBumpTriInteraction` and
`GXFlver_WaterBumpTriInteractionFloatObj` (1 each). The flowing water (`M[Flow]_Water`, 11; `M[Flow]_Tessellation_Water`,
2), the waterfalls (`M[Mb1]_SmallWaterfall_test`, 16) and the waterfall foam (`M[WaterFall]_Foam`, 5) do not state it.
:proven[every MTD of the binder]{games="sekiro"} Its forward programs that read the water simulation's normal map (at
`t58`) are those of `M[Interaction]_Tessellation_Water`, `M[Interaction]_Tessellation_PoisonWater` and
`M[Interaction]_Water`; the flowing-water families (`M[Flow]_Water`, `M[Flow]_Tessellation_Water`) read the frame's
colour and depth without it. :observed[1,053 forward programs' reflection]{games="sekiro"}

## What the frame binds to a water draw

In one recorded Elden Ring frame (Stormveil, 2560x1440, five frames, 39 forward water draws: two `M[PlacidLake]` and
one `M[Water][ocean4]` a frame), every water draw binds the following. :observed[one capture of five frames]{games="elden-ring"}

| Register | Name | What the frame binds | Confidence |
|---|---|---|---|
| `t45`, `t55` | `SceneColor_0_Screen_0`, `g_RefractionTexture` | One full-screen R11G11B10 copy of the lit composite, made right before the water draws, which then draw into the composite itself | :observed{games="elden-ring"} |
| `t56` | `g_DepthTexture` | A copy of the G-buffer depth | :observed{games="elden-ring"} |
| `t57` | `g_WaterSimulationNormalTexture` | A 512x512 RGBA8 target the frame draws first, while water is drawn (`GXWaterInteractionNormalMap2`) | :observed{games="elden-ring"} |
| `t44` | `g_RLRTexture` | The screen-space reflection chain's result, half resolution RGBA16F with six levels | :observed{games="elden-ring"} |
| `t33` | `g_SSAOTexture` | A 1x1 RGBA8 texture, not the ambient occlusion target | :observed{games="elden-ring"} |

The draws blend `SRC_ALPHA, INV_SRC_ALPHA` and test depth `GREATER_EQUAL`. `M[PlacidLake]`'s screen-space reflection
prepass (`FwdSsr`) draws earlier, among the reflection chain's steps. :observed[one capture of five frames]{games="elden-ring"}

## A lake's forward program

`M[PlacidLake]_FwdSdw` (Elden Ring) draws a lake as follows. :observed[the installed program's DXIL]{games="elden-ring"}

- **Waves.** Normal map A (`Texture2D_2`, tiled by `cbTextureTilingScale` row 1) scrolls by `float_11 * time * float2_2`;
  its blue channel offsets the coordinate of normal map B (`Texture2D_0`, row 0), which scrolls by
  `float2_4 * time * float_11 + float2_5 * uv`. The tangent-space normal is A's `xy` (pulled towards 0.5 by
  `TEXCOORD4.y`) plus `(B - 0.5) * float_9`, decoded as twice that less one: its `x` turns the normal along the
  bitangent (the normal crossed with the tangent, times the tangent's `w`) and its `y` along the tangent, and the third
  component is `sqrt(1 - saturate(x² + y²))`. Inside the water simulation's square (`TEXCOORD0.zw` strictly between 0
  and 1) the simulation normal (`t57` sampled there) replaces it by its alpha.
- **What is behind.** The screen coordinate is offset by the normal, by `float_1 * 10 / (depth + 10)`, and the frame's
  colour copy is read there; where the offset sample is in front of the surface, the straight coordinate is read
  instead.
- **Absorption.** What is behind is multiplied by `exp2(-1.4427 * sigma * max(0, behind - surface))` per channel, with
  `sigma = float3_0 + float3_2` and the two depths along the view axis: the surface's from its position's `w`, what is
  behind from the depth copy as `-z / (x - stored)` with `x` and `z` from `cbSceneParam`. `m10_00_692`, Stormveil's
  lake, states `sigma` = (0.215, 0.115, 0.09) per metre.
- **Fresnel.** The transmitted light is weighted by `0.96 - 0.96 * (1 - |N.V|)^5`: Schlick's form with a reflectance
  of 0.04 at normal incidence.
- **Caustics.** A mask (`Texture2D_3`) sampled at the world `xz` of what is behind (from the depth copy), moved by a
  flow map (`Texture2D_4`) in two phases of `frac(2 * float_8 * time)`, adds
  `hourColour * behind * mask * float_7 * float_16` faded by the distance (`float_26`, `float_27`) and the screen-space
  shadow. `hourColour` is `color_4` within five hours of noon, `color_3` in the morning and `color_5` in the afternoon,
  `color_2` beyond seven hours.
- **Reflection.** Screen-space reflection over the two image-based-light cubes, the sun's specular and the tiled point
  and spot lights' specular.
- **Body.** A diffuse body `FC_DifMapMulCol * saturate(color_0) * aColor[FC_ColorSlotNo]` (the instance record's colour
  in the slot `cbMatDynParam` names), lit by the sun (`cbLight`'s `Col_0` times
  `saturate(N.Vec_0) / pi`, times `min(1 + FC_SsaoWeight * (shadow - 1), 1)`), is mixed over the rest by
  `saturate(saturate((float_19 + (distance - float_17) / max(float_18 - float_17, 0.001)) * float_21) * float_5)`: a
  blend by the distance from the camera, not by the depth of water. `m10_00_692` states 120 and 700 for the two
  distances, 0.2, 6 and 0.2 for the rest, so its body is blended in from 4 metres from the camera, by 0.012 at 10 metres, up to a fifth from 101 metres on.
  Its body is black: every recorded `M[PlacidLake]` draw binds `color_0` as (0, 0, 0), the rest of its material
  constants equal to `m10_00_692`'s, a colour being its stored value raised to the power 2.2 and multiplied by its fifth
  value (`color_2`'s (0.506, 0.900, 1, 1, 8) is bound as (1.786, 6.347, 8)); `color_0`'s fifth value is 0. So far
  away the lake passes less of what is behind it, down to 0.8 of it, rather than showing a colour of its own.
  :observed[the material constants of every lake draw in five recorded frames]{games="elden-ring"}
- **Sun highlight.** The sun's specular takes a smoothness of `sqrt(smoothness * (1 - 0.075 / Vec_0.w))` from the
  light set's `Vec_0.w` (see [the frame](/engines/fromsoft/lighting/frame/)).
- **Alpha.** The draw's alpha is the instance's times `saturate((behind - surface) * float_3)`, a fade over the shore.

:::open[What does the water simulation draw?]
`GXWaterInteractionNormalMap2` draws the 512x512 normal map that interacting water reads near the player. What it
draws from (the player's and objects' contacts) and how its square follows the camera are not described.
:::

:::open[Do the other water families follow the lake's model?]
The lake's program is read in full. The rivers, oceans, swamps and Sekiro's interaction water are known to read the
same frame inputs; whether their absorption, Fresnel and shore fade take the same form is not established.
:::

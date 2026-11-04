---
title: Texture scroll and alpha fades
description: Vertex texture transforms, GX scroll records, program-driven time and alpha discard.
games: [sekiro]
sources:
  - title: Smithbox GX item descriptors
    url: https://github.com/vawser/Smithbox
    note: Names of GX texture-scroll records
implementations:
  - name: primase worlds/fromsoft (layer_bake/resolve.rs)
    url: https://github.com/Kalmarv/primase/blob/main/worlds/fromsoft/src/passes/layer_bake/resolve.rs
---

Sekiro can transform texture coordinates in the vertex stage and animate UVs inside the material program. Alpha
testing and camera fades are also shader operations, rather than a fixed-function alpha-test state. :observed

## Vertex coordinate transforms

`cbTexScroll` holds `VC_TexScroll_0` through `_3`, with per-set scale in XY and offset in ZW. The inspected
programs compute `uv = storedShortUV/2048 * scroll.xy + scroll.zw`; layered programs use sets 0 and 1, while
the inspected GXFlver programs use set 0. :observed

The block occurs in 2,189 of 2,824 inspected GXFlver vertex programs. In the available castle capture, all
40,744 layered draws it logged (at most 800 a frame) have identity texture-scroll constants. Outdoors in Ashina every
layered draw of 460 consecutive frames (384,131 draws) has the same four `[1,1,0,0]` vectors. This does not establish
identity on water and other time-dependent families. :observed In the running game, raising the first vector to
`[8,8,0,0]` for the draws of one layered program makes their textures repeat far more finely, so the first two
components scale the coordinates as the formula has it ([runtime render state](/engines/fromsoft/runtime/render-state/#deferred-contexts)). :observed[one frame each way]

Smithbox names GX20 through GX34 as per-texture-type U/V scroll speeds with a further float, and GX07 as a
water-related record. :sourced[Smithbox]

The whole-install GX scan records nonzero scroll data only on the inspected M[A]_al map pieces, a river's GX20
and GX26 items, and a water material's GX07. No layered material in that scan carries a scroll item.
:observed The specific rule `offset = speed*time` remains an inference without a capture of those moving surfaces.
:inferred

The scan covers the install's 14,459 FLVERs and 43,435 materials. Twelve items on four map pieces (and their `_S`
twins where listed) carry nonzero values; layered materials carry only GX00 and GX04 items.
:observed{games="sekiro"}

| Map piece | Material | Items | Confidence |
|---|---|---|---|
| `m25_00_00_00_906000` and `_S` | `M[A]_al` | GX20, V −0.03 and −0.05 | :observed{games="sekiro"} |
| `m17_00_00_00_106000` and `_S` | `M[A]_al_NoLight` | GX20, 0.005 and 0.005 | :observed{games="sekiro"} |
| `m20_00_00_00_920000`, a river | `M[ARSN]` | GX20 (0, −0.08); GX26 (0, −0.04) | :observed{games="sekiro"} |
| `m25_00_00_00_300010` | `M[ARSN]_Water_3normaltet` | GX07 | :observed{games="sekiro"} |

`M[Flow]_Water` and `Character_AMSN_Scroll*` instead multiply MTD float2 parameters by `FC_GlobalTime` inside
their material programs. :observed

## Alpha and fade inputs

Inspected alpha-tested programs discard when a tested alpha is below `FC_AlphaRef.x`. Some perturb the tested
scalar with `(ditherAlpha - 0.5) * FC_AlphaRef.y` before comparison. Setting the dither sample to 0.5 removes that
perturbation for finite scale, but does not describe the runtime noise texture. :observed

The alpha-test permutation can also read `FC_isDitherAlpha`, `FC_DitherEnable` and
`FC_isEnableCameraDitherFade`, plus camera fade range constants. In the 11,252 captured `_Gbuf_[A]` draws,
the camera-fade flag and `FC_isDitherAlpha` are always zero; `FC_DitherEnable` is one on 99 draws and zero on
the rest. A set enable word alone therefore does not prove an active fade. :observed

Sekiro's Ashina Castle frames draw 19 meshes whose materials carry GX20 scroll records (GX20, GX22, GX24 and GX26 together on
the `M[ARSN]` ones, GX14 and GX20 on three `M[A]`), and every one uploads the identity `cbTexScroll`. :observed[one frame; 859 draws with
the block]{games="sekiro"} The record's payload is not in a capture, so whether those authored speeds are zero was not read; the whole-install
scan above finds nonzero values only on four map pieces, none of them among these. :inferred{games="sekiro"} Elden Ring's
`cbTexScroll` is the identity in all 4,325 draws that bind it in five Stormveil sessions, among them the `M[Water][ocean4]` and
`M[Water][ocean_Horizon]` water draws, whose pixel and domain programs read `FC_GlobalTime`: the ocean's motion comes from the program's
time, not from a scroll upload. :observed[five captures]{games="elden-ring"}

Moving surfaces that do not use `cbTexScroll` carry their motion in other constants. Sekiro's effect-water pixel program (`PSCommonBuffer`) takes
`g_vNormalMapScrollDistance` and `g_hNormalMapScrollDistance` in `c6.xy`: three draws per frame, each pair different (for example 0.6185 and
0.8765 in one draw, 0.628 and 14.79 in the next) and different again in each of six sessions at the same spot. :observed[six Sekiro
frames of one spot]{games="sekiro"} A value that changes between sessions is not a material value, so the game writes it at run time. :inferred{games="sekiro"} Elden Ring's fog volumes carry `scrollSpeed` and `scrollScale` in `cbRendering.g_renderingDensity` (for
example speed (0.2, -0.05, 0.3) on one volume and (0, -4, -10) on the others), not in a material buffer. :observed{games="elden-ring"}

:::open[Which GX values generate each scroll constant?]
No captured frame holds a surface with a nonzero authored GX scroll: every `cbTexScroll` of Sekiro and Elden Ring frames is the identity, so
the upload rule, the time origin and the meaning of each extra float are still not shown. A frame of a river or the water material `GX07`
describes (the whole-install scan names `m20_00_00_00_920000` and `m25_00_00_00_300010`), ideally two frames about a second apart, would decide
it. :unknown
:::

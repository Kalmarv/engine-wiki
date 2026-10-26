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
40,744 layered draws have identity texture-scroll constants. This does not establish identity on water and
other time-dependent families. :observed

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

:::open[Which GX values generate each scroll constant?]
The named records and nonzero authored values identify candidates, but the complete runtime upload rule, time
origin and meaning of each extra float are not established by the available capture. :unknown
:::

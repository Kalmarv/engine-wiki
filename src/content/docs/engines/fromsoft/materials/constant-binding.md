---
title: Material constant binding and UV tiling
description: SAT word offsets, colour transfer, boolean bits and centered texture transforms.
implementations:
  - name: primase worlds/fromsoft (layer_bake/resolve.rs)
    url: https://github.com/Kalmarv/primase/blob/main/worlds/fromsoft/src/passes/layer_bake/resolve.rs
---

Material definitions store authoring values; the engine uploads shader constants after applying type-dependent
rules. Sekiro's programs name individual material fields, while Elden Ring commonly addresses the `SAT_MtdParam`
array. :observed

In Sekiro's programs `SAT_MtdParam` is a structure of named members. The metaparam's MtdParam start values are
zero there and do not locate them; the members' offsets come from the program's reflection, with nested members
flattened. :observed{games="sekiro"}

## SAT positions and values

The metaparam's MtdParam start is an absolute offset in 32-bit words from the beginning of the constant buffer,
not from the beginning of `SAT_MtdParam`. An array starting at byte 144 therefore begins at word 36. :observed{games="elden-ring"}

For a colour with stored RGB `c`, alpha `a` and intensity `i`, the observed upload is
`RGB = pow(c, 2.2) * i` when the metaparam's sRGB flag is set, and `RGB = c * i` when clear. Alpha remains `a`.
The power precedes intensity; a colour-like name or type alone does not imply the power. :observed

Elden Ring capture comparisons distinguish gamma conversion on 124 RGB lanes, raw multiplication on eight
unflagged lanes, and integer bit patterns on three nonzero booleans. The session contains 260 SAT draw groups,
97 tied to material definitions by shaders and textures; four eye lanes remain unexplained.
:observed{games="elden-ring"}

In full, the 260 groups are 97 tied, 70 untied, 73 with no SAT binding or program and 20 without a captured
constant buffer, and 1,049 lanes are classified. Of the type-13 RGB lanes whose sRGB flag is set, 124 fit only the
power form, none only the raw form, and 215 cannot tell them apart (values 0 or 1). Of the unflagged ones, 8 fit
only the raw form, none only the power form, and 1 cannot tell. :observed{games="elden-ring"} An independent check of the
unflagged `M_AMSN_V__cheap_A__snp_0_color_2` in `AEG004_113`, `AEG004_110` and `AEG004_171_exLOD` matches all 12
RGBA outputs to raw `RGB × intensity` with alpha unchanged, within 4.03e-8; among 15 other materials, 21 flagged
RGB lanes at intensities 1, 2, 3, 3.5, 4, 5 and 20 match `pow(c, 2.2) × i` within 3.97e-7.
:observed{games="elden-ring"}

Sekiro's non-unit intensity evidence comes from five independently attributed material-buffer blobs matched by
live texture-tiling rows. Examples include colour `(1,1,0.86274517)` at intensity 10 uploading
`(10,10,7.22672558)`, and `(0.78039223,0.64705884,0.56862748)` at intensity 0.5 uploading approximately
`(0.289773375,0.191887334,0.144408002)`. These distinguish gamma-before-intensity from both raw multiplication
and gamma-after-intensity; they are not a census of every material. :observed{games="sekiro"}

Sekiro commonly stores intensity as a separate `<colour-name>-Intensity` parameter; Elden Ring stores it as the
fifth colour component. :observed A true Elden Ring SAT boolean uploads word `0x00000001`, not float 1.0's
`0x3F800000`. Zero-valued booleans cannot distinguish these encodings. :observed{games="elden-ring"}

Stored runtime override payloads are documented separately under
[MaterialEx action data](/engines/fromsoft/effects/material-events/); that payload layout does not establish its
complete application order or transition rule. :unknown{games="elden-ring"}

## Texture groups and centered tiling

The metaparam joins each `Texture2D_N` to a UV group. The corresponding definition parameter is
`<group>_CommonUV-UVParam`; the row of `FC_TextureTilingScale` is indexed by the actual bound register, not `N`.
:observed

For scale `(u,v)`, captured rows are `(u,v,(1-u)/2,(1-v)/2)`, giving
`uv' = uv * scale + (1-scale)/2`. Scaling is about the texture center. :observed

| Source of scale | Evidence and scope | Confidence |
|---|---|---|
| FLVER texture scale before definition scale | Three discriminating Sekiro buffer contents support this precedence | :observed{games="sekiro"} |
| Nonzero definition texture scale before UV group | Four discriminating Sekiro buffer contents support this precedence | :observed{games="sekiro"} |
| Definition sampler scale or UV-group scale | Captured Elden Ring character rows match both paths | :observed{games="elden-ring"} |
| Metaparam default when no authored UV-group value exists | Plausible fallback, but the cited Sekiro captures do not distinguish it | :inferred{games="sekiro"} |
| Elden Ring non-unit FLVER scale precedence | Available reliably identified draws do not exercise this case | :unknown{games="elden-ring"} |

Over the 299,105 texture bindings of Elden Ring's asset and map FLVERs, 81,470 have FLVER scale 1 with a UV-group
scale other than 1, 1,058 have a FLVER scale other than 1 with UV-group scale 1, and 10 have both other than 1
(8 of them equal). Another 34,845 belong to no UV group: fixed-function and MultiBlend materials.
:observed{games="elden-ring"}

Of 440 tied Sekiro tiling-buffer contents, the candidate precedence reproduces 301. Another 130 fit none of the
tested orders; nine all-one contents conflict with the stated non-unit material scales. This is a partial
binding rule, not a universal equivalence. :observed{games="sekiro"}

Elden Ring draws with the same shader and textures can have different tiling constants. A Limgrave capture has
both `10/35/10` and `19/55/24` scale groups under identical declared texture resources, so shader-plus-texture
identity alone does not establish material identity. :observed{games="elden-ring"} Nor can that family's
material-constant buffer tell its materials apart: all 10 parameters of its metaparam are renderer-only, at offset
0. :observed{games="elden-ring"}

The eye pixel program's material buffer holds colour 100/255 and scalar 0.024705887 on all 17 of its 30 captured
draws that have one, and its textures tie equally to the `c9506` eye and the `FG_A_1500` left and right MATBINs.
:observed{games="elden-ring"}

:::open[Which runtime inputs account for unmatched tiling and eye words?]
Unexplained Sekiro tiling contents remain. Elden Ring's non-unit FLVER scale precedence has no decisive capture,
and the eye constants could reflect a runtime override, but that explanation is not established. :unknown
:::

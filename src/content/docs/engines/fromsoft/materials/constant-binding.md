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

## SAT positions and values

For a colour with stored RGB `c`, alpha `a` and intensity `i`, the observed upload is
`RGB = pow(c, 2.2) * i` when the metaparam's sRGB flag is set, and `RGB = c * i` when clear. Alpha remains `a`.
The power precedes intensity; a colour-like name or type alone does not imply the power. :observed

Sekiro commonly stores intensity as a separate `<colour-name>-Intensity` parameter; Elden Ring stores it as the
fifth colour component. :observed

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
| Elden Ring non-unit FLVER scale precedence | The install has 1,203 bindings with a FLVER texture scale, in 288 materials of 22 MATBINs, but no reliably identified captured draw uses one; `AEG006_031` to `AEG006_045` among them are placed in no MSB | :unknown{games="elden-ring"} |

## The blood amount

Both games' programs declare `FC_BloodAmount`, one float in the material buffer `cbMtdParam` (`b3`), under the same
name and at a different byte offset in each game. :observed The name and the blood decal it blends in suggest the engine raises it
per instance as a character takes damage, rather than taking it from the material definition. :inferred

| Game | Programs that declare it | Byte offset in `cbMtdParam` | Confidence |
|---|---|---|---|
| Sekiro | 12,412 of the 21,304 programs of the shader bundles, 12,117 of them pixel programs; 48 more, none of them pixel programs, hold the name in no constant buffer's layout | 96 in every one | :proven[the reflection of every program of the shader bundles]{games="sekiro"} |
| Elden Ring | 3,004 of 43,138 programs, 2,638 of them pixel programs | 48 in every one | :observed[the programs whose bytes hold the name, in the install with the Shadow of the Erdtree data, Steam build 25827938]{games="elden-ring"} |

In Elden Ring's character G-buffer programs that read it, the amount blends the surface colour `v` towards the blood
decal sampled from `g_DecalDiffuseTexture`: `amount * ((decal.a * v - v) + decal.rgb) + v`. At 0 the surface is
unchanged. :observed[the lifted value graphs of nine Stormveil materials' programs: `C[DetailBlend]` 0 and 13, two `M[AMSN]` `_Skin_PaintDecal` programs and `CS[c4750][VA_Frame]_Flag`]{games="elden-ring"}

:::open[What amount does a character carry at run time?]
The value an unhurt character's instance carries, and how the engine raises and lowers it, are not observed: no frame
capture has been read at that word. Sekiro's programs declare the same member; how they read it is not observed.
:::

## Sekiro

### SAT positions and values

In Sekiro's programs `SAT_MtdParam` is a structure of named members. The metaparam's MtdParam start values are
zero there and do not locate them; the members' offsets come from the program's reflection, with nested members
flattened. :observed{games="sekiro"}

The `_cloth` families (`Character_AMSN_[DetailBlend]_cloth`, `Character_AN_Blend_AMSN_[Fresnel]_cloth`,
`Fur_NTC_cloth`) name their material parameters, and their programs' `cbMtdParam` members, with the base family's
prefix (`Character_AMSN__DetailBlend__snp_0_*`), not one built from their own shader name. A lookup by the
`_cloth` shader's name matches no member. :observed[the cloth materials of the Wolf's default outfit]{games="sekiro"}

Sekiro's non-unit intensity evidence comes from five independently attributed material-buffer blobs matched by
live texture-tiling rows. Examples include colour `(1,1,0.86274517)` at intensity 10 uploading
`(10,10,7.22672558)`, and `(0.78039223,0.64705884,0.56862748)` at intensity 0.5 uploading approximately
`(0.289773375,0.191887334,0.144408002)`. These distinguish gamma-before-intensity from both raw multiplication
and gamma-after-intensity; they are not a census of every material. :observed{games="sekiro"}

### Texture groups and tiling

Of 440 tied Sekiro tiling-buffer contents, the candidate precedence reproduces 301. Another 130 fit none of the
tested orders; nine all-one contents conflict with the stated non-unit material scales. This is a partial
binding rule, not a universal equivalence. :observed{games="sekiro"}

## Elden Ring

### SAT positions and values

The metaparam's MtdParam start is an absolute offset in 32-bit words from the beginning of the constant buffer,
not from the beginning of `SAT_MtdParam`. An array starting at byte 144 therefore begins at word 36. :observed{games="elden-ring"}

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

A true Elden Ring SAT boolean uploads word `0x00000001`, not float 1.0's
`0x3F800000`. Zero-valued booleans cannot distinguish these encodings. :observed{games="elden-ring"}

Beside `SAT_MtdParam`, some programs read a `SAT_CAParam` block. The plain `M[AMSN_V]` G-buffer pixel program declares four float
members of it at bytes 272, 276, 280 and 284 of `cbMatDynParam` and multiplies the sampled albedo's RGB by the first three. The
bundle's metaparam lists the matching [CAParams](/engines/fromsoft/materials/metaparam/#material-parameters) as components 0 to 4
of `color_0`, each with default 1; the program does not read the fifth, the intensity. The names differ by one character: the
metaparam's has an extra underscore before `snp`. :observed[the installed program's reflection and IR, and its
bundle]{games="elden-ring"} In the recorded Stormveil frame that program's 47 readable material buffers hold (1, 1, 1, 1) there,
the defaults. :observed[one frame]{games="elden-ring"} The `M[AMSN_V][Mb3]` and `M[AMSN_V][Ov_N]` bundles have no CAParams.
:observed{games="elden-ring"}

### Texture groups and tiling

Over the 299,105 texture bindings of Elden Ring's asset and map FLVERs, 81,470 have FLVER scale 1 with a UV-group
scale other than 1, 1,058 have a FLVER scale other than 1 with UV-group scale 1, and 10 have both other than 1
(8 of them equal). Another 34,845 belong to no UV group: fixed-function and MultiBlend materials.
:observed{games="elden-ring"}

Elden Ring draws with the same shader and textures can have different tiling constants. A Limgrave capture has
both `10/35/10` and `19/55/24` scale groups under identical declared texture resources, so shader-plus-texture
identity alone does not establish material identity. :observed{games="elden-ring"} Nor can that family's
material-constant buffer tell its materials apart: all 10 parameters of its metaparam are renderer-only, at offset
0. :observed{games="elden-ring"}

The eye pixel program's material buffer holds colour 100/255 and scalar 0.024705887 on all 17 of its 30 captured
draws that have one, and its textures tie equally to the `c9506` eye and the `FG_A_1500` left and right MATBINs.
:observed{games="elden-ring"}

:::open[Which runtime inputs account for unmatched tiling and eye words?]
Unexplained Sekiro tiling contents remain. Elden Ring's non-unit FLVER scale precedence has no decisive capture;
placed assets whose two scales disagree would decide it, such as `AEG004_805` in `m60_42_37_00` (FLVER scale 2, UV
group scale 1) and `AEG007_200` in `m60_23_19_01` (160 against 30). The eye constants could reflect a runtime override, but that explanation is not established. :unknown
:::

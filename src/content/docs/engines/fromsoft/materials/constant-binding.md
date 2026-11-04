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

:only[sekiro] In five frames at the Ashina Castle gate, every drawn character material carries its definition's
`g_BloodAmount` there unchanged (1 on 760 draws, 0.9 on 5, 0 on 15), and every map and object material 0 (it has no such
parameter). None of the pixel programs those draws use reads the member: their reflection marks it unused.
:observed[five captured frames, 780 character and 2,225 map and object draws whose material buffer holds the word]{games="sekiro"}

In Elden Ring every character material carries 1 there: across seven Stormveil sessions, all 1,318 reads of the word by pixel programs of the `C[...]` families (`DetailBlend` in all its permutations, `AMSN`, `Fur`) and the `P[ChrCustomize]` hair, skin and body-hair programs are 1.0, and the 28 reads by `P[ChrCustomize][Eye]` and 7 by `P[ChrCustomize][EyeAO]` are 0.0. :observed[seven captured sessions]{games="elden-ring"}
Of the 62 distinct G-buffer pixel programs of one frame, 25 read it as a value of an output lane: every `C[...]` program, the `P[ChrCustomize]` skin and eye programs, `M[AMSN]_Skin_PaintDecal`, `M[AMSN][Ov_N]_Skin_PaintDecal` and `S[AMSN]_Glow`. :observed[traces of one frame]{games="elden-ring"}
Map and object materials hold 0 in most draws (all 191 of `M[AMSN_V][Ov_N]_Gbuf`), but a few programs read other values from the word (for
example 1, 10 and 0.706 in `M[AMSN_V]_Gbuf`), which these captures do not explain. :observed{games="elden-ring"} That every character
material holds exactly 1 (and the eyes 0) in seven sessions of one walk suggests a definition value or an engine default, not a damage measure;
the sessions did not record the character's health. :inferred{games="elden-ring"}

:::open[What amount does a character carry at run time?]
Sekiro's recorded frames hold the authored value and no drawn program reads it; Elden Ring's character programs read a word that is 1 in all
seven undamaged sessions. Whether damage changes the word in either game needs a frame of a wounded character, and the Elden Ring
definition's own `FC_BloodAmount` value (to tell a stored 1 from an engine-written one) is not read here.
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

Over five frames at the Ashina Castle gate, with each draw tied to its FLVER mesh and material through the mesh buffer
(the buffer is the FLVER's data block as stored), the definition's values reach `cbMtdParam` as follows: 43,417 float
parameters as stored, bit for bit; 3,515 colours whose RGB is `pow(c, 2.2) * i` and not `c * i`, none the other way, and
7,891 that cannot tell the two apart (0 or 1), alpha as stored in all of them. :observed[five captured frames]{games="sekiro"}
The sky dome's material `m[sky]_skydome_night` is the exception: 9 of its colours and 9 of its floats hold other values
than its definition's in every frame, so the engine writes them at run time. :observed[five captured frames]{games="sekiro"}

The definition's alpha reference `g_AlphaRef` (two integers `a`, `b`) reaches `FC_AlphaRef` converted:
`x = (a - 0.0001) / 255`, or `-100` when `a` is 0, and `y = b / 255`. :observed[3,989 draws of five frames, bit for bit for
a = 64, 70, 96, 100 and 128 and b = 128 and 192]{games="sekiro"} The pixel programs discard where the tested alpha is below
`x` ([alpha inputs](/engines/fromsoft/materials/texture-scroll/#alpha-and-fade-inputs)), so `-100` is no test and
the small offset keeps a texel of exactly `a / 255`. :inferred{games="sekiro"} Raising `x` to 2 in a replay of one of the G-buffer
pass's depth-only draws (its colour writes masked off) leaves the depth it wrote in the game, 23.8% of the screen, unwritten.
:observed[one replayed draw]{games="sekiro"}

### Texture groups and tiling

With draws tied to their mesh and material through the mesh buffer, the `FC_TextureTilingScale` row of every material
texture a pixel program samples, at its register, is `(u, v, (1-u)/2, (1-v)/2)`, centred, in all 17,040 rows of five
frames at the Ashina Castle gate. :observed[five captured frames]{games="sekiro"} The scale comes from:

| Case | Scale in the row | Rows | Confidence |
|---|---|---:|---|
| The FLVER binding of the texture's kind has a path | the FLVER binding's scale (all 203 rows where it is not 1 match it, and 438 rows whose definition scale is not 1 hold the binding's 1) | 641 | :observed{games="sekiro"} |
| The binding's path is empty | the definition's texture scale (the two floats after its path) | 5,707 | :observed{games="sekiro"} |
| The binding's path is empty and the definition's scale is 0 | 1 | 10 | :observed{games="sekiro"} |
| The definition has `group_N_CommonUV-UVParam` parameters | one group's scale (240 rows), the definition's texture scale (20) or 1 (210, among them the character families' base textures) | 470 | :observed{games="sekiro"} |

Which group each texture belongs to is the metaparam's. Read from the rows instead, in the 121 rows of two Ashina frames whose texture has no
FLVER path and whose material has group parameters, `Character_AMSN_[DetailBlend]` textures 1 and 6 take `group_2`, textures 2 and 5 take
`group_3` and textures 10 and 12 take `group_4`, each with no row that contradicts it (the other group's non-unit scale never appears
in them), while textures 0, 3 and 7 (the base colour, normal and mask) take no group: their rows are 1 whichever scale a group holds.
:observed[121 rows of two captured frames]{games="sekiro"} Each pair is a detail colour with its normal map. :inferred{games="sekiro"}
A comparison with the metaparam's own table, which is not read here, would make it a rule.

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
Sekiro's tiling rows are all explained (above), the group case by the inferred membership. Elden Ring's non-unit FLVER scale precedence has no
decisive capture; placed assets whose two scales disagree would decide it, such as `AEG004_805` in `m60_42_37_00` (FLVER scale 2, UV
group scale 1) and `AEG007_200` in `m60_23_19_01` (160 against 30). The eye program is `P[ChrCustomize][Eye]_Gbuf`, the character-creator
family: its two draws per frame (one with the boolean set) hold the same words, colour 100/255 and scalar 0.024705887 among them, in seven
sessions, so nothing in the frames tells a stored value from one set at run time. The family name makes a customisation override likely, but
a frame with a different appearance chosen would decide it. :unknown
:::

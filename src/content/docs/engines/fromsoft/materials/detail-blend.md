---
title: Character detail blending
description: Executed detail-layer equations, texture roles, gloss and the two games' reflectance models.
implementations:
  - name: primase worlds/fromsoft (detail_derive.rs)
    url: https://github.com/Kalmarv/primase/blob/main/worlds/fromsoft/src/passes/detail_derive.rs
---

Character detail shaders multiply a base surface by tinted detail textures, blending the detail contributions with
weights from the base normal texture. The detail normal and gloss terms are combined alongside colour, rather
than replacing the base texture wholesale. :observed

## Equations and scope

Let `chain(x)` mean the first detail value followed by successive `lerp(previous,x_i,w_i)` operations. For the
checked detail form, colour before surface encoding is
`C = saturate(gain * A' * chain(tint_i * D_i.rgb))`, where `A'` is the base RGB, optionally desaturated toward
`dot(A.rgb,(0.29891,0.58661,0.11448))`. :observed

For the checked form, the tangent-space normal begins with
`xy = 2*N.xy-1`, `z = sqrt(1-min(dot(xy,xy),1))`, then adds
`normalStrength * (2*chain(K_i.xy)-1)` to XY. Detail normals therefore perturb XY without rebuilding Z from the
final sum. :observed

With `f = saturate(chain(reflectanceTerm_i))`, Sekiro's checked form writes
`albedo = (1-f)*C*colour` and `F0 = lerp(0.03,C,f)`. Elden Ring's inspected metallic form instead writes
`albedo = C*colour` and metallic `f`, leaving the lighting program to form its F0.
:observed

In one Stormveil frame the pixel programs of the `C[DetailBlend]` family fall into groups by their disassembly. `C[DetailBlend]_cloth_1_Gbuf_[A]` is
instruction for instruction the program `C[DetailBlend]_1_Gbuf_[A]` (the files differ only in the debug name), as are `C[Fur]_cloth_0_Gbuf_[A]` and
`C[Fur]_0_Gbuf_[A]`, so the cloth variants share the plain equation exactly and `VC_isEnableCloth` only changes the vertex stage. Switches 0, 1, 6, 13 and the
cloth variant share one depth-only program body and one motion-vector body (`_DptA`, `_Velo_[A]`); the `[S2]` motion-vector programs of switches 0, 1 and 6
share another. :observed{games="elden-ring"} The 16 G-buffer programs of the family have 15 distinct bodies; no two switches share one. Every one of
them writes the same 14 colour lanes and reads `SV_IsFrontFace`. The textures that feed the albedo grow with the switch as the plain equation's chain does:
registers t2 and t11 for switch 0, one more for switch 13 (t5) and 1 (t10), two for 6 (t5, t13); `[Rich]` 1 reads the same registers as plain 1; `[S2]` programs
add t4, t14 and t15 (and t13 or t5/t16 by switch) and feed the alpha lane from t0 and t1, which the plain programs do not. :observed{games="elden-ring"}
That fits the plain equation for the plain switches and the cloth variants, and shows the `[S2]` programs to be built on other inputs; the instruction counts of
`[Rich]` (766 operations against plain 1's 720) and `[S2]` 1 (848) say they add terms to the chain rather than replace it, which the disassembly was
not read far enough to prove. :inferred{games="elden-ring"}

:::open[Which other families share this equation?]
Only the cloth variants are shown to share the plain-family equation, and only by identical programs. The `[Rich]` and `[S2]` programs add instructions to
the same texture set or to a larger one; their equations (the S2 variant's alpha-driven overlay, the back-face branch, and any subsurface lane) were not
derived, and `C[Fur]` reads other textures (t1 and t5 for the albedo) so is not this equation. No new capture settles it: the frames already hold these programs and their draws, and what remains is executing
each `[Rich]` and `[S2]` program on designed samples as the Sekiro switches were; a capture of a character in the back-facing pose would only confirm the branch.
:::

## Sekiro

Sekiro's inspected `Character_AMSN_[DetailBlend]` switches 0, 13, 6 and 1, including their Paint variants, are
checked by executing the original programs on designed samples, 256 random sample sets and an additional 64
transition sets where applicable. Each decoded role agrees with the derived equation within
`64 * floatEpsilon * max(abs(a),abs(b),1)` under the supplied material words. This is a bounded execution proof
for those programs and states. :proven[executed programs]{games="sekiro"}

### Texture roles

For those Sekiro programs, the base colour, base normal and base mask are slots 1, 2 and 8. The detail colour/normal
pairs and their order vary by switch. :proven[executed programs]{games="sekiro"}

| Switch | Detail colour/normal slots, in order | Confidence |
|---|---|---|
| 0 | `(0,11)` | :proven[executed programs]{games="sekiro"} |
| 13 | `(0,11)`, `(3,5)` | :proven[executed programs]{games="sekiro"} |
| 6 | `(0,11)`, `(3,5)`, `(9,13)` | :proven[executed programs]{games="sekiro"} |
| 1 | `(7,10)`, `(0,11)` | :proven[executed programs]{games="sekiro"} |

### Gain, gloss and mask terms

Sekiro's checked switches have a measured gain of 4.55. This gain is separate from the material colour's intensity;
folding gain into tint is algebraically equivalent but can change float rounding. :proven[executed programs]{games="sekiro"}

Stored gloss is `saturate(2 * chain(scale_i) * chain(K_i.z + glossBias_i))`.
The inspected Sekiro switches usually take each scale from base-normal Z; switch 1's first detail instead uses
0.5. Its blend transition uses `min((22*N.z)^260,1)`. :proven[executed programs]{games="sekiro"}

Some terms depend on the base mask plus a bias, and some use a constant bias alone. In Sekiro's checked switches
0, 13 and 6, the first detail has the mask-dependent term; switch 1 places it on the second detail.
:proven[executed programs]{games="sekiro"}

### Lining programs

`Character_AMSN_[Lining][S2]_6_Gbuf` forms its albedo with the same gain and chain shape, over logical textures:
`base = Texture2D_1 * cb1[24]`, then `lerp(base, Texture2D_10 * cb1[28], w1)` and
`lerp(previous, Texture2D_4 * cb1[26], w2)`, multiplied by `Texture2D_7.rgb` and by 4.55. The result is then blended
toward a further colour scaled by `cb1[29]`, by that colour's alpha, and saturated. `cb1[N]` is row `N` of constant
buffer 1; `w1` and `w2` are alphas computed earlier in the program. :observed[static reading of one program]{games="sekiro"}
`Texture2D_7` is the base albedo here as in DetailBlend; on `c7100`'s armour material it is `c7100_armor_a`, and
`Texture2D_10` is `metal01`. :observed{games="sekiro"} That material gives no texture path for `Texture2D_1` or
`Texture2D_4` in either the FLVER or its definition, so what those detail colours read is whatever the game binds to
an unbound slot (see [FLVER material bindings](/engines/fromsoft/materials/flver-bindings/)). :observed{games="sekiro"}

The gain fits a mid-grey detail: a texel stored as sRGB 128 is about 0.216 linear, and 0.216 × 4.55 ≈ 0.98, so an
sRGB-grey detail leaves the base albedo almost unchanged. A linear 0.5 in the same place multiplies it by about 2.3 and
saturates bright bases. :inferred{games="sekiro"}

## Elden Ring

Elden Ring's inspected `C[DetailBlend]` family uses a different slot assignment: slot 7 is base albedo, slot 0
is the base normal whose alpha supplies blend masks, and slots 1, 10 and 4 provide shared detail albedos.
:observed{games="elden-ring"}

### Alpha test

The alpha-tested `C[DetailBlend]_0_Gbuf_[A].ppo` tests a scalar that no target receives. It forms
`S = Texture2D_7.a * Texture2D_1.a` (base albedo alpha times the first shared detail's alpha) and discards when
`S + (ditherAlpha - 0.5) * scale < reference`, the reference and scale being words 4 and 5 of its third constant
buffer. `S` has no data path to an output: the target alphas hold instance words or constants, chosen by
`FC_AlphaRef.z`. The written alpha of this program is therefore not its coverage, which comes from the tested
product. :observed[static reading of the program]{games="elden-ring"}

Three `c3000` materials use it: two `C[c3000]_WP_Sword_Leather` variants, with reference 8/255, and `C[c3000]_Thorn`,
with 50/255. In 64 captured draws of them (26 leather, 38 thorn), all 60 stated words of the first and third
constant buffers equal the material's values, all eight target blends are disabled and alpha-to-coverage is off.
:observed[64 captured draws]{games="elden-ring"}

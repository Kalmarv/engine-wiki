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

Sekiro's inspected `Character_AMSN_[DetailBlend]` switches 0, 13, 6 and 1, including their Paint variants, are
checked by executing the original programs on designed samples, 256 random sample sets and an additional 64
transition sets where applicable. Each decoded role agrees with the derived equation within
`64 * floatEpsilon * max(abs(a),abs(b),1)` under the supplied material words. This is a bounded execution proof
for those programs and states. :proven[executed programs]{games="sekiro"}

## Texture roles

For those Sekiro programs, the base colour, base normal and base mask are slots 1, 2 and 8. The detail colour/normal
pairs and their order vary by switch. :proven[executed programs]{games="sekiro"}

| Switch | Detail colour/normal slots, in order | Confidence |
|---|---|---|
| 0 | `(0,11)` | :proven[executed programs]{games="sekiro"} |
| 13 | `(0,11)`, `(3,5)` | :proven[executed programs]{games="sekiro"} |
| 6 | `(0,11)`, `(3,5)`, `(9,13)` | :proven[executed programs]{games="sekiro"} |
| 1 | `(7,10)`, `(0,11)` | :proven[executed programs]{games="sekiro"} |

Elden Ring's inspected `C[DetailBlend]` family uses a different slot assignment: slot 7 is base albedo, slot 0
is the base normal whose alpha supplies blend masks, and slots 1, 10 and 4 provide shared detail albedos.
:observed{games="elden-ring"}

## Equations and scope

Let `chain(x)` mean the first detail value followed by successive `lerp(previous,x_i,w_i)` operations. For the
checked detail form, colour before surface encoding is
`C = saturate(gain * A' * chain(tint_i * D_i.rgb))`, where `A'` is the base RGB, optionally desaturated toward
`dot(A.rgb,(0.29891,0.58661,0.11448))`. :observed

Sekiro's checked switches have a measured gain of 4.55. This gain is separate from the material colour's intensity;
folding gain into tint is algebraically equivalent but can change float rounding. :proven[executed programs]{games="sekiro"}

For the checked form, the tangent-space normal begins with
`xy = 2*N.xy-1`, `z = sqrt(1-min(dot(xy,xy),1))`, then adds
`normalStrength * (2*chain(K_i.xy)-1)` to XY. Detail normals therefore perturb XY without rebuilding Z from the
final sum. :observed

Stored gloss is `saturate(2 * chain(scale_i) * chain(K_i.z + glossBias_i))`.
The inspected Sekiro switches usually take each scale from base-normal Z; switch 1's first detail instead uses
0.5. Its blend transition uses `min((22*N.z)^260,1)`. :proven[executed programs]{games="sekiro"}

With `f = saturate(chain(reflectanceTerm_i))`, Sekiro's checked form writes
`albedo = (1-f)*C*colour` and `F0 = lerp(0.03,C,f)`. Elden Ring's inspected metallic form instead writes
`albedo = C*colour` and metallic `f`, leaving the lighting program to form its F0.
:observed

Some terms depend on the base mask plus a bias, and some use a constant bias alone. In Sekiro's checked switches
0, 13 and 6, the first detail has the mask-dependent term; switch 1 places it on the second detail.
:proven[executed programs]{games="sekiro"}

:::open[Which other families share this equation?]
The demonstrated form does not cover every DetailBlend-labelled program. Elden Ring's S2 variant has an
alpha-driven overlay and a back-face branch, and SSS variants write an additional subsurface lane; neither is
established by the plain-family equation. :observed{games="elden-ring"}
:::

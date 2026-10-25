---
title: G-buffer surface encoding
description: Deferred render targets, normal bias, gloss, reflectance, metallic and emission.
implementations:
  - name: primase worlds/fromsoft (game.rs)
    url: https://github.com/Kalmarv/primase/blob/main/worlds/fromsoft/src/game.rs
---

G-buffer programs write surface properties into five render targets. Deferred lighting interprets them by target
and channel; Sekiro and Elden Ring assign different meanings to parts of target 1 and target 3. :observed

The table follows the inspected material writers and `GXLightAcc_DDirLight1.ppo` readers, with Sekiro's point-light
program checked as well. It does not assign a surface meaning merely because a target contains a nonzero value.
:observed

| Target/lane | Sekiro | Elden Ring | Confidence |
|---|---|---|---|
| 0 RGB | Biased world normal | Biased world normal | :observed |
| 0 A | Meaning not established | Meaning not established | :unknown |
| 1 R | Gloss | Metallic | :observed |
| 1 G | Diffuse wrap term, used where positive | Gloss | :observed |
| 1 B | Meaning not established | Read multiplied by 10; meaning not established | :unknown |
| 1 A | Meaning not established | Meaning not established | :unknown |
| 2 RGB | Albedo | Albedo | :observed |
| 2 A | Meaning not established | Read as an integer after multiplication by 255; meaning not established | :unknown |
| 3 RGB | Square root of reflectance F0 | Meaning not established | :observed{games="sekiro"} :unknown{games="elden-ring"} |
| 3 A | Light-group selector | Meaning not established | :observed{games="sekiro"} :unknown{games="elden-ring"} |
| 4 RGB | Emission radiance | Emission radiance | :observed |
| 4 A | Meaning not established | Meaning not established | :unknown |

## Normal, gloss and reflectance

Both games' writers encode a world normal as `n * 0.5 + b`, where `b` has float bits `0x3F002008`
(approximately 0.50048876). The lighting path decodes with `x*2-1` and normalizes. :observed

The surface-only gloss interpretation is `roughness = 1 - 0.95*sqrt(gloss)`. The directional light additionally
uses `sqrt(k*gloss)`, with `k = 1 - 0.75*0.1/w`, where `w` is a light-direction constant; the captured runtime
distribution of that constant is not established. :observed

Sekiro reconstructs `F0 = RT3.rgb * RT3.rgb` and uses it in the Schlick term
`F0 + (1-F0)*(1-dot(L,H))^5`. Elden Ring instead forms `F0 = lerp(0.04,albedo,metallic)`.
:observed

Sekiro's target-3 alpha selects the light group: `int(alpha*255)*18` identifies its first row in the light buffer.
The target-1 green value modifies the diffuse wrap term with factors 10 and 20 where it is positive.
:observed{games="sekiro"}

## Emission and normal-map basis

Among 100 Elden Ring G-buffer programs inspected from c2010, c2050, c2120 and Liurnia, target-4 RGB carries either
zero or radiance, not a mask or velocity. Emissive families multiply colour, intensity and the emissive map by
`SC_PreExposure`; the alpha lane has a separate unresolved meaning. :observed{games="elden-ring"}

For the inspected ordinary layered programs, sampled normal X follows `cross(N,T)*T.w`, and sampled normal Y
follows `T`. SpeedTree programs use a different stored tangent convention, described under
[SpeedTree](/engines/fromsoft/vegetation/speedtree/). :observed

:::open[What do the remaining channels encode?]
The inspected lighting programs do not consume every target or lane. Elden Ring's target-1 blue and target-2
alpha are read, but their complete meaning remains unresolved; target-4 alpha cannot be inferred from RGB's
emission role. :unknown
:::

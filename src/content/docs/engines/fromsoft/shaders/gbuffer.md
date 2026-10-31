---
title: G-buffer surface encoding
description: Deferred render targets, normal bias, gloss, reflectance, metallic and emission.
implementations:
  - name: "primase worlds/fromsoft (game.rs, Shading::gbuffer)"
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

No pass keeps the normal map's variance. Each G-buffer program that reads a normal map decodes its red and green as
`2t - 1`, rebuilds `z = sqrt(1 - saturate(dot(xy, xy)))`, normalizes the result of the tangent frame and writes that, and
`dot(xy, xy)` has no other use: no Toksvig- or LEAN-style roughness term. :observed[every use of the self-dot in the 42
G-buffer pixel programs drawn at Sekiro's `m11_01` (40 of which unpack a normal) and in 28 of Elden Ring's] Elden Ring's deferred
light programs `GXLightAcc_DDirLightShadowed1`, `GXLightAcc_DPointLight1`, `GXLightAcc_DSpotLight1` and
`GXLightDeferredAOEnvMapRegionFresnelPreMultiply` load target 0's RGB, decode it as `2t - 1` and use its squared length only
through `rsqrt` to rescale it to unit length, so the stored normal's length carries nothing either; they read the gloss
from target 1's green (`sqrt`, then the remap below). The point light widens the roughness by a term of the light's
distance and size, `(1 / (3.5x² + 5))^0.25`, an area-light correction, not by normal variance. :observed[the DXIL of these
four programs]{games="elden-ring"}

The surface-only gloss interpretation is `roughness = 1 - 0.95*sqrt(gloss)`. The directional light additionally
uses `sqrt(k*gloss)`, with `k = 1 - 0.75*0.1/w`, where `w` is a light-direction constant; the captured runtime
distribution of that constant is not established. :observed Elden Ring's directional light forms
`r = 1 - 0.95*sqrt(k*gloss)` per light and uses `α = r²` in its GGX distribution, which therefore evaluates `r⁴`.
:observed{games="elden-ring"}

Sekiro reconstructs `F0 = RT3.rgb * RT3.rgb` and uses it in the Schlick term
`F0 + (1-F0)*(1-dot(L,H))^5`. Elden Ring instead forms `F0 = lerp(0.04,albedo,metallic)`.
:observed

## Emission and normal-map basis

A normal texture's blue channel is not the normal's Z: the programs rebuild Z from red and green. :observed In
Ashina Castle's normal maps, blue averages 38 to 64 of 255, far from the Z that red and green imply.
:observed{games="sekiro"} Elden Ring's inspected G-buffer programs write normal-texture blue as gloss (target 1 G).
:observed{games="elden-ring"}

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

## Sekiro

### Reflectance, light groups and diffuse wrap

In the inspected Sekiro Multiple, MultipleGround and Multiple_Emissive switch population, the constant dielectric
encoding is RGB float bits `0x3E315CAC`, whose square is approximately 0.03. Multiple switch 18 has variable
reflectance, so the constant value is not a rule for every switch. :observed{games="sekiro"}

Sekiro's target-3 alpha selects the light group: `int(alpha*255)*18` identifies its first row in the light buffer.
In a frame at the Ashina Castle gate, of the 1,695,266 pixels with geometry, 1,531,746 select group 1, 163,465 group 3 and
55 group 0; group 1's first diffuse colour is (1.25, 0.769, 0.433, 1.5625). These are indices into the frame's buffer, not
yet tied to the light sets' file IDs. :observed[one frame, the target read back]{games="sekiro"}
The target-1 green value modifies the diffuse wrap term with factors 10 and 20 where it is positive.
:observed{games="sekiro"}

## Elden Ring

### Combining the light

After the lights accumulate, `GXLightCmbAlbedo` outputs `A*(1-m)` from target-2 albedo and target-1 metallic and is
drawn with blend `DEST_COLOR / ZERO`, so it multiplies the accumulated diffuse light by the diffuse albedo.
`GXLightComposite` then sums diffuse, specular and emission. The programs and a Limgrave capture agree on both.
:observed{games="elden-ring"}

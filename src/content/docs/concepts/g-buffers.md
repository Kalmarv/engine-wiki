---
title: G-buffers
description: Deferred surface outputs, normal encoding and engine-specific gloss, roughness and specular conventions.
---

G-buffer material programs write surface properties for a later lighting pass. A target number or channel alone does
not identify a property across engines, games or shader families. Each row links to the page that states it, with its
confidence.

| Engine / game or class | Colour | Normal | Surface response and other outputs | Detail |
|---|---|---|---|---|
| FromSoftware / Sekiro | RT2 RGB albedo | RT0 RGB biased world normal | RT1 R gloss, G diffuse wrap; RT3 RGB square root of F0, A light-group selector; RT4 RGB emission | [Surface encoding](/engines/fromsoft/shaders/gbuffer/) |
| FromSoftware / Elden Ring | RT2 RGB albedo | RT0 RGB biased world normal | RT1 R metallic, G gloss; RT4 RGB emission. RT1 B, RT2 A and RT3 semantics are not established | [Surface encoding](/engines/fromsoft/shaders/gbuffer/) |
| Anvil / Riders Republic, class 1 | o0 RGB base colour | o1 XYZ packs octahedral world normal and class | o0 W perceptual roughness, o1 W metalness, o2 XY motion, Z emissive scalar, o3 X AO | [Shading classes](/engines/anvil/shaders/gbuffer/) |
| Anvil / Riders Republic, classes 3–5 | o0 RGB base colour | Same packed normal/class representation | o1 W AO rather than metalness; o2 Z specular occlusion, W translucency; o3 X is family-specific | [Shading classes](/engines/anvil/shaders/gbuffer/) |
| RAGE / inspected GTA V Enhanced deferred programs | RT0 RGB diffuse, A draw-state byte | RT1 RGB usually `0.5*N + 0.5`; A supplies additional precision in some effects | RT2 R `sqrt(intensity)`, G `sqrt(falloff / 512)`, B Fresnel; RT3 carries AO and emission/16; RT4 RG screen displacement | [Deferred shading](/engines/rage/shaders/deferred-shading/) |
| Frostbite / measured skate. programs | Semantic assignment not established | `T0.xy = 0.4995*v + 0.4995` pairs with consumer `2*x-1`; a normal interpretation is not established | Large sampled lighting programs read t4–t8 directly; binding names do not establish channel semantics | [Measured pairing](/engines/frostbite/shaders/measured-program-behaviour/) |
| ForzaTech / inspected FH6 world families | RT0 RGB holds albedo for the listed ordinary families, but water families differ | World-family formulas establish different normal inputs and blends; no universal target layout is stated on that page | Family formulas establish roughness and metalness; RT1 XYZ carries the described distance-dependent emissive term | [World-family outputs](/engines/forzatech/shaders/world-families/) |

## Normal encodings

FromSoftware's inspected writers use `n * 0.5 + b`, with bias bits `0x3F002008`; lighting decodes with `2*x-1` and
normalizes. Anvil quantizes two octahedral components to nine bits, distributing high bits, a sign and the class into
o1 Z. RAGE twiddle effects quantize normal RGB and store residual bits in alpha. See
[FromSoftware normals](/engines/fromsoft/shaders/gbuffer/), [Anvil packing](/engines/anvil/shaders/gbuffer/)
and [RAGE precision](/engines/rage/shaders/deferred-shading/).

Frostbite's measured producer/consumer arithmetic establishes an encoding pair but does not establish what the pair
represents or a normal-unfolding step. It remains unresolved on the [measured-program page](/engines/frostbite/shaders/measured-program-behaviour/).

## Gloss, roughness and reflectance

The inspected FromSoftware surface gloss maps to `roughness = 1 - 0.95*sqrt(gloss)`; its directional light adds a
light-constant-dependent modification. Sekiro reconstructs F0 by squaring RT3 RGB, while Elden Ring forms
`lerp(0.04, albedo, metallic)`. See [gloss and reflectance](/engines/fromsoft/shaders/gbuffer/).

Anvil's Tex1 forward program clamps perceptual roughness to at least .045 and squares it for GGX alpha. Its deferred
non-metal classes use F0 .04 rather than interpreting AO as metalness. See [shading-class consumers](/engines/anvil/shaders/gbuffer/).

The inspected RAGE light reconstructs specular intensity as `RT2.x²` and falloff as `RT2.y² * 512`, then derives a
piecewise exponent. Those channels are not documented as metallic/roughness. See [specular reconstruction](/engines/rage/shaders/deferred-shading/).

:::open[What do the remaining outputs mean?]
Unresolved outputs stay scoped to their programs: [FromSoftware's remaining lanes](/engines/fromsoft/shaders/gbuffer/),
[Anvil's fragment-recording consumer](/engines/anvil/shaders/gbuffer/), [Frostbite's semantic pairing](/engines/frostbite/shaders/measured-program-behaviour/)
and [ForzaTech's emissive distance compensation](/engines/forzatech/shaders/world-families/) are separate open questions.
:::

---
title: Particle materials
description: "How a particle material's defines, states and sampler decide what a particle effect's quads draw: the alpha test, which drops the tint's alpha, blending and texture filtering."
sources:
  - title: bridge. (vanilla resource pack copy)
    url: https://github.com/bridge-core/bridge./tree/e3f00f6f649263383c96d578b9409dcb0fbf25cd/static/vanilla/RP/materials
    note: "the vanilla materials/particles.material of the 1.16 releases"
  - title: RenderDragonSourceCodeInv
    url: https://github.com/devendrn/RenderDragonSourceCodeInv/blob/1.20.20/materials/Particle/src/Particle.fragment.sc
    note: "the Particle material's fragment shader, reconstructed from the compiled material of the 1.20.20 renderer"
---

A particle effect names one material (`basic_render_parameters.material`) and one texture; every quad of the effect
draws with them. :sourced[bridge. (vanilla resource pack copy)] Materials are declared in `materials/particles.material`
as `name:parent` entries that add defines (`+defines`), render states (`+states`), sampler states (`+samplerStates`) and
blend factors (`blendSrc`, `blendDst`) over their parent's, in the same format as
[entity materials](/engines/bedrock/materials/entity-materials/). :sourced[bridge. (vanilla resource pack copy)]

## Vanilla materials

| Material | Defines and states | Confidence |
|---|---|---|
| `particles_base` | The texture sampled with `Point` filtering (`samplerIndex` 0); no defines or states | :sourced[bridge. (vanilla resource pack copy)] |
| `particles_opaque` | `ENABLE_FOG`, `DisableAlphaWrite` | :sourced[bridge. (vanilla resource pack copy)] |
| `particles_alpha` | `ALPHA_TEST`, `ENABLE_FOG`, `DisableAlphaWrite` | :sourced[bridge. (vanilla resource pack copy)] |
| `particles_blend` | `ENABLE_FOG`, `Blending`, `DisableCulling`, `DisableDepthWrite` | :sourced[bridge. (vanilla resource pack copy)] |
| `particles_effects` | `particles_alpha` + `EFFECTS_OFFSET` | :sourced[bridge. (vanilla resource pack copy)] |

## The fragment shader

The fragment shader samples the texture, then multiplies the texel by the vertex colour (the effect's
`particle_appearance_tinting` colour) and applies fog to the colour channels. :sourced[RenderDragonSourceCodeInv]
With `ALPHA_TEST` it discards a fragment whose **texel** alpha is below 0.5, tested before the tint, and after the tint
and fog it writes an alpha of 1.0. :sourced[RenderDragonSourceCodeInv] Without `ALPHA_TEST` it discards nothing.
:sourced[RenderDragonSourceCodeInv]

Two consequences follow from that order. :inferred An alpha-tested material ignores the tint's alpha: a
`particles_alpha` effect whose tint gradient fades the alpha to 0 stays fully drawn until it expires, and only a
texture's own cut-out shapes it. :inferred An alpha-tested material that also blends (a pack's `ALPHA_TEST` material with
`Blending` and `blendSrc: SourceAlpha`, `blendDst: One`) adds each surviving texel's colour at full weight, and draws
nothing at all from a texture whose alpha stays below 0.5 everywhere, such as a soft glow. :inferred

:::open[Does the current renderer's particle shader keep this order?]
The shader above is reconstructed from the 1.20.20 renderer; later renderers' particle shaders are not published.
:::

---
title: Entity materials
description: "How an entity material's defines select the entity shader's alpha test, colour mask, overlay, emissive light and texture animation, and where the colours they read come from."
sources:
  - title: bridge. (vanilla resource pack copy)
    url: https://github.com/bridge-core/bridge./tree/e3f00f6f649263383c96d578b9409dcb0fbf25cd/static/vanilla/RP/materials
    note: "the vanilla materials/entity.material of the 1.16 releases (188 materials)"
  - title: SlimeChunkDisplay (shader pack)
    url: https://github.com/lonelyang/SlimeChunkDisplay/tree/main/shaders/glsl
    note: "a pack built on the vanilla GLSL entity.vertex and entity.fragment of the same renderer; other packs derived from them (OSBES, ESTN, newb) carry the same colour lines"
  - title: Mojang bedrock-samples
    url: https://github.com/Mojang/bedrock-samples
    note: vanilla resource and behaviour packs, v1.26.60.5
---

An entity material is a named set of shader defines and render states. A client entity maps its own material names to
these (`"default": "cat"`), and a render controller assigns them to bones; each define switches on one stage of the
entity shader. :sourced[bridge. (vanilla resource pack copy)] Materials are declared in `materials/entity.material` as
`name:parent` entries that add or remove defines (`+defines`, `-defines`) and states (`+states`, such as `Blending`,
`DisableCulling`, `DisableDepthWrite`, `DisableAlphaWrite`) over their parent's. :sourced[bridge. (vanilla resource pack copy)]
None of the 226 tagged bedrock-samples releases carries a `resource_pack/materials` folder. :observed[every bedrock-samples tag]
Materials newer than the 1.16 file (`warden_bioluminescent_layer`, `player_spectator`, `copper_golem`, `allay`) are
named by the vanilla client entities but defined neither in the 1.16 file nor in any samples release; a code search of GitHub for
`warden_bioluminescent_layer` finds only client entity and texture files. :observed[GitHub code search for warden_bioluminescent_layer]

## What the defines do

The stages below are those of the 1.16-era GLSL entity shader, in the order the fragment shader runs them: texture,
alpha test, vertex colour, colour mask, multi-texture, overlay, light, fog, glint. :sourced[SlimeChunkDisplay (shader pack)]

| Define | Effect | Confidence |
|---|---|---|
| `ALPHA_TEST` | Discards a texel with alpha below 0.5; with `USE_COLOR_MASK`, only a texel with alpha 0; with `USE_EMISSIVE`, only a texel whose `r + g + b + a` is 0 (with `USE_ONLY_EMISSIVE`, alpha 0 or 1) | :sourced[SlimeChunkDisplay (shader pack)] |
| `USE_COLOR_MASK` | `rgb = mix(rgb, rgb * CHANGE_COLOR.rgb, a)`, then `a *= CHANGE_COLOR.a`: the texel's own alpha is how far the change colour tints it | :sourced[SlimeChunkDisplay (shader pack)] |
| `MULTI_COLOR_TINT` | The texture is a mask: `rgb = mask.r * CHANGE_COLOR.rgb`, replaced by `mask.g * MULTIPLICATIVE_TINT_CHANGE_COLOR` wherever `mask.g` is above 0 | :sourced[SlimeChunkDisplay (shader pack)] |
| `USE_OVERLAY` | `rgb = mix(rgb, OVERLAY_COLOR.rgb, OVERLAY_COLOR.a)`, before the light | :sourced[SlimeChunkDisplay (shader pack)] |
| `USE_EMISSIVE` | `color *= mix(1, light, a)` instead of `color *= light`: a texel takes the light by its alpha, so a transparent texel draws at full brightness | :sourced[SlimeChunkDisplay (shader pack)] |
| `TINTED_ALPHA_TEST` | The alpha test runs on `a * OVERLAY_COLOR.a` | :sourced[SlimeChunkDisplay (shader pack)] |
| `USE_UV_ANIM` | In the vertex shader, `uv = UV_ANIM.xy + uv * UV_ANIM.zw` | :sourced[SlimeChunkDisplay (shader pack)] |

The base `entity` material defines `USE_OVERLAY`, so nearly every entity material inherits it. :sourced[bridge. (vanilla resource pack copy)]

## Vanilla materials that read these colours

| Material | Parent and additions | Confidence |
|---|---|---|
| `entity` | `entity_static` + `USE_OVERLAY`; culled, opaque. `chicken` and `fox` are plain `entity` | :sourced[bridge. (vanilla resource pack copy)] |
| `entity_alphatest` | `entity_nocull` + `ALPHA_TEST` | :sourced[bridge. (vanilla resource pack copy)] |
| `entity_alphablend` | `entity` + state `Blending`, with a vertex colour; culled | :sourced[bridge. (vanilla resource pack copy)] |
| `entity_emissive_alpha` | `entity_nocull` + `ALPHA_TEST`, `USE_EMISSIVE` | :sourced[bridge. (vanilla resource pack copy)] |
| `villager_v2` | `entity_alphatest` with `depthFunc` `LessEqual` | :sourced[bridge. (vanilla resource pack copy)] |
| `entity_change_color` | `entity_nocull` + `USE_OVERLAY`, `USE_COLOR_MASK` | :sourced[bridge. (vanilla resource pack copy)] |
| `entity_alphatest_change_color` | `entity_change_color` + `ALPHA_TEST`, `USE_COLOR_MASK`, state `DisableAlphaWrite` | :sourced[bridge. (vanilla resource pack copy)] |
| `cat` | `entity_alphatest_change_color` | :sourced[bridge. (vanilla resource pack copy)] |
| `wolf`, `sheep` | `entity_change_color` | :sourced[bridge. (vanilla resource pack copy)] |
| `experience_orb` | `entity` + the defines `USE_UV_ANIM`, `ALPHA_TEST`, `Blending`, `USE_OVERLAY`, `USE_MASK` (`Blending` listed as a define, not a state) | :sourced[bridge. (vanilla resource pack copy)] |
| `charged_creeper` | `entity_static` + `USE_UV_ANIM`, `ALPHA_TEST`, additive blending (`One`, `One`) | :sourced[bridge. (vanilla resource pack copy)] |

## Where the colours come from

- **`CHANGE_COLOR`** is the render controller's `color` when it has one, and otherwise the entity's own colour, its
  behaviour component `minecraft:color` (a tame cat's or wolf's collar, a sheep's wool; see
  [behaviour components](/engines/bedrock/data-model/behaviour-components/)). :inferred This fits the vanilla data:
  the cat, wolf and sheep materials mask by it while their render controllers set no `color`, and the horse's
  controller gives `this` as the fallback of its armour-dye `color`. :inferred
- **`OVERLAY_COLOR`** is the render controller's `overlay_color`. :inferred
- **`UV_ANIM`** is the render controller's `uv_anim` (`offset` in `xy`, `scale` in `zw`). :inferred

### Tame cat textures

The tame cat textures mark the collar for the colour mask: in 24 of the 25 vanilla `*_tame*.tga` cat textures, the
16 collar texels have alpha 255 and the rest of the body alpha 4 (adults) or 1 (babies), so the body is drawn (alpha
above 0 passes the colour-mask alpha test) and barely tinted while the collar takes the collar colour in full.
:observed[the 25 tame cat textures of bedrock-samples v1.26.60.5] `graytabby_tame.tga` holds only the 16 collar texels.
:observed[the 25 tame cat textures of bedrock-samples v1.26.60.5] Drawn with a plain alpha test (below 0.5 discarded),
a tame cat would show only its collar. :inferred

:::open[Do the current renderer's materials keep these rules?]
The game has since moved to a renderer that compiles its materials, and no material file of it is published. Whether
the newer materials (`warden_bioluminescent_layer`, whose controllers pulse `color.a`, and `player_spectator`, drawn
with a `color` alpha of 0.3) use `USE_COLOR_MASK` or another stage to apply that alpha is not known.
:::

---
title: Level materials and transparency
description: "The materials of STUNTBOOST's level glTFs: bake materials, physics materials, prop materials, and the rules for transparent nodes (the Transparent(a) call and its alpha)."
games: [stuntboost]
sources:
  - title: StuntboostTools
    url: https://github.com/bytinggames/StuntboostTools
    note: the node name grammar
  - title: KHR_materials_specular
    url: https://github.com/KhronosGroup/glTF/tree/main/extensions/2.0/Khronos/KHR_materials_specular
    note: the extension the bake's direct-light mask is stored in
---

A level part's glTF has 1,534 materials in total across the 159 parts; every one is `OPAQUE`. :proven{games="stuntboost"} They
fall into three kinds. :observed{games="stuntboost"}

| Kind | Content | Confidence |
|---|---|---|
| bake material | the base colour texture is the baked atlas (`Bake<N>_Denoised`, lighting baked in); the `KHR_materials_specular` colour texture is the bake's direct-light mask, not a specular colour ([baked lighting](/engines/monogame/lighting/baked-lighting/)) | :observed{games="stuntboost"} |
| physics material | a name beginning `C_`, on collision geometry only ([collision](/engines/monogame/collision/collision-model/#physics-materials)); 1,099 of the 1,534 materials are physics materials (28 distinct names), the other 435 are bake and prop materials | :observed{games="stuntboost"} |
| prop material | an ordinary glTF material of a model; emissive strength in 26 parts (`KHR_materials_emissive_strength`) | :observed{games="stuntboost"} |

Textures are sampled with the glTF samplers: each part has a sampler with nearest magnification and nearest-mipmap-linear
minification (9728 and 9984; 159 samplers over the 159 parts), and 3 further samplers are linear (9729 and 9987).
:proven{games="stuntboost"} No sampler states wrap modes, which for glTF means repeat. :proven{games="stuntboost"} The images are
separate files ([textures](/engines/monogame/textures/xnb-textures/)).

## Transparent nodes

A node whose name contains `Transparent` is drawn sorted back to front. 870 nodes do over all levels. :observed{games="stuntboost"}
The call `Transparent(a)` (`SE.Transparent`) makes a transparent entity with alpha *a*:

- Its draw multiplies the shader's `Color` constant (register `c25`, all four channels, times the albedo and the vertex colour) by
  *a* and turns diffuse lighting off. :observed{games="stuntboost"}
- Only *a* < 1 goes to the back-to-front transparency batch. A node with *a* ≥ 1 is drawn at once, opaque, *a* times brighter.
  :observed{games="stuntboost"}
- The one node with *a* > 1 in the shipped data is `hang_sack=Transparent(1.5)`, in 18 levels, drawn with the room's bake
  material. :observed{games="stuntboost"}

The `Transparent` call is on 619 nodes as the first class; related props are `CDCaseTransparent`, `CassetteCaseTransparent` and
`TransparentBowl`. :observed{games="stuntboost"}

## Shadows

A `BackfaceShadowCaster()` mesh (every room's `ceiling°=BackfaceShadowCaster()`) is drawn only into the static shadows, never
visibly. :observed{games="stuntboost"} A `*` node casts into the bake without being baked to; a `°` node is invisible in the bake
([node names](/engines/monogame/gameplay/node-names/)). :sourced[StuntboostTools]

---
title: Material models
description: Material definitions, shader bindings, texture resolution and layered surfaces across engines.
---

A material connects geometry to shader programs and their inputs. A definition, an instance value and a shader
register need not identify the same thing. Each row links to the page that states it, with its confidence.

| Engine / game | Definition and instance | Binding | Detail |
|---|---|---|---|
| FromSoftware / Sekiro | MTD declares shader, typed parameters and textures; FLVER supplies definition references and texture overrides | Static switches select compiled programs; texture kind names and shader-data indices are separate from program registers | [MTD](/engines/fromsoft/materials/mtd/), [FLVER bindings](/engines/fromsoft/materials/flver-bindings/) |
| FromSoftware / Elden Ring | MATBIN stores shader/source paths, parameters and samplers behind a FLVER `.matxml` reference | METAPARAM supplies constant offsets, colour flags and UV groups; system textures can fill otherwise unbound slots | [MATBIN](/engines/fromsoft/materials/matbin/), [METAPARAM](/engines/fromsoft/materials/metaparam/), [FLVER bindings](/engines/fromsoft/materials/flver-bindings/) |
| Anvil / Riders Republic | Material references a MaterialTemplate and a 19-entry TextureSet and overrides typed properties | Template operators supply selectors and defaults; shader texture register and TextureSet slot differ. Complete runtime fallback order is not established | [Material and TextureSet](/engines/anvil/materials/material/) |
| RAGE / GTA V Enhanced | Drawable shader groups own effect-hash shader records, typed parameters, buckets and optional embedded textures | Parameter-info words distinguish textures, other references, samplers and buffer data; compiled programs and states live in SGD2 | [Enhanced parameters](/engines/rage/materials/enhanced-parameters/), [SGD2](/engines/rage/shaders/sgd2/) |
| Frostbite / skate. | MeshSet section material keys resolve in loaded ShaderBlockDepots; depots contain parameters rather than executable shaders | Texture values reference TextureAsset instance and EBX file GUIDs. Loaded cell-bundle membership registers a depot without an explicit EBX reference | [ShaderBlockDepots](/engines/frostbite/materials/shader-block-depots/) |
| ForzaTech / FH6 | Model MatI instances inherit through `.materialbin` parents to `.shaderbin` defaults | Nearest parameter definition wins. Per-family maps connect parameter hashes to buffer offsets, texture slots and samplers | [Material inheritance](/engines/forzatech/materials/materialbin/), [shader maps](/engines/forzatech/shaders/shaderbin/) |
| Unity / documented players | Material objects reference Shader objects and store named textures, scales, offsets, floats and colours | Keywords and the supported subshader/pass determine programs; pass state and material properties control blending and culling | [Materials](/engines/unity/materials/materials/), [draw keywords](/engines/unity/shaders/draw-keywords/) |
| Insomniac / Sunset Overdrive | Model material entries store `.material` path and name offsets | The submesh material-index interpretation follows ALERT and remains inferred in the model layout | [Model materials](/engines/insomniac/geometry/model/) |
| SEGA Ninja / SA2B | Ginja mesh parameters express GX state, persisting between meshes and from opaque into translucent lists | VertexDiffuse selects vertex colour versus the DiffuseColor register; texture tile words select per-axis wrapping | [Ginja material state](/engines/ninja/geometry/landtables-and-models/) |

## Texture identity and register identity

Sekiro's DetailBlend base albedo is logically `Texture2D_7` but uses register 1; its detail albedo `Texture2D_2` uses
register 7. Anvil likewise distinguishes the template's shader register from the selector's TextureSet slot. In
ForzaTech, some different parameter hashes even have the same displayed name, and shader maps select the active hash.
See [FLVER logical slots](/engines/fromsoft/materials/flver-bindings/), [Anvil selectors](/engines/anvil/materials/material/)
and [ForzaTech parameter identities](/engines/forzatech/materials/materialbin/).

## Layering is shader-specific

| Engine / family | How surfaces combine | Detail |
|---|---|---|
| FromSoftware / inspected layered families | Vertex attributes, masks and constants drive surface blending; Elden Ring's inspected overlay has a different weight per colour channel | [Layered surfaces](/engines/fromsoft/materials/layered-surfaces/) |
| FromSoftware / character DetailBlend | Tinted detail textures multiply the base surface; detail normals and gloss combine alongside colour. Slot assignments differ between Sekiro and Elden Ring | [Detail blending](/engines/fromsoft/materials/detail-blend/) |
| RAGE / terrain | Four colour/normal layers use weights from vertex colour or lookup masks; the weights sum to `1-r` rather than one | [Terrain blending](/engines/rage/terrain/layer-blending/) |
| Frostbite / measured stock world objects | `u51.x = 1` selects a secondary texture set; sampled other values select primary. Selection is flat per triangle, with no Color0 interpolation between sets | [Depot material families](/engines/frostbite/materials/shader-block-depots/) |
| ForzaTech / inspected world families | Roads blend layers A–D using height and blend textures; environment materials combine modulate and deposit terms | [World families](/engines/forzatech/shaders/world-families/), [environment](/engines/forzatech/shaders/environment/) |

## Surface values and output encoding

Sekiro stores reflectance separately while Elden Ring's inspected metallic form leaves F0 reconstruction to lighting.
GTA V Enhanced's inspected deferred path stores square-root specular quantities. Anvil's shading class changes the
interpretation of otherwise shared output lanes. These differences belong to the [G-buffer comparison](/concepts/g-buffers/)
and its linked engine pages.

:::open[What completes a material whose bindings are absent?]
Anvil's null overrides and final unfilled-slot substitute are not established by stored defaults. A null RAGE texture
pointer is a stored absence rather than a named white texture. See [Anvil fallback](/engines/anvil/materials/material/)
and [Enhanced texture references](/engines/rage/materials/enhanced-parameters/).
:::

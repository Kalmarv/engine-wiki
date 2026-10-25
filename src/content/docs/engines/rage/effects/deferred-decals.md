---
title: Deferred decals and shader-built geometry
description: Effects that modify existing surfaces or generate their final geometry in vertex shaders.
games: [gta-v]
sources:
  - title: CodeWalker
    url: https://github.com/dexyfex/CodeWalker
    note: Effect names and shader-family reference.
implementations:
  - name: primase worlds/gta (shader_class.rs)
    url: https://github.com/Kalmarv/primase/blob/main/worlds/gta/src/passes/shader_class.rs
---

Some effects modify existing surface properties rather than supplying a conventional coloured surface. Inspected
decal families can alter only normal, specular, shadow or ambient terms; `decal_dirt` is a darkening mask.
:observed[shader inspection]

The final geometry can also depend on shader execution. `cable` widens lines using camera distance;
`grass_batch*` builds instanced grass and `grass_fur*` builds shell-fur geometry in the vertex shader. Stored vertex
positions alone do not describe the final visible surface of these effects. :observed[shader inspection]

`trees_shadow_proxy` belongs to shadow rendering. The inspected shader classification also distinguishes
particle, cloud, sky, radar, minimap and silhouette effects from ordinary world surfaces. :observed

Only the inspected `cloth_*` effects carry the older effect-record flag-8 classification associated with two-sided
rendering; a banner observed from behind has mirrored text. The per-pass rasterizer table is the more direct
source of culling state when available. :observed

Opacity, palette, night-only geometry and foam behaviour are described with the
[vertex-colour inputs](/engines/rage/materials/vertex-colours/); explicit blending and culling records are in
[SGD2](/engines/rage/shaders/sgd2/). :observed

:::open[How is every generated geometry family parameterized?]
The compiled shaders establish that geometry is generated or expanded, but a complete account of each family's
instance data and CPU draw submission is not established here. :unknown
:::

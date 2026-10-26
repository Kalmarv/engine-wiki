---
title: Terrain layer blending
description: Four-layer terrain weights, lookup masks and Enhanced terrain specular parameters.
games: [gta-v]
sources:
  - title: CodeWalker
    url: https://github.com/dexyfex/CodeWalker
    note: Enhanced terrain effect and parameter names.
implementations:
  - name: primase worlds/gta (terrain.rs)
    url: https://github.com/Kalmarv/primase/blob/main/worlds/gta/src/passes/terrain.rs
---

The `terrain_cb_*` effects blend four diffuse and normal layers per pixel. In the inspected shaders, saturated
`COLOR1` channels `(r,g,b)` produce the following weights. :observed[shader disassembly]

| Layer | Weight | Confidence |
|---|---|---|
| 0 | `(1-r)(1-g)(1-b)` | :observed |
| 1 | `(1-r)(1-g)b` | :observed |
| 2 | `(1-r)g(1-b)` | :observed |
| 3 | `(1-r)gb` | :observed |

Diffuse colour is the weighted sum of layer colours. Normal XY is also a weighted sum with bumpiness applied;
the weights are not renormalized. Their sum is `1-r`, so normalization would remove an authored influence of red.
:observed[formula and shader inspection]

## Lookup-blended variants

`*_cm*` variants take green and blue from `lookupTexture` sampled at `TEXCOORD1`. `*_2tex_blend*` variants interpolate
those lookup channels toward `COLOR1.g/b` using `COLOR0.a`. Red stays `COLOR1.r`. `*_lod` variants use vertex colour
alone. :observed[shader inspection]

The lookup is filtered in the shader. A texture sample in the interior of a triangle can therefore change weights
without a corresponding change at any vertex. :observed

## Specular

In `terrain_cb_w_4lyr`, the dry specular intensity is `SpecularColor²` and the falloff parameter is `Specular`;
there is no independent specular material per layer. `materialWetnessMultiplier[4]` controls wetness, not four dry
specular values. The inspected terrain output fixes Fresnel at `0.98`. :observed[shader disassembly]

Ambient occlusion in the terrain output (G-buffer target 3) comes from the vertex, not from the layers, and the
output has no metalness term. :observed[shader disassembly]

For `terrain_cb_w_4lyr_pxm_spm`, let `S` be the weighted sum of each layer's height-map green channel. Intensity uses
`specularIntensityMultSpecMap * lerp(1, S², specIntensityAdjust)`; the corresponding falloff expression uses
`specularFalloffMultSpecMap * lerp(1, S², specFalloffAdjust)`, divided by 512 at the indicated G-buffer stage.
:observed[shader disassembly]

The [deferred encoding](/engines/rage/shaders/deferred-shading/) must also be considered when interpreting a stored
G-buffer value as an intensity or exponent. :observed

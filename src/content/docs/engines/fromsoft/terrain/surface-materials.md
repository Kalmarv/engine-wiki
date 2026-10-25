---
title: Ground surface materials
description: What the inspected ground shaders establish about terrain texturing and blend inputs.
implementations:
  - name: primase worlds/fromsoft (layer_bake/resolve.rs)
    url: https://github.com/Kalmarv/primase/blob/main/worlds/fromsoft/src/passes/layer_bake/resolve.rs
---

The inspected ground surfaces use mesh attributes and layered material programs. Sekiro's MultipleGround program
receives normalized vertex blend channels as well as texture coordinates; Elden Ring's masked material families
combine vertex weights with sampled masks. :observed

The blend equations and exact inspected shader scope are documented under
[layered surfaces](/engines/fromsoft/materials/layered-surfaces/); their inputs use
[FLVER vertex layouts](/engines/fromsoft/geometry/vertex-formats/).

## Repeating textures and independent inputs

Ground-family texture repetition is controlled per slot, with metaparam UV groups connecting slots to
`CommonUV-UVParam` parameters. The captured transform scales about the texture center, with an offset of
`(1-scale)/2`. :observed

The inspected Sekiro layered meshes include distinct secondary UV sets that cannot in general be recovered by
scaling and offsetting the primary set. Some primary UVs repeat or overlap, so one primary texture coordinate
can identify different surface points with different secondary coordinates. :observed{games="sekiro"}

The sampled Sekiro `M[LandScape]_Mountain` material family also appears among unresolved tiling captures: four
all-one buffer contents conflict with the non-unit scale stated by the matching material candidates. This is
not evidence of a universal landscape-specific scale rule. :observed{games="sekiro"}

See [constant binding and tiling](/engines/fromsoft/materials/constant-binding/) for the discriminating captures
and the limits of the current precedence rule.

:::open[Is there a separate terrain geometry representation?]
The ground-material observations do not establish a separate heightfield format, terrain tessellation algorithm,
or complete terrain LOD hierarchy. Material blend weights alone do not settle those geometry questions. :unknown
:::

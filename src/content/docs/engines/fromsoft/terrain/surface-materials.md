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

Elden Ring's terrain base layers carry a UV-group scale of 300. :inferred{games="elden-ring"}

See [constant binding and tiling](/engines/fromsoft/materials/constant-binding/) for the discriminating captures
and the limits of the current precedence rule.

## Sekiro

The inspected Sekiro layered meshes include distinct secondary UV sets that cannot in general be recovered by
scaling and offsetting the primary set. Some primary UVs repeat or overlap, so one primary texture coordinate
can identify different surface points with different secondary coordinates. :observed{games="sekiro"}

The sampled Sekiro `M[LandScape]_Mountain` material family also appears among unresolved tiling captures: four
all-one buffer contents conflict with the non-unit scale stated by the matching material candidates. This is
not evidence of a universal landscape-specific scale rule. :observed{games="sekiro"}

## What the Elden Ring frames draw

In a frame at the Stormveil gate, the draws of the layered ground materials (vertex programs of the `[Mb2]`, `[Mb3]` and further `[Mb<n>]`
families, 659 of the frame's 2,734 indexed draws: 336 from `m10_00_00_00` map pieces and 323 from assets) draw one face set of
an ordinary FLVER each, from the model's own index and vertex ranges, and none of them has a hull or domain program.
:observed[one captured frame]{games="elden-ring"} The only hull and domain programs of the frame are those of
effect billboards and ribbons (`GXFfxtessellate`) and of the ocean surface (`M[Water][ocean4]`, drawn from face set 2 of the
asset `AEG097_000`, 63,354 indices). :observed[one captured frame]{games="elden-ring"} The frame draws no open-world tile (no `m60`
map piece, see [map areas](/engines/fromsoft/world/areas-and-tiles/#parents-parts-and-their-small-tile)), so it shows how
a legacy map's ground is drawn and not the terrain of the overworld. :observed{games="elden-ring"}

:::open[Is there a separate terrain geometry representation?]
The ground-material observations do not establish a separate heightfield format, terrain tessellation algorithm,
or complete terrain LOD hierarchy. Material blend weights alone do not settle those geometry questions. :unknown
The Stormveil frames show no tessellated or heightfield ground; an open-world frame (the tile capture asked for under
[map areas](/engines/fromsoft/world/areas-and-tiles/)) is needed to see how an `m60` tile's ground is drawn.
:::

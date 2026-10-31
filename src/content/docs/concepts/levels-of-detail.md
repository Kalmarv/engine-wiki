---
title: Levels of detail
description: How engines separate mesh detail, distant world representations and the policies that select them.
---

Level of detail can live inside a model, in a placement hierarchy or in a separate far-world representation. The
geometry identifies available alternatives; selection fields describe a different part of the system. Each row links
to the page that states it, with its confidence.

| Engine / game | Stored alternatives | Selection and limits | Detail |
|---|---|---|---|
| FromSoftware / Sekiro and Elden Ring | FLVER face-set flags encode `(flags >> 24) & 7`; Elden Ring also uses levels 3 and 4 for far stand-ins, with a bit named `LodLevelEx` | Elden Ring's nested parent tiles establish placement, but runtime draw overlap and residency radii are not established. Elden Ring's asset textures have a full and a separately made `_l` package; each drawn instance switches between them by its distance and its `PartsDrawParam` row | [FLVER face sets](/engines/fromsoft/geometry/flver/), [parent tiles](/engines/fromsoft/world/areas-and-tiles/), [texture forms](/engines/fromsoft/textures/tpf/#which-form-is-drawn) |
| Anvil / Riders Republic | LODSelector stores five graphic-object descriptors; leading slots can come from dependency meshes | Descriptors store switch distance, transition-zone size, fade multiplier and shader LOD. Runtime fade behavior is not established | [LODSelector](/engines/anvil/world/lod-selector/) |
| RAGE / GTA V Enhanced | Drawable high/medium/low/very-low model lists coexist with world HD, LOD and SLOD1–4 hierarchies | Entity parent indices cross into a parent map; stored distance fields do not establish the complete runtime selection policy | [World hierarchy](/engines/rage/world/lod-and-priority/), [drawables](/engines/rage/geometry/drawables/) |
| Frostbite / skate. | MeshSets point to LOD records and geometry chunks; vistas draw their last LOD | LodGroups supply distance policy. WorldPartition masks vistas corresponding to loaded detailed cells | [MeshSets](/engines/frostbite/geometry/meshsets/), [vistas](/engines/frostbite/world/world-partition/) |
| ForzaTech / FH6 | `Modl` fields and mesh flags identify LODs; a cluster filename number is not the LOD | Ribbon profiles store six distance/fade bands by tier and pass; template libraries carry vegetation and prop bands. Global scales and PC preset-to-tier mapping are not established | [LODs and clusters](/engines/forzatech/geometry/lods-and-clusters/), [template libraries](/engines/forzatech/world/plib-templates/) |
| Insomniac / Sunset Overdrive | Hex tiles have `_low` and `_imposter` zone variants | The two floats that might relate to LOD or fading in placed-model records have no established meaning | [Zones](/engines/insomniac/world/zone/) |
| Unity / Sledding Game and PEAK | LODGroup lists renderers per level | Selection is by screen size; a disabled group leaves its levels drawing together | [Scene LOD groups](/engines/unity/data-model/scenes-and-hierarchy/) |
| Unity / SkateBIRD | Playable-level meshes have no LODs | Scenes use ProBuilder and statically batched combined meshes | [Meshes](/engines/unity/geometry/meshes/) |

## Distant objects and distant ground

Anvil's FarFake cells merge object proxies over terrain; distant ground instead uses coarser terrain nodes. LongRange
also lists ordinary objects, so its name alone does not classify an object as a proxy. The near-object-to-proxy-span
suppression rule is not established. See [LongRange and FarFake](/engines/anvil/world/far-view/).

Frostbite has runtime evidence for vista suppression: clearing measured WorldPartition masks restores distant slabs
above the detailed scene. A proxy spanning several cells can remain over a different loaded cell.
See [vista masks](/engines/frostbite/world/world-partition/).

RAGE's authored city SLODs are separate from the model lists inside a drawable. A mesh name containing `slod` does not
alone establish its placement role. See [world LOD](/engines/rage/world/lod-and-priority/).

:::open[What selects or suppresses the stored alternatives?]
The unresolved pieces differ: [FromSoftware tile overlap](/engines/fromsoft/world/areas-and-tiles/),
[Anvil proxy-span suppression](/engines/anvil/world/far-view/), [RAGE optional-entity selection](/engines/rage/world/lod-and-priority/)
and [ForzaTech global distance scales](/engines/forzatech/geometry/lods-and-clusters/) are not established by their
stored geometry alone.
:::

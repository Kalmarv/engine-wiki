---
title: Terrain clusters
description: How Forza Horizon 6 stores its ground, roads and water as 512 m heightfield cluster models, which clusters the game draws, and the material families on them.
---

The ground is not a height map at run time: each 512 m cell ships its surface as **cluster models** under
`scene/tbheightfield/`, already in world metres, carrying the ground, roads, pavements, decals and water surfaces. The ground
mesh has POSITION and NORMAL only, with no UVs; colour comes from per-cell textures ([Far-field colour](/engines/forzatech/terrain/far-field-colour/)
and [Near-field ground](/engines/forzatech/terrain/near-field-megatexture/)). :observed

Counts come from a recorded census of the Tokyo track `Brio` (23,941 heightfield instances); the install is no longer
available. :observed

## Cluster families

| File family | Holds | Confidence |
|---|---|---|
| `autoterrain_<cell>_clusterNNN.i.modelbin` | the real surface (ground, roads, pavements, decals, water), split into clusters; each cluster's LODs are separate files with consecutive numbers; some clusters exist once per season | :observed |
| `autoterrain_<cell>_cb_clusterNNN` | an underlay drawn 0.5 m below the surface (instance y = −0.5): a coarse ground mesh, a second copy of the roads and the water, and an `OCC_Terrain` occluder cluster | :observed |
| `autoterrain_<cell>_ul_clusterNNN` | the whole cell as one LOD1 mesh (the distance proxy of the bare clusters) | :observed |

The cell labels in file names are `cell index × 1023`; `autoterrain_x-1023_z-10230` is cell (−1, −10) and a cell covers
`[512 i, 512 (i+1))` m. :observed

## Which clusters are drawn

Which clusters draw comes from the [hand-placed instance file](/engines/forzatech/world/pvs-ribbon/), not from file names. Every
heightfield cluster is drawn by exactly one instance: 16,489 of 16,489 bare LOD0 files and 3,153 of 3,153 `_cb` files are the
band-0 model of exactly one instance; LOD1 to LOD3 files and `_ul` files are never a band-0 model. The instance carries the
cluster's LOD rows, LOD profile group and gameplay record. Every shipped LOD row of the 23,941 heightfield instances is a
heightfield cluster. :observed

- `_cb` instances (3,153) use LOD profile group 19, the only group with no main-view (pass 2) record (passes 0, 1, 8, 9 only; 298
  more group-19 instances have no shipped model): not drawn in the near view. They are also the only heightfield instances
  whose transform is not the identity (y −0.5). What passes 0, 1, 8 and 9 are (shadow cascades, reflections?) is not traced. :observed
- `_ul` instances (2,278) and 8 bare ones draw nothing in band 0 (band row 0x7F): distance proxies (HLOD parents of the bare
  clusters). :observed
- Bare instances have the identity transform at the origin, band 0 is the LOD0 cluster. 2,013 of them, all at the map border (LOD
  groups 17 and 18, band 0 = [0, 110 or 265 m)), had their LOD0 stripped from the build; the first later band whose model
  shipped is the one to use. :observed

### Seasonal clusters

2,262 bare instances carry a gameplay record with a season-exclusion mask: 0xDD (summer only) 606, 0xEE (spring only) 588, 0x88
(not winter) 1,022, 0x77 (winter only) 46. Seasonal clusters come in pairs that cover the same ground; for example the rice
paddies of `autoterrain_x-3069_z5115` have clusters 070 (0xDD) and 074 (0xEE), 018 and 014, 042 and 038 (`PLN_Lake_RicePaddy`
water, its `_DistanceFade` mesh and the paddy ground). Drawing every LOD0 file would draw both copies: the paddy box x
−1500..−1100, z 2600..3000 would have 90,275 water texels covered twice in the summer far-field bake of cell (−3, 5); selected by
the instance records it has 0 in summer (224,179 water texels) and 0 in spring (75,897, using clusters 014, 038, 074 instead of
018, 042, 070, and 004 and 099 summer-only). :observed Six bare instances carry a route or tag. :observed

## Material families on the ground

| Family | Used for |
|---|---|
| `terr_mega` | ground (`GenMaterial*`, `terr_mega*`, `SomeDeformationMaterial*`) |
| `uber_megaroad`, `uber_megaroad_edge` | rural roads |
| `uber_road` | city roads |
| `uber_roaddecal`, `uber_roaddecalretro` | paint, crossings, kerb grills, seams: coplanar layers drawn over the road |
| `environment_plot` | pavements |
| `uber_water`, `ocean`, `ocean_shoreline` | rivers, lakes, ponds, rice paddies, sea ([Water](/engines/forzatech/water/water/)) |

All rows :observed. Families are recognised from the `.shaderbin` at the end of each material's parent chain, not from names.
:observed The terrain meshes also contain exactly repeated triangles and a few zero-area ones; a repeat with the opposite winding
is how thin parts are made two-sided. :observed

## Decal layers on the surface

Road decal meshes lie 5 to 25 mm above the surface under them: measured on 1,042 road-decal meshes, patch stacks step about 1 mm
per layer (7.8, 8.8, 9.9, 10.7 mm) and paint lines sit about 17.6 mm up; 209 facade decal meshes sit a median 2.2 mm in front of
the wall. The vertex positions are quantised to 0.98 mm, so these offsets are deliberate. :observed See
[Decals](/engines/forzatech/effects/decals/).

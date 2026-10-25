---
title: Coordinates, cells and the map
description: The Forza Horizon 6 world frame, the cell grids of terrain and placements, how object reach crosses cell edges, the track locators and the pause-menu map.
---

## Frame and units

The world is **Y-up and left-handed, one unit = one metre**. A mesh header's quantisation, for example
`scale = (256, 32, 256), translate = (−1792, 96.021, −9984)`, reproduces its observed world box exactly. :observed
Direct3D conventions apply: row vectors, `p' = p · M`, v pointing down the image. :observed

The Brio track spans x −12,548..9,487 and z −11,281..10,754 on the pause map (22,035 m square, see below); the Tokyo
city lies in its southern half (the Shibuya area is around x −2,050..−850, z −5,390..−4,190 and the Tokyo core around
x −816..−560, z −5,156..−4,900). :observed

## Grids

| Grid | Size | Rule | Confidence |
|---|---|---|---|
| Terrain cells | 512 m | a cell covers `[512 i, 512 (i+1))` in X and Z; a tile named `..._x<label>_z<label>_...` uses `label = cell index × 1023` (`autoterrain_x-1023_z-10230` is cell (−1, −10)) | :observed |
| `proc` placement cells | 50, 75, 100, 125, 150, 200, 250, 300, 500, 10,000 m | origin `(cx × cs, 0, cz × cs)` | :observed |
| Far-field ground texel | 0.25 m | mainmap 2,048 texels per 512 m cell | :observed |

## Objects that stand over a cell edge

An object may reach into an area while its origin is outside it. Its reach is bounded by the model's oriented box from the
[hand-placed instance bounds](/engines/forzatech/world/pvs-ribbon/), not by the template library's box. The largest reach of any
placement of each category over all four seasons is: :observed

| Category | Max reach (m) | By |
|---|---|---|
| props | 92.9 | `prp_fst_balloon_hotair_c` |
| rocks | 68.3 | `roc_alp_module_embedded_a_small_coll` |
| buildings | 60.4 | `gpy_el_mod_ramp_02_c` |
| infrastructure | 51.8 | `inf_fst_tunnel_led_b` |
| bridges | 50.7 | `inf_cst_brdge_03_side_end_a` |
| trees | 47.7 | `tre_gbl_cherry_spg_a` (spring) |
| barriers | 27.8 | `bar_pln_retain_dmnd_01_a` |
| bushes | 21.2 | `bsh_gbl_elm_d` |
| signs | 12.4 | `sgn_cty_pfb_dir_gantry_01_a` |
| grasstemplate | 3.7 | `gcr_lmt_grass_tufty_b` |
| smashables | < 0.1 | flattenable-bush proxies |

The template library's AABB is not usable for this: it dropped 5 placements in the Tokyo core and inflated the
infrastructure reach to 846 m ([Template libraries](/engines/forzatech/world/plib-templates/)). :observed The `ocean_vista`
mesh spans x −63,677..99,817, z −100,965..94,764 around the whole map, and its saturated bounds record would put it in every
area: its 71 overlapping terrain clusters are all at the map's edge. :observed

## Track locators

`media\Tracks\Brio\trackroutes\*.nt` are plain XML `<TrackLocators>` with a `<SceneTransform>` per locator whose translation
is `value._41/_42/_43` in world metres. `map_region_city.nt` gives the Tokyo anchors, for example `Arena_000` at
(1046.7, 0.23, −6902.6). The numbers agree with placements and terrain. :observed Region outlines (City, Canyon, ...) are
`map_region_*.nt`, whose translations (`value._41`, `value._43`) are the polygon vertices. :observed

## The pause-menu map

The in-game map is a ready-made tile pyramid unrelated to the terrain data:
`media\UI\Textures\Data_Bound\Map_<Track>_<Season>.zip` (for example `Map_Brio_Spring.zip`). Entries are
`<level>-<row>-<col>.swatchbin`; level 0 is one tile for the whole map, level *L* is 2^L × 2^L tiles, row 0 is north; Brio
ships levels 0 to 3 (85 tiles) of 1,024 px each. :observed

The world extent is set by the game's own map profile, `UI.zip` →
`MapProfiles\MapIncludes\MapIncludeSharedResources.xml`: `background_size` is 22035 m (square) and `background_offset` is
(−12548, 0, −11281), the minimum X/Z corner. So pixel `(u, v)` of a stitched level maps to
`x = −12548 + u / W × 22035`, `z = 10754 − v / H × 22035`. :observed

The `mainmap_*` and `submap_*` swatches in the GeoChunks are not the pause map: they are the terrain shader's far-field colour
inputs ([Far-field colour](/engines/forzatech/terrain/far-field-colour/)). :observed

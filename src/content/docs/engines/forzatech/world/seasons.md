---
title: Seasons
description: How Forza Horizon 6 selects spring, summer, autumn or winter content for placements, materials, textures, terrain and water, and which parts of the selection are certain.
---

The world is one set of data with four seasons. Every layer below is selected from the data for one season, and the index
order everywhere is **0 spring, 1 summer, 2 autumn, 3 winter**. :observed Where the data is certain but the engine code that
picks it was not read, the row says so. All counts are from a recorded census of the Tokyo track `Brio`, no longer
re-checkable. :observed

| Layer | Selected by | Confidence |
|---|---|---|
| Placement files | the `.pgeo` season-exclusion mask ([Placement files](/engines/forzatech/world/pgeo-placements/)) | :observed |
| Model per placed template | the season's template library ([Template libraries](/engines/forzatech/world/plib-templates/)) | records :observed; season folder :inferred |
| Material instance per mesh | the mesh's material group element for the season; −1 means the group's summer element | :observed |
| Parent materials | `bin.zip` `materials\<season>\<same hash>` | contents :observed; season folder :inferred |
| Textures | the parameter's path hash up the season's parent chain, never the `_x<season>x_` in a file name | :observed |
| Terrain far-field colour | the season's `terr_mega` instances → `TerrainColourTexture` and `TerrainNormalTexture` | :observed |
| Ocean optics | the `tz_oceanparams.tz` zone whose exclusion mask admits the season → an `OceanSettings.xml` preset | data :observed; evaluation :inferred |
| `uber_water` colour | its parent materials, as for any material | :observed |
| Near-field ground splat map | the `.mtxmoddxt` file name suffix only | :unknown |
| Hand-placed instances and terrain clusters | the instance's gameplay record season-exclusion mask | :observed |

## Mesh material ids

Each mesh material group holds four `i16` material ids (spring, summer, autumn, winter). Over all 113,868 modelbins of
`GeoChunk0` (407,461 meshes, all version 1.9 or later, 431,991 groups): :observed

| Ids present (P spring, S summer, A autumn, W winter) | Groups |
|---|---|
| P S A W | 210,401 |
| − S − − | 149,073 |
| − S − W | 71,808 |
| P S A − | 320 |
| − S A W | 261 |
| P S − W | 122 |
| P S − − | 6 |

The summer id is never −1, and a seasonal id is never equal to the summer id (0 of 704,423 seasonal ids). Therefore −1 is the
only way a season shares summer's material: `id(s) = ids[s] != −1 ? ids[s] : ids[summer]`. −1 cannot mean "not drawn":
149,073 groups, including 2,319 of the 2,512 `models/buildings/city` models, have no seasonal id and would vanish outside
summer. Every variant group has its own four ids, and the rule applies per group. :observed Each of the 704,423 seasonal ids
points at an instance named `<summer instance name>x<season>x` with the season of its index and the same parent path.
:observed

Seasonal ids exist in terrain (41,812 of 62,295 `tbheightfield` models, each with `xspringx`, `xautumnx`, `xwinterx` copies of
`GenMaterial`, `terr_mega` and `SomeDeformationMaterial1`), HLOD and rock proxies, props, signs, barriers, rocks, trees,
bushes, Houdini infrastructure, and 193 of 2,512 city buildings. :observed

## Parent materials

The `bin.zip` manifest lists 419 materials as `materials\_0xN.materialbin`; the `spring\`, `autumn\` and `winter\` folders
hold the same 419 hashed names. 358 are byte-identical in all four sets; 61 differ (31 in winter only, 22 in spring, autumn
and winter, 5 in spring and autumn, 3 in spring and winter). The differences are data: switches and constants (for
`environment\plot.material` the snow and wetness switches `0xE20DFFAC` and `0xD0813282`), and textures
(`kit_cty_urb_01_a_xsummerx_bclr` becomes `..._xwinterx_bclr`; `foliage_worldtint_x<season>x_bclr`; all `water\*` materials).
:observed

A seasonal instance carries the same parent path as its summer instance, so a parent's season can only come from the folder:
season *s* reads `materials\<s>\<hash>`, and summer reads the flat file (the flat set is summer: for the 22 materials
that differ in spring, autumn and winter it differs from all three folders). :observed The executable holds the lowercase
season names and the string `game:\media\tracks\%s\bin.zip`, but the code forming the path was not traced. :inferred Shader
defaults (`DFPR`, the end of every chain) have no seasonal copy; `uber_branch` bark materials keep
`FuzzBaseColor = moss_xsummerx_diff` in winter. :observed

## Textures follow the chain

No texture is chosen by name. The `_x<season>x_` in swatch names is the authoring convention and holds no rule: winter data
references summer-named swatches where the data says so (in a rural validation box, 8 of 224 textures). :observed In a Tokyo
core box, 14 of 2,518 summer swatches and 183 of 2,492 winter swatches carry the other season's tag, and each one sampled
is the instance's own parameter. :observed

## Terrain far-field

In each 512 m cell the terrain meshes select the season's `GenMaterial`, `terr_mega` and `SomeDeformationMaterial1`
instances by their material ids. Each defines `TerrainColourTexture` (the `mainmap_...` swatch) and `TerrainNormalTexture` (the
`submap_...` swatch) by path hash, plus `BlendMapScale` and `BlendMapOffset`, which give the cell:
`X0 = 0.25 − offset.x / scale.x`, `Z0 = −offset.y / scale.y − 512.25` (offset (2.99756, 5.99463), scale (1/512.5, −1/512.5)
gives X0 = −1536, Z0 = 2560). All 52 instances per season agree per cell in the rural box checked. :observed

## Placements by season

Winter drops every summer-only grass file and adds snow overlays (`*_snow` building roofs, ornate walls, log piles, 0x77
files); the winter tree and bush libraries swap deciduous trees for bare `…_wnt_…` models (`tre_lmt_elm_*`,
`tre_lmt_maple_*`, `tre_cst_ash_*`, `tre_gbl_deciduous_*`, `tre_urb_ginkgo_*`, `bsh_gbl_elm_*`, `bsh_alp_pinus_mugo_*`) and
planters for their empty `_a` variant; spring swaps `tre_gbl_cherry_*` for blossom `…_spg_…` models. :observed A template name
must be looked up in the placement's own category library, because the winter planter names exist in both `props.plib`
(unchanged) and `trees.plib` (the empty variant). :observed

Hand-placed instances and terrain clusters carry the same exclusion mask in their gameplay record. Over the non-heightfield,
non-catalogue instances: 0x77 (winter only) 2,469, of which 2,466 draw a `*_snow` model; 0x88 (not winter) 178; 0xEE (spring
only) 36; 0xDD (summer only) 31; 0x99 17; 0x33 3; 0xCC 1; 0xFF (never) 2; 0x00 (no limit) 26,374; no record 97,719 (17,382 of
those are `_snow` models drawn all year, mostly alpine rocks). 2,004 `_snow` instances sit exactly on an instance of the same
model without `_snow`. :observed Drawn over the whole map: summer 110,530, spring 110,513, autumn 110,520, winter 112,808;
winter keeps the 2,468 instances with 0x77 that every other season drops and drops 207. Terrain clusters drawn: summer
17,868, spring 17,850. :observed

## Not covered

- The near-field splat `.mtxmoddxt` is per season by file name only, and no data reference to them exists (no
  `mtxmoddxt` string in the executable, none in the `.pvs`). :unknown
- Run-time season effects outside the asset data (snow accumulation, wetness, weather presets, the `FallbackGI\brio_<season>`
  textures, `crowds_<season>`) are not described. :unknown

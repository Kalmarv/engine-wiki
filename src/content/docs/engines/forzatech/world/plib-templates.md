---
title: Template libraries (.plib)
description: The instance template libraries that map a placement block name to a model, its draw behaviour and its LOD distance bands.
---

Each placement category has a library, `Ribbon_00\instancetemplates\<season>\objects\<CATEGORY>.plib`, that turns the
block names of [`.pgeo` files](/engines/forzatech/world/pgeo-placements/) into models. The `objects\` folder is
byte-identical to `summer\`; there is one library per category per season folder (5 folders × 13 categories = 65 files of
version 38). :observed Every field below was read from all 65 files, each of which parses exactly through the tailor
section. The sections after it are not decoded. :observed

`Placement\GRASSTEMPLATE.plib` (version 9) is a different format: groups of weighted grass templates for the run-time `.mtp`
grass, not used by `.pgeo`. :observed

## Layout

```layout
title: .plib (version 38)
size: variable
games: [fh6]
note: "Little-endian. Parsed through the tailor table; what follows it is not decoded."
fields:
  - {at: 0, size: 4, type: u32, name: version, value: 38, level: observed}
  - {at: 4, size: 4, type: u32, name: unknown, level: unknown, note: "varies per file"}
  - {at: 8, size: "4 + n", type: str, name: category, level: observed, note: "GRASSTEMPLATE, TREES, ..."}
  - {at: "next", size: 8, type: "u8[8]", name: hash, level: unknown}
  - {at: "next", size: variable, type: "behaviour[]", name: draw behaviours, level: observed, note: "u32 count, then behaviours"}
  - {at: "next", size: variable, type: "template[]", name: model templates, level: observed, note: "u32 count, then templates"}
  - {at: "next", size: variable, type: "tailor[]", name: tailors, level: observed, note: "u32 count; each { str name, str uv, u32 0, str scale, u32 0, u32 0, str density }"}
  - {at: "next", size: variable, type: bytes, name: later sections, level: unknown, note: "UV, scale and density tables, materials, placement and grass templates"}
```

A **draw behaviour** is `str name` (`TREE_3D_DEFAULT`, `PLANT_3D_DRAW_BEHAVIOUR_HIGH`, ...), `u32 mode` (0, 1 or 3), two
floats (−1, −1 or 1, 1), 13 flag bytes (meanings unknown), and 65 slots; each slot is `u32 nRanges`, `nRanges × 33 B { u32
kind, f32 start, f32 end, f32 fadeIn, f32 fadeOut, f32 −1, f32 −1, 5 × u8 }`, `f32 −1, f32 −1, f32 (1.0, 0.8 or 0.6), u8`.
:observed

A **model template** is the block name, the draw behaviour name, an AABB (`f32 min[3], 0, max[3], 0`), `f32 1.0`, 11 flag
bytes, the x range of the AABB again, `u8 1`, `u32 nModels` (1 on all 19,776 templates) with a path
`tracks\brio\scene\models\...\<stem>.model|.max`, `u8 0`, 65 bytes `slotToSet` (the index of the LOD set for each behaviour
slot; non-zero exactly where the behaviour slot has ranges: 0 mismatches over 257,725), and the LOD sets
`u32 nSets × { u32 n, n × { u8, u32 lod, u32 (0, 1, 1000000 or 0x7FFFFFFF), u32 k, k × u32 id } }` (set 0 is empty). :observed

## Template to model

The model is the file stem of the one path; the archive has `<same folder>\<stem>_clusterNNN.i.modelbin` (the grass template
`3D_GBL_SUSUKI_SUM_A_3D_HIGH` maps to `groundcover\gbl\gcr_gbl_susuki\gcr_gbl_susuki_a\gcr_gbl_susuki_a_cluster000` to
`002`). For all 3,485 `<x>_3D` templates in the summer libraries the stem is `<x>`; other seasons differ for 1 to 35
templates (spring and winter `tre_lmt_elm_c_3D` map to `tre_lmt_elm_wnt_c`; autumn `tre_urb_ginkgo_d_3D` to
`tre_urb_ginkgo_wnt_d`). :observed The autumn `trees.plib` defines `tre_urb_ginkgo_d_3D` twice (one record to
`tre_urb_ginkgo_d`, a later one to `tre_urb_ginkgo_wnt_d`); which one the game uses is not known. :unknown

The grass mapping is identical in all seasons for the templates they share (winter lacks 56 and spring adds 6). All 49
placed grass templates are in the spring, summer and autumn libraries; winter lacks 23 of them (crops, tufty grass,
which are placed in all-season files). :observed The winter library therefore probably draws no such grass. :inferred

## LOD bands

A slot lists distance bands and the template's set for that slot lists the model LODs (`lod` = 0, 1, 2 ..., in `_clusterNNN`
order, which is inferred). :observed Examples: `TREE_3D_DEFAULT` slot 13 is 0–25, 25–80 and 80–225 m with set LODs 0, 1 and 2,
slot 11 is 0–135 m with LOD 2; impostors take over from 225 m (`impostor_draw_behaviour` slot 13: 225–1000 and 1000–2600 m).
`GEN_LONG_GRASS_A_3D_HIGH`, `_MEDIUM` and `_LOW` are one model at LOD 0, 1 and 2 for 0–40, 40–80 and 80–189 m, so the
`_HIGH` suffix is the near band of the same model. :observed Which render pass each slot is (colour, shadow ...) is not
established. :unknown

## The template box is not the model's extent

The AABB is not the model's extent: it can be smaller or far larger than the mesh (`prp_cty_strge_delivery_01_a`: library
half width 0.17 m, model 0.31 m; `inf_fst_entrance_a`: library reach 846 m, model x −15.2..15.2 m). :observed The bounds
that do contain the mesh come from the hand-placed instance file ([model bounds](/engines/forzatech/world/pvs-ribbon/)).
:observed

## Templates with no geometry

Some templates have an all-zero AABB and every LOD id `0xFFFFFFFF` (props `decal_cty_pnt_cyclearrow`, `cyclelane`,
`filterline`, `pedestriancrossing01` to `05`, `long_u`, `inf_hwy_volume_01_b`, `bar_gbl_pavement_blocksrural_spacer`,
`road_gen_rum_round_collision`, `*_glow`), in all four seasons, while their shipped siblings have real bounds
(`decal_cty_pnt_pedestriancrossing`: 0.65 × 0.006 × 5.07 m, id 7968). Their model path is an ordinary mesh reference
(`scene\models\road_decals\decals\...`) with an ordinary draw behaviour, and no modelbin exists for them in any archive.
:observed The game probably draws nothing for those placements, and the painted road markings come from the road decal
layers of the terrain ([Decals](/engines/forzatech/effects/decals/)). :inferred

Placements whose model stem has no modelbin are numerous: 35,504 buildings, 19,490 props, 5,797 barriers, 1,164
infrastructure, 120 bushes, 7 rocks map-wide. :observed

:::open[What do the later .plib sections hold?]
After the tailor table the file holds UV, scale and density tables, material tables and the placement and grass templates
(such as `GBL_SUSUKI_SUM_A_HIGH`, which names a billboard template, a tailor and `3D_GBL_SUSUKI_SUM_A_3D_HIGH`). None is
decoded.
:::

:::open[What do the draw behaviour mode, flags and slot kinds mean?]
`mode` (0, 1, 3), the 13 flag bytes and the per-range `kind` are read but not interpreted.
:::

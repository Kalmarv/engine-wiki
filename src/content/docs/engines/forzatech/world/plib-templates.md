---
title: Template libraries (.plib)
description: The instance template libraries that map a placement block name to a model, its draw behaviour and its LOD distance bands.
implementations:
  - name: forzatech-formats (plib.rs)
    url: https://github.com/Kalmarv/forzatech-formats/blob/main/src/plib.rs
---

Each placement category has a library, `Ribbon_00\instancetemplates\<season>\objects\<CATEGORY>.plib`, that turns the
block names of [`.pgeo` files](/engines/forzatech/world/pgeo-placements/) into models. The `objects\` folder is
byte-identical to `summer\`; there is one library per category per season folder (5 folders × 13 categories = 65 files of
version 38). :observed All 65 files read to their last byte under the layout below, every constant holding on every
file (545 draw behaviours, 19,776 model templates and 47,835 placement templates in all). :proven[all 65 files]

`Placement\GRASSTEMPLATE.plib` (version 9) is a different format: groups of weighted grass templates for the run-time `.mtp`
grass, not used by `.pgeo`. :observed All 5 (one per season folder) read to their last byte under the layout further down (512
groups with 2,379 items and 415 sets in all). :proven[all 5 files]

## Layout

```layout
title: .plib (version 38)
size: variable
games: [fh6]
note: "Little-endian; a string is a u32 length and that many bytes of printable ASCII, a list a u32 count and that many entries. The file ends where the names end."
fields:
  - {at: 0, size: 4, type: u32, name: version, value: 38, level: observed}
  - {at: 4, size: 4, type: u32, name: unknown, level: unknown, note: "varies per file"}
  - {at: 8, size: "4 + n", type: str, name: category, level: observed, note: "GRASSTEMPLATE, TREES, ..."}
  - {at: "next", size: 8, type: "u8[8]", name: hash, level: unknown}
  - {at: "next", size: variable, type: "behaviour[]", name: draw behaviours, level: observed, note: "u32 count, then behaviours"}
  - {at: "next", size: variable, type: "template[]", name: model templates, level: observed, note: "u32 count, then templates"}
  - {at: "next", size: variable, type: "tailor[]", name: tailors, level: observed, note: "u32 count; each { str name, str uv, u32 0, str scale, u32 0, u32 0, str density }"}
  - {at: "next", size: variable, type: "uv entry[]", name: UV entries, level: unknown, note: "list of { str name, f32[6] }; then a u32 0 (a list that is empty in every file)"}
  - {at: "next", size: variable, type: "scale entry[]", name: scale entries, level: unknown, note: "list of { str name, f32[2] }; then two u32 0 (lists that are empty in every file)"}
  - {at: "next", size: variable, type: "density entry[]", name: density entries, level: unknown, note: "list of { str name, f32[5] }"}
  - {at: "next", size: variable, type: "material[]", name: materials, level: observed, note: "list of { str name, str material (empty for MATERIAL_DEFAULT), u32 0, u32 index (0 to 20, meaning unknown), u32 0 }"}
  - {at: "next", size: variable, type: "placement template[]", name: placement templates, level: observed, note: "list of { str name, str proxy path, u32, str billboard template, str billboard tailor, str model template, str model tailor, str material, f32[2], i32 }"}
  - {at: "next", size: 4, type: u32, name: zero, value: 0, level: observed, note: "a list that is empty in every file"}
  - {at: "next", size: variable, type: "str[]", name: names, level: observed, note: "the crowd animation names in the crowd library; one empty name elsewhere"}
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

A **placement template** is what a `.pgeo` block's source range names (`GBL_SUSUKI_SUM_A_HIGH`): it names a model template (and
a tailor and a material entry) and optionally a billboard model template. :observed The tailors, UV, scale and density
entries, and the material entries are read as listed above; what their floats and the template's words mean is not
established. :unknown

The version 9 library is `u32 9, u32` (varies), two names (`GRASSTEMPLATE` twice), a list of groups, a list of sets and a final
`f32`. A group is `str name, u32 n, f32` and *n* items `{ str placement template, u8 (0 or 2), f32[7], i32 (−1, 0 or 1),
f32[3] }`; a set is `str name` and a list of group names. :proven[all 5 files] The meaning of the floats, the byte and the
word is not established. :unknown

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

What each slot's LOD set draws, read over the 26 `<x>_impostor` templates, their 26 `<x>_3D` twins and 38 other templates
(buildings, props, signs, barriers, infrastructure) placed in the Shibuya Scramble area: slot 13 is the only slot whose set
holds LOD 0 of every template and holds the whole chain (trees `[0, 1, 2]`, bushes `[0]`, props `[0, 1, 2, 3]` or `[0 .. 4]`,
buildings `[0, 3]`, impostors `[0]` or `[0, 2]`); slot 11 holds no LOD 0 of a model with several (props `[1, 2, 3]`, buildings
`[1, 3]`, trees `[2]`); slot 12 holds `[1, 3]` and slot 10 `[3]` (buildings); slots 1 and 6 hold one coarse LOD (`[3]` or `[4]`;
`[0]` for impostors, the one card). :observed The bucket flags of the meshes of those LODs do not tell the slots apart: they
are the same files, with colour buckets (`0x19`, `0x1c`, `0x38`), in every slot. :observed A tree's `_3D` template covers 0 to
25, 25 to 80 and 80 to 225 m in slot 13 and 0 to 135 m (LOD 2) in slot 11, and its `_impostor` template starts at 225 m in slot 13
and at 135 m in slot 11 (a bush: `_3D` 0 to 55 m, impostor from 55 m in slot 13; `_3D` 0 to 40 m, impostor from 40 m in
slot 11), but in slots 1 and 6 only the impostor has ranges (0 to 400 or 500 m and 0 to 200 or 250 m for a tree, 0 to 250 and 0 to 150 m for a
bush). :observed Slot 13 is therefore probably the main colour view: the one pass with the finest LOD and the near bands.
:inferred The flattenable-bush proxy templates (`bsh_flat_*_3D`, `Bush_Flattenable_Hard_3D`: two triangles, material
`art_mesh`, and bucket `0x18` for `Bush_Flattenable_Hard_3D`) have ranges in slot 11 only, and every one of the 924 placed in the area has a real `_3D` bush at
the same position. :observed The impostors are placed the same way: each of the 3,270 placements of the 26 `<x>_impostor`
templates in and within 30 m of the area has a placement of the same tree's or bush's `<x>_3D` template at the same position
(within 1 cm). They come from the rule files (`…so.pgeo` 2,764, `…ulc.pgeo` 253, `…ulp.pgeo` 253). :observed An impostor is
marked only by names: the template's `_impostor` suffix, its materials' `Impostor_LOD<n>` names and the `uber_foliage`
`Impostor` parameter, while their meshes' bucket flags (`0x38`) are those of other foliage. :observed The distinct range ends of every slot are all values of the main-view LOD profile distances
(`.pvs`, pass 2, tier 1 or 3), which does not tell the slots apart either. :observed

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
infrastructure, 120 bushes, 7 rocks map-wide. :observed Looking every model path of the 65 libraries up as
`<same folder>\<stem>_cluster<NNN>.<k>.modelbin` among the 113,868 modelbins of `GeoChunk0` finds a file for 12,566 of the
19,776 paths (10,834 of the 17,874 `.max` paths and 1,732 of the 1,872 `.model` paths); 7,210 have none, 30 of those being
empty paths. :proven[all 65 libraries]

:::open[What do the UV, scale and density entries and the tailors mean?]
They are read and every byte is accounted for, but what a tailor does with its three entries, and what the floats are, is
not established.
:::

:::open[What do the lists that are empty in every file hold?]
Three lists after the UV and scale entries and one after the placement templates are empty in all 65 libraries, so their
entry layout cannot be read from the install.
:::

:::open[What do the draw behaviour mode, flags and slot kinds mean?]
`mode` (0, 1, 3), the 13 flag bytes and the per-range `kind` are read but not interpreted.
:::

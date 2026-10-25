---
title: Spline deform
description: How Forza Horizon 6 bends guard rails, walls, railings and railway track along a curve in the instanced vertex shader, and what the engine does not store.
---

Barriers, retaining walls, railway track and rumble strips are authored as straight modules and bent along a per-instance
cubic curve at draw time. The curve is the 96-byte record stored with the instance ([Curve records](/engines/forzatech/world/pgeo-placements/));
the bend itself is in the vertex shader. The material switch `SplineDeform` (type-4 parameter, default 0) selects it, so a
curve record alone bends nothing. :observed

Counts come from a recorded census of the Tokyo track `Brio`, no longer re-checkable. :observed

## Which shaders

Three families have `*_Spline*` permutations: `environment` (46 permutations such as `_Standard_Spline`,
`_StandardRCSM_Shadows_Spline`, `_AlphaTest_Spline`), `uber_rock_array` (`_Array_Spline`, `_Array_Micro_Spline`) and
`uber_rock` (`_diff1_simple_Modulate_Spline`). Only the instanced vertex shaders (`…LightScenario_I.pcdxil.vso`, entry
`VS3D_Instanced`) bend; the non-instanced `_Standard_Spline` shader is byte-for-byte the same DXIL as `_Standard`. The deform block
is identical, after renumbering, in the G-buffer and shadow-depth shaders of every permutation checked, and the two rock families
run the same maths without the `VertexSkew` line. The `_MS` (MegaSkirt) suffix does not deform. :observed

## How the record reaches the GPU

A `StructuredBuffer<InstanceSplineData>` at t52 with stride 96 and type `{float3 × 8}` holds the 96-byte record verbatim, indexed
per instance through its own index list `t63[cb15[0].y + instance] + sub-index` (the instance record, t59, a 64-byte
`PackedTrackInstance`, uses `t46[cb15[0].x + …]`). The bend is enabled per draw by `InstancingCB` (cb13) register 1: `.x ≠ 0`
enables it, `.y` and `.z` are the model-space x range `x0` and `x1`. Register 0 carries the draw behaviour's LOD fade
distances, so the constant buffer is per-template, per-LOD draw data filled by the CPU. :observed

## The transform

From `environmentGBufferLightScenario_I.pcdxil.vso` of `_Standard_Spline`, with `pos` the dequantised model-space position
(`pos × positionScale + positionTranslate`):

```
t   = saturate((pos.x − x0) / (x1 − x0))                    x0, x1 = InstancingCB[1].y, .z
pos.x is replaced by −positionTranslate.x / positionScale.x, i.e. the dequantised x becomes 0
P   = c0 + t·c1 + t²·c2 + t³·c3                             (evaluated as ((c0 + t·c1) + t²·c2) + t³·c3)
T   = normalize(c1 + t·(2·c2) + t²·(3·c3))                  rsqrt(dot)
Up  = c4 + t·c5 + t²·c6 + t³·c7;  s = sqrt(dot(Up, Up));  U = Up / s
row0 = T,  scale.x = 1
row1 = U,  scale.y = s       environment only: if material register 41.w (VertexSkew) ≠ 0, row1 = (0, 1, 0)
row2 = cross(T, U), scale.z = 1                             (U before the VertexSkew swap; not re-normalised)
world = P + pos.y·scale.y·row1 + pos.z·row2                 (row-vector p·M; the pos.x term is zero)
normal = n.x·T + n.y·row1 + n.z·row2 (unscaled); the tangent uses the scaled rows; INSTANCE_SPLINE_TIME = t
```

The model's x axis maps onto the curve by its bounding-box range, y is offset along the curve's up vector and scaled by `|Up|`, z
along `cross(T, U)`; the record's own rotation rows, scale and position are not used (they equal `c0`, `U(0)` and `|Up(0)|`).
With `VertexSkew`, y offsets stay vertical so posts stand upright on a sloped piece; register 41.w is `CBMP` offset 668. Material
register 46.z (`MeshHidingOnOff`) multiplies the position by 0 in every permutation. Without the switch the permutation uses the
rigid record transform. :observed

An independent re-implementation of the formula finds every sampled bent vertex (10,870 and 5,862 vertices on two areas) within
0.49 mm (float32 against float64). Chained pieces (`P(1)` of one equals `P(0)` of the next) have end and start cross-sections
meeting within 0.06 mm (Tokyo, 512 joints) or 2.8 mm (rural, 310 joints) when bent, against p95 70 mm and 428 mm when rigid.
:observed Against road paint, on the 20 rural pieces bent at least 5 cm off their chord with a continuous line within 3 m, the
distance to the line departs from a straight trend by a median 1.9 cm bent against 6.3 cm rigid. :observed

## Which models bend

The switch is per material. Over the 218 block names with curve records (all LODs, summer materials): 173,475 curved records
belong to models whose LOD0 materials are all SplineDeform (armco, `bar_cty_wall_plaster_01_a`, `bar_lmt_rail_04_a`,
`inf_gbl_railway_01/03/04_a`, retaining walls, rumble strips `road_gen_rum_round_*`), 3,849 to models where only some are
(`bar_gbl_armco_02_a`, `bar_*_retain_*` with a rigid part), 62,908 to models with none (drawn rigidly: `bar_cty_wall_hwy_01_a/b/c`,
`bar_cty_planters_pavement_01_a*`, `bar_hwy_arrowcorner_01_a`, `bar_alp_fnce_net_01*`, `bar_cty_rail_metal_01_a`, fences, hedges)
and 3,162 to templates with no model. The far `projection_lod` copies (`*_plod`) never bend. :observed

## What is not stored

**The x range `x0`, `x1`.** The CPU code that fills `InstancingCB` was not located. The profiler strings of
`Instancing::InstanceCulling`, `SharedInstanceDataManager` and `VisibleSplineBufferAllocator` have no RIP-relative reference in
the code, and the one plain-code reference found, the static initialiser registering `Instancing::InstancingData`, calls two
functions whose bytes are not valid instructions at rest: part of the instancing code is stored protected, while the executable
as a whole is not packed. No shipped file stores the range under a name (the strict `.pgeo` walk accounts for every byte).
:observed The candidates, scored on the 172,719 curved records of the 112 templates with SplineDeform materials and a model (a
record matches when its curve length ÷ `|Up(0)|` equals the candidate's x length within 2 mm, i.e. a piece laid unstretched):

| Candidate x range | Records matched |
|---|---|
| union of the `Modl` bounding box x over the template's LOD files (smashable fragments left out) | 148,401 |
| the same over every cluster file, fragments included | 148,370 |
| the LOD0 file alone | 147,564 |
| the template library AABB x | 128,377 |

:observed No candidate fits every template: `bar_cst_wall_01_a` (146 records) matches the LOD-file union (2.000, 142 records) and
not the union with its smashable fragment (2.0757, 4), `bar_lmt_rail_04_endr_a` (108) matches only the union with its fragment
(2.5954, 106; LOD files 2.5904, 0), and `bar_cst_wall_01_b/_c` match none. The library box is far off on some templates
(`bar_cty_wall_plaster_01_a`: 4.0004 against curves of 3.530 and a model of 3.5295 in every LOD). The `Modl` box equals the
vertex dequantisation range `positionTranslate.x ± positionScale.x`. The curve lengths were chosen by the level-building tool,
so they show the length the tool assumed, not the constant the game binds. :observed

**The sentinel records.** All 11,634 "no curve" sentinel records sit in blocks that also hold curved ones (547 blocks, none
all-sentinel), 1,561 of them on SplineDeform templates (`bar_cst_wall_01_a` 423, `bar_cty_wall_conc_01_a` 218,
`bar_cty_wall_tiles_03_a` 179, `bar_cty_wall_plaster_01_a` 139). The vertex shader has no per-instance test: with the switch on it
bends whatever record the index list points at, and the sentinel curve runs from (−990, −990, −990) to (−3966, −3966, −3966)
with `|Up|` about 1,700, so a sentinel instance sent down the spline path would land far outside the map. Their own 80-byte
records are ordinary transforms (orthonormal rows, scale 1), they are not duplicates of other placements (3 of 1,561 lie within 0.5
m of another piece), and their rigid extents form straight runs (1,010 have an end within 2 cm of another piece's end, 588 both
ends): the layout of pieces meant to be drawn straight. :observed Which path the CPU sends them through is decided by code that was
not located. :unknown

:::open[Which x range does the game bind for each SplineDeform template?]
The four candidates fit 128,377 to 148,401 of the 172,719 curved records and none fits every template. The range is filled by CPU
code stored protected in the executable.
:::

:::open[How are the "no curve" sentinel instances drawn?]
The 1,561 sentinels on SplineDeform templates look like straight runs, but the draw path (spline switch on or off) is not known.
:::

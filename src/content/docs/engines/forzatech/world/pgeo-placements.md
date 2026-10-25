---
title: Placement files (.pgeo)
description: The per-cell placement files of Forza Horizon 6, their file grammar, the 80-byte instance record, curve records, gameplay gating and season masks.
sources:
  - title: ForzaTools
    url: https://github.com/Nenkai/ForzaTools
    note: the FH5 reader does not cover the FH6 pgeo layout
---

Nearly everything placed by rule in the world (buildings, props, trees, bushes, barriers, rocks, signs, groundcover,
infrastructure, bridges, smashables and the crowd and spline templates) is stored in **`.pgeo` placement files**, one file
per (cell size, cell, category) under `scene\proc\cellsize\<cs>\<cx>_<cz>\`. A file is a list of named **blocks**, each a
template name followed by its instances; the template name maps to one model through the category's [template
library](/engines/forzatech/world/plib-templates/). :observed

All counts are from a recorded census of the Tokyo track `Brio` (96,234 `.pgeo` files); the install is no longer available
to re-check. :observed

## Files and names

The file name is `c<cs>_<category>_<lod>[_rt_<route>][__tag_<tag>_ | _<gameplay object id>][_<mask>].pgeo`. Cell sizes on
this map are 50, 75, 100, 125, 150, 200, 250, 300, 500 and 10,000 m; a cell's world origin is `(cx × cs, 0, cz × cs)`.
:observed Categories are buildings, props, trees, bushes, barriers, rocks, signs, grasstemplate, infrastructure, bridges,
smashables, crowdtemplate, cwdspline and evolving_world. :observed

| Suffix | Holds | Confidence |
|---|---|---|
| `_do` | full-detail placements, except vegetation (`_trees_do` in the Tokyo core is plant pots) | :observed |
| `_ulc` | the real trees and bushes: `<template>_3D` blocks plus `<template>_impostor` blocks at the same positions | :observed |
| `_ulp` | impostors only | :observed |
| `_so` | vista impostors, far billboards, bush collision proxies | :observed |
| `_rt_<route>`, `__tag_<tag>_`, `_<gameplay object id>` | gameplay-gated content | :observed |
| `_<N>` (119, 187, 221, 238 ...) | season variants: the season-exclusion mask as a number | :observed |

`grasstemplate_do` (cell size 75) holds groundcover and crops: blocks named `<template>_3D_HIGH`, 8,454,531 records in
36,087 blocks map-wide (49 distinct templates: susuki, Aleutian avens, dichondra, tufty grass, cabbage, onion, lavender,
sunflower), about 3.4 million of them in summer. `_3D_HIGH` is the only `_3D_<suffix>` form in any `.pgeo` category;
`grasstemplate_so` holds 8.5 million far billboard copies (`3D_ASSET_BILLBOARD*_TEMPLATE_HIGH`) and 7 stray
`GEN_LONG_GRASS_*_3D_HIGH`. The rice-paddy templates exist in the library but nothing places them through `.pgeo`.
:observed

## File grammar

One grammar covers all 96,234 files, and walking it consumes every byte of every file, with every constant below holding
on all of them. :observed All strings are `u32` length plus ASCII with no terminator. :observed

```layout
title: .pgeo file
size: variable
games: [fh6]
note: "Little-endian. The end of the file follows the last list; kind 5 files add a spline section."
fields:
  - {at: 0, size: "4 + n", type: str, name: section name, level: observed, note: "like c75_grasstemplate_do_221_cellx55z114_section0"}
  - {at: "next", size: 4, type: u32, name: kind, level: observed, note: "0 = ordinary category file (95,694), 2 = crowdtemplate_cwd (296), 5 = cwdspline (244)"}
  - {at: "next", size: 4, type: u32, name: three, value: 3, level: observed, note: "kind 5 only"}
  - {at: "next", size: 8, type: "u32[2]", name: constants, value: "13, 15", level: observed}
  - {at: "next", size: 32, type: "f32[8]", name: bounding box, level: observed, note: "minX minY minZ 0, maxX maxY maxZ 1; w is 0 and 1 on every file"}
  - {at: "next", size: "4 + n", type: str, name: category, level: observed, note: "the library category: PROPS, GRASSTEMPLATE, CROWDTEMPLATE, EVOLVING_WORLD ..."}
  - {at: "next", size: 4, type: f32, name: unknown, level: unknown, note: "0.59 to 23 m, per file"}
  - {at: "next", size: "4 + n", type: str, name: route, level: observed, note: "empty = none; \"0\", \"8003\"; crowd: \"~101\", \"~351;~8008\""}
  - {at: "next", size: "4 + n", type: str, name: gameplay tag, level: observed, note: "empty = none; [DRIFT_ZONE_17], BARN_FIND_MAZ_55_787B_91, TAXIJOB"}
  - {at: "next", size: 4, type: "u8, u8[3]", name: season exclusion, level: observed, note: "mask byte then three zero bytes; see Seasons below"}
  - {at: "next", size: 4, type: u32, name: zero, value: 0, level: observed}
  - {at: "next", size: "4 + 32 n", type: "table entry[]", name: table, level: observed}
  - {at: "next", size: variable, type: "block[]", name: list A, level: observed, note: "u32 count, then blocks"}
  - {at: "next", size: variable, type: "block[]", name: list B, level: observed, note: "u32 count, then blocks"}
  - {at: "next", size: 4, type: u32, name: zero, value: 0, level: observed}
```

Each block is `str name; u32 n; n × 80-byte instance record; u32 m (0 or n); m × 96-byte curve record; u32 nSources;
nSources × { str source template, u32 first, u32 count }`. The sources are contiguous from record 0 and their counts
sum to *n*; *nSources* is 0 only on the crowd blocks (PEDESTRIAN, ANIMATED, ANIMATED_SPRITE) and `bsh_flat_urb_garden_3D`.
The source is the placement template the records came from (for grass, `GBL_SUSUKI_SUM_A_HIGH`, defined further down the
library). :observed

```layout
title: .pgeo table entry
size: 32
games: [fh6]
fields:
  - {at: 0, size: 4, type: u32, name: zero, value: 0, level: observed}
  - {at: 4, size: 4, type: u32, name: hash, level: observed, note: "one value per template (554 distinct, 1:1 with the block name); the function is not CRC-32, FNV, djb2 or sdbm of the name, stem or path"}
  - {at: 8, size: 12, type: "i32, u32, u32", name: B range, level: observed, note: "block index, first record, count in list B; -1, 0, 0 when none"}
  - {at: 20, size: 12, type: "i32, u32, u32", name: A range, level: observed, note: "block index, first record, count in list A; -1, 0, 0 when none"}
```

The first triple is list B and the second list A on all 189,514 entries; `_do` entries have only the B triple,
`smashables_so` entries only the A triple, `_ulc` entries both with equal values. Every range lies inside its block, and
188,987 entries are exactly one source range of the block (the other 527 cover the whole block). :observed Which blocks get
entries is not a template property (376 source templates are covered in some cells and not in others) and correlates with
no record field; the entries carry no placements. :unknown

### The two block lists

| File | List A | List B | Confidence |
|---|---|---|---|
| `_do` (every category) | empty | the model blocks `<template>_3D` (grass `_3D_HIGH`) | :observed |
| `_ulc` (trees, bushes) | `<template>_impostor`, `tre_lmt_*_impostor_vista`, `bsh_urb_hedge_*_impostor_N` | `<template>_3D` | :observed |
| `_ulp` | impostor blocks | empty | :observed |
| `_so` | impostor and vista blocks; grass billboards | empty | :observed |
| `smashables_so` | `Bush_Flattenable_*_3D` collision proxies (17,994) | empty | :observed |
| `crowdtemplate_cwd` (kind 2) | `ANIMATED_SPRITE` or empty | `ANIMATED`, `PEDESTRIAN` | :observed |
| `cwdspline` (kind 5) | empty | one `PEDESTRIAN` block | :observed |

In every `_ulc` file list A and list B are parallel: same block count, same record counts, byte-identical 80-byte
records and identical sources (12,617 bush and 9,008 tree files); only the names differ. List A is the far copy, list B
the 3D models. :observed 4,034 tree files pair `tre_gbl_elm_a_impostor` with `tre_lmt_elm_a_3D`. :observed

## The 80-byte instance record

```layout
title: Instance record
size: 80
games: [fh6]
note: "Little-endian. Coordinates are sign-magnitude fixed point, not two's complement."
fields:
  - {at: 0, size: 12, type: "u32[3]", name: position, level: observed, note: "x, y, z: bit 31 sign, bits 16-30 integer, bits 0-15 fraction / 65535 (the instanced shaders divide by 65535, not 65536)"}
  - {at: 12, size: 24, type: "f32[6]", name: rotation rows, level: observed, note: "the first two rows of the 3×3 transform, unit vectors; the third is their cross product"}
  - {at: 36, size: 12, type: "f32[3]", name: scale, level: observed, note: "local axis scale; uniform in practice"}
  - {at: 48, size: 4, type: u32, name: flags, level: unknown, note: "0x80800000 typical"}
  - {at: 52, size: 1, type: u8, name: instance variation x, level: observed, note: "the swatch-tint palette row (byte / 255), shared by all pieces of a building"}
  - {at: 53, size: 1, type: u8, name: instance variation y, level: observed, note: "per-piece value: lights on/off variation, and the tide-mark height of rock shaders"}
  - {at: 54, size: 1, type: u8, name: instance variation z, level: observed, note: "window_linecastroom room centre override"}
  - {at: 55, size: 1, type: u8, name: instance variation w, level: observed, note: "window_linecastroom room width override"}
  - {at: 56, size: 4, type: "u8[4]", name: unknown, level: unknown, note: "bytes 56 to 59 not described by any reader"}
  - {at: 60, size: 1, type: u8, name: material variant, level: observed, note: "row of the model's variant table; 0 = base"}
  - {at: 61, size: 1, type: u8, name: zero, value: 0, level: observed, note: "0 in all 1,992,129 records checked"}
  - {at: 62, size: 2, type: u16, name: building id, level: observed, note: "index into the ModulateConstants frame table of the .pvs; 0 = no frame; shared by every piece of a building and its attached props, barriers and signs"}
  - {at: 64, size: 4, type: u32, name: unknown, level: unknown, note: "not described"}
  - {at: 68, size: 4, type: u32, name: random value, level: observed, note: "per-piece"}
  - {at: 72, size: 4, type: u32, name: unknown, level: unknown, note: "not described"}
  - {at: 76, size: 4, type: u32, name: record tail, level: unknown, note: "0x00000200 on most records; groundcover 0x100 or 0x200 (0x100 in the winter grass file)"}
```

The instance variation bytes come from reading the compiled instanced vertex shaders (`environment`, `uber_rock`,
`uber_rock_array`): they load the record's dword at +0x34 and output its four bytes as `INSTANCE_VARIATION.xyzw = byte × float32(1/255)`.
The window shader reads `k = sat(IV.w × 25.6)`, `RS.x = lerp(RS.x, IV.w × 25.6, k)`, `RP.x = lerp(RP.x, IV.z × 25.6 − 12.8, k)`.
:observed

The GPU instance buffer the shaders read (a `StructuredBuffer` of stride 64) has the same layout for dwords 0 to 13;
dwords 14 and 15 are packed by the CPU (a raw dword 14 would cull every instance; dword 15 bits 8 to 23 hold the frame
index, the record's u16 at +0x3E). :observed Groundcover records use the same 80 bytes with a uniform scale, flags
`0x80800000`, variation bytes `FF FF FF FF` (tint row 1.0), variant 0 and a random value. Nothing in a record selects among
models: a template has one model, and variety comes from separate templates. :observed

Positions agree with each file's own bounding box on many cells, positive and negative on all three axes. :observed The
sign-magnitude form matters: `0x96F33B00` is −5875.23, not −26893. :observed Groundcover sits on the extracted terrain
mesh: susuki in x 3434..3690, z 4784..5040 (160,671 summer records, 30,000 sampled) at `y − terrain` median 0.000 m, p99
0.006 m; crops in x −1450..−1194, z −3900..−3644 (6,437) median −0.015 m, p99 0.13 m. :observed

Only 12 of 14.4 million placements have a scale below 0.1 (a row of `bsh_urb_garden_*` at 0.021 near (−2977, −5462), one
maple at 0.09, one wall post at 0.05), all at ground height; no record marks a placement as disabled. :observed

### Rotation convention

The engine is Direct3D row-vector: `p' = p · M`. The stored `r0` and `r1` are the first two rows of `M` and
`row2 = cross(row0, row1)`. Treating them as basis vectors rotates every yawed instance by the inverse yaw (modular
wall and sleeper pieces scatter into slabs). :observed

## Curve records

Present on 11,658 blocks (barriers 11,367, infrastructure 168, props 114, bushes 6, rocks 2, smashables 1; 218 block
names), one per instance. Each is either the "no curve" sentinel (`−990, −990, −990, −991 × 3, ..., −997 × 3`, 11,634
records) or, in 243,394 records, the instance's spline data, the struct the SplineDeform vertex shaders read verbatim:
:observed

```layout
title: Curve record
size: 96
games: [fh6]
note: "24 floats: two cubic polynomials, P(t) = c0 + c1 t + c2 t² + c3 t³ and Up(t) = c4 + c5 t + c6 t² + c7 t³."
fields:
  - {at: 0, size: 48, type: "f32[3][4]", name: curve c0..c3, level: observed, note: "world metres; c0 is the instance position (the record's fixed point is coarser, within 0.000122 m)"}
  - {at: 48, size: 48, type: "f32[3][4]", name: up vector c4..c7, level: observed, note: "its length is the y scale"}
```

The record's rigid transform is derived from the curve: `c4 / |c4|` equals the second rotation row and `|c4|` the uniform
scale on every curved record (within 3e-6); the first row is the chord direction `normalize(P(1) − P(0))` on 218,297 of
the 237,572 curved `_barriers_do` records (and the tangent `normalize(c1)` on 101,744, where the piece is straight).
`P(1)` is, on a 1 cm grid, the `P(0)` of another record of the same block for 167,137 of the 243,394, so the pieces form
chains. :observed Some records of templates that never bend are wild (planters: bends up to 279 m). :observed How the bend
is applied is on [Spline deform](/engines/forzatech/shaders/spline-deform/).

**Crowd spline (kind 5).** After the lists: `u32 nSplines` (1 on all 244), then per spline a GUID string, an 8-float box, a
length, a float (0.72 to 1), `u32 nPoints`, and `nPoints × 80 bytes` (three vec4 with w = 0 whose roles are not verified,
eight cumulative distance samples), then two lists of floats whose meaning is unknown. The PEDESTRIAN records of these
files sit at (0, 0, 0). :observed The name grammar is `c300_cwdspline_<cx>_<cz>_<n>` under cell `0_0`; the route carried
by 37 of them is in the header only. :observed

## Gameplay gating

The name grammar is also stored in the header, and on all 95,990 non-cwdspline files the name rebuilt from (cell size,
category, route, tag, mask) equals the file name: mask is the numeric suffix, tag `[X]` is `__tag_x_`, other tags are `_x`,
routes are `_rt_<route>` with `~` written `x` and `;` written `_`. :observed

| File | Route | Gameplay tag | Mask |
|---|---|---|---|
| `c50_buildings_do.pgeo` | | | 0x00 |
| `c200_props_do_rt_0.pgeo` (traffic cones, sandbags) | `0` | | 0x00 |
| `c50_buildings_do_rt_8003.pgeo` | `8003` | | 0x00 |
| `c125_trees_rt_1_ulc.pgeo` | `1` | | 0x00 |
| `c200_props_do__tag_drift_zone_17_.pgeo` | | `[DRIFT_ZONE_17]` | 0x00 |
| `c200_props_do_rt_0_discount_board_xp_a_099.pgeo` | `0` | `DISCOUNT_BOARD_XP_A_099` | 0x00 |
| `c50_buildings_do_barn_find_maz_55_787b_91_119.pgeo` | | `BARN_FIND_MAZ_55_787B_91` | 0x77 |
| `c150_bridges_do__tag_bridge_pillars_.pgeo` | | `[BRIDGE_PILLARS]` | 0x00 |
| `c300_signs_do_taxijob.pgeo` | | `TAXIJOB` | 0x00 |
| `c50_buildings_do_119.pgeo` (`bld_gbl_resi_04_a_snow`) | | | 0x77 |

All rows :observed. The tag names are gameplay-object ids (`ANIM_CM_*` match `AnimatedCollisionMeshes.xml`, barn finds,
speed cameras, estate entrances) or bracketed group tags. :observed Route 0 covers speed cameras, XP boards, danger signs,
mascots, trailblazer markers and traffic cones. :observed `evolving_world_do` files have no route or tag. :observed

:::open[Which gameplay tags does the game switch on in free roam by default?]
No field in the `.pgeo` header, the hand-placed instance record, the executable's strings or `GameObjs.xml` gives a default
state. `Stripped\EntityModel.zip` and the encrypted game database were not searched.
:::

## Seasons

The season byte uses the trigger-zone bits of `FORZA_SeasonExclusion`: the low nibble's bit 0 is spring, 1 summer, 2
autumn, 3 winter, and a set bit means the content is not shown in that season; the high nibble repeats the low one on
every file seen. :observed

| Suffix (mask) | Shown in | Content (record counts, whole map) | Confidence |
|---|---|---|---|
| none (0) | all | most files of every category; grass: crops and tufty grass (37,000) | :observed |
| `_221` (0xDD) | summer | grass 3.41 M: Aleutian avens, `SUSUKI_SUM`, dichondra | :observed |
| `_187` (0xBB) | autumn | grass 2.02 M: `*_AUTUMN` avens/dichondra, susuki from `GBL_SUSUKI_ATM_*` | :observed |
| `_238` (0xEE) | spring | grass 1.76 M: `ALEUTIAN_AVENS_SPRING` | :observed |
| `_119` (0x77) | winter | grass 1.20 M `SUSUKI_WNT`; buildings 3,298 `*_snow` roof overlays, `*_snow` barriers, snow log piles | :observed |
| `_136` (0x88) | not winter | crops (cabbage, onion, lavender) 22,000; a few props | :observed |
| `_204` 0xCC / `_153` 0x99 / `_51` 0x33 | spring+summer / summer+autumn / autumn+winter | a few dozen festival props, boxes | :observed |

The seasonal files repeat positions: in one 75 m cell (47, 59) all 2,162 `SUSUKI_WNT_A` positions are also `SUSUKI_SUM_A`
positions in `_221` and again in `_187`; a winter `bld_gbl_resi_04_a_snow` sits exactly on its `bld_gbl_resi_04_a`.
Reading every file therefore stacks up to four copies. :observed See [Seasons](/engines/forzatech/world/seasons/) for what
else changes by season.

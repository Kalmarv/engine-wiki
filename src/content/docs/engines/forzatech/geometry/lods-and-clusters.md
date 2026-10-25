---
title: LODs and clusters
description: How Forza Horizon 6 splits a template into model files, how a file's level of detail is stored, and where the switch distances are kept.
---

A placed object is a **template**: a name that maps to one model stem, which has several `.modelbin` files for its levels
of detail and, for smashables, its fragments. The files are called `<template>_clusterNNN.i.modelbin`. The shipping build
stripped every LOD that no draw profile uses, so a building piece typically ships LOD0, LOD1 and LOD3 only. :observed

All counts are from a recorded census of the Tokyo track `Brio`; the install is no longer available. :observed

## The cluster number is not the LOD

In 9,467 of 34,191 LOD files (27.7%) the cluster number and the LOD differ. The patterns seen are: `0,1,2,3,4`; Houdini
roofs `0,4`; smashables `0, fragments..., 3, 2, 1`; multi-part templates `0,1,2,3,0,1,2,3` (two parts per level). :observed

The LOD of a file is in its `Modl` blob ([Models](/engines/forzatech/geometry/modelbin/)): either `has LOD 1, min LOD = max LOD = k,
LOD flags = 1 << (k + 1)` (34,191 files) or `has LOD 0, 0, 0, 0xFFFF` (9,343 files: smashable fragments or the only file of a
single-piece template). A mesh's `(LOD flags, level 1, level 2)` is `(1 << (k+1), k, k)` or `(0xFFFF, 30, 255)`. :observed

### Census of LOD flags

Over all 113,868 modelbins of `GeoChunk0` (407,461 meshes): in `.i.modelbin` files every mesh's flags equal its file's
`Modl` flags. :observed

| `Modl` LOD flags | Files |
|---|---|
| `0x2` (LOD0) | 29,122 |
| `0x4` (LOD1) | 25,337 |
| `0x8` (LOD2) | 21,362 |
| `0x10` (LOD3) | 19,341 |
| `0x20` (LOD4) | 8,276 |
| `0x40` (LOD5) | 11 |
| `0xFFFF` (has LOD 0) | 10,414 |

Bit 0 occurs only inside `0xFFFF` (13,730 meshes, all in the 10,414 all-LOD files); no mesh sets bit 0 with any other
combination, so it has no meaning of its own, and the test for a LOD is `flags & (1 << (k + 1))`. :observed The five
`.a.modelbin` files give each mesh one LOD bit (89 meshes); two have no LOD0 mesh (flags `0x1C`, LOD1 to LOD3). :observed

## Switch distances

LOD distances are stored only in the hand-placed instance file's LOD profile table ([Hand-placed instances](/engines/forzatech/world/pvs-ribbon/)):

```layout
title: LOD profile record
size: 50
games: [fh6]
note: "In the .pvs. u32 group count, then per group a u32 n and n records. Little-endian."
fields:
  - {at: 0, size: 2, type: u16, name: tier, level: observed, note: "quality tier 0 to 4"}
  - {at: 2, size: 2, type: u16, name: pass, level: observed}
  - {at: 4, size: 36, type: "band[6]", name: bands, level: observed, note: "per band: f16 distance, f16 fade, u8 0, u8 last"}
  - {at: 40, size: 1, type: u8, name: one, value: 1, level: observed}
  - {at: 41, size: 1, type: u8, name: unknown, level: unknown}
  - {at: 42, size: 8, type: "f32[2]", name: two floats, value: "1.0, 1.0", level: observed}
```

LOD *k* is drawn in `[max(dist_0..dist_k−1), dist_k)`; a zero-width band skips the LOD; nothing is drawn beyond the band
marked `last`. :observed Pass 2 is the main view and the only pass with fades; passes 4, 10 and 11 equal `dist − fade/2`
exactly, pass 7 `min(dist − fade/2, 100)`. :observed

A hand-placed instance's group is its transform byte +56. A `.pgeo` template's group is that of its **catalogue copy**: the
one unplaced ribbon instance of the template at exactly (0, 0, 0), which exists for 1,882 of 2,010 `.pgeo` templates; the
rest ship no modelbin. :observed The LODs the build stripped equal the LODs the profile never draws for 98.6% of model sets.
:observed

The game's global LOD distance scales and which PC preset is which tier are in encrypted settings. :unknown

## Distance bands of the template libraries

For vegetation and props, the distances come from the instance template libraries instead: a draw behaviour slot lists
distance bands, and the template's set for that slot lists model LODs. See [Template libraries](/engines/forzatech/world/plib-templates/). :observed

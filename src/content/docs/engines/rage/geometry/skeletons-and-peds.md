---
title: Skeletons, skinning and ped components
description: Bone tags, local and inverse transforms, blend palettes and component-ped variation data.
games: [gta-v]
sources:
  - title: CodeWalker
    url: https://github.com/dexyfex/CodeWalker
    note: Skeleton and CPedVariationInfo descriptions.
implementations:
  - name: primase worlds/gta (drawable.rs)
    url: https://github.com/Kalmarv/primase/blob/main/worlds/gta/src/rage/drawable.rs
  - name: primase worlds/gta (ped.rs)
    url: https://github.com/Kalmarv/primase/blob/main/worlds/gta/src/rage/ped.rs
---

Drawables can carry a skeleton with per-bone local transforms, parent indices, tags and stored inverse transforms.
A geometry's blend indices refer through its bone palette; palette entries are bone tags rather than necessarily
the skeleton's array indices. :proven

Skeleton header fields below are read wherever present across every accepted version-159 YDR/YDD and version-171
YFT in the resource census, including fragment drawables. Fifteen other-version YDR copies are excluded. This
establishes stored skeleton structure, while the component-variation and pose examples below retain their own
measurement scope. :proven[version-filtered full-install census]

```layout
title: Skeleton header
size: 112
fields:
  - {at: 0, size: 32, type: bytes, name: undescribed prefix, level: unknown}
  - {at: 32, size: 8, type: pointer, name: bone records, level: proven}
  - {at: 40, size: 8, type: pointer, name: inverse transforms, level: proven}
  - {at: 48, size: 8, type: pointer, name: local transforms, level: proven}
  - {at: 56, size: 8, type: pointer, name: parent indices, level: proven}
  - {at: 64, size: 30, type: bytes, name: undescribed fields, level: unknown}
  - {at: 94, size: 2, type: u16, name: bone count, level: proven}
  - {at: 96, size: 16, type: bytes, name: undescribed tail, level: unknown}
```

```layout
title: Bone record
size: 80
fields:
  - {at: 0, size: 68, type: bytes, name: undescribed fields, level: unknown}
  - {at: 68, size: 2, type: u16, name: bone tag, level: proven}
  - {at: 70, size: 10, type: bytes, name: undescribed tail, level: unknown}
```

Local transforms occupy 64 bytes each as row-vector 4×4 matrices with an unused fourth column. Parent indices are
16-bit signed values; `-1` marks a root. Composing a bone's local transform with its ancestors places it in drawable
space. :proven

Four unsigned-byte indices and four normalized unsigned-byte weights supply the sampled `BLENDINDICES0` and
`BLENDWEIGHT0` skin streams. Stored inverse transforms belong to the skeleton; replacing them with assumed identity
transforms loses the authored bind relationship. :observed

Some fragment poses are singular: the inspected corpus identifies all-zero poses on `z_z_alien`, `z_z_fred`,
`z_z_fred_large`, `z_z_wilma`, `z_z_wilma_large` and `cs_bradcadaver`. A blanket assumption that every fragment pose is
an invertible rotation is therefore invalid. :observed

## Component peds

`CPedVariationInfo` is META data in a component ped's `.ymt`, beside its `.ydd` and `.yft`. It describes available
component slots and each slot's drawable and texture variations. :observed

| Slot index | Identifier | Confidence |
|---|---|---|
| 0 | `head` | :observed |
| 1 | `berd` | :observed |
| 2 | `hair` | :observed |
| 3 | `uppr` | :observed |
| 4 | `lowr` | :observed |
| 5 | `hand` | :observed |
| 6 | `feet` | :observed |
| 7 | `teef` | :observed |
| 8 | `accs` | :observed |
| 9 | `task` | :observed |
| 10 | `decl` | :observed |
| 11 | `jbib` | :observed |

Dictionary entry names follow `<slot>_<three-digit-index>_<suffix>`, hashed for lookup. Suffixes `r`, `u` and `m`
occur; restricting lookup to the first two loses some upper- and lower-body entries. :observed

[Animation tracks](/engines/rage/animation/ycd/) also identify bones by tag. The available variation set does not
by itself establish the component combination selected by gameplay. :observed

:::open[How do gameplay selections resolve all ped variation constraints?]
Selection sets, component metadata and prop information exist, but the complete selection policy is not established
by the component and dictionary linkage described here. :unknown
:::

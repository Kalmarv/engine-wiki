---
title: World LOD, content flags and priority
description: Map-parent hierarchy, far stand-ins, content flags and density-dependent entity priorities.
games: [gta-v]
sources:
  - title: CodeWalker
    url: https://github.com/dexyfex/CodeWalker
    note: LOD and priority enum names, YmapFile.CalcFlags.
implementations:
  - name: primase worlds/gta (map.rs)
    url: https://github.com/Kalmarv/primase/blob/main/worlds/gta/src/rage/map.rs
---

World LOD links placed entities across map files. An entity's `parentIndex` indexes the parent map's entity array;
`-1` means no LOD parent. `numChildren`, `lodDist` and `childLodDist` describe the linked hierarchy's detail and
distance relationships. :sourced[CodeWalker]

| `lodLevel` | Name | Confidence |
|---|---|---|
| 0 | HD | :sourced[CodeWalker] |
| 1 | LOD | :sourced[CodeWalker] |
| 2 | SLOD1 | :sourced[CodeWalker] |
| 3 | SLOD2 | :sourced[CodeWalker] |
| 4 | SLOD3 | :sourced[CodeWalker] |
| 5 | ORPHANHD | :sourced[CodeWalker] |
| 6 | SLOD4 | :sourced[CodeWalker] |

The distant city has authored SLOD models, separate from the high/medium/low/very-low lists inside individual
[drawables](/engines/rage/geometry/drawables/). These are two distinct levels of detail organization. :observed

A mesh name containing `slod` is not a sufficient definition of its placement role: SLOD-looking geometry also
occurs in ordinary HD placements. A reported Del Perro pier example is `m_sm_slod3sjm`, above the deck; its name alone
does not establish which runtime pass uses it. :inferred

## Content flags

CodeWalker's calculated meanings are useful descriptions, but the stored bits are not always derivable from the
entities in a file. :observed

| `contentFlags` bit | CodeWalker interpretation | Confidence |
|---|---|---|
| 0 | HD or ORPHANHD entities | :sourced[CodeWalker] |
| 1 | LOD entities | :sourced[CodeWalker] |
| 2 | SLOD2 or coarser | :sourced[CodeWalker] |
| 3 | Interior instances | :sourced[CodeWalker] |
| 4 | SLOD1 or coarser | :sourced[CodeWalker] |
| 5 | Occluders | :sourced[CodeWalker] |
| 6 | Physics dictionaries | :sourced[CodeWalker] |
| 7 | LOD lights | :sourced[CodeWalker] |
| 8 | Distant LOD lights | :sourced[CodeWalker] |
| 10 | Grass instance batches | :sourced[CodeWalker] |
| 9, 11–31 | Meaning not established | :unknown |

Real map listings include maps with SLOD entities and bit 4 unset, and maps with bit 4 set and no such entities.
`prologue05b_lod.ymap` is an example that defeats treating bit 4 as a calculated function of entity LOD levels.
:observed

## Priority

| `priorityLevel` | Name | Confidence |
|---|---|---|
| 0 | `PRI_REQUIRED` | :sourced[CodeWalker] |
| 1 | `PRI_OPTIONAL_HIGH` | :sourced[CodeWalker] |
| 2 | `PRI_OPTIONAL_MEDIUM` | :sourced[CodeWalker] |
| 3 | `PRI_OPTIONAL_LOW` | :sourced[CodeWalker] |

At sampled settings with `CityDensity=1.0` and `SMC_AUTO`, optional-low objects such as parking meters, bollards and
small palms are absent while optional-medium objects such as news boxes and dumpsters are present. This observation
does not establish the controlling setting or a universal priority cutoff. :observed

:::open[What selects optional-low entities?]
The stored priorities and a runtime absence/presence comparison are known; the CPU decision and full settings matrix
are not established. :unknown
:::

:::open[What do stored content flags imply beyond their calculated descriptions?]
Bit 4 contradicts a rule based solely on contained entity levels. Its full streaming role remains unresolved.
:unknown
:::

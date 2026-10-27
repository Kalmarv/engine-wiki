---
title: World LOD, content flags and priority
description: Map-parent hierarchy, far stand-ins, content flags and density-dependent entity priorities.
games: [gta-v]
sources:
  - title: CodeWalker
    url: https://github.com/dexyfex/CodeWalker
    note: LOD and priority enum names, YmapFile.CalcFlags.
  - title: fivefury
    note: content flag names
  - title: rage-formats
    url: https://github.com/VIRUXE/rage-formats
    note: content flag names
implementations:
  - name: primase worlds/gta (map.rs)
    url: https://github.com/Kalmarv/primase/blob/main/worlds/gta/src/rage/map.rs
---

World LOD links placed entities across map files. An entity's `parentIndex` indexes the parent map's entity array;
`-1` means no LOD parent. `numChildren`, `lodDist` and `childLodDist` describe the linked hierarchy's detail and
distance relationships. :sourced[CodeWalker]

The LOD and priority enum names and values in the tables are checked against the embedded enum descriptions in
every YMAP and YTYP copy of the install, with no mismatch or refused file. This establishes their stored encoding,
not the runtime distance or density decision. :proven[all map and archetype enum descriptions]

| `lodLevel` | Name | Confidence |
|---|---|---|
| 0 | HD | :proven |
| 1 | LOD | :proven |
| 2 | SLOD1 | :proven |
| 3 | SLOD2 | :proven |
| 4 | SLOD3 | :proven |
| 5 | ORPHANHD | :proven |
| 6 | SLOD4 | :proven |

The distant city has authored SLOD models, separate from the high/medium/low/very-low lists inside individual
[drawables](/engines/rage/geometry/drawables/). These are two distinct levels of detail organization. :observed

A mesh name containing `slod` is not a sufficient definition of its placement role: SLOD-looking geometry also
occurs in ordinary HD placements. On Del Perro pier, a section of `m_sm_slod3sjm` is placed as HD geometry 0.74 m
above the deck. :observed Its name alone does not establish which runtime pass uses it. :inferred

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

Other readers name the bits differently: fivefury calls bit 4 `BLOCKINFO` and bit 2 container LOD, and fivefury and
rage-formats call bit 9 critical. Neither states where its names come from. :sourced[fivefury, rage-formats]

Real map listings include maps with SLOD entities and bit 4 unset, and maps with bit 4 set and no such entities.
`prologue05b_lod.ymap` is an example that defeats treating bit 4 as a calculated function of entity LOD levels.
:observed

## Priority

| `priorityLevel` | Name | Confidence |
|---|---|---|
| 0 | `PRI_REQUIRED` | :proven |
| 1 | `PRI_OPTIONAL_HIGH` | :proven |
| 2 | `PRI_OPTIONAL_MEDIUM` | :proven |
| 3 | `PRI_OPTIONAL_LOW` | :proven |

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

---
title: Enhanced archive corpus
description: Recounted archive and resource-entry totals, with physical copies separated from active world selection.
games: [gta-v]
sources:
  - title: CodeWalker
    url: https://github.com/dexyfex/CodeWalker
    note: Independent archive table-of-contents listing used for the recount.
implementations:
  - name: primase worlds/gta (archive_set.rs)
    url: https://github.com/Kalmarv/primase/blob/main/worlds/gta/src/read/archive/archive_set.rs
---

The retained PC Enhanced archive listing contains 5,407 unique archive paths, including nested archives. A recount
groups by full archive path and then counts each table entry by kind and extension; directories are excluded from
the file totals below. These are physical archive-entry counts, including overridden copies, rather than the
number of visible assets in a running world. :proven[complete retained listing]

| Unit | Count | Confidence |
|---|---|---|
| Unique archive paths | 5,407 | :proven |
| NG archive records | 5,405 | :proven |
| AES archive records | 2 | :proven |
| Directory entries | 9,182 | :proven |
| Binary entries | 45,075 | :proven |
| Resource entries | 348,598 | :proven |
| Binary plus resource entries | 393,673 | :proven |

The two AES paths are named in [RPF7 archives](/engines/rage/archives/rpf7/). :proven

## Selected file types

These rows count file entries by their last filename extension in the same listing, across all archives and all
copies; they do not imply that every entry uses the Enhanced payload layout. :proven

| Extension | Entry count | Confidence |
|---|---|---|
| `ymap` | 19,941 | :proven |
| `ytyp` | 2,869 | :proven |
| `ydr` | 84,607 | :proven |
| `ydd` | 23,108 | :proven |
| `yft` | 61,064 | :proven |
| `ytd` | 89,817 | :proven |
| `ybn` | 14,692 | :proven |
| `ycd` | 25,961 | :proven |
| `ymt` | 4,715 | :proven |
| `ynv` | 10,567 | :proven |
| `ynd` | 780 | :proven |
| `ypt` | 1,544 | :proven |
| `ysc` | 1,864 | :proven |

The independent [animation recount](/engines/rage/animation/ycd/) has the same 25,961 unique dictionary paths and
267,536 contained animations. An animation hash can occur in more than one dictionary, so this is not a count of
distinct motion identities. :proven

## What a city count needs

An installed resource count does not specify the city's placed geometry. Story/Online
[mount state](/engines/rage/archives/mounts/), script-managed map activation,
[world LOD and priority](/engines/rage/world/lod-and-priority/), and
[drawable model detail](/engines/rage/geometry/drawables/) all select subsets of the stored data. :proven

:::open[How large is the city under a reproducible native selection?]
A native placement, triangle or draw-count total with a precise map state, region, hour, priority and LOD selection
is not established by this archive listing. :unknown
:::

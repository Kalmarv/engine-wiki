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
number of visible assets in a running world. :observed[complete retained listing]

| Unit | Count | Confidence |
|---|---|---|
| Unique archive paths | 5,407 | :observed |
| NG archive records | 5,405 | :observed |
| AES archive records | 2 | :observed |
| Directory entries | 9,182 | :observed |
| Binary entries | 45,075 | :observed |
| Resource entries | 348,598 | :observed |
| Binary plus resource entries | 393,673 | :observed |

The two AES paths are named in [RPF7 archives](/engines/rage/archives/rpf7/). :observed

## Selected file types

These rows count file entries by their last filename extension in the same listing, across all archives and all
copies; they do not imply that every entry uses the Enhanced payload layout. :observed

| Extension | Entry count | Confidence |
|---|---|---|
| `ymap` | 19,941 | :observed |
| `ytyp` | 2,869 | :observed |
| `ydr` | 84,607 | :observed |
| `ydd` | 23,108 | :observed |
| `yft` | 61,064 | :observed |
| `ytd` | 89,817 | :observed |
| `ybn` | 14,692 | :observed |
| `ycd` | 25,961 | :observed |
| `ymt` | 4,715 | :observed |
| `ynv` | 10,567 | :observed |
| `ynd` | 780 | :observed |
| `ypt` | 1,544 | :observed |
| `ysc` | 1,864 | :observed |

The independent [animation recount](/engines/rage/animation/ycd/) has the same 25,961 unique dictionary paths and
267,536 contained animations. An animation hash can occur in more than one dictionary, so this is not a count of
distinct motion identities. :observed

## What a city count needs

An installed resource count does not specify the city's placed geometry. Story/Online
[mount state](/engines/rage/archives/mounts/), script-managed map activation,
[world LOD and priority](/engines/rage/world/lod-and-priority/), and
[drawable model detail](/engines/rage/geometry/drawables/) all select subsets of the stored data. :observed

:::open[How large is the city under a reproducible native selection?]
A native placement, triangle or draw-count total with a precise map state, region, hour, priority and LOD selection
is not established by this archive listing. :unknown
:::

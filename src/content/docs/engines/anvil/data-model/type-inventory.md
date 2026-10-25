---
title: "Resource inventory and reader coverage"
description: "Counting units, archive populations, type-name confidence and decoding scope."
games: ["riders-republic"]
sources:
  - title: RRAssetStudio v3
    url: https://www.nexusmods.com/ridersrepublic/mods/5
    note: Independent Riders Republic resource reader.
implementations:
  - name: "primase worlds/anvil (listing.rs)"
    url: https://github.com/Kalmarv/primase/blob/main/worlds/anvil/src/read/listing.rs
---

The six archive name tables contain **1,301,684 stored entries and 905 distinct type ids**. Summing each type across archives and each archive across types reproduces those totals. Base/patch copies and null/meta entries are included; these are not unique live resources. :observed

| Archive | Entries | Confidence |
|---|---:|---|
| `DataPC.forge` | 163,356 | :observed |
| `DataPC_patch_01.forge` | 49,363 | :observed |
| `DataPC_MAD_USNAT.forge` | 767,463 | :observed |
| `DataPC_MAD_USNAT_patch_01.forge` | 320,777 | :observed |
| `DataPC_MAD_WhiteRoom.forge` | 388 | :observed |
| `DataPC_MAD_WhiteRoom_patch_01.forge` | 337 | :observed |

The complete hash-sorted type inventory is split into [part 1](/engines/anvil/data-model/type-inventory-1/), [part 2](/engines/anvil/data-model/type-inventory-2/), [part 3](/engines/anvil/data-model/type-inventory-3/), [part 4](/engines/anvil/data-model/type-inventory-4/). Every name retains its own confidence independently from its counted occurrences. :observed

## Coverage criteria

The following measurements use a fixed decoding profile. Acceptance means the profile can frame the body, not that every field has established semantics. A stricter component-length profile and a profile retaining unknown component bytes answer different questions. :observed

| Resource | Accepted | Refused | Criterion / scope | Confidence |
|---|---:|---:|---|---|
| Entity | 585,234 | 29,876 | Strict sequential component-length profile | :observed |
| EntityGroup | 38,825 | 18,012 | Strict sequential component-length profile | :observed |
| GridCellDataBlock | 66,359 | 0 | Six-archive body profile | :observed |
| GridPartition | 8 | 0 | Six-archive body profile | :observed |
| World | 4 | 0 | Six-archive body profile | :observed |
| LODSelector | 48,862 | 0 | Six-archive body profile | :observed |
| MeshShape | 25,162 | 0 | Six-archive body profile | :observed |
| ReferenceListShape | 3,731 | 0 | Six-archive body profile | :observed |
| SphereShape | 241 | 0 | Six-archive body profile | :observed |
| CapsuleShape | 290 | 0 | Six-archive body profile | :observed |
| BoxShape | 29 | 0 | Six-archive body profile | :observed |

Full Entity and EntityGroup framing, when unknown component bodies are retained between recognized headers, reaches all 615,110 and 56,837 records respectively. This does not erase the distinction between interpreted and opaque components. :observed

The six-archive inventory contains 9,111 Animation and 10,741 BuildTable entries. The exact-end clip/BuildTable checks cover five named archives and omit WhiteRoom patch, which contributes 24 clips and 11 tables. Thus their checked populations are 9,087 and 10,730; the difference is archive scope, not a conflicting resource count. :observed

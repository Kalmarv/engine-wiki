---
title: EDGE traversal data
description: Sekiro grapple points, hang segments and wall-hug records.
games: [sekiro]
implementations:
  - name: primase EDGE reader
    url: https://github.com/Kalmarv/primase/blob/main/worlds/fromsoft/src/edge.rs
---

Sekiro EDGE data describes grapple points, hang segments and wall-hug segments separately from render meshes and
collision. The examined files have a 16-byte header and 64-byte records, with the count covering the complete file.
:observed

```layout
title: EDGE header
size: 16
fields:
  - {at: 0, size: 4, type: u32, name: unknown, level: unknown, note: Observed 4}
  - {at: 4, size: 4, type: u32, name: record count, level: observed}
  - {at: 8, size: 4, type: i32, name: file ID, level: observed}
  - {at: 12, size: 4, type: u32, name: padding, level: observed, value: 0}
```

```layout
title: EDGE record
size: 64
fields:
  - {at: 0, size: 12, type: "f32[3]", name: point 0, level: observed}
  - {at: 12, size: 4, type: f32, name: unknown, level: unknown, note: Observed 1.0}
  - {at: 16, size: 12, type: "f32[3]", name: point 1, level: observed}
  - {at: 28, size: 4, type: f32, name: unknown, level: unknown, note: Observed 1.0}
  - {at: 32, size: 12, type: "f32[3]", name: point 2, level: observed}
  - {at: 44, size: 4, type: f32, name: parameter, level: unknown, note: Finite stored float; meaning unresolved}
  - {at: 48, size: 4, type: i32, name: record ID, level: observed}
  - {at: 52, size: 1, type: u8, name: traversal kind, level: observed, note: 1 grapple; 2 hang; 3 wall hug}
  - {at: 53, size: 1, type: u8, name: variation, level: unknown, note: Raw stored byte}
  - {at: 54, size: 1, type: u8, name: flags, level: unknown, note: Raw stored byte}
  - {at: 55, size: 9, type: "u8[9]", name: padding, level: observed, value: 0}
```

## Counts in the Ashina maps :only[sekiro]

| Map | Hang segments | Wall-hug segments | Grapple points | Confidence |
|---|---|---|---|---|
| `m11_01` Ashina Castle | 963, 7,280 m | 1,326, 6,267 m | none | :observed{games="sekiro"} |
| `m11_00` Ashina Outskirts | 584, 2,813 m | 974, 3,818 m | 4 | :observed{games="sekiro"} |
| `m11_02` Ashina Reservoir | 211, 702 m | 229, 778 m | none | :observed{games="sekiro"} |

:::open[What are the point and variation conventions for every traversal kind?]
The records distinguish traversal classes, but complete point roles, eligibility flags, direction conventions and
runtime activation rules remain unresolved.
:::

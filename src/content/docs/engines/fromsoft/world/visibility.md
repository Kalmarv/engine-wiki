---
title: Visibility and shadow controls
description: MSB visibility arrays, independent shadow flags and their unresolved runtime joins.
sources:
  - title: SoulsFormatsNEXT MSB parts
    url: https://github.com/soulsmods/SoulsFormatsNEXT/tree/master/SoulsFormats/Formats/MSB
implementations:
  - name: primase MSB reader
    url: https://github.com/Kalmarv/primase/blob/main/worlds/fromsoft/src/msb.rs
---

MSB stores several controls that affect what can draw: part shadow bytes, visibility-related arrays and
event-addressable entity IDs. Character display masks and event-flag world presence add separate state systems.
:sourced[SoulsFormatsNEXT]

## Visibility arrays

The reference reader names Elden Ring part arrays `DisplayGroups`, `DrawGroups` and `CollisionMask`, but leaves their
semantics unknown. Sekiro's corresponding structure is named `CollisionMask` with 48 words.
:sourced[SoulsFormatsNEXT]

```layout
title: Elden Ring part visibility-related structure
size: 392
games: [elden-ring]
fields:
  - {at: 0, size: 32, type: "u32[8]", name: DisplayGroups, level: unknown, note: Community field name; meaning unresolved}
  - {at: 32, size: 32, type: "u32[8]", name: DrawGroups, level: unknown, note: Community field name; meaning unresolved}
  - {at: 64, size: 128, type: "u32[32]", name: CollisionMask, level: unknown, note: Community field name; meaning unresolved}
  - {at: 192, size: 4, type: "u8[4]", name: conditions and unknown bytes, level: unknown, note: Named Condition1; Condition2; UnkC2; UnkC3 by the reference}
  - {at: 196, size: 2, type: i16, name: unknown, level: unknown, note: Reference reports -1 in retail}
  - {at: 198, size: 2, type: i16, name: unknown, level: unknown, note: Reference reports 0 or 1 in retail}
  - {at: 200, size: 192, type: "u8[192]", name: padding, level: sourced, value: 0}
```

The Elden Ring shadow-byte comparison covers every part of all 935 installed MSBs with no refusals.
:proven{games="elden-ring"}

## Shadow bytes

Offsets below are relative to the part's entity-data block, not its header. The cast, receive and shadow-only flags
are independent stored bytes.
:observed{games="sekiro"} :proven[all 457,108 parts]{games="elden-ring"}

| Offset | Meaning | Stored encoding | Confidence |
|---|---|---|---|
| `0x0a` | Point-light shadow cast | MSBS: `0/1`; MSBE: `0/0xff` | :observed{games="sekiro"} :proven[all parts]{games="elden-ring"} |
| `0x0c` | Cast shadow | `0/1` | :observed{games="sekiro"} :proven[all parts]{games="elden-ring"} |
| `0x0d` | Static shadow control | Raw byte; renderer meaning unresolved | :unknown |
| `0x0e` | Cascade-3 shadow control | Raw byte; renderer meaning unresolved | :unknown |
| `0x11` | Receive shadow | `0/1` | :observed{games="sekiro"} :proven[all parts]{games="elden-ring"} |
| `0x12` | Shadow only | `0/1` | :observed{games="sekiro"} :proven[all parts]{games="elden-ring"} |

:::open[What is the exact visibility predicate?]
The presence of arrays and their community names do not establish bit intersections, collision activation,
occlusion, camera dependence or LOD handoff. Nor is precedence established when shadow-only and cast-shadow
controls appear contradictory. These bytes must not be collapsed into a single unconditional visibility flag.
:::

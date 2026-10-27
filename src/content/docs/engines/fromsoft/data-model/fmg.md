---
title: FMG message files
description: The text tables of the message binders, the version 2 layout and what a full-install census found in it.
sources:
  - title: SoulsFormatsNEXT FMG
    url: https://github.com/soulsmods/SoulsFormatsNEXT
implementations:
  - name: fromsoft-formats FMG reader
    url: https://github.com/Kalmarv/fromsoft-formats/blob/main/src/fmg.rs
---

An FMG is a table from numeric IDs to strings. The games keep their text (item and menu text) in FMGs that sit as members named `*.fmg` inside the message binders, one folder per language under
`msg/` (for example `msg/engus/item.msgbnd.dcx`). The IDs are the keys that params and scripts use to name text.
:sourced[SoulsFormatsNEXT]

Both games use the 64-bit-offset layout, version 2, and never a big-endian or non-Unicode file. All 504 FMGs of the
Sekiro install and all 3,968 of the Elden Ring install (the base game) have the header bytes and the group table
described below with no exception. :proven

```layout
title: FMG header and group table (version 2)
size: variable
note: Little-endian. IDs are stored as ranges (groups); each group's strings are consecutive slots of the offset table.
fields:
  - {at: 0, size: 1, type: u8, name: zero, level: proven, value: 0}
  - {at: 1, size: 1, type: u8, name: big-endian flag, level: proven, value: 0, note: "Zero in all 4,472 files"}
  - {at: 2, size: 1, type: u8, name: version, level: proven, value: 2}
  - {at: 3, size: 1, type: u8, name: zero, level: proven, value: 0}
  - {at: 4, size: 4, type: u32, name: file size, level: proven, note: Equals the file's length in every file}
  - {at: 8, size: 1, type: u8, name: Unicode flag, level: proven, value: 1, note: Strings are UTF-16LE}
  - {at: 12, size: 4, type: u32, name: group count, level: proven}
  - {at: 16, size: 4, type: u32, name: string count, level: proven, note: Equals the sum of the group sizes in every file}
  - {at: 20, size: 4, type: u32, name: unknown, level: unknown, note: "0xff in every file"}
  - {at: 24, size: 8, type: u64, name: string-offset table offset, level: proven, note: The group table ends exactly here in every file}
  - {at: 32, size: 8, type: u64, name: zero, level: proven, value: 0}
  - {at: 40, size: "16 × group count", type: "group[]", name: groups, level: proven}
```

```layout
title: FMG group (version 2)
size: 16
fields:
  - {at: 0, size: 4, type: u32, name: index of the group's first string slot, level: proven, note: Continues where the previous group's slots end}
  - {at: 4, size: 4, type: i32, name: first ID, level: proven}
  - {at: 8, size: 4, type: i32, name: last ID, level: proven, note: Inclusive}
  - {at: 12, size: 4, type: u32, name: zero, level: proven, value: 0}
```

A group holds the IDs `first..=last`; its slot `j` belongs to ID `first + j`. A slot is a u64 offset from the file's
start to a NUL-terminated UTF-16 string, or 0. :proven for the slot table; the string encoding is :sourced[SoulsFormatsNEXT]

## What the install holds

Over all 504 Sekiro FMGs (46,738 groups, 381,243 slots) and all 3,968 Elden Ring FMGs (787,143 groups, 7,526,881 slots):

- No ID appears in two groups of one file, and the groups are in ascending ID order without overlap. :proven
- The group table ends where the offset table begins, group indices are consecutive, and the string count is the sum of
  the group sizes. :proven
- A slot of 0 (an ID with no string) is common: 114,867 of the Sekiro slots, in 446 of 504 files, and 5,481,630 of the
  Elden Ring slots, in 2,604 of 3,968 files. A reader should treat such an ID as having no text, not as an error. :proven

:::open[What do the IDs without strings mean?]
The slot table gives an ID a place in a group range even when no text exists for it in that language or build.
Whether the game treats an empty slot differently from a missing ID is not established.
:::

---
title: MaterialEx action data
description: Elden Ring MaterialExParam rows and their observed TAE 198 references.
games: [elden-ring]
sources:
  - title: Paramdex
    url: https://github.com/soulsmods/Paramdex
  - title: DSAnimStudio
    url: https://github.com/Meowmaritus/DSAnimStudio
implementations:
  - name: primase material event reader
    url: https://github.com/Kalmarv/primase/blob/main/worlds/fromsoft/src/sekiro/read/material_events.rs
---

MaterialExParam stores named material-parameter data, and examined TAE type-198 actions reference its row IDs.
The checked Elden Ring table is `MATERIAL_EX_PARAM_ST`, data version 4, with 96-byte rows. :observed

```layout
title: MaterialExParam version 4 row
size: 96
fields:
  - {at: 0, size: 64, type: "u16[32]", name: parameter name, level: observed, note: NUL-terminated UTF-16LE}
  - {at: 64, size: 4, type: i32, name: material ID, level: sourced}
  - {at: 68, size: 20, type: "f32[5]", name: stored RGBA and intensity lanes, level: observed, note: Values are stored; their application rule is unresolved}
  - {at: 88, size: 8, type: "u8[8]", name: unknown tail, level: unknown, note: Retained without interpretation}
```

```layout
title: Examined TAE 198 parameter payload
size: 64
fields:
  - {at: 0, size: 4, type: u32, name: unknown, level: unknown, note: Raw word retained}
  - {at: 4, size: 4, type: i32, name: MaterialExParam row ID, level: observed}
  - {at: 8, size: 56, type: "u8[56]", name: unknown action fields, level: unknown, note: Raw integer and float word views do not establish timing or target meanings}
```

Examined aliases can carry 72 bytes, with eight zero bytes after the 64-byte payload. :observed

:::open[How does a material action apply and transition?]
The row link does not establish ramp duration, interpolation, target selection, blending with other actions or
application order. The Elden Ring envelope does not establish Sekiro's type-198 layout.
:::

---
title: Light and fog files
description: "The light and fog binary files of Sonic Adventure 2: Battle stages, how a stage names them, their layouts and which parts of their use are engine code."
sources:
  - title: X-Hax SA Tools (SA2LightFogEditor)
    url: https://github.com/X-Hax/sa_tools
    note: the light and fog file layouts
---

Each stage can have a light file and one or more fog files. The stage module names them as strings (for example `stg13_light.bin` and `stg13_fog.bin` in `stg13D.rel`, or `stg24_fogA.bin` in `stg24D.rel`),
and a named file need not exist on the disc: `stg13_fog.bin` is named but absent, so City Escape has no fog file. :observed `stgNN_light_gc.bin` files exist for 18 stages but are named in no module; they
are found by name convention. :observed 104 light and fog files are present in all. :observed Counts come from a recorded census of the USA disc `GSNE8P`; they cannot be re-checked now. :observed

## Layouts

Big-endian, from SA Tools' SA2LightFogEditor. :sourced[SA Tools]

```layout
title: Light slot (stgNN_light.bin, 0x180 bytes = 12 slots)
size: 32
games: [sa2b]
note: Big-endian. Twelve slots; `dir` is the direction the light travels ((0, −1, 0) = from above).
fields:
  - {at: 0, size: 12, type: "f32[3]", name: dir, level: sourced}
  - {at: 12, size: 4, type: f32, name: color multiplier, level: sourced}
  - {at: 16, size: 4, type: f32, name: ambient multiplier, level: sourced}
  - {at: 20, size: 12, type: "f32[3]", name: color, level: sourced}
```

```layout
title: Light slot (stgNN_light_gc.bin, 0x240 bytes = 12 slots)
size: 48
games: [sa2b]
note: Big-endian. Twelve slots.
fields:
  - {at: 0, size: 12, type: "f32[3]", name: dir, level: sourced}
  - {at: 12, size: 12, type: "f32[3]", name: color, level: sourced}
  - {at: 24, size: 12, type: "f32[3]", name: ambient, level: sourced}
  - {at: 36, size: 4, type: s32, name: override, level: sourced}
  - {at: 40, size: 4, type: s32, name: unknown, level: unknown}
  - {at: 44, size: 4, type: s32, name: unknown, level: unknown}
```

```layout
title: Fog header (16 bytes)
size: 16
games: [sa2b]
note: Big-endian. A 0x210-byte variant adds a 128-entry f32 table, which is not decoded.
fields:
  - {at: 0, size: 2, type: s16, name: type, level: sourced}
  - {at: 2, size: 2, type: s16, name: unknown, level: unknown}
  - {at: 4, size: 4, type: "u8[4]", name: colour, level: sourced, note: "A, R, G, B"}
  - {at: 8, size: 4, type: f32, name: max distance, level: sourced}
  - {at: 12, size: 4, type: f32, name: min distance, level: sourced}
```

## What is engine code

Which light slot lights the landtable, how `_light` and `_light_gc` combine, which fog variant (A, B, C) is active where, and the 128-entry fog table are not in the files. :unknown Sky models are drawn
by stage code and are not in the landtable. :observed

:::open[Which light slot lights a landtable and which fog variant applies?]
All slots are present in the files; the selection is engine code. The first slot of `_light.bin` is probably the daylight slot, with its ambient multiplier as the world ambient (inferred).
:::

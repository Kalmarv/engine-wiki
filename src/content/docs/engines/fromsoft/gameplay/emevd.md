---
title: EMEVD scripts and world state
description: Event records, instructions, parameter substitutions and Sekiro's map-state functions.
sources:
  - title: DarkScript3
    url: https://github.com/AinTunez/DarkScript3
  - title: SoulsFormatsNEXT EMEVD
    url: https://github.com/soulsmods/SoulsFormatsNEXT
implementations:
  - name: primase EMEVD reader
    url: https://github.com/Kalmarv/primase/blob/main/worlds/fromsoft/src/emevd.rs
---

EMEVD files store numbered events as instructions: an instruction bank and ID, raw argument bytes and an optional
layer. Events also list substitutions that copy event-call arguments into particular instruction arguments.
:sourced[SoulsFormatsNEXT]

Both examined games use the 64-bit little-endian layout with version `0xCD`. Sekiro's common scripts and all map
scripts found by probing `m10..m99`, block `00..09`, consume the complete files with only bounded zero alignment;
every event, instruction, substitution, linked-file offset and string byte matches an independent decode.
:proven{games="sekiro"} The same envelope is readable in examined Elden Ring scripts, without establishing the
meaning of every opcode. :observed{games="elden-ring"}

## Tables

The `0x90`-byte header starts with `EVD\0`, format bytes `00 ff 01 ff`, version and total file size. Sixteen 64-bit
values then give count/offset pairs for events, instructions, an unused table, layers, substitutions and linked
files, followed by byte-length/offset pairs for argument and string blocks. :observed

```layout
title: EMEVD event record
size: 48
fields:
  - {at: 0, size: 8, type: i64, name: event ID, level: observed}
  - {at: 8, size: 8, type: i64, name: instruction count, level: observed}
  - {at: 16, size: 8, type: i64, name: instruction offset, level: observed, note: Relative to the instruction table}
  - {at: 24, size: 8, type: i64, name: substitution count, level: observed}
  - {at: 32, size: 8, type: i64, name: substitution offset, level: observed, note: Relative to the substitution table}
  - {at: 40, size: 4, type: u32, name: rest behavior, level: sourced, note: 0 default; 1 restart; 2 end}
  - {at: 44, size: 4, type: u32, name: padding, level: observed, value: 0}
```

```layout
title: EMEVD instruction
size: 32
fields:
  - {at: 0, size: 4, type: i32, name: bank, level: observed}
  - {at: 4, size: 4, type: i32, name: instruction ID, level: observed}
  - {at: 8, size: 8, type: i64, name: argument byte count, level: observed}
  - {at: 16, size: 8, type: i64, name: argument offset, level: observed, note: Relative to the argument block}
  - {at: 24, size: 8, type: i64, name: layer offset, level: observed, note: Relative to layer table; -1 means none}
```

```layout
title: EMEVD parameter substitution
size: 32
fields:
  - {at: 0, size: 8, type: i64, name: instruction index, level: observed}
  - {at: 8, size: 8, type: i64, name: target argument byte offset, level: observed}
  - {at: 16, size: 8, type: i64, name: source event-argument byte offset, level: observed}
  - {at: 24, size: 4, type: u32, name: copy byte count, level: observed}
  - {at: 28, size: 4, type: i32, name: unknown, level: unknown, note: Stored word retained without interpretation}
```

## Sekiro world-state functions

:only[sekiro] `2000:6` initializes common events. The following common functions take an entity or group, four event
flags and four corresponding state bytes; zero flag IDs leave pairs unused. They disable their target and enable it
only while every nonzero `(flag,state)` pair fails, restarting when flags change. :observed{games="sekiro"}

| Common function | Target | Direct state instruction | Confidence |
|---|---|---|---|
| `20004110` | Map piece | `2012:1` | :observed{games="sekiro"} |
| `20004112` | Object | `2005:3` | :observed{games="sekiro"} |
| `20004114` | Collision | `2011:1` | :observed{games="sekiro"} |

Ashina Castle's charcoal-layer wall group is hidden while flag 8302 is off. A live save with 8301, 8302 and 8306 off
shows the intact walls, supporting that polarity for this area. :observed{games="sekiro"}

:::open[Which other events determine world presence?]
Substituted calls, story-event control flow and other common functions can change the same parts. The three
functions above are not a complete world-state interpreter, and their Sekiro IDs do not establish Elden Ring rules.
:::

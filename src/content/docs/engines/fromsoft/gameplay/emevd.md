---
title: EMEVD scripts and world state
description: Event records, instructions, parameter substitutions and Sekiro's map-state functions.
sources:
  - title: DarkScript3
    url: https://github.com/AinTunez/DarkScript3
  - title: SoulsFormatsNEXT EMEVD
    url: https://github.com/soulsmods/SoulsFormatsNEXT
implementations:
  - name: fromsoft-formats EMEVD reader
    url: https://github.com/Kalmarv/fromsoft-formats/blob/main/src/emevd.rs
---

EMEVD files store numbered events as instructions: an instruction bank and ID, raw argument bytes and an optional
layer. Events also list substitutions that copy event-call arguments into particular instruction arguments.
:sourced[SoulsFormatsNEXT]

Both examined games use the 64-bit little-endian layout with version `0xCD`. Sekiro's common scripts and all map
scripts found by probing `m10..m99`, block `00..09`, consume the complete files with only bounded zero alignment;
all 11 scripts (1,213 events) match an independent decode in every event, instruction, substitution, linked-file
offset and string byte.
:proven{games="sekiro"} The same envelope is readable in examined Elden Ring scripts, without establishing the
meaning of every opcode. :observed{games="elden-ring"}

The `/event` folders hold 30 scripts in the Sekiro install (`common`, `common_func` and 28 map scripts: 1,703 events,
42,885 instructions, 6,920 substitutions) and 589 in the Elden Ring install (4,908 events, 107,639 instructions,
34,483 substitutions). A reader that consumes every byte of a script and refuses anything else reads all of them, and
an independent parse of the tables gives the same event, instruction and substitution totals for each game. All 619
files carry version `0xCD`. :proven

The Elden Ring install holds scripts for maps whose layouts it does not hold: 117 `m61` scripts and 20 for
areas 20, 21, 22, 25, 28 and 40 to 43 (the expansion's areas; its archive is not installed), 137 in all; its other 450 map scripts and the two
common scripts (`common`, `common_func`) belong to base-game maps. :proven{games="elden-ring"} The Sekiro scripts
use 258 distinct (bank, ID) instructions, the Elden Ring scripts 316. :proven

## Tables

The `0x90`-byte header starts with `EVD\0`, format bytes `00 ff 01 ff`, version and total file size. Sixteen 64-bit
values then give count/offset pairs for events, instructions, an unused table, layers, substitutions and linked
files, followed by byte-length/offset pairs for argument and string blocks.
:proven[all 11 scripts]{games="sekiro"} :observed{games="elden-ring"}

```layout
title: EMEVD header (Sekiro)
size: 144
games: [sekiro]
fields:
  - {at: 0, size: 4, type: "char[4]", name: magic, value: "EVD\\0", level: proven}
  - {at: 4, size: 4, type: "u8[4]", name: format bytes, level: sourced, note: "00 ff 01 ff"}
  - {at: 8, size: 4, type: u32, name: version, value: "0xCD", level: proven}
  - {at: 12, size: 4, type: u32, name: file size, level: proven}
  - {at: 16, size: 16, type: "i64[2]", name: event count and offset, level: proven}
  - {at: 32, size: 16, type: "i64[2]", name: instruction count and offset, level: proven}
  - {at: 48, size: 16, type: "i64[2]", name: unknown table count and offset, level: unknown, note: Count is zero in examined scripts}
  - {at: 64, size: 16, type: "i64[2]", name: layer count and offset, level: proven}
  - {at: 80, size: 16, type: "i64[2]", name: substitution count and offset, level: proven}
  - {at: 96, size: 16, type: "i64[2]", name: linked-file count and offset, level: proven}
  - {at: 112, size: 16, type: "i64[2]", name: argument length and offset, level: proven}
  - {at: 128, size: 16, type: "i64[2]", name: string length and offset, level: proven}
```

```layout
title: EMEVD header (Elden Ring)
size: 144
games: [elden-ring]
fields:
  - {at: 0, size: 4, type: "char[4]", name: magic, value: "EVD\\0", level: observed}
  - {at: 4, size: 4, type: "u8[4]", name: format bytes, level: sourced, note: "00 ff 01 ff"}
  - {at: 8, size: 4, type: u32, name: version, value: "0xCD", level: observed}
  - {at: 12, size: 4, type: u32, name: file size, level: observed}
  - {at: 16, size: 16, type: "i64[2]", name: event count and offset, level: observed}
  - {at: 32, size: 16, type: "i64[2]", name: instruction count and offset, level: observed}
  - {at: 48, size: 16, type: "i64[2]", name: unknown table count and offset, level: unknown, note: Count is zero in examined scripts}
  - {at: 64, size: 16, type: "i64[2]", name: layer count and offset, level: observed}
  - {at: 80, size: 16, type: "i64[2]", name: substitution count and offset, level: observed}
  - {at: 96, size: 16, type: "i64[2]", name: linked-file count and offset, level: observed}
  - {at: 112, size: 16, type: "i64[2]", name: argument length and offset, level: observed}
  - {at: 128, size: 16, type: "i64[2]", name: string length and offset, level: observed}
```

```layout
title: EMEVD event record (Sekiro)
size: 48
games: [sekiro]
fields:
  - {at: 0, size: 8, type: i64, name: event ID, level: proven}
  - {at: 8, size: 8, type: i64, name: instruction count, level: proven}
  - {at: 16, size: 8, type: i64, name: instruction offset, level: proven, note: Relative to the instruction table}
  - {at: 24, size: 8, type: i64, name: substitution count, level: proven}
  - {at: 32, size: 8, type: i64, name: substitution offset, level: proven, note: Relative to the substitution table}
  - {at: 40, size: 4, type: u32, name: rest behavior, level: sourced, note: 0 default; 1 restart; 2 end}
  - {at: 44, size: 4, type: u32, name: padding, level: proven, value: 0}
```

```layout
title: EMEVD event record (Elden Ring)
size: 48
games: [elden-ring]
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
title: EMEVD instruction (Sekiro)
size: 32
games: [sekiro]
fields:
  - {at: 0, size: 4, type: i32, name: bank, level: proven}
  - {at: 4, size: 4, type: i32, name: instruction ID, level: proven}
  - {at: 8, size: 8, type: i64, name: argument byte count, level: proven}
  - {at: 16, size: 8, type: i64, name: argument offset, level: proven, note: Relative to the argument block}
  - {at: 24, size: 8, type: i64, name: layer offset, level: proven, note: Relative to layer table; -1 means none}
```

```layout
title: EMEVD instruction (Elden Ring)
size: 32
games: [elden-ring]
fields:
  - {at: 0, size: 4, type: i32, name: bank, level: observed}
  - {at: 4, size: 4, type: i32, name: instruction ID, level: observed}
  - {at: 8, size: 8, type: i64, name: argument byte count, level: observed}
  - {at: 16, size: 8, type: i64, name: argument offset, level: observed, note: Relative to the argument block}
  - {at: 24, size: 8, type: i64, name: layer offset, level: observed, note: Relative to layer table; -1 means none}
```

```layout
title: EMEVD parameter substitution (Sekiro)
size: 32
games: [sekiro]
fields:
  - {at: 0, size: 8, type: i64, name: instruction index, level: proven}
  - {at: 8, size: 8, type: i64, name: target argument byte offset, level: proven}
  - {at: 16, size: 8, type: i64, name: source event-argument byte offset, level: proven}
  - {at: 24, size: 4, type: u32, name: copy byte count, level: proven}
  - {at: 28, size: 4, type: i32, name: unknown, level: unknown, note: Stored word retained without interpretation}
```

```layout
title: EMEVD parameter substitution (Elden Ring)
size: 32
games: [elden-ring]
fields:
  - {at: 0, size: 8, type: i64, name: instruction index, level: observed}
  - {at: 8, size: 8, type: i64, name: target argument byte offset, level: observed}
  - {at: 16, size: 8, type: i64, name: source event-argument byte offset, level: observed}
  - {at: 24, size: 4, type: u32, name: copy byte count, level: observed}
  - {at: 28, size: 4, type: i32, name: unknown, level: unknown, note: Stored word retained without interpretation}
```

```layout
title: EMEVD instruction layer (Sekiro)
size: 32
games: [sekiro]
fields:
  - {at: 0, size: 4, type: u32, name: unknown, level: unknown, note: Observed 2}
  - {at: 4, size: 4, type: u32, name: layer mask, level: sourced}
  - {at: 8, size: 8, type: i64, name: unknown, level: unknown, note: Observed 0}
  - {at: 16, size: 8, type: i64, name: unknown, level: unknown, note: Observed -1}
  - {at: 24, size: 8, type: i64, name: unknown, level: unknown, note: Observed 1}
```

```layout
title: EMEVD instruction layer (Elden Ring)
size: 32
games: [elden-ring]
fields:
  - {at: 0, size: 4, type: u32, name: unknown, level: unknown, note: Observed 2}
  - {at: 4, size: 4, type: u32, name: layer mask, level: sourced}
  - {at: 8, size: 8, type: i64, name: unknown, level: unknown, note: Observed 0}
  - {at: 16, size: 8, type: i64, name: unknown, level: unknown, note: Observed -1}
  - {at: 24, size: 8, type: i64, name: unknown, level: unknown, note: Observed 1}
```

## Initialising events: `2000:0` and `2000:6`

`2000:0` (initialise event) and `2000:6` (initialise common event) start another event with arguments. Their first
words differ between the games, over every call in the installs (none of the first two words is filled by a
substitution): :proven

| Call | Sekiro | Elden Ring |
|---|---|---|
| `2000:0` | 2,382 calls: a number below 100 first, the event ID second (eight digits in 1,931 calls, below 10,000 in 281, negative in 170) | 6,126 calls: a number below 100 first, the event ID second |
| `2000:6` | 2,138 calls: the common event's ID first (2,107 eight-digit, 31 seven-digit), then its arguments | 10,480 calls: a number below 100 first, then the common event's ID (9,629 eight-digit, 187 nine-digit, 638 seven-digit or fewer, 26 above a billion) |

So `2000:0` takes a leading slot number in both games, and `2000:6` takes it only in Elden Ring; the Sekiro layout that
puts the function ID in the first argument does not describe Elden Ring's calls. The Sekiro `2000:6` calls carry 2 to 16
words (7 in the part-state calls below), the Elden Ring ones 3 to 18 words. :proven

## Map IDs in arguments

An argument that names a map stores four bytes in the order area, block, X, dd, so its little-endian u32 has the area in
the low byte (`m60_41_38_00` is `3c 29 26 00`). In every non-zero literal word (149 of 149) of the Sekiro instructions `4:21` (at
argument offset 8), `4:38` (0), `4:43` (20), `2002:4` (12), `2002:7` (4), `2002:13` (12), `2003:59` (0 and 8), `2003:88`
(0) and `2003:93` (0), and every one (38 of 38) of Elden Ring's `3:35` (4), `4:28` (8), `2002:10` (4), `2002:11` (4) and `2003:14`
(0), the bytes read in that order give the name of a map of the install (or of one of its scripts), and the reverse
order gives none. Elden Ring's `1003:206` and `1003:208` (at 4) do the same in 33 of 37 words; the other four hold the
number 50. :proven The map words stored in layouts have the opposite order; see
[map words](/engines/fromsoft/world/areas-and-tiles/#map-words).

## Flag and entity numbering

Event flags are decimal numbers whose digits name the map they belong to, in a form that differs between the games.

Sekiro and Dark Souls III classify a flag by its digits: the area is `flag / 10^5 mod 100`, the block digit
`flag / 10^4 mod 10`, and a flag with area 90 or more, or with area and block digit both 0, is global rather than
named for a map. :sourced[SoulSplitter]{games="sekiro"} Over all 30 Sekiro scripts, the 142 part-state calls (50 of
`20004110`, 57 of `20004112`, 35 of `20004114`, in 13 scripts) name six flags in all, 8301, 8302, 8303, 8304, 8306 and
8310, and every one is global in that classification, so these rules do not exercise the map digits. :proven{games="sekiro"}

In Elden Ring the flags that map scripts set with `2003:66` (2,063 calls with literal arguments, over all 589 scripts)
follow `area × 10^6 + block × 10^4 + n` in dungeon maps and `10^9 + X × 10^6 + Z × 10^4 + n` in `m60` tiles:

| Maps | Flags in the map's own form | Small flags (below 10^6) | Another tile or block's form | Confidence |
|---|---:|---:|---:|---|
| Dungeon scripts | 750 | 407 | 68 (52 tile form, 16 other block) | :observed{games="elden-ring"} |
| `m60` tile scripts | 327 | 135 | 376 (358 other tile, 18 dungeon form) | :observed{games="elden-ring"} |

Small flags are story flags shared by all maps. The entity IDs in the layouts use the same forms (see
[entity IDs and groups](/engines/fromsoft/world/msb/#entity-ids-and-groups)). :observed{games="elden-ring"}

## Sekiro

### World-state functions

:only[sekiro] `2000:6` initializes common events. The following common functions take an entity or group, four event
flags and four corresponding state bytes; zero flag IDs leave pairs unused. They disable their target and enable it
only while every nonzero `(flag,state)` pair fails, restarting when flags change. :observed{games="sekiro"}

| Common function | Target | Direct state instruction | Confidence |
|---|---|---|---|
| `20004110` | Map piece | `2012:1` | :observed{games="sekiro"} |
| `20004112` | Object | `2005:3` | :observed{games="sekiro"} |
| `20004114` | Collision | `2011:1` | :observed{games="sekiro"} |

In `m11_01` the calls come from the map script's event 50. A target is a part's entity ID or any of its group IDs.
With every flag off, these calls switch 259 parts, four of them world collision: 118 are enabled, and 138
placements belonging to other states are not. Map-piece group 1117201 (36 intact pieces) is enabled while
1117204 (33 charcoal pieces) and 1117203 (7) are not, and 1117210 (1) is disabled in either state; object groups
1116200 and 1116201 are enabled and 1116203 and 1116204 are not; collision 1114820 is enabled and 1114310, 1114311
and 1114821 are not. :observed{games="sekiro"}

Ashina Castle's charcoal-layer wall group is hidden while flag 8302 is off. A live save with 8301, 8302 and 8306 off
shows the intact walls, supporting that polarity for this area. :observed{games="sekiro"}

Other mechanisms change presence too. `m11_00` also calls common functions 20004115 (collision pairs) and
20004120 (object animation), and `m11_01` has 219 story-event instructions that name entities directly: event
11115943, for example, swaps the keep's top between `m015070` and `m015072` on flags 11110100, 8301 and 11115921.
:observed{games="sekiro"}

:::open[Which other events determine world presence?]
Substituted calls, story-event control flow and other common functions can change the same parts. The three
functions above are not a complete world-state interpreter, and their Sekiro IDs do not establish Elden Ring rules.
:::

## Elden Ring

All 589 scripts in `/event/*.emevd.dcx` read with the layout above, and SoulsFormatsNEXT classifies Elden Ring's
header as the same variant as Sekiro's. The scripts use 316 distinct instructions; `2000:6` (initialize common
event) is the most frequent, with 10,480 calls. :observed{games="elden-ring"}

Elden Ring has no counterpart to Sekiro's three state functions. Of the 257 common functions in
`/event/common_func.emevd.dcx`, 27 use the part-state instructions `2012:1`, `2005:3` or `2011:1` (among them
90005424, 90005458, 90005525, 90005620, 90005725 and 91005600). Each waits on a flag or condition (`1003:x`,
`3:x`) before it enables or disables an asset, a fog wall or an NPC or boss setup, so world presence follows from
the control flow of these functions rather than from a fixed argument pattern. :observed{games="elden-ring"}

---
title: EMEVD scripts and world state
description: Event records, instructions, parameter substitutions and Sekiro's map-state functions.
sources:
  - title: DarkScript3
    url: https://github.com/AinTunez/DarkScript3
  - title: SoulsFormatsNEXT EMEVD
    url: https://github.com/soulsmods/SoulsFormatsNEXT
  - title: Smithbox (EMEDF files and the EMEVD editor)
    url: https://github.com/vawser/Smithbox
  - title: soulstruct (Elden Ring EMEDF)
    url: https://github.com/Grimrukh/soulstruct
  - title: SoulSplitter (event flag reading)
    url: https://github.com/FrankvdStam/SoulSplitter
  - title: fromsoftware-rs (event flag and map id types)
    url: https://github.com/vswarte/fromsoftware-rs
implementations:
  - name: fromsoft-formats EMEVD reader
    url: https://github.com/Kalmarv/fromsoft-formats/blob/main/src/emevd.rs
  - name: fromsoft-formats instruction schema (emedf)
    url: https://github.com/Kalmarv/fromsoft-formats/blob/main/src/emedf/mod.rs
  - name: fromsoft-formats event flags (eventflag)
    url: https://github.com/Kalmarv/fromsoft-formats/blob/main/src/eventflag.rs
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

## Order of the tables

After the header the tables follow each other with no byte between them, in this order: events, instructions, layers,
arguments, substitutions, linked-file offsets, strings; the unused table's offset is the layer table's. Each event's
instructions and substitutions are the next run of their tables, so the offsets in the event records count up through the
tables. :proven[every script of both installs] A layer table holds one record per distinct layer value, in the order the
instructions first name them. Each instruction's arguments are padded to a multiple of four bytes, the block to a multiple
of sixteen, and an instruction without arguments stores -1 for its argument offset, as an instruction without a layer
does for its layer offset. :proven[every script of both installs] An event without instructions or substitutions stores -1
for that list's offset in every event of both installs but six, in four Sekiro scripts, whose empty substitution lists
store the running offset of the table instead (0 in four of them, 13,152 and 10,592 in the others). Writing the tables in
this order reproduces 26 of Sekiro's 30 scripts and all 446 distinct scripts of Elden Ring's 589 byte for byte; the four
Sekiro scripts differ in those six offsets only. :proven[an independent writer over every script of both installs]

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

## Instruction schema

An instruction's argument bytes have a fixed layout given by its bank and number. The community keeps the table
(DarkScript3's EMEDF files, which Smithbox ships for both games and soulstruct for Elden Ring): a name for each
instruction, and for each argument a name, a type and sometimes the name of the enumeration its values come from. The
types are signed and unsigned 8-, 16- and 32-bit integers, 32-bit floats and, in Sekiro's table, a string-table offset.
The two tables hold 405 (Sekiro) and 361 (Elden Ring; soulstruct's copy has seven instructions Smithbox's lacks)
instructions. :sourced[EMEDF files]

The arguments follow one another at their natural alignment (a 32-bit value at a multiple of four, a 16-bit value at a
multiple of two, a byte anywhere) and the block is padded to a multiple of four bytes. The last argument of the event
initialisers `2000:0` and `2000:6` repeats, one 32-bit word for each argument of the event they start. Against every
instruction of both installs these rules reproduce the stored argument length of all but four: they type all 42,885
instructions of Sekiro's scripts (258 distinct bank and number pairs) and 107,635 of the 107,639 of Elden Ring's (315 of
316 distinct pairs). The four are Elden Ring's `11:3`, which stores 8 bytes beside the player-on-hit conditions `11:0` to
`11:2` and which the table lacks. :proven

The substitutions confirm the offsets inside an instruction, not only its length: each of the 6,920 substitutions in
Sekiro's scripts and 34,483 in Elden Ring's copies bytes onto exactly one argument of its typed instruction (same
offset, same size). :proven

Reading the arguments by their names in the table, the roles that matter for the world are these (counts are literal
arguments, with those a substitution fills in brackets):

| Role | Named | Sekiro | Elden Ring |
|---|---|---:|---:|
| Event flag | `Event Flag ID`, the ends and limits of flag ranges, the response flags | 8,279 (606) | 18,440 (6,648) |
| Run of flags | `Base Event Flag ID` with `Number of Used Flag Bits` | 43 (0) | 166 (129) |
| Entity | `Entity ID` and its variants (`Target Entity ID`, `Hit Entity ID`, `Area Entity ID` ...) | 16,393 (5,091) | 18,768 (22,602) |
| Map as separate bytes | `Area ID`, `Block ID` and in Elden Ring `Region ID`, `Index ID` | 283 (10) | 260 (21) |
| Map as one decimal number | `Map ID` | none | 65 (8) |
| Event started or ended | `Event ID` of `2000:0`, `2000:1`, `2000:6` | 4,520 (0) | 16,606 (0) |

:observed

The event started by a literal `2000:0` or `2000:6` call is an event some script of the install defines in 4,350 of
Sekiro's 4,520 calls and 16,593 of Elden Ring's 16,606; the others name events the base game's scripts do not hold.
:observed Of the literal entity arguments, 13,455 of Sekiro's 16,393 are an entity ID that a layout of the install states
(a part, a part group, a region or an event; 53 are 0 or -1), and 8,430 of Elden Ring's 18,768 (419 are 0 or -1); 2,610
and 4,552 of the rest are 10000, the number the player is addressed by. The other entity arguments name no entity that
the layouts read state. :observed

## Map IDs in arguments

An instruction names a map in one of two forms.

- **Separate bytes.** The table's `Area ID`, `Block ID`, `Region ID` and `Index ID` arguments store the numbers of the
  name `mAA_BB_CC_DD` in that order, so a 32-bit little-endian word that holds them has the area in its low byte
  (`m60_41_38_00` is `3c 29 26 00`). The index byte holds the name's two digits as hexadecimal digits (`_10` is `0x10`)
  and `0xff` stands for any. Sekiro's instructions name only the area and block, sometimes as 32-bit values (`2003:59`,
  `2003:88`). Of Sekiro's 283 literal pairs, 277 name a map family of the install (the 6 others name `m25_01`, which the
  install lacks); of Elden Ring's 253 literal four-byte quads, 43 hold a wildcard, 133 name a map of the install and 77 do
  not (73 are the all-zero quad, 4 are `m12_00`, which has no files). :observed
- **One decimal number.** Elden Ring's cutscene-and-warp instructions `2002:11`, `2002:12` and `2002:13` take a `Map ID` as
  the digits of the name run together, `AABBCCDD`: `11050000` is `m11_05_00_00` and `60444500` is `m60_44_45_00`. 64 of the
  65 literal values name a map of the install (the other is the number 16). :observed{games="elden-ring"}

The map words stored in layouts have the opposite order; see [map words](/engines/fromsoft/world/areas-and-tiles/#map-words).

Several positions whose non-zero words read, in that byte order, as the name of an installed map are not map arguments:
they hold small numbers whose bytes happen to read as a name (the number 10 is `m10_00_00_00`). By the table, Sekiro's `4:21` at offset 8 is a message ID (always 10), `4:38`
a count (15) and `4:43` a distance (15); in Elden Ring `3:35`, `1003:206` and `1003:208` take a ceremony ID (20, 30, 40 or
50), `4:28` a threat level (31) and `2002:10` and `2002:11` hold the playback method (16 or 32) at offset 4. :observed

## Flag and entity numbering

Flags are 32-bit numbers. Sekiro and Elden Ring store and number them differently.

:only[sekiro] A flag is a decimal number `R AA G Z nnn` of at most eight digits: a region digit, a two-digit area, a block
group digit, a zone digit and a three-digit number inside the zone. The game keeps 32 flags in a word; flag `nnn` is bit
`31 - nnn % 32` of word `nnn / 32`, counted from the least significant bit. A flag whose area is 90 or more, or whose area
and group digits are both 0, is kept apart from the blocks'. :sourced[fromsoftware-rs and SoulSplitter]

:only[elden-ring] A flag is stored by its category, the number divided by 1000, in a block of 125 bytes (1000 bits): flag
`nnn` is bit `7 - nnn % 8` of byte `nnn / 8` of its block. :sourced[fromsoftware-rs and SoulSplitter]

What the digits mean is a convention the scripts follow, not something the storage needs. Over every literal flag
argument of both installs (8,094 in Sekiro's scripts, 17,812 in Elden Ring's, those equal to 0 or -1 left out), by the
script they stand in:

| Game and script | Digits name no map | Name the script's own map | Name another map | Confidence |
|---|---:|---:|---:|---|
| Sekiro, a map's script | 3,145 | 2,088 | 120 | :observed |
| Sekiro, the common scripts | 2,518 | | 223 (the script has no map of its own) | :observed |
| Elden Ring, a dungeon's script | 2,196 | 3,616 | 159 | :observed |
| Elden Ring, an `m60` or `m61` tile's script | 3,391 | 2,686 | 526 | :observed |
| Elden Ring, the common scripts | 3,831 | | 1,407 (the script has no map of its own) | :observed |

In Sekiro the digits are read as in the paragraph above. In Elden Ring a flag of eight digits `AA BB d nnn` is a block of
the dungeon `mAA_BB` (4,354 of the 4,374 literal flags of that length name a block the install has files for) and one of
ten digits is a tile of the open world, `10 XX ZZ d nnn` for `m60_XX_ZZ` and `20 XX ZZ d nnn` for `m61_XX_ZZ` (3,991 of the
4,129 name a tile the install has files for, 29 name an absent tile and 109 have another two-digit prefix); shorter flags
(4,129 of the 17,812 have ten digits, 4,374 eight, the other 9,309 fewer) are shared by every map.
:observed{games="elden-ring"}

### Flags set by `2003:66`

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

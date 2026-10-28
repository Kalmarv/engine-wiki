---
title: TAE time-action events
description: Animation event timing, import headers and mesh-visibility events.
sources:
  - title: SoulsFormatsNEXT TAE
    url: https://github.com/soulsmods/SoulsFormatsNEXT
  - title: DSAnimStudio
    url: https://github.com/Meowmaritus/DSAnimStudio
  - title: Smithbox TAE event templates
    url: https://github.com/vawser/Smithbox
    note: Per-game event parameter templates (field order, types, asserted values)
  - title: SekiroAnimationBridge
    url: https://github.com/Beertraps/SekiroAnimationBridge
    note: The four weapon slots of event 715
implementations:
  - name: fromsoft-formats TAE reader
    url: https://github.com/Kalmarv/fromsoft-formats/blob/main/src/tae.rs
---

TAE stores timed actions alongside motion clips. An animation record has an ID and events with a type number,
start and end times in seconds, and raw parameter bytes. The event-type definitions are external to TAE.
:sourced[SoulsFormatsNEXT]

Both games use the 64-bit little-endian version `0x1000D`, called `SDT` by SoulsFormatsNEXT. :observed

```layout
title: TAE event header
size: 24
note: File-relative offsets to f32 times and to the event-data record.
fields:
  - {at: 0, size: 8, type: u64, name: start time offset, level: observed}
  - {at: 8, size: 8, type: u64, name: end time offset, level: observed}
  - {at: 16, size: 8, type: u64, name: event data offset, level: observed}
```

```layout
title: TAE event data record
size: 16
fields:
  - {at: 0, size: 4, type: i32, name: event type, level: observed}
  - {at: 4, size: 4, type: i32, name: unknown, level: unknown, note: Community reader names it Unk04}
  - {at: 8, size: 8, type: u64, name: parameter offset, level: observed, note: Zero or the position immediately after this record in examined files}
```

## File layout

The header of the 326 Sekiro and 1,071 Elden Ring TAE files of the animation binders obeys the layout below, word for
word; only the fields marked variable differ between files. :proven[over the files read]{games="sekiro elden-ring"}

```layout
title: TAE header (version 0x1000D)
size: 208
note: Offsets are from the start of the file. Names after 0xD0 are UTF-16, the animation table normally follows at 0x110.
fields:
  - {at: 0, size: 4, type: "char[4]", name: magic, value: "TAE ", level: proven}
  - {at: 4, size: 1, type: u8, name: endianness, level: proven, note: 0 little-endian}
  - {at: 7, size: 1, type: u8, name: pointer-width flag, level: proven, note: 0xFF for 64-bit offsets}
  - {at: 8, size: 4, type: u32, name: version, level: proven, note: 0x1000D}
  - {at: 12, size: 4, type: u32, name: file size, level: proven, note: Equals the file length}
  - {at: 16, size: 8, type: u64, name: constant, level: unknown, note: 0x40}
  - {at: 24, size: 8, type: u64, name: constant, level: unknown, note: 1}
  - {at: 32, size: 8, type: u64, name: constant, level: unknown, note: 0x50}
  - {at: 40, size: 8, type: u64, name: constant, level: unknown, note: 0x80}
  - {at: 48, size: 8, type: u64, name: event bank, level: observed, note: "13 or 14 in Sekiro; 22 to 37 in Elden Ring; the bank the file's event types are numbered in"}
  - {at: 56, size: 8, type: u64, name: reserved, level: unknown, note: 0}
  - {at: 64, size: 8, type: "u8[8]", name: flag bytes, level: unknown, note: 01 00 01 02 02 01 01 01}
  - {at: 72, size: 8, type: u64, name: constant, level: unknown, note: 1}
  - {at: 80, size: 4, type: u32, name: file id, level: observed, note: Variable}
  - {at: 84, size: 4, type: u32, name: animation count, level: observed, note: Variable}
  - {at: 88, size: 8, type: u64, name: animation table offset, level: observed, note: "0x110, or 0xD0 in 15 Sekiro weapon-part files whose two name offsets both point at 0xD0, or 0 with no animations"}
  - {at: 96, size: 8, type: u64, name: animation group header offset, level: observed, note: Variable}
  - {at: 104, size: 8, type: u64, name: constant, level: unknown, note: 0xA0}
  - {at: 112, size: 8, type: u64, name: animation count, level: observed, note: Repeats the count at 84}
  - {at: 120, size: 8, type: u64, name: first animation body offset, level: observed, note: Variable}
  - {at: 128, size: 8, type: u64, name: constant, level: unknown, note: 1}
  - {at: 136, size: 8, type: u64, name: constant, level: unknown, note: 0x90}
  - {at: 144, size: 8, type: "u32[2]", name: file id twice, level: observed}
  - {at: 152, size: 8, type: u64, name: constant, level: unknown, note: 0x50}
  - {at: 160, size: 8, type: u64, name: reserved, level: unknown, note: 0}
  - {at: 168, size: 8, type: u64, name: constant, level: unknown, note: 0xB0}
  - {at: 176, size: 8, type: u64, name: skeleton name offset, level: observed, note: "In the 15 Sekiro weapon-part files whose animation table is at 0xD0 this is 0xD0, the table's own offset, and there is no name there"}
  - {at: 184, size: 8, type: u64, name: SIB name offset, level: observed, note: "As the skeleton name offset"}
  - {at: 192, size: 16, type: "u64[2]", name: reserved, level: unknown, note: 0 and 0}
```

The animation table is `animation count` records of 16 bytes (the animation number as u64, the offset of its body as
u64), sorted by strictly ascending number. :proven[over the files read]{games="sekiro elden-ring"} The group header at
offset 96 holds a count and the offset of its entries (16 bytes after it, except in the files with no animations); each
entry is a first and a last animation number (i32 each) and the u64 offset of the table record of the first; the entries
are exactly the maximal runs of consecutive animation numbers, and every number is in one run.
:proven[over the files read]{games="sekiro elden-ring"}

An animation body holds, at its first four u64 words, the offsets of its event headers, its event groups, its table of
times and its mini header block, then the u32 event count, the u32 event-group count and a u64 count of distinct
times. The times table is that many ascending, distinct f32 values, and they are exactly the distinct start and end
times of the animation's events. :proven[over the animations read]{games="sekiro elden-ring"} An event group is 32 bytes:
a value count, the offset of that many u32 offsets of event headers of the same animation (4 bytes each), the offset of
a u64 type number, and a zero word. :proven[over the groups read]{games="sekiro elden-ring"} Groups may be empty (2,509
of Sekiro's 247,075; 49,359 of Elden Ring's 943,080). Almost every group names events of one type (561 and 70,951
do not), but the stored group type is not always that event type. :observed

Parameter bytes stored for an event are the bytes up to the next record, and their length is not fixed per event
type: of the 106 Sekiro event types that occur in the files with a following record, 52 are stored with more than one
length, usually differing by 8. A parameter offset of 0
occurs on 7 Sekiro events, all of type 943, which store no parameter bytes; Elden Ring has none. :observed

## Event parameter templates

A community template lists an event type's parameter fields in order as scalars, several of them zero-asserted
padding. :sourced[Smithbox] Sekiro's template covers 337,847 of its 337,924 events, and Elden Ring's all 1,313,057; the
types without a template in Sekiro are 340 (57 events), 341 (18) and 350 (2). None of the 553,355
asserted fields stored in Sekiro's events or the 2,050,123 in Elden Ring's differs from the template's value. :observed
The stored parameter bytes are nevertheless shorter than the template's field list for 4,627 Sekiro events and 268
Elden Ring events: in 4,310 and 205 of them only zero-asserted or padding fields are missing, and in 317 and 63 a
named or unasserted field is (event 96's `State Info` in 158 and 48 events, event 401's third word in 143, Elden Ring
event 193's `Force Apply` in 12). So those types occur in shorter variants than the template states. :observed

## Event 715

Event 715 stores a u8 selector, three zero bytes, four s32 dummy-polygon ids and a further s32. Community templates name
it a weapon-position override and list the selector as 0 (right weapon) and 1 (left weapon). :sourced[Smithbox] In
Sekiro's 372 events of this type, in 19 files, the selector is 0 on 174, 1 on 167, 2 on 16 and 3 on 15, so all four
values occur. The Sekiro animation bridge, a community tool, names the selector's four slots as the sword, the
prosthetic tools (parts `wp_a_0700` to `wp_a_0799`), the Mortal Blade and the grappling hook. :sourced[SekiroAnimationBridge]
An id is -1 when its model index is unused: all four are -1 on 2 events, and the others have 1 to 3
ids set. :observed{games="sekiro"} Elden Ring has no event 715. :observed

## Animation numbers and files

A character's binder holds one TAE and stores `group x 1,000,000 + number` for a clip `aGGG_NNNNNN`
(`a050_003000` is animation 50,003,000): this holds for the clips of every character, object and weapon part with a
TAE, 2,234 of 2,243 clips of group 1 or more in Sekiro and 8,739 of 8,758 in Elden Ring (group-0 clips: all but 43
and 177 that have no record; a further 62 and 2,631 clips are in binders with no TAE). The player's `c0000.anibnd` instead holds one TAE per animation group, named
`a00.tae`, `a10.tae`, `a50.tae`, `a70.tae` to `a79.tae`, `a100.tae` and so on (65 files in Sekiro, 642 in Elden Ring),
and a clip `aGGG_NNNNNN` is record `NNNNNN` of the file for its group: all 1,434 distinct player clip names of Sekiro
are found that way, and 9,217 of Elden Ring's 9,342 (89 more are in the file of another group, 36 in none). Looking
only for `group x 1,000,000 + number` therefore reaches the player's group-0 clips and no others (689 of 1,434 in Sekiro,
1,436 of 9,342 in Elden Ring). :observed

Every clip member of the animation binders is named `aGGG_NNNNNN.hkx`, with a `_N` suffix for the variants of weapon
parts (788 in Sekiro, 236 in Elden Ring), `sNNNNN_aGGG_NNNNNN.hkx` for effect clips, or `aGG_NNNN.hkx` for face
generation packfiles. :proven[over the binder members read]{games="sekiro elden-ring"}

## Animation headers

| Header | Stored relationship | Confidence |
|---|---|---|
| Standard | Loop flag, HKX import flag, delayed-load flag and motion-source animation ID | :sourced[SoulsFormatsNEXT] |
| ImportOther | Another animation supplies motion and events | :sourced[SoulsFormatsNEXT] |
| Empty | No motion-file name offset | :observed |

Of the animation records, 10,836 Sekiro ones (37,583 in Elden Ring) have the standard header with no flags, 1,656 (10,706)
import their motion data from another animation number, 79 (62) loop, and 2,983 (2,790) are ImportOther.
:observed A flag for delayed loading is set on 211 records in Sekiro, all in the player's group files `a2xx`, and on none
in Elden Ring. 184 of those records have a clip file only in one of the player's throw binders
(`c0000_cXXXX.anibnd`, one per enemy), 27 have no clip file in any binder. :observed{games="sekiro"} The animation
number an import names is a record of the same file for 1,432 of Sekiro's 1,687 motion imports (9 name -1, 246 name a
number the file lacks) and 6,197 of Elden Ring's 10,716. :observed

Parameter bytes can include zero alignment after the meaningful fields. Group tables index animations and tie
events together; they are distinct from the per-event parameter payload. :sourced[SoulsFormatsNEXT]

SoulsFormatsNEXT represents an open-ended event with an end of 100 seconds when reading stored `f32::MAX`.
That reader convention is not evidence that every authored 100-second event has identical runtime meaning.
:sourced[SoulsFormatsNEXT]

## Event files in a character's animation binder

A character's `anibnd` holds its event files as binder members numbered from a first slot: 5,000,000 when the binder also holds
a member with ID 9,999,999, else 3,000,000. Of the 705 character animation binders (142 Sekiro, 563 Elden Ring), 267 hold event
files: the 98 with member 9,999,999 start at slot 5,000,000 and the 169 without it at 3,000,000; none disagrees.
:proven[every `chr/*.anibnd.dcx` of the Sekiro 1.06 and Elden Ring installs] The other 438 binders hold no event file; 290 of them
hold member 9,999,999 and 148 do not, so that member alone does not mean a binder has event files. :proven[the same 705 binders]

Only the player binder (`c0000`) holds more than one event file: one per animation group, `a00.tae` in slot 5,000,000, then
`a50.tae` in slot 5,000,050 and so on (Sekiro up to `a250`; Elden Ring `a00` to `a1xx`). :observed[the `c0000` binders of both
games]

An event file stores animation numbers within its group, all below 1,000,000. The animation's full number is
`group × 1,000,000 + stored`, so animation `a050_122301` is 50122301. :observed{games="sekiro elden-ring"} DSAnimStudio applies the
same rule. :sourced[DSAnimStudio] With it Sekiro's `c0000` matches 1,248 of 1,248 clips to an event record, and Elden Ring's
matches 7,844 of 7,953. :observed

An ImportOther header's source is a full number and can name an animation of another event file of the same binder: 218 imports of
Sekiro `c0000` in files of group above 0 name `a00` animations by numbers below 1,000,000. :observed{games="sekiro"} Read with the
rule above, all 2,790 ImportOther headers of Elden Ring resolve inside their own binder, and 2,849 of Sekiro's 2,866 do.
:observed[all ImportOther headers of the 142 and 563 character binders] Of the 17 in Sekiro that do not, 6 name -1, which
DSAnimStudio reads as no import (the animation keeps its own record), and 11 name animations no event file of the binder holds:
`c1020` 100009500, `c9520` 20103, `c9800` 100205010 with the 1000085xx and 1000086xx numbers, and `c9820` 100005211.
:observed{games="sekiro"} What the engine does with those 11 is not known. :unknown{games="sekiro"}

## Mesh-visibility events

Templates for both games give events 233, 711 and 713 arrays of 32 mask-group bytes. The visibility behavior below
is the one implemented by DSAnimStudio. :sourced[DSAnimStudio]

| Event | Byte values for each group | Lifetime | Confidence |
|---|---|---|---|
| 233 | `0` hide, `1` show, `255` unchanged | Latched | :sourced[DSAnimStudio] |
| 711 | `1` hide, `0` unchanged | Event interval | :sourced[DSAnimStudio] |
| 713 | `1` show, `0` unchanged | Event interval | :sourced[DSAnimStudio] |

These changes operate on the same numbered groups as the NPC's
[display masks](/engines/fromsoft/data-model/character-parts/). :sourced[DSAnimStudio]

Material event 198 links into a separate [MaterialEx table](/engines/fromsoft/effects/material-events/) in examined
Elden Ring data. :observed{games="elden-ring"}

:::open[What happens exactly at interval ends and overlapping events?]
The engine's end-instant convention for 711/713 has not been observed. A half-open playback interval is a possible
interpretation, not an established engine fact. Source-record order is used by the checked external playback model;
runtime priority across overlapping action systems still needs confirmation.
:::

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
  - title: soulstruct
    url: https://github.com/Grimrukh/soulstruct
    note: Event type names and data layouts of the Dark Souls Remastered and III era
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

### What the templates hold

Sekiro's template defines 190 event types (148 with a name) and Elden Ring's 156 (141 named); the installs store 109 and 124
event types, of which 106 and all 124 are defined. :proven[every event of every distinct event file of both installs] A field is a
boolean byte (`b`), an integer of 1, 2, 4 or 8 bytes or a 32-bit float, sometimes with a list of named values (`entry`), a value
it must hold (`assert`, always 0) and the param table a value is a row of (`ref`: `SpEffectParam` on 9 fields in Sekiro's
template and 10 in Elden Ring's, `DecalParam` on 5, `LockCamParam` on 3 and 2, `MaterialEx` on 2, `AiSoundParam` on 2,
`Bullet` on 1). :sourced[Smithbox]

The fields follow each other with no alignment: every one of the asserted fields sits at the offset that packing gives and holds
its value, in all events of both installs. :observed[553,355 and 2,050,123 asserted fields] No byte after the last template field of
an event is other than zero. :proven[every event of both installs] Every boolean field holds 0 or 1. :proven[every event of both
installs]

Where the template and the data disagree:

| Disagreement | Sekiro | Elden Ring | Confidence |
|---|---|---|---|
| A field the template types as a float stores a word that is not a finite float: events 708 (fields 3, 10 and 12: `0xffffffff` in all 1,497 events), 730 (fields 0 and 1: negative integers such as -45 and -90, in 419 and 429 events) and 156 (fields 0 and 1, in 39 and 27 events) | 5,405 fields | none | :proven[every event of both installs] |
| A stored value that no `entry` of its field names (event 0's jump table 6,826; event 700's field 5, 6,261; event 715's selector 31, ...) | 13,142 of 215,388 values read, in 5 of 24 slots | 4,069 of 1,867,190, in 8 of 51 slots (event 700's field 5: 2,800; event 1's second field: 694; event 300's first: 385) | :proven[every event of both installs] |
| An event stored shorter than the template's fields (above) | 4,627 events | 268 | :proven[every event of both installs] |

So the named values are the common ones, not a closed set, and a field's type is the editor's reading.

### A second source

A second community source lists 113 event types of the Dark Souls Remastered and III era, 108 of them with a class that gives the
fields of the data in order, and names 49 of the types it shares with Sekiro's template and 40 of those it shares with Elden Ring's
(the others are numbered only). :sourced[soulstruct] It shares 106 types with Sekiro's template and 96 with Elden Ring's; of its
other 7 and 17 types none occurs in the files of either game, and the templates define 84 and 60 types it does not list. :observed[the
113 types against every event of every distinct event file of both installs] It lists the type of 319,835 of Sekiro's 337,924 events
and of 1,274,243 of Elden Ring's 1,313,057. Event 198 is in neither its list nor Sekiro's template, and Sekiro's files store none.
:observed[the same census]

The two sources agree on where the fields lie. Of the 103 and 94 shared types it has a class for, no field of one straddles the edge
of a field of the other (a field the other splits, such as a 32-byte array that the template lists as 32 bytes, is no disagreement),
with one exception, Sekiro's event 112: the template has a 16-bit field at byte 4 and a word at byte 6, the class words at bytes 4
and 8, and Elden Ring's template has 16-bit fields at bytes 4 and 6 and a word at 8. Four of Sekiro's 29,350 events of this type
store 110 at byte 8, which the Sekiro template's word reads as 7,208,960. :observed[the shared types of both games, every stored
event] They place 234 fields of Sekiro's types and 224 of Elden Ring's at the same offset and width, and type 33 and 31 of them
differently: 26 and 25 are bytes the class types as integers and the template as booleans, 2 and 2 the reverse, and 5 and 4 are
4-byte words one source types as a float and the other as an integer. :observed[the same types] Those words are decided by the
stored values:

| Word | Template | Class | Stored | Confidence |
|---|---|---|---|---|
| Event 0 (jump table), byte 4 | float (`Arg A`) | integer | zero on 76,495 of Sekiro's 76,629 events and 304,824 of Elden Ring's 309,876; on the rest a finite float (0.09 on 133 and 5,050 events): a float | :observed[every event of the type in both installs] |
| Event 130, bytes 8 and 12 (Sekiro) | 32-bit integer (`Dummy Poly ID`, `Slot ID`) | float | 185 events: -1 and 7 at byte 8, -1 at byte 12: integers | :observed[all 185 events] |
| Event 730, bytes 0 and 4 | float | integer | 860 and 873 non-zero words in Sekiro's 1,086 events, 115 and 115 in Elden Ring's 116 (180): none reads as a finite float of magnitude 1e-20 to 1e12; they are the integers -45, 75, -90 and 180 | :observed[every event of the type in both installs] |
| Event 194, byte 8 (Elden Ring) | 32-bit integer | float | zero in all 4 events: undecided | :observed[all 4 events] |

Its classes are the older games' layouts, so they end where later games added fields: for 7 Sekiro types (events 96, 120, 130, 151,
601, 715 and 720) and 9 Elden Ring types (2, 64, 96, 120, 129, 145, 193, 601 and 700) some events hold a nonzero byte outside the
fields it lists (3,024 Sekiro events and 464,868 Elden Ring events, 408,390 of them of event 129, whose Wwise fields lie past the
class's 20 bytes), and none outside the template's. :observed[the shared types it has a class for, every stored event] Where both
name a type they mostly describe the same action (type 96 `PlayFFX` and `Spawn One Shot FFX`, 233 `ChangeDrawMask` and `Change
Character Draw Mask`, 711 `HideModelMask` and `Hide Model Mask`, 713 `ModelMask` and `Show Model Mask`, 66 and 67 `CreateSpEffect1`
and `2` and `Add SpEffect - Multiplayer` and `Add SpEffect`); a few differ (712 `DamageLevelModule` and `Override Weapon Model
Locations`, 760 `IFrameState` and `Set Root Motion Multiplier`, 522 `KingOfTheStorm` and `Set Special Lock-on Parameter`), which
the field layouts alone do not settle. :inferred

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

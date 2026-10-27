---
title: TAE time-action events
description: Animation event timing, import headers and mesh-visibility events.
sources:
  - title: SoulsFormatsNEXT TAE
    url: https://github.com/soulsmods/SoulsFormatsNEXT
  - title: DSAnimStudio
    url: https://github.com/Meowmaritus/DSAnimStudio
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

## Animation headers

| Header | Stored relationship | Confidence |
|---|---|---|
| Standard | Loop flag, HKX import flag, delayed-load flag and motion-source animation ID | :sourced[SoulsFormatsNEXT] |
| ImportOther | Another animation supplies motion and events | :sourced[SoulsFormatsNEXT] |
| Empty | No motion-file name offset | :observed |

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

---
title: TAE time-action events
description: Animation event timing, import headers and mesh-visibility events.
sources:
  - title: SoulsFormatsNEXT TAE
    url: https://github.com/soulsmods/SoulsFormatsNEXT
  - title: DSAnimStudio
    url: https://github.com/Meowmaritus/DSAnimStudio
implementations:
  - name: primase TAE reader
    url: https://github.com/Kalmarv/primase/blob/main/worlds/fromsoft/src/tae.rs
---

TAE stores timed actions alongside motion clips. An animation record has an ID and events with a type number,
start and end times in seconds, and raw parameter bytes. The event-type definitions are external to TAE.
:sourced[SoulsFormatsNEXT]

Both games use the 64-bit little-endian version `0x1000D`, called `SDT` by SoulsFormatsNEXT. :observed

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

---
title: "Scripts, crowds and gameplay context"
description: "Domino values, crowd records and recursive condition trees."
games: ["riders-republic"]
sources:
  - title: RRAssetStudio v3
    url: https://www.nexusmods.com/ridersrepublic/mods/5
    note: Independent Riders Republic resource reader.
implementations:
  - name: "primase worlds/anvil (entity.rs)"
    url: https://github.com/Kalmarv/primase/blob/main/worlds/anvil/src/read/entity.rs
---

Gameplay components share Entity ownership and resource references with visuals, but contain separate scripting, crowd and condition structures. DominoComponent stores a script instance and typed parameters; BulkComponent describes crowds; GameplayContextDisablerComponent stores a recursive condition tree. :observed

## Domino parameters

A Domino parameter has an 82-byte prefix of embedded objects and type metadata, a value selected by the low byte of its kind word, and 13 trailing bytes. A 21-byte tail ends the component. The grammar is validated on 2,384 of 2,626 measured Domino bodies, not the entire population. :observed

| Value kind | Serialized value | Confidence |
|---|---|---|
| `0x1C` | Ten-byte resource reference | :observed |
| `0x12` | Tag + u64 link | :observed |
| `0x1D` | Counted list of nine-byte links | :observed |
| `0x00` | One byte | :observed |
| `0x16` | Embedded object; SoundInstance body 52 bytes, SpeechSoundInstance 84 in checked profiles | :observed |
| `0x19`, `0x0A` | Present in unresolved profiles | :unknown |

## Crowds

BulkComponent starts with component flags, BulkSettings and BulkRandomCompositionTemplate, then counted 36-byte BulkTemplate entries. A member array has 45-byte records (`u64 + type 0x7A983CEC + 33 bytes`), whose first three f32 fit local offsets. Five BulkState records and corresponding SoundInstance objects follow, then a counted f32 list and 17-byte tail. The complete length grammar matches all 2,481 measured bodies; offset semantics remain inferred. :observed :inferred

## Context conditions

A context tree node starts `04 + u64 + type`. Operator type `0x025AD7F9` stores a byte, operator u32, child count and recursive children. Leaf type `0x0FA689EF` stores two bytes, a gameplay-context id and 23 bytes. The component ends with a counted nine-byte link array and four bytes; this grammar reaches all 2,315 measured ends. :observed

:::open[What are complete script and condition semantics?]
Readable value framing does not establish every Domino value class, the condition operator truth table, or when gameplay activates each crowd state. :unknown
:::

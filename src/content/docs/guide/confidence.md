---
title: Confidence
description: The five confidence levels, what earns each, and how a claim moves between them.
sidebar:
  order: 2
---

Every statement of fact in the wiki carries one of five levels. They describe how the statement is known, not how
important it is or how likely it seems.

| Level | Meaning | What earns it |
|---|---|---|
| :proven | Holds on every case there is. | Every entry of the game's data was read with no bytes left unaccounted for; or an independent reader produced the same result on every entry, field for field; or the engine's own code (a shader, a script) was run and gave the stated result. |
| :observed | Measured on real data; holds on what was checked. | A census or measurement over real game data that is not exhaustive: one area, a sample, the entries one tool could open. |
| :sourced | Someone else says so. | A third-party tool, its source code, a community document or a developer's statement, not checked by us. Name the source. |
| :inferred | Reasoned, not measured. | A conclusion from other facts, a name, a fit, a pattern, or the way a similar engine does it. |
| :unknown | Stored, meaning not established. | The bytes are there and accounted for (their position and size are known) but what they mean is not. |

Something nobody has looked at has no badge and no page: it shows as a gap on the [coverage page](/coverage/).

## Proven or Observed: the line

The question is **how much of the game the check covered**, not how confident anyone feels.

- **Proven:** the check covered *every* instance in the install for that build: all the archive files of that kind,
  every entry of a type, every program in the bundle. A strict reader (one that refuses an entry on an unexpected value or
  on bytes it cannot account for) getting through all of them with no refusals proves the layout it reads. So does an
  independent reader agreeing on all of them. "The six forges of the install hold 1,301,684 entries and every header
  reads as below" is Proven.
- **Observed:** the check covered *part* of what exists: one area, one level, a sample, the entries one tool could open,
  some archives but not all, one capture, a handful of launches. Runtime measurements of the running game (frame
  captures, crash reproductions, timings) are Observed unless the mechanism is one that cannot depend on the scene.

A census with refusals proves the layout for what it read: say "proven on the 585,234 entries read; 29,876 refused" and
leave the refused part open.

## What a level is about

A level is about the statement it is attached to, for the build of the game the wiki records (each game's hub page
states it). "Offset 8 is the version, `1` in every index" is one statement; if the value has been checked on every
file but nobody knows what the field does, the field is :unknown and the note says the value is constant.

A level never claims more than its evidence covers. Proven on Sekiro is not proven on Elden Ring; limit the badge to
the game it was checked on (`:proven{games="sekiro"}`) and give the other game its own level.

## Evidence

A :proven or :observed statement says what was checked and over what, in words a reader can repeat:

- "Every entry of both installs decodes to the same bytes as SoulsFormats does." :proven
- "Over the 9,818 placements of Ashina Castle, none has a scale other than 1." :observed
- "Running the game's pixel shader under WARP with these inputs gives the formula below on all 81,240 lanes tested." :proven

Evidence is described as a method and a scope, never as "a test in some repository" or "an agent found". Where
the wiki relies on outside work, the page lists it under `sources:` and a :sourced badge names it.

## Moving between levels

- **Up:** a census over every entry, a match with an independent reader, or running the engine's code moves a claim
  to :proven. Edit the badge and the evidence sentence together.
- **Down:** a counterexample demotes a claim at once, and the counterexample is written down. If a "proven" rule
  fails on a new build or a new area, the claim was proven for less than it said: narrow it, and say so.
- **Contradictions** between sources stay visible: write both, each with its own badge, and an open question.

## The levels in other notes

Older notes used other words. They map as follows:

| Older label | Level |
|---|---|
| established, E, VERIFIED (on every entry) | Proven |
| VERIFIED (on an area or a sample), measured | Observed |
| T, READ, a tool's claim, "per SoulsFormats" | Sourced |
| INFERRED, lead, guess, likely | Inferred |
| U, unknown, "stored, meaning not established" | Unknown |

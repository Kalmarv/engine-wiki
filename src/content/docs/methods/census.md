---
title: Exhaustive census
description: Reading every entry of a game's data with every byte accounted for, and why that proves a layout.
---

A census reads **every** entry of a kind across the whole install (every mesh in every archive, every index of every
archive pair) with a strict reader, and reports how many were read, how many were refused, and why.

## What makes a census strict

- **Every byte is accounted for.** The reader records which bytes each field consumed, and an entry with bytes no field
  claims, or a field that runs past the end, is refused. A layout that leaves nothing over on every entry is a layout
  of the real format, not a lucky partial guess.
- **Fixed values are checked, not skipped.** A field stated as always zero, or always `0x10100`, is compared on every
  entry, so a claim like "always zero" is itself proven.
- **Refusals are counted and named.** "13,579 read, 0 refused" proves the layout for that type on that build. "585,234
  read, 29,876 refused" proves it for what was read and leaves the rest open; the refusals say where the knowledge stops.

## What it proves

That the layout fits every entry of that build: the positions, sizes and types of the fields, and every value range it
states. It does **not** prove what a field means. A census can show that the byte at offset 5 is always 0 or 1, and
nothing about why; that field stays :unknown until something else (a reference reader's use of it, the engine's code)
says what it does.

## Limits

- One build at a time. A patch can add a variant; a census of the old build says nothing about it.
- Data the game never ships cannot be counted: a variant a tool documents but no file of the install uses stays
  :sourced (see [DCX envelopes](/engines/fromsoft/archives/dcx/): `DFLT`).
- A census over one area or a sample is a measurement, not a census: :observed.

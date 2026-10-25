---
title: Reference-reader comparison
description: Proving a reading by matching an independent reader on every entry, and what counts as independent.
---

Where the community has a mature reader for a format (SoulsFormats and SoulsFormatsNEXT for FromSoftware games,
CodeWalker for GTA V, UnityPy for Unity, RRAssetStudio for Riders Republic), the strongest cheap check of a reading is a
**differential**: read every entry with both, and compare the results field by field, or the decoded bytes byte for byte.

## What it proves

A match on every entry proves that two independently written readers agree on the whole install. Combined with a strict
[census](/methods/census/), it proves both the layout and the decoding (for example: every archive entry of Sekiro and
Elden Ring decodes to the same bytes as the reference readers produce; see [BHD5 and BDT archives](/engines/fromsoft/archives/bhd5-bdt/)).

The reference only proves what it computes. If it reads a field and ignores it, a match says nothing about that field's
meaning.

## When the reference is wrong

References are not ground truth. A disagreement is investigated against a third authority (the engine's own code,
the game's rendering), and when the reference is the one that is wrong, the page says so. Example: older SoulsFormats
reads FLVER vertex member type `0x13` used as a texture coordinate as two 16-bit integers over 2048, but Elden Ring's
vertex programs read it as four unsigned normalised bytes, unscaled; the programs are the authority.

## What counts as independent

- A third-party reader written from its own research: independent.
- Our own earlier tool, a port of the same notes, or a reader that links the code under test: not independent. Its
  agreement is a regression check, not evidence.
- A tool whose licence forbids copying is still a valid oracle to run and compare against; copy none of its code.

## Without a match

What a reference reader says and nobody has compared is :sourced, with the tool named in the badge.

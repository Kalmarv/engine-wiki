---
title: Name recovery
description: Finding the names behind stored hashes, how sure each kind of match is, and what a name does not tell you.
---

Engines often store a hash where a name would be: Anvil's type ids are the CRC-32 of the type's name, FromSoftware's
archives key files by a hash of their path, RAGE hashes names with Jenkins one-at-a-time. Recovering the names makes the
data readable to people, and a name is a strong hint about meaning. How sure a recovered name is depends on where the
candidate came from.

## Kinds of match

| Candidate from | Example | How sure |
|---|---|---|
| The engine itself at run time | class-registration strings in a memory snapshot of the running game | Proven: the engine registers that name for that hash |
| A tool's or community's list for the same engine | Anvil type names from AnvilToolkit or ACExplorer; a path dictionary from UXM | Sourced, then Proven once the hash is recomputed and matches |
| A wordlist or generated combinations | dictionary words joined in every order | A candidate only: with a 32-bit hash and many candidates, chance matches are expected |

A name is accepted only when its hash is recomputed and equals the stored value. A tool's label for a field or type
whose hash does **not** match is a label, not a name, and is kept apart.

## What a name does not prove

A name identifies; it does not describe. `TerrainMaterialBank` says what a type is for, nothing about its layout or the
meaning of its fields. Use names to orient the work, then establish layouts by [census](/methods/census/) and meanings
by [reference readers](/methods/reference-readers/) or the [engine's code](/methods/engine-code/).

## Collisions

Lossy hashes collide. Two paths can share a 32-bit hash; two candidate words can match one type id by chance. Keep every
matching candidate and say so, rather than picking one.

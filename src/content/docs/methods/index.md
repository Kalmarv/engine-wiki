---
title: Methods
description: How things in this wiki become known, and which confidence level each method can earn.
sidebar:
  order: 0
---

A confidence level is only as good as the check behind it. These pages describe the checks the wiki relies on, what
each can and cannot show, and the level it earns.

| Method | What it shows | Earns at best |
|---|---|---|
| [Exhaustive census](/methods/census/) | A layout reads every entry of the game's data with every byte accounted for | Proven |
| [Reference-reader comparison](/methods/reference-readers/) | An independent reader gets the same result on every entry | Proven |
| [Running the engine's own code](/methods/engine-code/) | A shader or program of the game, run unmodified, computes what the page says | Proven |
| [Runtime observation](/methods/runtime-observation/) | What the running game actually holds and draws (captures, memory snapshots) | Proven or Observed |
| [Crash analysis](/methods/crash-analysis/) | Which code freed or damaged the memory a crash reads, from dumps and in-process recording | Observed |
| [Name recovery](/methods/name-recovery/) | Which names stored hashes stand for | Proven (a name), never a meaning |
| Partial measurement | A census over part of the data (one area, a sample) | Observed |
| Third-party claim | What another tool or document says, unchecked | Sourced |
| Reasoning | A conclusion from other facts, names, fits or similar engines | Inferred |

Two rules apply to every method:

- **Scope is part of the claim.** A check over one game, one build or one area proves nothing beyond it. Say what
  the check covered, and limit the badge to the games it covered.
- **Independence matters.** Our own earlier tools, or a tool built from the same notes, are not an independent check of
  each other. A match only counts when the second reader was written without the first.

---
title: Runtime observation
description: Learning what the running game holds and draws, through graphics captures and memory snapshots.
---

Some facts exist only while the game runs: which program a draw uses, the constants it is given, the class names the
engine registers, values the engine computes from data. Two ways of observing them are used here. Both are done
offline, on the owner's own copy, with anti-cheat not running, and never in online play.

## Graphics captures

A capture layer between the game and Direct3D records each draw: its shaders, render targets, bound textures, constant
buffers and blend state, and can copy render targets and buffers back for inspection. It shows:

- which compiled program draws which object, and with which constants, so a material's runtime inputs can be matched
  to its stored values;
- the order and blending of passes (G-buffer, lighting, composite), which explains how stored data turns into the image;
- known pixels to compare a reading's output against.

A capture is one frame of one scene. What it shows holds for what was drawn: :observed, or :proven for a mechanism
(a blend state, a pass order) that does not depend on the scene.

## Memory snapshots

When a game's executable is protected so that its code cannot be read from disk, a snapshot of the memory of a virtual
machine running it gives the code and the engine's runtime structures offline, with nothing attached to the game:

- **Class registries:** the names the engine registers for its types and components, which identify hashed type ids
  exactly (see [name recovery](/methods/name-recovery/)).
- **The engine's own decoders,** readable in a disassembler from the memory image.
- **Decoded data:** textures and buffers in the layout the renderer uses, as known plaintext for checking a decoder.
- **Live values:** per-frame constants and values the engine evaluates from data (a sky colour at a given hour), to fit
  and check formulas.

A snapshot is one moment: take several (menu, in the world, different hours or states) and say which one a fact comes from.

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

The layer can be a stand-in `d3d11.dll` and `dxgi.dll` placed beside the executable that forward every call to the
system's own runtime, so the game draws on the real driver. It has to hand the game its own objects wherever the game can
reach the runtime's: a game that finds its swap chain's factory through the device's `IDXGIDevice` otherwise creates the
swap chain where the layer does not see it ([Sekiro](/engines/fromsoft/runtime/render-state/#deferred-contexts)).

A capture is checked by replaying it: every recorded call is run again offline from the recorded contents of the resources
it uses, and each render target is compared with what the game's GPU wrote, bit for bit. A replay that matches on every
target shows the capture holds everything the frame's drawing depends on. Compute programs that reserve output slots with
an atomic add write their records in an order that changes from run to run, so the replay takes those dispatches' outputs
from the game rather than recomputing them ([order-dependent programs](/engines/fromsoft/runtime/render-state/#compute-programs-whose-output-depends-on-thread-order)).
With that, a Sekiro frame matches on all 146 targets and a SkateBIRD title frame on all 33, on three replays each.
:observed[one frame of each game]

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

How a snapshot is taken decides what it holds:

- **From the hypervisor, not inside the guest.** The virtual machine is paused and its physical memory written out
  whole, with the address gaps of the machine (the PCI hole) filled with zeros so that a file offset is a physical
  address. Nothing runs inside the game's machine to take it.
- **Without a passed-through GPU.** The guest then renders with WARP, Direct3D's software rasterizer, so textures,
  buffers and compiled shaders the game creates sit in guest memory as plain rows rather than in video memory.
- **At the right moment.** Structures the engine builds while starting are absent from an early snapshot: in Riders
  Republic a snapshot at the splash screen holds no class names, one at the main menu holds them
  ([class registry](/engines/anvil/data-model/class-registry/)). The executable image is most complete while the game
  idles at a menu (in the measured case nearly all its pages were resident there, against about half once a world had
  streamed in), so take code from a menu snapshot and decoded assets from one in the world.
- **Read with a tool that understands Windows' memory.** Process memory is found through the guest's page tables;
  pages Windows has moved into its compressed store are only readable by a reader that decompresses them (MemProcFS
  does, Volatility 3 does not), which recovers a good part of an image that otherwise looks missing. The main module
  can then be rebuilt as an executable in its loaded layout for a disassembler.

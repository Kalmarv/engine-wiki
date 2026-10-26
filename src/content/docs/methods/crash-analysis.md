---
title: Crash analysis in a closed executable
description: Finding the cause of a memory-damage crash in a game without its source, from dumps and in-process recording.
---

Added content can crash a game whose source code is not available. The crash dump says where the game
faulted, not why. This page covers how the cause is found and the traps that send an analysis the wrong way. All of
it is done offline, on the owner's own copy, with anti-cheat not running.

## The crash site is the victim

When memory is freed while something still holds it, or written past its end, the fault happens later, in whatever
code reads that memory next. Several crash addresses with one shared trait (the same tagged pointer value, the same
object type) usually point to one cause. Treat the faulting function as a witness, and look for the code that wrote
the bad value or freed the block.

Before forming a theory, ask what the most direct evidence would be, and run the simplest comparison first: the same
content built by the old and the new toolchain, or one change at a time.

## Recording allocations and frees

A small library loaded into the game hooks the allocator's allocate and free entry points and records each call with
its call path. It runs in record-only mode, so it never changes what the game does. Two rules make its records useful:

- **Deep call paths.** Eight to twelve frames, and for work run from a job queue, also the path that queued the job.
  A two-frame path names a shared helper, not the subsystem that called it.
- **Know the allocator's own structure.** A free routine can re-enter itself after looking up the real arena, so one
  logical free appears as two records (for skate., see [general free dispatch](/engines/frostbite/runtime/limits/#general-free-dispatch)).

When a recorder matches a register value against its history, mask it to 48 bits and keep only values in the user
address range (at most `0x7ffffffeffff`). Without that, constants such as `0x0000ffffffffffff` match unrelated
values and flood the result.

## Traps in the instrumentation itself

- **First-chance exceptions of your own probes.** A vectored exception handler sees every access violation before
  structured handlers run, including one that a `__try` memory probe in the instrumentation catches and handles.
  Logged as a crash, it points at the instrumentation. Probe memory with `ReadProcessMemory` instead, which reports
  an unreadable address without raising.
- **Faults inside a hook's trampoline.** A hook copies the first instructions of the function it replaces. A fault in
  a copied instruction reports the trampoline's address; map it back to the game's own address before reading it.

## Time-travel recording

Attaching WinDbg's time-travel recorder to skate. running under ReSkate stalls the level load: the recorder logs
thousands of `NtSuspendThread got a handle without basic rights so TTD cannot operate with it`, and two attempts with
40 GB ring buffers each produced no usable trace. :observed{games="skate"} The in-process recorder above is the route
that works for this game.

## Reading dumps in WinDbg and CDB

Observed with CDB 10.0.29617 on skate. minidumps:

- Assigning a pseudo-register (`r @$t0=...`) resets the exception context set by `.ecxr`; `dx` debugger variables
  keep it. :observed
- After `.frame /r N`, `dx @r13` reads the faulting context's R13, not the unwound value the frame command printed.
  Copy unwound register values from the `.frame /r` output as literals. :observed
- In an executable without symbols, the nearest exported name in a stack is not the function's identity. Use
  offsets from the module base. :inferred

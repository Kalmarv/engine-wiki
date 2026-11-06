---
title: TMUnlimiter map data
description: "The chunks TMUnlimiter, a community extension, adds to TrackMania Nations Forever maps: their versions, the version 7 order, the challenge flags, parameter values, block kinds, embedded models and the encrypted chunk 0x3F001000."
games: [tmnf]
sources:
  - title: GBX.NET
    url: https://github.com/BigBang1112/gbx-net
    note: version 2.5.0; its TMUnlimiter reader (CGameCtnChallenge.TMUnlimiterData) and the function enum of parameters
  - title: TMUnlimiter wiki, AngelScript
    url: https://github.com/tomek0055/TMUnlimiter/wiki/AngelScript
    note: the script interface TMUnlimiter declares, including VehicleCarTuning's fields and their types
  - title: AngelScript
    url: https://www.angelcode.com/angelscript/
    note: the scripting library; as_restore.cpp of version 2.37.0 writes and reads the saved bytecode
---

TMUnlimiter is a community extension of TrackMania Nations Forever. A map made with it keeps its real content in chunks the
stock game skips, under class `CGameCtnChallenge` with the chunk numbers `0x3F001000` to `0x3F001003`, and leaves the stock
game a single stand-in block. :observed[61 downloaded maps]

Everything here is measured on maps from TrackMania Exchange: the 61 TMUnlimiter maps of the 2026 top-downloads list (100 maps)
that GBX.NET can read, each compared with it field by field with no difference, and the 10 it refuses, nine for their
AngelScript bytecode and one for a parameter's value kind (below). :observed[71 maps]

## The chunks

Chunks `0x3F001001`, `0x3F001002` and `0x3F001003` are skippable, share one layout and begin with a version byte. The chunk
number gives the data version of the embedded block models: 0 for `1001`, 1 for `1002`, 2 for `1003`; from version 2 a byte
follows each sub-variant. :observed[61 maps]

| Version | What follows | Confidence |
|---|---|---|
| 0 | Nothing | :observed |
| 1 | Game blocks with byte coordinates | :observed |
| 6 | Blocks of kinds 0 and 2 only | :observed |
| 7 | The order below; the common version | :observed |

A map with version 1 or more keeps a single stand-in block in chunk `0x0304301F`, whose text is "TMUnlimiter 2.0.0 is required to
load this challenge..."; the real blocks are in the extension chunk. :observed[61 maps]

### Version 7

| Order | Field | Confidence |
|---|---|---|
| 1 | Flags, `u16` (below) | :observed |
| 2 | Decoration offset and scale; absent when the visibility is 3 | :observed |
| 3 | AngelScript modules (below) | :observed |
| 4 | Parameter sets | :observed |
| 5 | Trigger groups | :observed |
| 6 | Block groups | :observed |
| 7 | Embedded model count | :observed |
| 8 | Material model references | :observed |
| 9 | Replacement texture flags | :observed |
| 10 | Embedded images | :observed |
| 11 | Embedded block models | :observed |
| 12 | Vehicle idents | :observed |
| 13 | Blocks | :observed |

The node indices named by the material model references, the replacement textures and the image bitmap pairs are external
files, entries of the header's reference table, not nodes; none is named twice. :observed[61 maps]

| Flag bits | Meaning (GBX.NET's names) | Confidence |
|---|---|---|
| 0–1 | Decoration visibility: 0 all, 1 sky, 2 background, 3 nothing | :sourced[GBX.NET] |
| 2 | Decoration moved | :sourced[GBX.NET] |
| 3 | Decoration scaled | :sourced[GBX.NET] |
| 4 | Pylons off | :sourced[GBX.NET] |
| 5 | Base empty | :sourced[GBX.NET] |
| 6 | Vehicle collisions | :sourced[GBX.NET] |
| 7 | Random start | :sourced[GBX.NET] |
| 8 | Server communications | :sourced[GBX.NET] |
| 9 | Ignore multiplayer time synchronisation | :sourced[GBX.NET] |
| 10–15 | Never set | :observed[61 maps] |

### Blocks and parameters

| Block kind | Meaning | Confidence |
|---|---|---|
| 0 | Game block | :observed |
| 1 | Trigger | :observed |
| 2 | External | :observed |
| 3 | Embedded | :observed |

A parameter's value kind follows from its function, an index into an enum of 467 functions. A `KeysReal`, `KeysNatural` or
`FastBufferReal` parameter whose operation is Multiply stores one `f32` in place of its keys. :observed[61 maps] The keyed
parameters store an inline `CFuncKeysReal`, a node with no node index (see
[key functions](/engines/gamebox/animation/mediatracker/#key-functions)). :observed[61 maps]

Two functions GBX.NET's table gives as `KeysReal` carry a plain `f32`: 124 `Vehicle_M4AccelFromSlipAngle` and 136
`Vehicle_M4SteerRadiusCoefFromSlipAngle`. TMUnlimiter's script interface declares both as `float` fields of
`VehicleCarTuning` (`m4AccelFromSlipAngle`, `m4SteerRadiusCoefFromSlipAngle`). :sourced[TMUnlimiter wiki, AngelScript] The one
downloaded map that sets parameter 124 (operation Set) stores the single `f32` 10.0 there, not an inline `CFuncKeysReal`, and
with the parameter read as an `f32` the map reads to its end. :observed[the one map of 100 that sets it]

### AngelScript modules

Each module begins with a flags byte: bit 0 marks an empty module, which stores nothing more, and bit 1 a module stored
without a name; otherwise the module's name follows as a string. No other bit is set. :observed[71 maps] A module that is
not empty holds AngelScript's saved bytecode, the stream `asIScriptModule::SaveByteCode` writes, directly after the name. The
stream has no length of its own, so the next field starts where a walk of the stream in the reader's order ends. :observed[the
9 maps of the 100 that have bytecode]

The stream is AngelScript 2.37.0's. The 32-bit extension DLL contains every error text that version adds and none of those
2.38.0 adds, the maps' type tokens are 2.37's numbers (`bool` 65, `void` 80, which 2.38 renumbered), and pointer operands in
the bytecode are 32-bit words. :observed[the TMUnlimiter 2.0 DLL and the 9 maps] Read with 2.37.0's rules (encoded integers,
strings by length or by an earlier string's index, data types and functions by reference to entries already read), every
module of the 9 maps walks to its last byte with every instruction one the 2.37.0 writer emits; each map has one module
with bytecode, and its bytes are found whole in GBX.NET's decompressed body. Read with the rules of earlier versions (2.31,
or 2.33 to 2.35) no module walks to its end. :observed[the 9 maps] The modules declare enums, classes, funcdefs, typedefs,
globals, functions and imports, and their string constants are UTF-16LE, the host's string type. :observed[the 9 maps]

## Chunk 0x3F001000

Chunk `0x3F001000` is encrypted whole, with a byte cipher that is its own inverse. For byte `i` of a chunk of `len` bytes, in
32-bit arithmetic:

```
hash = (len * (2 * len - i)) ^ 0xEAD9C8B3
hash += (3 * i) % 0x7F
if i % 5 < 2: hash = ~hash
byte = ~(byte ^ hash)        (low 8 bits)
```

:observed[the one map of 100 that has the chunk, read and compared with GBX.NET]

GBX.NET masks this chunk's challenge flags with `0x105` and compares the result with visibility 3 (nothing), which a masked
value can never equal, so it always reads the decoration offset and scale. :sourced[GBX.NET's reader]

## Comparing with GBX.NET

GBX.NET's view of these maps differs from the file in ways a comparison has to allow for. :sourced[GBX.NET's reader]

- It keeps only the embedded block models some block uses, so nodes reached only from unused models (`CPlugTree`,
  `CPlugMaterial`, surfaces) are missing from its node census: a map with 126 trees shows 105.
- It counts inline nodes (a `CFuncKeysReal` in a parameter, a `CPlugIndexBuffer` in a visual), which have no node index.
- It replaces the map's block list with the chunk's game blocks, so the block data chunk's count and first block differ from
  its dump.
- It refuses AngelScript modules with bytecode, and reads parameters 124 and 136 as keys.

---
title: Ghosts
description: "CGameCtnGhost, a recorded run: the compressed sample stream of car states in chunk 0x0303F005, the 61-byte version 9 car record, and the input events, versions and seed of chunk 0x03092019."
games: [tmnf]
sources:
  - title: GBX.NET
    url: https://github.com/BigBang1112/gbx-net
    note: version 2.5.0; CGameGhost, CGameCtnGhost and their chunk lists
---

A ghost is a recorded run: the car's state sampled at a fixed period, packed and compressed, beside the player's input events
and the versions of the game that recorded it. :observed[15 ghosts of 9 downloaded maps]

`CGameCtnGhost` is `0x03092000`. The layouts below read all 15 ghosts of 9 maps of the 2026 top-downloads list to their end, and
the chunks found in them are the ones GBX.NET finds. :observed[15 ghosts]

## Samples (chunk 0x0303F005)

The chunk is a `u32` uncompressed size and a `u32` length followed by that many zlib bytes. :observed[15 ghosts] The stream
inside:

| Order | Field | Type | Confidence |
|---|---|---|---|
| 1 | Vehicle class | `u32`, `0x0A02B000` | :observed |
| 2 | Fixed step | bool | :observed |
| 3 | Unknown | `i32`, 0 | :unknown |
| 4 | Sample period | `i32`, 100 ms | :observed |
| 5 | State version | `i32`, 9 in all 15 | :observed |
| 6 | State data | a buffer of the samples' records | :observed |
| 7 | Sample count | `i32` | :observed |
| 8 | Offsets | the first sample's offset (`i32`), then a size per sample (`i32`), or −1 and then count − 1 sizes | :observed |
| 9 | Times | present when the step is not fixed | :observed |

### Car record (state version 9)

A sample is 61 bytes. :observed[15 ghosts] The first record of each ghost decodes to a plausible start position.
:observed[15 ghosts]

```layout
title: Car state, version 9
size: 61
note: The names of fields after the position follow GBX.NET's; only the position is checked against the map.
fields:
  - {at: 0, size: 12, type: "vec3 f32", name: position, level: observed}
  - {at: 12, size: 2, type: u16, name: rotation angle, level: sourced}
  - {at: 14, size: 4, type: u32, name: rotation axis (packed), level: sourced}
  - {at: 18, size: 4, type: u32, name: velocity (packed), level: sourced}
  - {at: 22, size: 4, type: u32, name: angular velocity (packed), level: sourced}
  - {at: 26, size: 6, type: "u16[3]", name: speeds and rpm, level: sourced}
  - {at: 32, size: 8, type: "u16[4]", name: wheel rotations, level: sourced}
  - {at: 40, size: 1, type: u8, name: steer, level: sourced}
  - {at: 41, size: 1, type: u8, name: gas, level: sourced}
  - {at: 42, size: 1, type: u8, name: brake, level: sourced}
  - {at: 43, size: 4, type: "u8[4]", name: unknown, level: unknown, note: "GBX.NET's u11 to u14"}
  - {at: 47, size: 1, type: u8, name: turbo, level: sourced}
  - {at: 48, size: 1, type: u8, name: front steer, level: sourced}
  - {at: 49, size: 8, type: "(u8, u8)[4]", name: "per wheel: dampen, material", level: sourced}
  - {at: 57, size: 3, type: "u8[3]", name: unknown, level: unknown, note: "GBX.NET's u25 to u27"}
  - {at: 60, size: 1, type: u8, name: dirt blend, level: sourced}
```

## Inputs and versions (chunk 0x03092019)

| Order | Field | Type | Confidence |
|---|---|---|---|
| 1 | Events duration | `u32`; when 0 nothing else of the inputs follows | :observed |
| 2 | Input store version | 0 | :observed |
| 3 | Input names | counted idents | :observed |
| 4 | Event count, limit | | :observed |
| 5 | Events | 9 bytes each: time + 100,000 (`u32`), an input-name index (`u8`), data (`u32`) | :observed |
| 6 | Executable version | string | :observed |
| 7 | Checksum, OS, CPU | | :observed |
| 8 | Race settings | string | :observed |
| 9 | Seed | `i32`, after the inputs | :observed |

:observed[15 ghosts]

Ghosts recorded with the TMF Competition Patch carry a further chunk, `0x0304F001`: a `u32` and counted bytes, which are
high-entropy. It is skippable. :observed[the patched ghosts among the 15]

:::open[What does the Competition Patch chunk hold?]
Chunk `0x0304F001`'s bytes look encrypted or compressed; they are not read.
:::

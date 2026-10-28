---
title: CAS compression blocks
description: Physical block framing and codec selection inside skate.'s CAS archives.
games: [skate]
sources:
  - title: ReSkate CAS implementation
    url: https://github.com/Dingo-Shenanigans/ReSkate/tree/main/Engine/Resource
implementations:
  - name: frostbite-formats (cas.rs)
    url: https://github.com/Kalmarv/frostbite-formats/blob/main/src/cas.rs
---

An asset's CAS range is a sequence of eight-byte headers and exactly sized payloads. Concatenating the decoded
blocks reconstructs the asset. Physical range length includes the headers; decoded length does not. :observed

```layout
title: CAS block header
size: 8
fields:
  - {at: 0, size: 1, type: u8, name: dictionary metadata, level: unknown, note: "Zero in all 1,001,300 headers of the indexed ranges."}
  - {at: 1, size: 3, type: u24be, name: decoded length, level: observed}
  - {at: 4, size: 1, type: u8, name: codec and reserved bit, level: observed, note: Low seven bits select the codec; high bit is reserved.}
  - {at: 5, size: 1, type: u8, name: flags and payload length high bits, level: observed, note: Low nibble is length bits 16–19; the upper nibble is 7 in every stock block.}
  - {at: 6, size: 2, type: u16be, name: payload length low bits, level: observed}
```

| Codec | Payload | Confidence |
|---|---|---|
| `0` | Stored bytes, equal in length to the decoded block | :sourced[ReSkate] |
| `2` | zlib | :sourced[ReSkate] |
| `0x11`, `0x15`, `0x19` | Oodle-compressed bytes | :sourced[ReSkate] |

Studio output uses Oodle CAS blocks. A block's codec is independent of its asset's resource type. :observed

Each of the 208 sampled `0x11` blocks holds one Oodle block that begins `8C 06` (Kraken, restart bit set), and walking
its block and quantum headers ends exactly at the block's last payload byte. :observed[208 sampled blocks]

## Stock data

The stock game Data has 23 TOCs over 72 CAS files. Following exactly the chunk and bundle-asset ranges the TOCs
index, its CAS files hold 999,764 distinct physical blocks: 153,945 with codec `0` and 845,819 with codec `0x11`. No
indexed block uses `2`, `0x15`, `0x19` or any other codec. :proven[every block the TOCs index; headers read, a sample decoded]
No `0x11` block's payload is the same length as its decoded block, so the stock data shows no compressed block
that falls back to stored bytes at equal size. :observed That some blocks are stored with codec `0` does not
show when the producer chooses to store. :inferred

The bundle manifests that live in CAS files (6,056 of them) are stored raw, without block headers; reading them
as CAS frames misreads them. :observed Gaps and padding between indexed ranges are not blocks. 30,293,670 bytes of
the CAS files lie outside every indexed asset and manifest range, so the codec census does not cover them. :observed

Every header of every indexed range reads with byte 0 equal to zero, the top bit of byte 4 clear and the upper nibble
of byte 5 equal to 7 (1,001,300 headers over 723,698 ranges, 999,764 distinct blocks). The payload-length bits 16 to 19
are nonzero in 82,951 blocks, all of them stored (codec `0`) 64 KiB blocks whose payload is 65,536 bytes; every other
block has a payload below 65,536. Every block that does not end its range decodes to exactly 65,536 bytes, and every
range chains from its first header to its last byte with no remainder. :proven[all indexed ranges of the stock install]
The upper nibble of byte 5 is 7 in the 1,535,187 blocks of the files that the 82 mod folders installed beside the game
list in their bundles as well, among them maps compiled by ReSkate Studio. :observed[every listed file of those 82 folders]
No stock region names a Patch folder, so no delta file occurs among the ranges. :proven[the stock install]

:::open[Which dictionary and flag variants does the engine accept?]
No stock block uses a nonzero dictionary byte or a flags nibble other than 7, so the stock data does not show what
either would mean. The measured framing does not establish support for every Frostbite CAS codec. :unknown
:::

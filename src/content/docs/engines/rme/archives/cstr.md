---
title: CSTR compressed streams
description: "How a compressed PAK entry is stored: a CSTR header and blocks of raw deflate, each at most 65,531 bytes, stored uncompressed when deflate did not help."
implementations:
  - name: primase worlds/shred (cstr.rs)
    url: https://github.com/Kalmarv/primase/blob/main/worlds/shred/src/read/cstr.rs
---

A [PAK entry](/engines/rme/archives/pak/) whose attribute value is `2` is a **CSTR** stream: a 16-byte header followed by blocks, each a raw deflate stream of at most 65,531 decoded bytes, or the same bytes stored as they are. The stream is
`compressed_size` bytes long in the PAK and decodes to the entry's `size`. :proven[all 31,227 streams of the 336 PAKs]

Big-endian throughout.

```layout
title: CSTR header
size: 16
games: [shred]
note: Followed by the blocks to the end of the stream.
fields:
  - {at: 0, size: 4, type: "char[4]", name: magic, value: "CSTR", level: proven}
  - {at: 4, size: 2, type: u16, name: byte_order_mark, value: "0xFEED", level: proven}
  - {at: 6, size: 2, type: u16, name: version, value: "1", level: proven}
  - {at: 8, size: 2, type: u16, name: block_count, level: proven, note: "exactly the number of blocks in every stream"}
  - {at: 10, size: 2, type: u16, name: threshold, value: "0xF32F", level: proven, note: "62,255; the compression-selection threshold the loader compares with"}
  - {at: 12, size: 4, type: u32, name: uncompressed_size, level: proven}
```

```layout
title: CSTR block
size: "4 + stored_size"
games: [shred]
note: Blocks follow one another with no padding.
fields:
  - {at: 0, size: 2, type: u16, name: stored_size, level: proven, note: "bytes of payload"}
  - {at: 2, size: 2, type: u16, name: decoded_size, level: proven, note: "bytes the block decodes to; at most 65,531"}
  - {at: 4, size: "stored_size", type: "u8[]", name: payload, level: proven, note: "raw deflate (no zlib header) when stored_size differs from decoded_size, otherwise the bytes themselves"}
```

Across the disc there are 111,391 blocks: 107,170 are deflate and 4,221 are stored (equal sizes). The decoded sizes of a stream's blocks sum to its header size, and the stored sizes plus headers fill its range in the PAK. :proven[all 31,227 streams]
The threshold is `0xF32F` and the largest decoded block is 65,531 bytes (`0xFFFB`). :proven[all 31,227 streams]

## How the loader chooses

The executable reads the block header, then inflates the block when the stored size is at most the threshold and the decoded size is above `0xFFFB − threshold` (3,276 bytes); otherwise it copies the stored bytes. :observed[static reading of the executable]
That rule and "inflate when the two sizes differ" give the same answer on every one of the 111,391 blocks of the disc and on the 260 blocks of the script archive. :proven[all blocks]
Its working buffers are `0xFFFB` bytes each, which would explain why no block decodes to more. :inferred
How the writer picks stored or deflate is not shown by the data, and the threshold's meaning on the writing side is not established. :unknown

The script archive (`SCRIPTS.SDAT` decrypted) holds 252 streams in 260 blocks, all compressed, with the same threshold. :observed

:::open[Why are some blocks stored?]
4,221 blocks are stored. Small blocks and data that deflate cannot shrink are both possible reasons; the split between them was not measured.
:::

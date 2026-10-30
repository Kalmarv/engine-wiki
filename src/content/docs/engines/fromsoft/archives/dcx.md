---
title: DCX envelopes
description: The compression wrapper around most FromSoftware files, its header, and the codecs Sekiro and Elden Ring use.
sources:
  - title: SoulsFormats (DCX)
    url: https://github.com/JKAnderson/SoulsFormats
    note: reference reader; documents the header variants and the DFLT and KRAK codecs
  - title: SoulsFormatsNEXT (DCX.DecompressDCXZSTD)
    url: https://github.com/soulsmods/SoulsFormatsNEXT
    note: the ZSTD variant
  - title: oozextract
    url: https://github.com/lvlvllvlvllvlvl/oozextract
    note: an open-source Kraken decoder
implementations:
  - name: fromsoft-formats (dcx.rs)
    url: https://github.com/Kalmarv/fromsoft-formats/blob/main/src/dcx.rs
---

Most files inside the [archives](/engines/fromsoft/archives/bhd5-bdt/) are wrapped in a **DCX envelope**: a fixed
76-byte header naming the codec and the sizes, then the compressed payload. A file's name says so with a `.dcx`
suffix (`m11_01_00_00.msb.dcx`); the envelope holds exactly one file, often a BND4 binder of several. :proven

The header is three tagged blocks, `DCS` (sizes), `DCP` (codec) and `DCA` (payload), all big-endian. :proven

```layout
title: DCX header
size: 76
note: "Big-endian. The payload follows at 76, then at most 15 zero bytes of alignment."
fields:
  - {at: 0, size: 4, type: "char[4]", name: magic, value: "DCX\\0", level: proven}
  - {at: 4, size: 4, type: u32, name: format version, level: sourced, note: "`0x11000` (or `0x10000` in older DFLT files); SoulsFormats' variant key"}
  - {at: 8, size: 4, type: u32, name: DCS offset, value: "0x18", level: inferred, note: "always `0x18`, where `DCS` starts"}
  - {at: 12, size: 4, type: u32, name: DCP offset, value: "0x24", level: inferred, note: "always `0x24`, where `DCP` starts"}
  - {at: 16, size: 4, type: u32, name: unknown, level: unknown, note: "`0x44`, or `0x24` in older DFLT files"}
  - {at: 20, size: 4, type: u32, name: unknown, level: unknown, note: "`0x4C` when the field at 16 is `0x44`, else `0x2C`"}
  - {at: 24, size: 4, type: "char[4]", name: DCS tag, value: "DCS\\0", level: proven}
  - {at: 28, size: 4, type: u32, name: decoded size, level: proven}
  - {at: 32, size: 4, type: u32, name: payload size, level: proven}
  - {at: 36, size: 4, type: "char[4]", name: DCP tag, value: "DCP\\0", level: proven}
  - {at: 40, size: 4, type: "char[4]", name: codec, level: proven, note: "`KRAK`, `ZSTD` or `DFLT`"}
  - {at: 44, size: 4, type: u32, name: DCP block size, value: "0x20", level: inferred, note: "always `0x20`: from 36 to the `DCA` tag at 68"}
  - {at: 48, size: 1, type: u8, name: compression level, level: sourced, note: "SoulsFormats' name; 6 in every KRAK envelope, 9 in every DFLT envelope of the archives"}
  - {at: 49, size: 3, type: "u8[3]", name: reserved, level: proven, note: "always zero"}
  - {at: 52, size: 4, type: u32, name: reserved, level: proven, note: "always zero"}
  - {at: 56, size: 1, type: u8, name: unknown, level: unknown, note: "0 in every archive envelope; 15 in the DFLT envelopes of Elden Ring's older regulation files"}
  - {at: 57, size: 3, type: "u8[3]", name: reserved, level: proven, note: "always zero"}
  - {at: 60, size: 4, type: u32, name: reserved, level: proven, note: "always zero"}
  - {at: 64, size: 4, type: u32, name: unknown, value: "0x10100", level: unknown, note: "always `0x10100`"}
  - {at: 68, size: 4, type: "char[4]", name: DCA tag, value: "DCA\\0", level: proven}
  - {at: 72, size: 4, type: u32, name: DCA header size, value: 8, level: sourced, note: "SoulsFormats' compressed header length"}
```

Only the combinations of version, the field at 16, level and the byte at 56 listed here occur; every envelope in both
installs is one of them. :proven

| Codec | Version | Field at 16 | Level | Byte at 56 | Sekiro | Elden Ring |
|---|---|---|---:|---:|---|---|
| `KRAK` | `0x11000` | `0x44` | 6 | 0 | 27,074: 7,830 top-level, 19,244 inside binders | 117,121: 71,312 top-level, 45,809 inside binders |
| `DFLT` | `0x10000` | `0x24` | 9 | 0 | 12 top-level | 19 top-level |
| `DFLT` | `0x10000` | `0x44` | 9 | 0 | 8 top-level, 1 inside a binder | 1 top-level |
| `DFLT` | `0x11000` | `0x44` | 9 | 0 | 1 top-level | none |
| `DFLT` | `0x11000` | `0x44` | 9 | 15 | none | the 16 regulation files up to 1.10 |
| `ZSTD` | `0x11000` | `0x44` | 21 | 0 | none | the 13 regulation files from 1.12.1 to 1.17.3 |

The archive rows count every envelope at any depth in the archives of both installs (Sekiro's five pairs, Elden Ring's
six; Elden Ring's `DLC` pair is not installed). :proven[both archive sets, Elden Ring without the `DLC` pair] The
regulation rows count the 28 published Elden Ring regulation files and the installed one, once decrypted.
:observed{games="elden-ring"} No `KRAK` envelope has level 9 in either install. :proven[both archive sets]

## Codecs

| Codec | What it is | Where | Confidence |
|---|---|---|---|
| `KRAK` | Oodle Kraken. The games load it from their own `oo2core_6_win64.dll` | the archives of both games | :proven |
| `ZSTD` | One Zstandard frame, with `KRAK`'s header layout | Elden Ring's `regulation.bin` once decrypted, from 1.12.1 on | :proven{games="elden-ring"} |
| `DFLT` | zlib | 22 Sekiro and 20 Elden Ring archive envelopes, and Elden Ring's regulation files up to 1.10 | :proven |

In Sekiro's `Data5`, the entry with path hash `a28b84c8` declares a larger compressed size in its `KRAK` header than
its stored extent holds: the header asks for 1,342,263 bytes and the entry is 1,114,112 bytes long. The entries of the
pair are contiguous, so the next entry starts where this one ends and the stored payload simply stops short of the
declared size. No other envelope of either install is short; this is the only one of Sekiro's 27,096 and Elden Ring's 117,141.
:proven[every envelope of both archive sets]

## Kraken payload framing

A `KRAK` payload is a run of blocks, one per 262,144 decoded bytes (the last holds what is left). Each block starts
with a two-byte header; the decoder type in it sets the framing that follows. :proven[27,073 Sekiro and 117,121 Elden Ring payloads walked to their last byte]

```layout
title: Oodle block header
size: 2
note: "One per 262,144 decoded bytes, at the start of each block."
fields:
  - {at: 0, size: 1, type: u8, name: flags, level: sourced, note: "low nibble `0xC` and bits 4-5 clear in every block; bit 6 set: the block is stored uncompressed; bit 7 set: the decoder restarts here"}
  - {at: 1, size: 1, type: u8, name: decoder, level: sourced, note: "bits 0-6: decoder type; bit 7: checksums follow (never set)"}
```

| Decoder type | Name | Block framing | Sekiro payloads | Elden Ring payloads |
|---|---|---|---:|---:|
| 6 | Kraken | one 3-byte big-endian quantum header per block (compressed size minus one in the low 18 bits; `0x3FFFF` marks a memset quantum followed by one fill byte) | 26,139 | 116,161 |
| 2 | LZB16 | 16 quanta of 16,384 decoded bytes per block, each with a 2-byte big-endian header (compressed size minus one in the low 14 bits) | 934 | 960 |

Decoder type 2 is LZB16, not LZNIB: compressing with each compressor of `oo2core` versions 5, 6 and 9, only the LZB16
compressor writes blocks beginning `8C 02`, and the LZNIB compressor writes `8C 01`. :observed oozextract names its
type-2 decoder `Lznib`; the framing it reads is the one above, and the name is the only disagreement. :sourced[oozextract]

Every block of every payload has the restart bit set: the first blocks begin `8C 06`, `8C 02` or (stored) `CC 06`, and
the 303,703 later blocks of Elden Ring and 70,897 of Sekiro begin `8C 06` or `CC 06`. No block has the checksum bit,
and no payload uses another decoder type. Of the quantum kinds beyond a compressed run, only the memset one occurs (67
quanta in Sekiro, 115 in Elden Ring); there is no whole-match quantum and no stored small quantum. Walking the headers this
way consumes every payload exactly: no payload has bytes left after its last quantum. :proven[both archive sets]

Sekiro depends on that bit. A rewritten object file of eight Kraken blocks in which only the first block restarts makes
the game exit while loading it, and the same file with every block restarting loads and plays. :observed[two loads of each]{games="sekiro"}

A stored block (header `CC 06`: 1,180 first and 1,292 later blocks in Sekiro, 4,420 and 3,339 in Elden Ring) is the
block's decoded bytes raw, with no quantum header: a walk steps over as many bytes as the block decodes to (what is left,
for the last block). The walk needs only the payload and the envelope's decoded size, never decoding, and ends at the
payload's last byte on all 27,073 readable Sekiro and 117,121 Elden Ring payloads. :proven[both archive sets, Elden Ring without the `DLC` pair]

Oodle's own decode does not report how many input bytes it used, so a payload with bytes left after its last quantum is
not noticed by decoding it. `oo2core_6` returns the original bytes from a stream of its own making with one byte
appended: 9 sizes from 1 to 600,000 bytes, for each of the compressors that make decoder types 2, 6, 10, 11 and 12 (it
returns nothing for the LZNA, type 5, streams of the same sizes, with or without the extra byte). :observed
Only the walk of the framing finds trailing bytes. The framing of the decoder types the games do not use (5, 10, 11, 12) and the escapes of a
16 KiB quantum header (low 14 bits `0x3FFF`: bits 14-15 `0` whole match, `1` memset, `2` stored) are oozextract's :sourced[oozextract].
No shipped payload has one. Streams `oo2core_6` makes for each of the decoder types 2, 5, 6, 10, 11 and 12 (9 sizes each, 1 to
600,000 bytes) walk to exactly their last byte under the framing above, and a stream with a byte added or removed does
not. :observed

All 934 Sekiro and 960 Elden Ring decoder-type-2 payloads are one quantum long: they decode to 264 to 2,044 bytes in
Sekiro (one is 2,044) and 270 to 2,040 in Elden Ring. In Elden Ring 278 are whole top-level files and 682 are the
`.hkx.dcx` members of the map collision binders (`.hkxbhd`); in Sekiro 50 are top-level and 884 are members of
`.edgebhd` (383), `.tpfbhd` (434), `.hkxbhd` (51) and `.wallbhd` (16) binders. :proven[both archive sets, Elden Ring without the `DLC` pair]

The game's Oodle library and oozextract decode the Kraken payloads to the same bytes on all 27,073 readable Sekiro payloads
and all 117,121 Elden Ring ones, so a reader does not need the game's library where oozextract is available.
:proven[both archive sets, Elden Ring without the `DLC` pair]

A Kraken quantum can code a run of bytes as a Huffman chunk with a one-symbol alphabet: the eight bytes
`40 0A 68 00 03 00 40 80` decode to 667 bytes of `0x02`, and one quantum of a Sekiro payload holds such a chunk.
:observed{games="sekiro"} The released oozextract 0.5.6 refuses that chunk, because its one-symbol path returns the
number of input bytes it read where the chunk's decoded size is expected, as the C decoder ooz it follows does. With
only that return value corrected, it decodes a sample of 256 Sekiro `KRAK` envelopes to the same bytes as
`oo2core_6`. :observed[256 Sekiro envelopes]{games="sekiro"} A reader that relies on oozextract instead of the game's
library has to handle that case.

A writer that compresses `KRAK` payloads with the games' `oo2core_6` must size its output buffer with that version's
`OodleLZ_GetCompressedBufferSizeNeeded`, which takes the raw size alone: 65,536 bytes gives 65,810. Oodle 2.9
(`oo2core_9`) takes the compressor and the raw size (Kraken, 65,536 gives 65,560). :observed Called with the two-argument
form, the older library reads the compressor id (8 for Kraken) as the raw size and returns the bound for 8 bytes, so the
output buffer is too small and the compressor writes past it. :observed The one-argument signature for versions 5
and 6 is also SoulsFormats'. :sourced[SoulsFormats]

The decoded size in the header is the allocation a reader must make before decoding, and it can be large: Elden Ring's
shader binder `/shader/shaderbdle.shaderbdlebnd.dcx` decodes to about 676 MB.
:observed{games="elden-ring"}

## Writing an envelope

The 76-byte header is a function of the codec tag, the version, the field at 16, the level, the byte at 56 and the two
sizes: writing it from those fields reproduces the header of every envelope of both archive sets and of the 29
regulation files. :proven[both archive sets, Elden Ring without the `DLC` pair] The field at 20 is `0x2C` when the field
at 16 is `0x24` and `0x4C` otherwise, and the payload starts at 76 in every variant.

What a writer cannot reproduce is the payload, because the shipped compressors are not the ones a writer has.

| Codec | Compressing the decoded bytes again | Confidence |
|---|---|---|
| `DFLT` | The payloads are zlib streams (`78 DA`). zlib 1.3.1 at level 9 reproduces 48 of the 58 shipped payloads byte for byte: 13 of Sekiro's 22, 19 of Elden Ring's 20 and all 16 regulation files up to 1.10. The other 10 were made by another deflate encoder: for the 9 of Sekiro's tried, no zlib level or memory level from 1 to 9 gives their bytes, and their sizes are both below and above level 9's. Rust's `miniz_oxide` reproduces none of the 58 and `zlib-rs` 9. | :observed |
| `KRAK` | `oo2core_6` Kraken at levels 0 to 9 reproduces the shipped payload of none of 40 sampled Sekiro envelopes except the 3 or 4 whose payload is the data stored raw; the sizes at level 6 (the header's level byte) and at level 4 come within about 4 % of the shipped ones, above and below. | :observed{games="sekiro"} |
| `ZSTD` | Every shipped frame (13 files) has the descriptor byte `0x00` (no content size, no checksum, no dictionary, not single-segment) and the window descriptor `0x80` (a 64 MiB window, the window log of level 21). libzstd 1.5.7 at level 21, streaming without a stated size, makes the same first six bytes for the installed 1.17.3 regulation's 54,111,776 bytes and 1,739,983 bytes after them where the shipped frame has 2,045,636. | :observed{games="elden-ring"} |

A decoder that checks sizes exactly refuses what an envelope with a wrong size word makes of these streams. For 190
sampled Sekiro and 708 sampled Elden Ring Kraken payloads, `oo2core_6` refuses every one decoded to one byte more than
the header says, and every one decoded to one byte less except those whose last block is stored (14 and 45), which it
decodes to the shorter prefix; it refuses every payload one byte short and accepts every payload with one byte added. :observed
Walking the framing ([Kraken payload framing](#kraken-payload-framing)) refuses the two it accepts: a payload one byte
over, and an envelope whose decoded size is one less where the last block is stored, both leave bytes after the last block.
:observed

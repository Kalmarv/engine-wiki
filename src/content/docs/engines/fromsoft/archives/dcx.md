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
pair are contiguous, so the next entry starts where this one ends, and the stored payload is a prefix of the compressed
stream. No other envelope of either install is short; this is the only one of Sekiro's 27,096 and Elden Ring's 117,141.
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

Every block of every payload has the restart bit set: the first blocks begin `8C 06`, `8C 02` or (stored) `CC 06`, and
the 303,703 later blocks of Elden Ring and 70,897 of Sekiro begin `8C 06` or `CC 06`. No block has the checksum bit,
no payload uses another decoder type, and no quantum is a whole-match or small-block stored one. Walking the headers this way consumes every payload exactly: no payload has bytes left
after its last quantum. :proven[both archive sets]

All 934 Sekiro and 960 Elden Ring decoder-type-2 payloads are one quantum long: they decode to 264 to 2,044 bytes in
Sekiro (one is 2,044) and 270 to 2,040 in Elden Ring. In Elden Ring 278 are whole top-level files and 682 are the
`.hkx.dcx` members of the map collision binders (`.hkxbhd`); in Sekiro 50 are top-level and 884 are members of
`.edgebhd` (383), `.tpfbhd` (434), `.hkxbhd` (51) and `.wallbhd` (16) binders. :proven[both archive sets, Elden Ring without the `DLC` pair]

The game's Oodle library and oozextract decode the Kraken payloads to the same bytes, so a reader does not need the
game's library where oozextract is available. :observed

A writer that compresses `KRAK` payloads with the games' `oo2core_6` must size its output buffer with that version's
`OodleLZ_GetCompressedBufferSizeNeeded`, which takes the raw size alone: 65,536 bytes gives 65,810. Oodle 2.9
(`oo2core_9`) takes the compressor and the raw size (Kraken, 65,536 gives 65,560). :observed Called with the two-argument
form, the older library reads the compressor id (8 for Kraken) as the raw size and returns the bound for 8 bytes, so the
output buffer is too small and the compressor writes past it. :observed The one-argument signature for versions 5
and 6 is also SoulsFormats'. :sourced[SoulsFormats]

The decoded size in the header is the allocation a reader must make before decoding, and it can be large: Elden Ring's
shader binder `/shader/shaderbdle.shaderbdlebnd.dcx` decodes to about 676 MB.
:observed{games="elden-ring"}

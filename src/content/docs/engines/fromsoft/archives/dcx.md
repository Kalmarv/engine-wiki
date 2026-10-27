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
  - name: primase worlds/fromsoft (read/dcx.rs)
    url: https://github.com/Kalmarv/primase/blob/main/worlds/fromsoft/src/read/dcx.rs
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
  - {at: 48, size: 1, type: u8, name: compression level, level: sourced, note: "KRAK 6 or 9; DFLT 8 or 9"}
  - {at: 49, size: 3, type: "u8[3]", name: reserved, level: proven, note: "always zero"}
  - {at: 52, size: 4, type: u32, name: reserved, level: proven, note: "always zero"}
  - {at: 56, size: 1, type: u8, name: unknown, level: unknown, note: "0; 15 in one DFLT variant"}
  - {at: 57, size: 3, type: "u8[3]", name: reserved, level: proven, note: "always zero"}
  - {at: 60, size: 4, type: u32, name: reserved, level: proven, note: "always zero"}
  - {at: 64, size: 4, type: u32, name: unknown, value: "0x10100", level: unknown, note: "always `0x10100`"}
  - {at: 68, size: 4, type: "char[4]", name: DCA tag, value: "DCA\\0", level: proven}
  - {at: 72, size: 4, type: u32, name: DCA header size, value: 8, level: sourced, note: "SoulsFormats' compressed header length"}
```

Only the combinations of version, the field at 16, level and the byte at 56 listed here occur; every envelope in both
installs is one of them. :proven

## Codecs

| Codec | What it is | Where | Confidence |
|---|---|---|---|
| `KRAK` | Oodle Kraken. The games load it from their own `oo2core_6_win64.dll` | the archives of both games | :proven |
| `ZSTD` | One Zstandard frame, with `KRAK`'s header layout | Elden Ring's `regulation.bin` once decrypted | :proven{games="elden-ring"} |
| `DFLT` | zlib | documented by SoulsFormats for earlier games | :sourced[SoulsFormats] |

Whether Sekiro or Elden Ring ship any `DFLT` envelope is not established. :unknown

The payload size is not exact in every header: in Sekiro's `Data5`, the entry with path hash `a28b84c8` declares a
larger compressed size in its `KRAK` header than its stored payload. :inferred{games="sekiro"}

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

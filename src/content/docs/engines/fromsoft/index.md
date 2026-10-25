---
title: FromSoftware engine
description: FromSoftware's in-house engine as Sekiro and Elden Ring ship it, what the two games share, and where they differ.
sources:
  - title: SoulsFormats
    url: https://github.com/JKAnderson/SoulsFormats
    note: reference reader for the FromSoftware formats through Sekiro (archived in 2025)
  - title: SoulsFormatsNEXT
    url: https://github.com/soulsmods/SoulsFormatsNEXT
    note: the maintained fork, with Elden Ring formats (MATBIN, METAPARAM, MSBE)
  - title: UXM Selective Unpack
    url: https://github.com/Nordgaren/UXM-Selective-Unpack
    note: archive lists, public keys and path dictionaries for each game
  - title: Paramdex
    url: https://github.com/soulsmods/Paramdex
    note: param definitions per game
  - title: Souls Modding wiki
    url: https://www.soulsmodding.com/
---

Sekiro (2019) and Elden Ring (2022) run on one engine lineage that FromSoftware has carried since Demon's Souls. The
two games read their data the same way: files packed in BHD5/BDT archive pairs, wrapped in DCX compression envelopes
and grouped in BND4 binders; models in FLVER files; maps laid out by MSB files; collision as Havok files; lights in BTL
banks; behaviour in EMEVD event scripts and params. :proven

Most formats are self-describing: a file's version or its section chain says which variant it is, so one reader serves
both games by what the bytes state. :proven The differences the files do not state about themselves (where a game keeps
its files, how it hashes archive paths, which keys open its archives) are each game's own rules. :proven

## What the two games share and where they differ

| Area | Sekiro | Elden Ring | Confidence |
|---|---|---|---|
| Archive pairs | `Data1`–`Data5` | `Data0`–`Data3`, `DLC`, `sd/sd`, `sd/sd_dlc02` | :proven |
| Archive path hash | base 37, 32-bit | base 133, 64-bit | :proven |
| Archive file record (40 bytes) | Dark Souls III's layout | its own layout | :proven |
| Compression | DCX `KRAK` (Oodle Kraken) | DCX `KRAK`; `ZSTD` for the params | :proven |
| Params | `param/gameparam/gameparam.parambnd.dcx` in the archives | `regulation.bin` beside the executable, AES-256-CBC encrypted | :proven |
| `NPC_PARAM_ST` | data version 14, 896-byte rows | data version 9, 736-byte rows | :proven |
| Map layout | MSB, Sekiro generation (MSBS) | MSB, Elden Ring generation (MSBE); same section chain and record envelopes | :proven |
| World structure | separate map areas (`m11_01` Ashina Castle, ...) | map areas plus open-world tiles of 256 m (`m60`, `m61`), each inside larger parent tiles | :proven |
| Material definitions | MTD | MATBIN | :proven |
| Compiled shaders | DXBC (Direct3D 11) | DXIL (Direct3D 12) | :proven |
| Collision | Havok 2016.2 | Havok 2018.1 | :observed |
| Light banks (BTL) | version 16 | version 18; the same 232-byte light record | :proven |
| Event scripts (EMEVD) | 64-bit little-endian layout, version `0xCD` | the same layout | :proven |

Each row is described on the system page it belongs to; the archive rows in [BHD5 and BDT archives](/engines/fromsoft/archives/bhd5-bdt/).

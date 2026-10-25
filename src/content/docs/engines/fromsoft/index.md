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

Sekiro (2019) and Elden Ring (2022) share FromSoftware's in-house engine lineage. :sourced[Souls Modding wiki] The
two games organize their data similarly: files packed in BHD5/BDT archive pairs, wrapped in DCX compression envelopes
and grouped in BND4 binders; models in FLVER files; maps laid out by MSB files; collision as Havok files; lights in BTL
banks; behaviour in EMEVD event scripts and params. :observed

Several formats identify their structural variant through a version or section chain. :observed Row definitions,
resource paths and runtime selection rules can still depend on the game: a PARAM's type and version, for example, do
not include its field definitions. :sourced[Paramdex]

## What the two games share and where they differ

| Area | Sekiro | Elden Ring | Confidence |
|---|---|---|---|
| Archive pairs | `Data1`–`Data5` | `Data0`–`Data3`, `DLC`, `sd/sd`, `sd/sd_dlc02` | :proven |
| Archive path hash | base 37, 32-bit | base 133, 64-bit | :proven |
| Archive file record (40 bytes) | Dark Souls III's layout | its own layout | :proven |
| Compression | DCX `KRAK` (Oodle Kraken) | DCX `KRAK`; `ZSTD` for the params | :proven |
| Params | `param/gameparam/gameparam.parambnd.dcx` in the archives | `regulation.bin` beside the executable, AES-256-CBC encrypted | :proven |
| `NPC_PARAM_ST` | data version 14, 896-byte rows | data version 9, 736-byte rows | :proven |
| Map layout | MSBS, eight sections | MSBE, six sections; shared section-chain mechanism, different part headers | :observed |
| World structure | separate map areas (`m11_01` Ashina Castle, ...) | map areas plus open-world tiles of 256 m (`m60`, `m61`), each inside larger parent tiles | :observed |
| Material definitions | MTD | MATBIN | :proven |
| Compiled shaders | DXBC (Direct3D 11) | DXIL (Direct3D 12) | :observed |
| Collision | Havok 2016.2 | Havok 2018.1 | :observed |
| Light banks (BTL) | version 16 | version 18; the same 232-byte light record | :observed |
| Event scripts (EMEVD) | 64-bit little-endian layout, version `0xCD` | the same layout | :observed |
| Traversal data | EDGE grapple, hang and wall-hug records | No equivalent established here | :observed{games="sekiro"} |
| Animation | Havok skeleton and motion, TAE actions; player companion binders | Havok skeleton and motion, TAE actions; divided companion binders | :observed |

The [archive index](/engines/fromsoft/archives/bhd5-bdt/), [map layouts](/engines/fromsoft/world/msb/),
[coordinate frames](/engines/fromsoft/world/frames/), [parameter tables](/engines/fromsoft/data-model/params/) and
[runtime observations](/engines/fromsoft/runtime/render-state/) describe the scope and limits of these comparisons.
